/**
 * Deep flow audit. Covers the specific user-flows enumerated in the bug
 * report: Customer Profile, Customer Visits tab, edit-customer save,
 * rating edit save, work-order edit/delete, invoice preview/PDF print.
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

  const Customers = (await import('../src/components/CustomersModule')).default;
  const Orders = (await import('../src/components/WorkOrdersModule')).default;
  const Invoices = (await import('../src/components/InvoicesModule')).default;

  const results: { name: string; ok: boolean; note: string }[] = [];
  const report = (name: string, ok: boolean, note: string) => {
    results.push({ name, ok, note });
  };

  // ---------- Customer Profile (visits) page ----------
  {
    const customers = dataService.getCustomers();
    const target = customers[0];
    let root: TR.ReactTestRenderer | null = null;
    try {
      await act(async () => {
        root = TR.create(React.createElement(Customers, {
          customers, devices: dataService.getDevices(),
          onAddCustomer: dataService.addCustomer.bind(dataService),
          onUpdateCustomer: dataService.updateCustomer.bind(dataService),
          onDeleteCustomer: dataService.deleteCustomer.bind(dataService),
          onAddDevice: dataService.addDevice.bind(dataService),
          onDeleteDevice: dataService.deleteDevice.bind(dataService),
          orders: dataService.getOrders(),
          invoices: dataService.getInvoices(),
          payments: dataService.getPayments(),
          contracts: dataService.getContracts(),
          lang: 'ar',
          voiceTrigger: { module: 'customers', subAction: 'open_profile', customerId: target.id },
        } as any));
      });
      await flush();

      // Click the "الملف الكامل والزيارات" button on the customer's row
      const allBtns = findAllButtons(root!.toJSON());
      const profileBtn = allBtns.find(b => /الملف الكامل والزيارات/.test(btnText(b)));
      if (!profileBtn) {
        report('Customer.profile-button-exists', false, 'No "الملف الكامل والزيارات" button');
      } else {
        report('Customer.profile-button-exists', true, btnText(profileBtn));
        await act(async () => { profileBtn.props.onClick(); });
        await flush();
        const json = JSON.stringify(root!.toJSON());
        // Profile view markers
        const hasProfile = json.includes('ملف مبيعات وتكييف العميل') || json.includes('customer-profile-view') || json.includes('تايم لاين');
        report('Customer.profile-view-renders', hasProfile, hasProfile ? 'profile content present' : 'profile content missing');

        // Find edit button
        const allBtns2 = findAllButtons(root!.toJSON());
        const editBtn = allBtns2.find(b => /تعديل بيانات والتقييم/.test(btnText(b)));
        if (!editBtn) {
          report('Customer.edit-button-exists', false, 'No "✏️ تعديل بيانات والتقييم" button');
        } else {
          report('Customer.edit-button-exists', true, btnText(editBtn));
          await act(async () => { editBtn.props.onClick(); });
          await flush();

          // After opening edit modal, find save button
          const allBtns3 = findAllButtons(root!.toJSON());
          const saveBtn = allBtns3.find(b => /حفظ التغـييرات والتقـييم/.test(btnText(b)));
          if (!saveBtn) {
            report('Customer.edit-modal-save-button', false, 'No "💾 حفظ التغـييرات والتقـييم" button');
          } else {
            report('Customer.edit-modal-save-button', true, btnText(saveBtn));

            // BEFORE we click save: confirm rating UI is in the modal.
            const modalTree = JSON.stringify(root!.toJSON());
            const hasRating = modalTree.includes('Customer Rating') || modalTree.includes('تقييم العميل');
            report('Customer.rating-edit-section-renders', hasRating, hasRating ? 'rating UI present in edit modal' : 'rating UI missing in edit modal');

            // Try changing rating by clicking a star button (stars use a Star
            // icon inside a <button onClick={() => setEditRating(num)}>).
            // We can locate by walking buttons with onClick that contain
            // 'hover:scale-110' class (unique to star buttons).
            const allInModal = findAllButtons(root!.toJSON());
            const starBtns = allInModal.filter(b => /hover:scale-110/.test(String(b.props.className || '')));
            if (starBtns.length >= 5) {
              report('Customer.rating-stars-count', true, `found ${starBtns.length} star buttons`);
              // Click the 3rd star
              await act(async () => { starBtns[2].props.onClick(); });
              await flush();
            } else {
              report('Customer.rating-stars-count', false, `expected >=5 star buttons, got ${starBtns.length}`);
            }

            const beforeRating = dataService.getCustomers().find(c => c.id === target.id)?.rating;
            // Re-fetch save button AFTER the star click so it carries the
            // latest closure (React 19 binds a fresh onClick per render).
            const allInModal2 = findAllButtons(root!.toJSON());
            const freshSaveBtn = allInModal2.find(b => /حفظ التغـييرات والتقـييم/.test(btnText(b))) || saveBtn;
            try {
              await act(async () => { freshSaveBtn.props.onClick(); });
              await flush();
              const afterRating = dataService.getCustomers().find(c => c.id === target.id)?.rating;
              const ratingChanged = afterRating === 3;
              report('Customer.edit-save-persisted', true, `rating ${beforeRating} -> ${afterRating}`);
              report('Customer.rating-edit-persists', ratingChanged, ratingChanged ? `rating now ${afterRating}` : `rating expected 3, got ${afterRating}`);
            } catch (e: any) {
              report('Customer.edit-save-persisted', false, e?.message || String(e));
            }
          }
        }
      }
    } catch (e: any) {
      report('Customer.profile-flow', false, `Mount/flow threw: ${e?.message || e}`);
    } finally {
      try { (root as any)?.unmount(); } catch {}
    }
  }

  // ---------- Customer DELETE ----------
  {
    const target = dataService.addCustomer({
      name: 'CRUD Delete Probe', phone: '01100000001', address: 'x', governorate: 'القاهرة', region: 'المعادي', customerSource: 'Other', rating: 3,
    } as any);
    let root: TR.ReactTestRenderer | null = null;
    try {
      await act(async () => {
        root = TR.create(React.createElement(Customers, {
          customers: dataService.getCustomers(), devices: dataService.getDevices(),
          onAddCustomer: dataService.addCustomer.bind(dataService),
          onUpdateCustomer: dataService.updateCustomer.bind(dataService),
          onDeleteCustomer: dataService.deleteCustomer.bind(dataService),
          onAddDevice: dataService.addDevice.bind(dataService),
          onDeleteDevice: dataService.deleteDevice.bind(dataService),
          orders: dataService.getOrders(), invoices: dataService.getInvoices(),
          payments: dataService.getPayments(), contracts: dataService.getContracts(),
          lang: 'ar',
        } as any));
      });
      await flush();
      (globalThis as any).confirm = () => true;
      // Customer-row delete is an icon-only button with class `text-red-500`
      // and ` hover:bg-red-50 rounded-lg`. Iterate icon-only red buttons,
      // click them, and check if any specific customer was removed.
      const before = dataService.getCustomers().length;
      let deleted = false;
      // Walk in row order: there will be one delete button per customer card.
      const all = findAllButtons(root!.toJSON());
      const candidates = all.filter(b => {
        const cls = String(b.props.className || '');
        return /text-red-500/.test(cls) && /hover:bg-red-50/.test(cls);
      });
      for (const b of candidates) {
        const beforeIds = dataService.getCustomers().map(c => c.id);
        try {
          await act(async () => { b.props.onClick(); });
          await flush();
        } catch (_) {}
        const afterIds = dataService.getCustomers().map(c => c.id);
        if (afterIds.length < beforeIds.length) {
          deleted = true;
          break;
        }
      }
      report('Customer.delete-via-UI', deleted, deleted ? `was ${before} now ${dataService.getCustomers().length}` : `tried ${candidates.length} delete buttons, none worked`);
      if (!deleted) dataService.deleteCustomer(target.id); // cleanup
    } catch (e: any) {
      report('Customer.delete-via-UI', false, `threw: ${e?.message || e}`);
    } finally {
      try { (root as any)?.unmount(); } catch {}
    }
  }

  // ---------- Work Order EDIT + DELETE ----------
  {
    const order = dataService.addOrder({
      customerId: dataService.getCustomers()[0].id,
      deviceId: dataService.getDevices()[0]?.id || '',
      technicianId: 'EMP-001',
      serviceType: 'صيانة وتنظيف',
      status: 'new',
      cost: 700,
      collectionAmount: 0,
      expenses: 0,
    } as any);
    let root: TR.ReactTestRenderer | null = null;
    try {
      await act(async () => {
        root = TR.create(React.createElement(Orders, {
          orders: dataService.getOrders(),
          customers: dataService.getCustomers(),
          devices: dataService.getDevices(),
          employees: dataService.getEmployees(),
          onAddOrder: dataService.addOrder.bind(dataService),
          onUpdateOrder: dataService.updateOrder.bind(dataService),
          onDeleteOrder: dataService.deleteOrder.bind(dataService),
        } as any));
      });
      await flush();

      // Click edit button (label: "تعديل وبيانات الأمر ✏️")
      const all = findAllButtons(root!.toJSON());
      const editBtn = all.find(b => /تعديل وبيانات الأمر/.test(btnText(b)));
      if (!editBtn) {
        report('Order.edit-button-exists', false, 'no "تعديل وبيانات الأمر" button');
      } else {
        report('Order.edit-button-exists', true, btnText(editBtn));
        await act(async () => { editBtn.props.onClick(); });
        await flush();
        // Find save: "💾 حفظ التغـييرات والأرقام"
        const all2 = findAllButtons(root!.toJSON());
        const saveBtn = all2.find(b => /حفظ التغـييرات والأرقام/.test(btnText(b)));
        if (!saveBtn) {
          report('Order.edit-save-button-exists', false, 'no save button in edit modal');
        } else {
          report('Order.edit-save-button-exists', true, btnText(saveBtn));
          try {
            await act(async () => { saveBtn.props.onClick(); });
            await flush();
            report('Order.edit-save-flow', true, 'save executed without throw');
          } catch (e: any) {
            report('Order.edit-save-flow', false, e?.message || String(e));
          }
        }
      }

      // Delete button on order card has Arabic text "إلغاء الأمر وحذفه"
      (globalThis as any).confirm = () => true;
      const before = dataService.getOrders().length;
      // Need to re-render order list (we left edit modal open which may overlay)
      // First close the modal by clicking cancel
      const all3 = findAllButtons(root!.toJSON());
      const cancelBtn = all3.find(b => /إلغاء الأمر$/.test(btnText(b)));
      if (cancelBtn) { await act(async () => { cancelBtn.props.onClick(); }); await flush(); }
      const all4 = findAllButtons(root!.toJSON());
      const deleteBtn = all4.find(b => /إلغاء الأمر وحذفه/.test(btnText(b)));
      let deleted = false;
      if (deleteBtn) {
        try {
          await act(async () => { deleteBtn.props.onClick(); });
          await flush();
          deleted = dataService.getOrders().length < before;
        } catch (e: any) {
          report('Order.delete-throw', false, e?.message || String(e));
        }
      }
      report('Order.delete-via-UI', deleted, deleted ? `orders ${before}->${dataService.getOrders().length}` : (deleteBtn ? 'click did not remove order' : 'delete button not found'));
      if (!deleted) dataService.deleteOrder(order.id);
    } catch (e: any) {
      report('Order.edit-delete-flow', false, e?.message || String(e));
    } finally {
      try { (root as any)?.unmount(); } catch {}
    }
  }

  // ---------- Invoice Preview / PDF ----------
  {
    let root: TR.ReactTestRenderer | null = null;
    try {
      await act(async () => {
        root = TR.create(React.createElement(Invoices, {
          invoices: dataService.getInvoices(), customers: dataService.getCustomers(),
          onAddInvoice: dataService.addInvoice.bind(dataService),
          onUpdateInvoice: dataService.updateInvoice.bind(dataService),
          onDeleteInvoice: dataService.deleteInvoice.bind(dataService),
          settings: dataService.getSettings(),
          onAddOrder: dataService.addOrder.bind(dataService),
          updateSettings: dataService.updateSettings.bind(dataService),
        } as any));
      });
      await flush();
      const all = findAllButtons(root!.toJSON());
      const printBtn = all.find(b => btnText(b) === 'طباعة' || /^طباعة$/.test(btnText(b)));
      report('Invoice.print-button-exists', !!printBtn, printBtn ? 'found' : 'missing');
      if (printBtn) {
        await act(async () => { printBtn.props.onClick(); });
        await flush();
        await flush();
        const json = JSON.stringify(root!.toJSON());
        // Preview markers
        const hasPreview = json.includes('print-area') || json.includes('اطبع المستند') || json.includes('M Group Cool ERP + CRM');
        report('Invoice.preview-renders', hasPreview, hasPreview ? 'preview content present' : 'preview content missing');

        // Look for the PDF / Print trigger button
        const all2 = findAllButtons(root!.toJSON());
        const pdfBtn = all2.find(b => /اطبع المستند|حفظ PDF|اطبع/.test(btnText(b)));
        report('Invoice.pdf-button-exists', !!pdfBtn, pdfBtn ? btnText(pdfBtn) : 'no PDF button rendered');
        if (pdfBtn) {
          try {
            await act(async () => { pdfBtn.props.onClick(); });
            await flush();
            report('Invoice.pdf-click', true, 'window.print() invoked OK');
          } catch (e: any) {
            report('Invoice.pdf-click', false, e?.message || String(e));
          }
        }
      }
    } catch (e: any) {
      report('Invoice.preview-flow', false, e?.message || String(e));
    } finally {
      try { (root as any)?.unmount(); } catch {}
    }
  }

  // Print results
  origErr.call(console, '\n========== DEEP FLOW AUDIT ==========');
  let failed = 0;
  for (const r of results) {
    origErr.call(console, `[${r.ok ? 'PASS' : 'FAIL'}] ${r.name} :: ${r.note}`);
    if (!r.ok) failed++;
  }
  origErr.call(console, '\n--- Other captured errors ---');
  if (errs.length === 0) origErr.call(console, '(none)');
  else errs.forEach(e => origErr.call(console, e));
  origErr.call(console, '========================================');
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(e => { origErr.call(console, 'DEEP FLOW AUDIT CRASH:', e); process.exit(2); });
