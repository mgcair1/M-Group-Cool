/**
 * Route / sub-tab audit. For every module, click through every visible
 * tab/sub-tab and confirm no throw occurs and the resulting tree contains
 * some renderable nodes.
 */
import './setup';
import React from 'react';
import TR, { act } from 'react-test-renderer';

const errs: { ctx: string; msg: string }[] = [];
const origErr = console.error;
console.error = (...a: any[]) => {
  const s = a.map(String).join(' ');
  if (/(deprecated|not implemented|getContext|act\()/.test(s)) return;
  errs.push({ ctx: 'console.error', msg: s.slice(0, 300) });
};
process.on('unhandledRejection', (e: any) => {
  const s = String(e?.message || e);
  if (/firebase|installations|api[\s-_]?key|fetch/i.test(s)) return;
  errs.push({ ctx: 'unhandled', msg: s.slice(0, 300) });
});

const findAllButtons = (n: any, acc: any[] = []): any[] => {
  if (!n) return acc;
  if (Array.isArray(n)) { n.forEach(x => findAllButtons(x, acc)); return acc; }
  if (typeof n !== 'object') return acc;
  if (n.type === 'button' && n.props?.onClick) acc.push(n);
  (n.children || []).forEach((c: any) => findAllButtons(c, acc));
  return acc;
};

const buttonText = (n: any): string => {
  const flat = (x: any): string => {
    if (x == null) return '';
    if (typeof x === 'string') return x;
    if (Array.isArray(x)) return x.map(flat).join('');
    if (typeof x === 'object') return flat(x.children);
    return '';
  };
  return flat(n.children).trim();
};

async function clickAllTabs(name: string, element: React.ReactElement, tabPatterns: RegExp[]) {
  let root: TR.ReactTestRenderer | null = null;
  try {
    await act(async () => { root = TR.create(element); });
    for (const pat of tabPatterns) {
      const allBtns = findAllButtons(root!.toJSON());
      const match = allBtns.find(b => pat.test(buttonText(b)));
      if (!match) {
        errs.push({ ctx: name, msg: `Tab matching ${pat} not found (available: ${allBtns.slice(0, 12).map(buttonText).join(' | ')})` });
        continue;
      }
      try {
        await act(async () => { match.props.onClick(); });
        // flush
        for (let p = 0; p < 4; p++) await act(async () => { await new Promise(r => setImmediate(r)); });
        const after = JSON.stringify(root!.toJSON());
        if (after.length < 200) {
          errs.push({ ctx: name, msg: `After clicking ${pat}, tree is suspiciously tiny (${after.length}b)` });
        }
      } catch (e: any) {
        errs.push({ ctx: name, msg: `Click on ${pat} threw: ${e?.message || e}` });
      }
    }
  } catch (e: any) {
    errs.push({ ctx: name, msg: `Mount threw: ${e?.message || e}` });
  } finally {
    try { (root as any)?.unmount(); } catch {}
  }
}

async function main() {
  const { dataService } = await import('../src/dataService');
  (globalThis as any).localStorage.clear();
  dataService.login('mgc.air1@gmail.com', '00000000');
  dataService.updateSettings({ language: 'ar', themeMode: 'light' });

  const Customers = (await import('../src/components/CustomersModule')).default;
  const Orders = (await import('../src/components/WorkOrdersModule')).default;
  const Invoices = (await import('../src/components/InvoicesModule')).default;
  const Payroll = (await import('../src/components/EmployeePayrollModule')).default;
  const Inventory = (await import('../src/components/InventoryModule')).default;
  const Enterprise = (await import('../src/components/EnterprisePortal')).default;

  const st = {
    customers: dataService.getCustomers(),
    devices: dataService.getDevices(),
    orders: dataService.getOrders(),
    contracts: dataService.getContracts(),
    invoices: dataService.getInvoices(),
    payments: dataService.getPayments(),
    expenses: dataService.getExpenses(),
    employees: dataService.getEmployees(),
    attendance: dataService.getAttendance(),
    suppliers: dataService.getSuppliers(),
    products: dataService.getProducts(),
    settings: dataService.getSettings(),
  };

  await clickAllTabs('Customers', React.createElement(Customers, {
    customers: st.customers, devices: st.devices,
    onAddCustomer: dataService.addCustomer.bind(dataService),
    onUpdateCustomer: dataService.updateCustomer.bind(dataService),
    onDeleteCustomer: dataService.deleteCustomer.bind(dataService),
    onAddDevice: dataService.addDevice.bind(dataService),
    onDeleteDevice: dataService.deleteDevice.bind(dataService),
    orders: st.orders, invoices: st.invoices, payments: st.payments, contracts: st.contracts, lang: 'ar',
  } as any), [
    /إضافة عميل/, /العودة للاستعراض|الكل|قائمة العملاء/, /روي|ROI|تحليل|قنوات|مصادر|إيرادات/i,
  ]);

  await clickAllTabs('WorkOrders', React.createElement(Orders, {
    orders: st.orders, customers: st.customers, devices: st.devices, employees: st.employees,
    onAddOrder: dataService.addOrder.bind(dataService),
    onUpdateOrder: dataService.updateOrder.bind(dataService),
    onDeleteOrder: dataService.deleteOrder.bind(dataService),
  } as any), [
    /إنشاء أمر تشغيل جديد/, /أوامر التشغيل/,
    /^جديد$/, /^مكتمل$/, /^الكل$/,
  ]);

  await clickAllTabs('Invoices', React.createElement(Invoices, {
    invoices: st.invoices, customers: st.customers,
    onAddInvoice: dataService.addInvoice.bind(dataService),
    onUpdateInvoice: dataService.updateInvoice.bind(dataService),
    onDeleteInvoice: dataService.deleteInvoice.bind(dataService),
    settings: st.settings,
    onAddOrder: dataService.addOrder.bind(dataService),
    updateSettings: dataService.updateSettings.bind(dataService),
  } as any), [
    /تحرير فاتورة/, /الفواتير وعروض/, /طباعة/,
  ]);

  await clickAllTabs('Payroll', React.createElement(Payroll, {
    employees: st.employees, attendance: st.attendance,
    onAddEmployee: dataService.addEmployee.bind(dataService),
    onAddAttendance: dataService.addAttendance.bind(dataService),
    totalCompanyProfits: 100000,
  } as any), [
    /شؤون الموظفين/, /حصر الحضور/, /توزيع أرباح/,
  ]);

  await clickAllTabs('Inventory', React.createElement(Inventory, {
    products: st.products, suppliers: st.suppliers,
    onAddProduct: dataService.addProduct.bind(dataService),
    onUpdateProduct: dataService.updateProduct.bind(dataService),
    onDeleteProduct: dataService.deleteProduct.bind(dataService),
    onAddSupplier: dataService.addSupplier.bind(dataService),
    onDeleteSupplier: dataService.deleteSupplier.bind(dataService),
    settings: st.settings,
    updateSettings: dataService.updateSettings.bind(dataService),
  } as any), [
    /مستودعات الأصناف/, /سجل الموردين المعتمدين/, /حسابات ومديونية/,
    /سجل الأصول/, /أسطول سيارات/,
  ]);

  await clickAllTabs('Enterprise', React.createElement(Enterprise, {
    settings: st.settings,
    updateSettings: dataService.updateSettings.bind(dataService),
    customers: st.customers, devices: st.devices, orders: st.orders,
    invoices: st.invoices, employees: st.employees,
    onAddOrder: dataService.addOrder.bind(dataService),
    onUpdateOrder: dataService.updateOrder.bind(dataService),
    onAddCustomer: dataService.addCustomer.bind(dataService),
  } as any), [
    // tabs in EnterprisePortal use translations from settings.language
    /بوابة العميل الذكية|customer_portal/, /لوحة تحكم الفني|tech_portal/,
    /حاسبات الأحمال|hvac_calc/, /شراكة الأرباح|partner_dashboard/,
    /دليل الأعطال|knowledge_base/, /مصمم النظام|system_designer/,
  ]);

  console.log = origErr.bind(console);
  origErr.call(console, '\n========== ROUTE AUDIT ==========');
  if (errs.length === 0) origErr.call(console, '✅ All sub-tabs rendered without errors.');
  else errs.forEach(e => origErr.call(console, `[${e.ctx}] ${e.msg}`));
  origErr.call(console, '==================================');
  process.exit(errs.length > 0 ? 1 : 0);
}

main().catch(e => { origErr.call(console, 'ROUTE AUDIT CRASH:', e); process.exit(2); });
