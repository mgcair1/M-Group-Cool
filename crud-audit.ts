/**
 * Exhaustive CRUD audit. Exercises every dataService entry point so we
 * confirm Create / Read / Update / Delete work without throwing for
 * customers, orders, invoices, payments, expenses, employees, attendance,
 * suppliers, products and settings.
 */
import './setup';

const captured: string[] = [];
const errs: string[] = [];

async function main() {
  const { dataService } = await import('../src/dataService');
  (globalThis as any).localStorage.clear();
  // Re-seed by forcing logout then re-login.
  dataService.logout();
  // Manually invoke the cache loader by reading state.
  // Actually, dataService is a singleton constructed at import time; the
  // localStorage was cleared AFTER construction. We must call the private
  // mock loader path indirectly by re-importing via cache-bust:
  // Easier: just exercise APIs against the existing in-memory state.
  dataService.login('mgc.air1@gmail.com', '00000000');

  const test = (name: string, fn: () => void | any) => {
    try {
      const r = fn();
      captured.push(`[PASS] ${name}` + (r !== undefined ? ` => ${JSON.stringify(r).slice(0, 80)}` : ''));
    } catch (e: any) {
      errs.push(`[FAIL] ${name} :: ${e?.message || e}`);
    }
  };

  // ===== CUSTOMERS =====
  let createdCustomerId = '';
  test('Customer.create', () => {
    const c = dataService.addCustomer({
      name: 'عميل اختبار التدقيق',
      phone: '01000000001',
      address: 'شارع المعادي',
      governorate: 'القاهرة',
      region: 'المعادي',
      customerSource: 'Facebook',
      rating: 4,
    } as any);
    createdCustomerId = c.id;
    return c.id;
  });
  test('Customer.read.list', () => dataService.getCustomers().length);
  test('Customer.read.byId', () => dataService.getCustomerById(createdCustomerId)?.name);
  test('Customer.update.rating', () => {
    dataService.updateCustomer(createdCustomerId, { rating: 5 });
    return dataService.getCustomerById(createdCustomerId)?.rating;
  });
  test('Customer.update.fields', () => {
    dataService.updateCustomer(createdCustomerId, { name: 'عميل اختبار محدث', notes: 'تم تعديل البيانات' });
    return dataService.getCustomerById(createdCustomerId)?.name;
  });
  test('Customer.delete', () => {
    dataService.deleteCustomer(createdCustomerId);
    return dataService.getCustomerById(createdCustomerId) ?? 'deleted';
  });

  // ===== DEVICES =====
  const anyCustomer = dataService.getCustomers()[0];
  let createdDeviceId = '';
  test('Device.create', () => {
    const d = dataService.addDevice({
      customerId: anyCustomer.id,
      brand: 'شارب',
      type: 'سبليت',
      capacity: '2.25 حصان',
    } as any);
    createdDeviceId = d.id;
    return d.id;
  });
  test('Device.update', () => {
    dataService.updateDevice(createdDeviceId, { capacity: '3 حصان' });
    return dataService.getDevices().find(d => d.id === createdDeviceId)?.capacity;
  });
  test('Device.delete', () => {
    dataService.deleteDevice(createdDeviceId);
    return dataService.getDevices().find(d => d.id === createdDeviceId) ?? 'deleted';
  });

  // ===== WORK ORDERS =====
  let createdOrderId = '';
  test('Order.create', () => {
    const o = dataService.addOrder({
      customerId: anyCustomer.id,
      deviceId: dataService.getDevices()[0]?.id || '',
      technicianId: 'EMP-001',
      serviceType: 'صيانة وتنظيف',
      status: 'new',
      cost: 500,
      collectionAmount: 0,
      expenses: 50,
      priority: 'medium',
    } as any);
    createdOrderId = o.id;
    return o.id;
  });
  test('Order.update.status', () => {
    dataService.updateOrder(createdOrderId, { status: 'in_progress' });
    return dataService.getOrders().find(o => o.id === createdOrderId)?.status;
  });
  test('Order.update.priority', () => {
    dataService.updateOrder(createdOrderId, { priority: 'high' });
    return (dataService.getOrders().find(o => o.id === createdOrderId) as any)?.priority;
  });
  test('Order.update.complete-triggers-invoice', () => {
    const before = dataService.getInvoices().length;
    dataService.updateOrder(createdOrderId, { status: 'completed', collectionAmount: 500 });
    const after = dataService.getInvoices().length;
    return `invoices: ${before} -> ${after}`;
  });
  test('Order.delete', () => {
    dataService.deleteOrder(createdOrderId);
    return dataService.getOrders().find(o => o.id === createdOrderId) ?? 'deleted';
  });

  // ===== INVOICES =====
  let createdInvNumber = '';
  test('Invoice.create', () => {
    const inv = dataService.addInvoice({
      type: 'tax_invoice',
      customerId: anyCustomer.id,
      vatRate: 14,
      subtotal: 1000,
      items: [{ description: 'صيانة', quantity: 1, price: 1000, total: 1000 }],
      status: 'unpaid',
    } as any);
    createdInvNumber = inv.invoiceNumber;
    return `${inv.invoiceNumber} total=${inv.totalAmount}`;
  });
  test('Invoice.update.status', () => {
    dataService.updateInvoice(createdInvNumber, { status: 'paid' });
    return dataService.getInvoices().find(i => i.invoiceNumber === createdInvNumber)?.status;
  });
  test('Invoice.update.subtotal-recalc', () => {
    dataService.updateInvoice(createdInvNumber, { subtotal: 2000 });
    const inv = dataService.getInvoices().find(i => i.invoiceNumber === createdInvNumber);
    return `subtotal=${inv?.subtotal} vat=${inv?.vatAmount} total=${inv?.totalAmount}`;
  });
  test('Invoice.delete', () => {
    dataService.deleteInvoice(createdInvNumber);
    return dataService.getInvoices().find(i => i.invoiceNumber === createdInvNumber) ?? 'deleted';
  });

  // ===== PAYMENTS =====
  const someInv = dataService.getInvoices()[0];
  let createdPaymentId = '';
  test('Payment.create', () => {
    const p = dataService.addPayment({
      invoiceId: someInv.invoiceNumber,
      customerId: someInv.customerId,
      amount: 100,
      paymentType: 'نقدي',
    } as any);
    createdPaymentId = p.id;
    return p.id;
  });
  test('Payment.update', () => {
    dataService.updatePayment(createdPaymentId, { amount: 150 });
    return dataService.getPayments().find(p => p.id === createdPaymentId)?.amount;
  });
  test('Payment.delete', () => {
    dataService.deletePayment(createdPaymentId);
    return dataService.getPayments().find(p => p.id === createdPaymentId) ?? 'deleted';
  });

  // ===== EXPENSES =====
  let createdExpenseId = '';
  test('Expense.create', () => {
    const e = dataService.addExpense({
      amount: 200,
      category: 'مكتبية',
      date: '01/06/2026',
      description: 'مصاريف اختبار',
    } as any);
    createdExpenseId = e.id;
    return e.id;
  });
  test('Expense.update', () => {
    dataService.updateExpense(createdExpenseId, { amount: 300 });
    return dataService.getExpenses().find(e => e.id === createdExpenseId)?.amount;
  });
  test('Expense.delete', () => {
    dataService.deleteExpense(createdExpenseId);
    return dataService.getExpenses().find(e => e.id === createdExpenseId) ?? 'deleted';
  });

  // ===== EMPLOYEES =====
  let createdEmpId = '';
  test('Employee.create', () => {
    const e = dataService.addEmployee({
      name: 'فني اختبار',
      jobTitle: 'فني تكييف أول',
      phone: '01000000002',
      baseSalary: 8000,
      salary: 8000,
      commissionRate: 5,
    } as any);
    createdEmpId = e.id;
    return e.id;
  });
  test('Employee.update', () => {
    dataService.updateEmployee(createdEmpId, { baseSalary: 9000 });
    return dataService.getEmployees().find(e => e.id === createdEmpId)?.baseSalary;
  });
  test('Employee.delete', () => {
    dataService.deleteEmployee(createdEmpId);
    return dataService.getEmployees().find(e => e.id === createdEmpId) ?? 'deleted';
  });

  // ===== ATTENDANCE =====
  let createdAttId = '';
  test('Attendance.create', () => {
    const a = dataService.addAttendance({
      employeeId: 'EMP-001',
      date: '01/06/2026',
      status: 'present',
      checkIn: '09:00',
      checkOut: '17:00',
    } as any);
    createdAttId = a.id;
    return a.id;
  });
  test('Attendance.update', () => {
    dataService.updateAttendance(createdAttId, { status: 'absent' });
    return dataService.getAttendance().find(a => a.id === createdAttId)?.status;
  });
  test('Attendance.delete', () => {
    dataService.deleteAttendance(createdAttId);
    return dataService.getAttendance().find(a => a.id === createdAttId) ?? 'deleted';
  });

  // ===== SUPPLIERS =====
  let createdSupplierId = '';
  test('Supplier.create', () => {
    const s = dataService.addSupplier({
      companyName: 'مورد اختبار',
      contactName: 'م.أحمد',
      phone: '01000000003',
      email: 'test@supplier.com',
      categories: 'قطع غيار',
    } as any);
    createdSupplierId = s.id;
    return s.id;
  });
  test('Supplier.update', () => {
    dataService.updateSupplier(createdSupplierId, { phone: '01999999999' });
    return dataService.getSuppliers().find(s => s.id === createdSupplierId)?.phone;
  });
  test('Supplier.delete', () => {
    dataService.deleteSupplier(createdSupplierId);
    return dataService.getSuppliers().find(s => s.id === createdSupplierId) ?? 'deleted';
  });

  // ===== PRODUCTS =====
  let createdProductId = '';
  test('Product.create', () => {
    const p = dataService.addProduct({
      sku: 'TEST-001',
      name: 'قطعة اختبار',
      category: 'فريون',
      quantity: 20,
      reorderLevel: 5,
      buyPrice: 100,
      sellPrice: 200,
    } as any);
    createdProductId = p.id;
    return p.id;
  });
  test('Product.update.quantity', () => {
    dataService.updateProduct(createdProductId, { quantity: 15 });
    return dataService.getProducts().find(p => p.id === createdProductId)?.quantity;
  });
  test('Product.update.low-stock-triggers-notification', () => {
    const before = dataService.getNotifications().length;
    dataService.updateProduct(createdProductId, { quantity: 2 });
    const after = dataService.getNotifications().length;
    return `notifications ${before} -> ${after}`;
  });
  test('Product.delete', () => {
    dataService.deleteProduct(createdProductId);
    return dataService.getProducts().find(p => p.id === createdProductId) ?? 'deleted';
  });

  // ===== SETTINGS =====
  test('Settings.update', () => {
    dataService.updateSettings({ companyName: 'M Group Cool (Test)', vatRate: 15 });
    return dataService.getSettings().companyName;
  });
  test('Settings.update.deep', () => {
    dataService.updateSettings({ customNames: { test: 'value' } });
    return dataService.getSettings().customNames?.test;
  });

  // ===== BACKUP / RESTORE =====
  test('Backup.export', () => {
    const j = dataService.exportBackup();
    return `length=${j.length}`;
  });
  test('Backup.import', () => {
    const j = dataService.exportBackup();
    return dataService.importBackup(j) ? 'imported' : 'failed';
  });

  // Print results
  console.log('\n========== CRUD AUDIT ==========');
  captured.forEach(c => console.log(c));
  errs.forEach(c => console.log(c));
  console.log(`\nTotal: ${captured.length} passed, ${errs.length} failed`);
  console.log('=================================');
  process.exit(errs.length > 0 ? 1 : 0);
}

main().catch(e => { console.error('CRUD AUDIT CRASH:', e); process.exit(2); });
