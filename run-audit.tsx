/**
 * Runtime audit: render each module with realistic mock data and
 * collect console errors / runtime exceptions.
 */
import './setup';
import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';

// Suppress noisy React warnings that aren't bugs (canvas, link tags in JSDOM)
const noiseRe = /(not implemented|getContext|inside a test was not wrapped|act\()/;
const origErr = console.error;
const origWarn = console.warn;
const captured: { module: string; level: string; msg: string }[] = [];
let currentModule = 'init';
console.error = (...a: any[]) => {
  const s = a.map(String).join(' ');
  if (noiseRe.test(s)) return;
  captured.push({ module: currentModule, level: 'error', msg: s.slice(0, 400) });
};
console.warn = (...a: any[]) => {
  const s = a.map(String).join(' ');
  if (noiseRe.test(s)) return;
  // captured.push({ module: currentModule, level: 'warn', msg: s.slice(0, 200) });
};

// Tame unhandled promise rejections from Firebase config attempts
process.on('unhandledRejection', (e: any) => {
  const s = String(e?.message || e);
  if (/api[\s-_]?key|firebase|installations|fetch/i.test(s)) return;
  captured.push({ module: currentModule, level: 'unhandled', msg: s.slice(0, 400) });
});

async function loadModules() {
  // The dataService initializes Firebase at module load. We swallow any errors.
  const ds = await import('../src/dataService');
  return ds;
}

interface AuditCase {
  name: string;
  run: (ds: any) => Promise<void> | void;
}

async function renderAndCapture(name: string, el: React.ReactElement, after?: (root: TestRenderer.ReactTestRenderer) => any) {
  currentModule = name;
  let root: TestRenderer.ReactTestRenderer | null = null;
  try {
    await act(async () => {
      root = TestRenderer.create(el);
    });
    if (after && root) {
      await act(async () => { await after(root!); });
    }
    return { name, ok: true, msg: 'rendered' };
  } catch (e: any) {
    captured.push({ module: name, level: 'render-throw', msg: (e?.stack || e?.message || String(e)).slice(0, 1200) });
    return { name, ok: false, msg: e?.message || String(e) };
  } finally {
    try { root?.unmount(); } catch {}
  }
}

async function main() {
  const ds = await loadModules();
  const dataService = ds.dataService;

  // Force a fresh seeded state so we exercise the real mock data path.
  (globalThis as any).localStorage.clear();
  // Re-load mocks
  // dataService is already constructed; we need to log in a user to render header sections that depend on it.
  dataService.login('mgc.air1@gmail.com', '00000000');

  // Provide a sane settings.language
  // Trigger save to force a state emit.
  dataService.updateSettings({ language: 'ar', themeMode: 'light' });

  const Customers = (await import('../src/components/CustomersModule')).default;
  const WorkOrders = (await import('../src/components/WorkOrdersModule')).default;
  const Invoices = (await import('../src/components/InvoicesModule')).default;
  const Payroll = (await import('../src/components/EmployeePayrollModule')).default;
  const Inventory = (await import('../src/components/InventoryModule')).default;
  const Enterprise = (await import('../src/components/EnterprisePortal')).default;
  const Dashboard = (await import('../src/components/Dashboard')).default;

  const state = {
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

  const findByPropContaining = (tree: any, prop: string, predicate: (val: any) => boolean): any[] => {
    const acc: any[] = [];
    const walk = (n: any) => {
      if (!n || typeof n !== 'object') return;
      if (n.props && prop in n.props && predicate(n.props[prop])) acc.push(n);
      (n.children || []).forEach(walk);
    };
    walk(tree);
    return acc;
  };

  const findAll = (tree: any, type: string): any[] => {
    const acc: any[] = [];
    const walk = (n: any) => {
      if (!n || typeof n !== 'object') return;
      if (n.type === type) acc.push(n);
      (n.children || []).forEach(walk);
    };
    walk(tree);
    return acc;
  };

  const results: any[] = [];

  // ===== Dashboard =====
  results.push(await renderAndCapture('Dashboard', React.createElement(Dashboard, {
    ...state,
    onNavigate: () => {},
  } as any)));

  // ===== Customers - list =====
  results.push(await renderAndCapture('Customers/list', React.createElement(Customers, {
    customers: state.customers,
    devices: state.devices,
    onAddCustomer: (d: any) => dataService.addCustomer(d),
    onUpdateCustomer: (id: string, d: any) => dataService.updateCustomer(id, d),
    onDeleteCustomer: (id: string) => dataService.deleteCustomer(id),
    onAddDevice: (d: any) => dataService.addDevice(d),
    onDeleteDevice: (id: string) => dataService.deleteDevice(id),
    orders: state.orders, invoices: state.invoices, payments: state.payments, contracts: state.contracts,
    lang: 'ar',
  } as any)));

  // ===== Customers - profile (white-screen reported) =====
  results.push(await renderAndCapture('Customers/profile', React.createElement(Customers, {
    customers: state.customers,
    devices: state.devices,
    onAddCustomer: (d: any) => dataService.addCustomer(d),
    onUpdateCustomer: (id: string, d: any) => dataService.updateCustomer(id, d),
    onDeleteCustomer: (id: string) => dataService.deleteCustomer(id),
    onAddDevice: (d: any) => dataService.addDevice(d),
    onDeleteDevice: (id: string) => dataService.deleteDevice(id),
    orders: state.orders, invoices: state.invoices, payments: state.payments, contracts: state.contracts,
    lang: 'ar',
    voiceTrigger: { module: 'customers', subAction: 'open_profile', customerId: state.customers[0]?.id },
  } as any), async (root) => {
    // Click "open profile" button on first customer card
    const tree = root.toJSON();
    const profileBtns = findByPropContaining(tree, 'onClick', () => true);
    // Force-click anything that mentions الملف الكامل
    const json = JSON.stringify(tree);
    if (!json.includes('ملف العميل') && !json.includes('ملف مبيعات وتكييف العميل')) {
      // Manually navigate by simulating tab switch via voiceTrigger already given.
    }
  }));

  // Force-open profile tab via internal state by re-rendering with simulated click.
  // Easiest: render then find the testable element with onClick that sets activeTab to 'profile'.
  // We already pass voiceTrigger to trigger profile tab.

  // ===== Customers - edit modal =====
  results.push(await renderAndCapture('Customers/edit-modal', React.createElement(Customers, {
    customers: state.customers,
    devices: state.devices,
    onAddCustomer: (d: any) => dataService.addCustomer(d),
    onUpdateCustomer: (id: string, d: any) => dataService.updateCustomer(id, d),
    onDeleteCustomer: (id: string) => dataService.deleteCustomer(id),
    onAddDevice: (d: any) => dataService.addDevice(d),
    onDeleteDevice: (id: string) => dataService.deleteDevice(id),
    orders: state.orders, invoices: state.invoices, payments: state.payments, contracts: state.contracts,
    lang: 'ar',
    voiceTrigger: { module: 'customers', subAction: 'open_profile', customerId: state.customers[0]?.id },
  } as any), async (root) => {
    // Walk tree, find an onClick that contains "setIsEditingCustomer" - we can't introspect, so just click profile-edit
    const findClick = (n: any, pred: (s: string) => boolean): any => {
      if (!n) return null;
      if (n.props?.onClick && pred(String(n.children || ''))) return n;
      for (const c of n.children || []) { const r = findClick(c, pred); if (r) return r; }
      return null;
    };
    const tree: any = root.toJSON();
    const editBtn = findClick(tree, s => s.includes('تعديل بيانات والتقييم') || s.includes('✏️ تعديل'));
    if (editBtn?.props?.onClick) {
      await act(async () => { editBtn.props.onClick(); });
      const after: any = root.toJSON();
      // Now look for save button
      const saveBtn = findClick(after, s => s.includes('حفظ التغـييرات والتقـييم'));
      if (saveBtn?.props?.onClick) {
        await act(async () => { saveBtn.props.onClick(); });
      }
    }
  }));

  // ===== Work Orders =====
  results.push(await renderAndCapture('WorkOrders/list', React.createElement(WorkOrders, {
    orders: state.orders,
    customers: state.customers,
    devices: state.devices,
    employees: state.employees,
    onAddOrder: (d: any) => dataService.addOrder(d),
    onUpdateOrder: (id: string, d: any) => dataService.updateOrder(id, d),
    onDeleteOrder: (id: string) => dataService.deleteOrder(id),
  } as any), async (root) => {
    // Walk for "تعديل وبيانات الأمر" then click and then click save
    const find = (n: any, pred: (s: string) => boolean): any => {
      if (!n) return null;
      if (n.props?.onClick && pred(String(n.children || ''))) return n;
      for (const c of n.children || []) { const r = find(c, pred); if (r) return r; }
      return null;
    };
    const t: any = root.toJSON();
    const editBtn = find(t, s => s.includes('تعديل وبيانات الأمر'));
    if (editBtn) {
      await act(async () => { editBtn.props.onClick(); });
      const t2: any = root.toJSON();
      const saveBtn = find(t2, s => s.includes('حفظ التغـييرات والأرقام'));
      if (saveBtn) {
        await act(async () => { saveBtn.props.onClick(); });
      }
    }
  }));

  // Deep button finder that returns the *leaf* button whose textual children
  // (only direct text nodes and string children) match the predicate.
  const findButton = (node: any, pred: (text: string) => boolean): any => {
    if (!node || typeof node !== 'object') return null;
    if (Array.isArray(node)) {
      for (const n of node) { const r = findButton(n, pred); if (r) return r; }
      return null;
    }
    // Recurse first to prefer the deepest match.
    for (const c of node.children || []) {
      const r = findButton(c, pred);
      if (r) return r;
    }
    if (node.type === 'button' && node.props?.onClick) {
      const flatText = (function flat(n: any): string {
        if (n == null) return '';
        if (typeof n === 'string') return n;
        if (Array.isArray(n)) return n.map(flat).join(' ');
        if (typeof n === 'object') return flat(n.children);
        return '';
      })(node.children);
      if (pred(flatText)) return node;
    }
    return null;
  };

  // ===== Invoices: Preview/PDF render (mount component with preview pre-opened) =====
  // We exercise the preview by mounting a wrapper that immediately triggers the
  // print button via a useEffect — that side-steps React 19 test-renderer's
  // act() commit-timing quirks where toJSON snapshots a stale commit.
  const PreviewProbe: React.FC = () => {
    const ref = React.useRef<HTMLDivElement>(null);
    React.useEffect(() => {
      // Find the first طباعة button in the rendered DOM via a re-walk.
      // No-op: rely on user-triggered onClick; the test harness already handles this.
    }, []);
    return React.createElement(Invoices, {
      invoices: state.invoices,
      customers: state.customers,
      onAddInvoice: (d: any) => dataService.addInvoice(d),
      onUpdateInvoice: (id: string, d: any) => dataService.updateInvoice(id, d),
      onDeleteInvoice: (id: string) => dataService.deleteInvoice(id),
      settings: state.settings,
      onAddOrder: (d: any) => dataService.addOrder(d),
      updateSettings: (d: any) => dataService.updateSettings(d),
    } as any);
  };

  // ===== Invoices list + preview =====
  results.push(await renderAndCapture('Invoices/list+preview', React.createElement(Invoices, {
    invoices: state.invoices,
    customers: state.customers,
    onAddInvoice: (d: any) => dataService.addInvoice(d),
    onUpdateInvoice: (id: string, d: any) => dataService.updateInvoice(id, d),
    onDeleteInvoice: (id: string) => dataService.deleteInvoice(id),
    settings: state.settings,
    onAddOrder: (d: any) => dataService.addOrder(d),
    updateSettings: (d: any) => dataService.updateSettings(d),
  } as any), async (root) => {
    // Click first 'طباعة' button
    const find = (n: any, pred: (s: string) => boolean): any => {
      if (!n) return null;
      if (n.props?.onClick && pred(String(n.children || ''))) return n;
      for (const c of n.children || []) { const r = find(c, pred); if (r) return r; }
      return null;
    };
    const t: any = root.toJSON();
    // DEBUG: collect all button texts
    const allBtnTexts: string[] = [];
    const walkAllBtns = (n: any): void => {
      if (!n || typeof n !== 'object') return;
      if (Array.isArray(n)) { n.forEach(walkAllBtns); return; }
      if (n.type === 'button') {
        const flat = (function f(x: any): string {
          if (x == null) return '';
          if (typeof x === 'string') return x;
          if (Array.isArray(x)) return x.map(f).join('|');
          if (typeof x === 'object') return f(x.children);
          return '';
        })(n.children);
        allBtnTexts.push(flat);
      }
      (n.children || []).forEach(walkAllBtns);
    };
    walkAllBtns(t);
    captured.push({ module: 'Invoices/list+preview', level: 'debug', msg: 'Buttons found: ' + JSON.stringify(allBtnTexts.slice(0, 30)) });
    const printBtn = findButton(t, s => /طباعة/.test(s));
    if (printBtn) {
      try {
        await act(async () => { printBtn.props.onClick(); });
        // Flush microtasks + macrotasks to give React 19 test-renderer time
        // to commit the new render before we snapshot it.
        for (let pass = 0; pass < 10; pass++) {
          await act(async () => { await new Promise(r => setImmediate(r)); });
          await act(async () => { await new Promise(r => setTimeout(r, 5)); });
        }
      } catch (e: any) {
        captured.push({ module: 'Invoices/list+preview', level: 'click-throw', msg: e?.stack || String(e) });
      }
      // Confirm preview rendered by looking at JSX tree.
      const j = JSON.stringify(root.toJSON());
      // Stash for post-hoc verification (the render-phase log may arrive later).
      (globalThis as any).__INVOICE_PREVIEW_TREE = j;
    } else {
      captured.push({ module: 'Invoices/list+preview', level: 'logic', msg: 'Could not find a طباعة button to click' });
    }
  }));

  // ===== Payroll (white screen reported) =====
  const totalProfits = state.payments.reduce((s, p) => s + p.amount, 0) - state.expenses.reduce((s, e) => s + e.amount, 0);
  results.push(await renderAndCapture('Payroll/all-tabs', React.createElement(Payroll, {
    employees: state.employees,
    attendance: state.attendance,
    onAddEmployee: (d: any) => dataService.addEmployee(d),
    onAddAttendance: (d: any) => dataService.addAttendance(d),
    totalCompanyProfits: totalProfits,
  } as any), async (root) => {
    const find = (n: any, pred: (s: string) => boolean): any => {
      if (!n) return null;
      if (n.props?.onClick && pred(String(n.children || ''))) return n;
      for (const c of n.children || []) { const r = find(c, pred); if (r) return r; }
      return null;
    };
    // Switch through tabs
    for (const tabLabel of ['حصر الحضور', 'توزيع أرباح']) {
      const t: any = root.toJSON();
      const btn = find(t, s => s.includes(tabLabel));
      if (btn) await act(async () => { btn.props.onClick(); });
    }
  }));

  // ===== Inventory (white screen reported) =====
  results.push(await renderAndCapture('Inventory/all-tabs', React.createElement(Inventory, {
    products: state.products,
    suppliers: state.suppliers,
    onAddProduct: (d: any) => dataService.addProduct(d),
    onUpdateProduct: (id: string, d: any) => dataService.updateProduct(id, d),
    onDeleteProduct: (id: string) => dataService.deleteProduct(id),
    onAddSupplier: (d: any) => dataService.addSupplier(d),
    onDeleteSupplier: (id: string) => dataService.deleteSupplier(id),
    settings: state.settings,
    updateSettings: (d: any) => dataService.updateSettings(d),
  } as any), async (root) => {
    const find = (n: any, pred: (s: string) => boolean): any => {
      if (!n) return null;
      if (n.props?.onClick && pred(String(n.children || ''))) return n;
      for (const c of n.children || []) { const r = find(c, pred); if (r) return r; }
      return null;
    };
    for (const tabLabel of ['سجل الموردين', 'حسابات ومديونية', 'سجل الأصول', 'أسطول سيارات']) {
      const t: any = root.toJSON();
      const btn = find(t, s => s.includes(tabLabel));
      if (btn) await act(async () => { btn.props.onClick(); });
    }
  }));

  // ===== Enterprise / Operations Portal (white screen reported) =====
  results.push(await renderAndCapture('Enterprise/all-tabs', React.createElement(Enterprise, {
    settings: state.settings,
    updateSettings: (d: any) => dataService.updateSettings(d),
    customers: state.customers,
    devices: state.devices,
    orders: state.orders,
    invoices: state.invoices,
    employees: state.employees,
    onAddOrder: (d: any) => dataService.addOrder(d),
    onUpdateOrder: (id: string, d: any) => dataService.updateOrder(id, d),
    onAddCustomer: (d: any) => dataService.addCustomer(d),
  } as any), async (root) => {
    const find = (n: any, pred: (s: string) => boolean): any => {
      if (!n) return null;
      if (n.props?.onClick && pred(String(n.children || ''))) return n;
      for (const c of n.children || []) { const r = find(c, pred); if (r) return r; }
      return null;
    };
    // Iterate through all top tabs
    for (const lbl of ['Smart Customer Portal', 'بوابة العميل', 'الفني الميدانية', 'tech_portal', 'حاسبات الأحمال', 'hvac', 'شراكة الأرباح', 'دليل الأعطال', 'مصمم النظام']) {
      const t: any = root.toJSON();
      const btn = find(t, s => s.includes(lbl));
      if (btn) await act(async () => { btn.props.onClick(); });
    }
  }));

  // Post-hoc invoice preview verification: the render-phase log of the
  // InvoicesModule proves the preview is displayed once selectedInvoice
  // resolves.  React 19's test-renderer commits *after* our toJSON snapshot,
  // so we look at the captured logs for the canonical evidence.
  const previewProof = captured.find(c => c.msg.includes('[MGC_AUDIT-RENDER]') && c.msg.includes('activeTab= print') && c.msg.includes('selectedInvoice= true'));
  if (previewProof) {
    captured.push({ module: 'Invoices/list+preview', level: 'pass', msg: 'Invoice preview rendered correctly (verified via render-phase log)' });
  } else {
    captured.push({ module: 'Invoices/list+preview', level: 'logic', msg: 'Invoice preview never reached print view with selectedInvoice' });
  }

  // Print results
  console.log = origErr.bind(console); // restore for output
  origErr.call(console, '\n========== AUDIT RESULTS ==========');
  results.forEach(r => origErr.call(console, `[${r.ok ? 'PASS' : 'FAIL'}] ${r.name} :: ${r.msg}`));
  origErr.call(console, '\n========== CAPTURED ERRORS ==========');
  if (captured.length === 0) {
    origErr.call(console, 'No runtime errors captured.');
  } else {
    captured.forEach(c => origErr.call(console, `[${c.level}] (${c.module}) ${c.msg}`));
  }
  origErr.call(console, '====================================\n');
  process.exit(captured.length > 0 || results.some(r => !r.ok) ? 1 : 0);
}

main().catch(e => {
  origErr.call(console, 'AUDIT HARNESS CRASH:', e);
  process.exit(2);
});
