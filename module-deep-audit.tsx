/**
 * Deep audit of Payroll, Inventory and Operations Portal modules:
 * mount each, switch through every sub-tab, attempt one user flow per tab.
 */
import './setup';
import React from 'react';
import TR, { act } from 'react-test-renderer';

const errs: string[] = [];
const origErr = console.error;
console.error = (...a: any[]) => {
  const s = a.map(String).join(' ');
  if (/(deprecated|getContext|not implemented|act\(|warning)/i.test(s)) return;
  errs.push(s.slice(0, 300));
};

const findAllButtons = (n: any, acc: any[] = []): any[] => {
  if (!n) return acc;
  if (Array.isArray(n)) { n.forEach(x => findAllButtons(x, acc)); return acc; }
  if (typeof n !== 'object') return acc;
  if (n.type === 'button' && n.props?.onClick) acc.push(n);
  (n.children || []).forEach((c: any) => findAllButtons(c, acc));
  return acc;
};
const findAllInputs = (n: any, acc: any[] = []): any[] => {
  if (!n) return acc;
  if (Array.isArray(n)) { n.forEach(x => findAllInputs(x, acc)); return acc; }
  if (typeof n !== 'object') return acc;
  if ((n.type === 'input' || n.type === 'select') && n.props?.onChange) acc.push(n);
  (n.children || []).forEach((c: any) => findAllInputs(c, acc));
  return acc;
};
const findAllForms = (n: any, acc: any[] = []): any[] => {
  if (!n) return acc;
  if (Array.isArray(n)) { n.forEach(x => findAllForms(x, acc)); return acc; }
  if (typeof n !== 'object') return acc;
  if (n.type === 'form' && n.props?.onSubmit) acc.push(n);
  (n.children || []).forEach((c: any) => findAllForms(c, acc));
  return acc;
};
const btnText = (n: any): string => {
  const flat = (x: any): string => {
    if (x == null) return '';
    if (typeof x === 'string') return x;
    if (Array.isArray(x)) return x.map(flat).join('');
    if (typeof x === 'object') return flat(x.children);
    return '';
  };
  return flat(n.children).trim();
};
const flush = async () => {
  for (let p = 0; p < 8; p++) await act(async () => { await new Promise(r => setImmediate(r)); });
};

async function main() {
  const { dataService } = await import('../src/dataService');
  (globalThis as any).localStorage.clear();
  dataService.login('mgc.air1@gmail.com', '00000000');
  dataService.updateSettings({ language: 'ar', themeMode: 'light' });

  const Payroll = (await import('../src/components/EmployeePayrollModule')).default;
  const Inventory = (await import('../src/components/InventoryModule')).default;
  const Enterprise = (await import('../src/components/EnterprisePortal')).default;

  const results: { name: string; ok: boolean; note: string }[] = [];
  const report = (n: string, ok: boolean, note: string) => results.push({ name: n, ok, note });

  // ------------ PAYROLL ------------
  {
    let root: TR.ReactTestRenderer | null = null;
    try {
      await act(async () => {
        root = TR.create(React.createElement(Payroll, {
          employees: dataService.getEmployees(), attendance: dataService.getAttendance(),
          onAddEmployee: dataService.addEmployee.bind(dataService),
          onAddAttendance: dataService.addAttendance.bind(dataService),
          totalCompanyProfits: 250000,
        } as any));
      });
      await flush();
      report('Payroll.employees-tab-renders', JSON.stringify(root!.toJSON()).includes('كشف رواتب'), 'main payroll tab rendered');

      // Switch to attendance tab
      const all = findAllButtons(root!.toJSON());
      const attBtn = all.find(b => /حصر الحضور/.test(btnText(b)));
      if (attBtn) {
        await act(async () => { attBtn.props.onClick(); });
        await flush();
        report('Payroll.attendance-tab', JSON.stringify(root!.toJSON()).includes('تسجيل حضور'), 'attendance tab renders');
      } else report('Payroll.attendance-tab', false, 'tab not found');

      // Switch to partnership tab
      const all2 = findAllButtons(root!.toJSON());
      const partBtn = all2.find(b => /توزيع أرباح/.test(btnText(b)));
      if (partBtn) {
        await act(async () => { partBtn.props.onClick(); });
        await flush();
        report('Payroll.partnership-tab', JSON.stringify(root!.toJSON()).includes('شراكة') || JSON.stringify(root!.toJSON()).includes('شريك'), 'partnership tab renders');
      } else report('Payroll.partnership-tab', false, 'tab not found');
    } catch (e: any) {
      report('Payroll.mount', false, e?.message || String(e));
    } finally { try { (root as any)?.unmount(); } catch {} }
  }

  // ------------ INVENTORY ------------
  {
    let root: TR.ReactTestRenderer | null = null;
    try {
      await act(async () => {
        root = TR.create(React.createElement(Inventory, {
          products: dataService.getProducts(), suppliers: dataService.getSuppliers(),
          onAddProduct: dataService.addProduct.bind(dataService),
          onUpdateProduct: dataService.updateProduct.bind(dataService),
          onDeleteProduct: dataService.deleteProduct.bind(dataService),
          onAddSupplier: dataService.addSupplier.bind(dataService),
          onDeleteSupplier: dataService.deleteSupplier.bind(dataService),
          settings: dataService.getSettings(),
          updateSettings: dataService.updateSettings.bind(dataService),
        } as any));
      });
      await flush();
      const treeStr = JSON.stringify(root!.toJSON());
      // Render of products table is the white-screen-fix test
      report('Inventory.products-tab', treeStr.includes('جرد قطع الغيار') && treeStr.includes('فريون'), 'products table rendered with rows');

      // Iterate through every sub-tab
      const tabs = ['سجل الموردين المعتمدين', 'حسابات ومديونية', 'سجل الأصول', 'أسطول سيارات'];
      for (const t of tabs) {
        const all = findAllButtons(root!.toJSON());
        const btn = all.find(b => btnText(b).includes(t));
        if (btn) {
          try {
            await act(async () => { btn.props.onClick(); });
            await flush();
            report(`Inventory.tab.${t}`, true, 'tab opens without throw');
          } catch (e: any) {
            report(`Inventory.tab.${t}`, false, e?.message || String(e));
          }
        } else {
          report(`Inventory.tab.${t}`, false, 'tab button not found');
        }
      }

      // Update a product quantity via the "تعديل الرصيد" button (uses prompt)
      const all2 = findAllButtons(root!.toJSON());
      const productsTabBtn = all2.find(b => /مستودعات الأصناف/.test(btnText(b)));
      if (productsTabBtn) {
        await act(async () => { productsTabBtn.props.onClick(); });
        await flush();
      }
      const all3 = findAllButtons(root!.toJSON());
      const editQtyBtn = all3.find(b => /تعديل الرصيد/.test(btnText(b)));
      if (editQtyBtn) {
        (globalThis as any).prompt = () => '99';
        await act(async () => { editQtyBtn.props.onClick(); });
        await flush();
        const updated = dataService.getProducts().find(p => p.quantity === 99);
        report('Inventory.edit-product-qty', !!updated, updated ? 'quantity set to 99' : 'quantity not updated');
      }

      // Delete a product via UI (trash icon button - red)
      const all4 = findAllButtons(root!.toJSON());
      const trashBtn = all4.find(b => /text-red-500/.test(String(b.props.className || '')) && !btnText(b));
      if (trashBtn) {
        const before = dataService.getProducts().length;
        await act(async () => { trashBtn.props.onClick(); });
        await flush();
        const after = dataService.getProducts().length;
        report('Inventory.delete-product', after < before, `products ${before}->${after}`);
      }
    } catch (e: any) {
      report('Inventory.mount', false, e?.message || String(e));
    } finally { try { (root as any)?.unmount(); } catch {} }
  }

  // ------------ ENTERPRISE PORTAL ------------
  {
    let root: TR.ReactTestRenderer | null = null;
    try {
      await act(async () => {
        root = TR.create(React.createElement(Enterprise, {
          settings: dataService.getSettings(),
          updateSettings: dataService.updateSettings.bind(dataService),
          customers: dataService.getCustomers(), devices: dataService.getDevices(),
          orders: dataService.getOrders(), invoices: dataService.getInvoices(),
          employees: dataService.getEmployees(),
          onAddOrder: dataService.addOrder.bind(dataService),
          onUpdateOrder: dataService.updateOrder.bind(dataService),
          onAddCustomer: dataService.addCustomer.bind(dataService),
        } as any));
      });
      await flush();
      report('Enterprise.mount', !!root, 'mounted');

      // Iterate every tab from EnterprisePortal (Arabic labels)
      const tabs = [
        'بوابة العميل الذكية',
        'لوحة تحكم الفني الميدانية للتشغيل',
        'حاسبات الأحمال والتكييف المتقدمة',
        'شراكة الأرباح والمستحقات',
        'دليل الأعطال والتشخيص الذكي',
        'مصمم النظام المتقدم',
      ];
      for (const t of tabs) {
        const all = findAllButtons(root!.toJSON());
        const btn = all.find(b => btnText(b).includes(t));
        if (btn) {
          try {
            await act(async () => { btn.props.onClick(); });
            await flush();
            const tree = JSON.stringify(root!.toJSON());
            // Sanity: not just an empty shell
            const tabOk = tree.length > 1000;
            report(`Enterprise.tab.${t}`, tabOk, tabOk ? `${tree.length}b rendered` : 'tab body suspiciously empty');
          } catch (e: any) {
            report(`Enterprise.tab.${t}`, false, e?.message || String(e));
          }
        } else {
          report(`Enterprise.tab.${t}`, false, 'tab button not found');
        }
      }

      // Customer portal: try searching for a customer
      const cpBtn = findAllButtons(root!.toJSON()).find(b => /بوابة العميل/.test(btnText(b)));
      if (cpBtn) {
        await act(async () => { cpBtn.props.onClick(); });
        await flush();
        // Find login button
        const all = findAllButtons(root!.toJSON());
        const loginBtn = all.find(b => /دخول|تسجيل دخول|ابحث|ادخل/.test(btnText(b)));
        if (loginBtn) {
          try {
            await act(async () => { loginBtn.props.onClick(); });
            await flush();
            report('Enterprise.customer-portal-search', true, 'search executed');
          } catch (e: any) {
            report('Enterprise.customer-portal-search', false, e?.message || String(e));
          }
        }
      }
    } catch (e: any) {
      report('Enterprise.mount', false, e?.message || String(e));
    } finally { try { (root as any)?.unmount(); } catch {} }
  }

  // Print results
  origErr.call(console, '\n========== MODULE DEEP AUDIT ==========');
  let failed = 0;
  for (const r of results) {
    origErr.call(console, `[${r.ok ? 'PASS' : 'FAIL'}] ${r.name} :: ${r.note}`);
    if (!r.ok) failed++;
  }
  origErr.call(console, '\n--- Captured errors ---');
  if (errs.length === 0) origErr.call(console, '(none)');
  else errs.forEach(e => origErr.call(console, e));
  origErr.call(console, '==========================================');
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(e => { origErr.call(console, 'MODULE DEEP AUDIT CRASH:', e); process.exit(2); });
