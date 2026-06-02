/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Invoice, Customer, InvoiceItem, CompanySettings } from '../types';
import MGroupCoolLogo from './MGroupCoolLogo';
import { 
  FileText, 
  Plus, 
  Trash2, 
  CheckCircle, 
  AlertCircle, 
  Printer, 
  Calculator, 
  Receipt,
  Download,
  AlertTriangle,
  ChevronDown
} from 'lucide-react';

interface InvoicesModuleProps {
  invoices: Invoice[];
  customers: Customer[];
  onAddInvoice: (data: Omit<Invoice, 'id' | 'invoiceNumber' | 'date'>) => Invoice;
  onUpdateInvoice: (id: string, data: Partial<Invoice>) => void;
  onDeleteInvoice: (id: string) => void;
  settings: CompanySettings;
  voiceTrigger?: any;
  onAddOrder?: (data: any) => void;
  updateSettings?: (data: any) => void;
}

export default function InvoicesModule({
  invoices,
  customers,
  onAddInvoice,
  onUpdateInvoice,
  onDeleteInvoice,
  settings,
  voiceTrigger,
  onAddOrder,
  updateSettings
}: InvoicesModuleProps) {

  // State
  const [activeTab, setActiveTab] = useState<'list' | 'add' | 'print'>('list');
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);

  React.useEffect(() => {
    if (!voiceTrigger || voiceTrigger.module !== 'invoices') return;
    if (voiceTrigger.subAction === 'create_invoice') {
      setActiveTab('add');
    }
  }, [voiceTrigger]);
  
  // New invoice state variables
  const [customerId, setCustomerId] = useState('');
  const [invoiceType, setInvoiceType] = useState<Invoice['invoiceType']>('tax_invoice');
  const [discount, setDiscount] = useState<number>(0);
  const [status, setStatus] = useState<Invoice['status']>('unpaid');
  const [notes, setNotes] = useState('');

  // Items builder state
  const [items, setItems] = useState<InvoiceItem[]>([
    { description: 'غسيل وصيانة تكييف سبليت 2.25 حصان بالجراب الشفاف', quantity: 2, unitPrice: 450, total: 900 }
  ]);
  const [itemDesc, setItemDesc] = useState('');
  const [itemQty, setItemQty] = useState<number>(1);
  const [itemPrice, setItemPrice] = useState<number>(0);

  // Computed invoice profile
  const selectedInvoice = useMemo(() => {
    // Invoices are uniquely identified by `invoiceNumber` (the legacy mock
    // data and Firestore docs do not store a separate `id`). Fall back to
    // `id` only for safety with newer or third-party data sources.
    return invoices.find(i => i.invoiceNumber === selectedInvoiceId || (i.id && i.id === selectedInvoiceId));
  }, [invoices, selectedInvoiceId]);

  const targetCustomerForPrint = useMemo(() => {
    if (!selectedInvoice) return null;
    return customers.find(c => c.id === selectedInvoice.customerId);
  }, [selectedInvoice, customers]);

  // Invoice calculations
  const tempSubtotal = useMemo(() => {
    return items.reduce((sum, item) => sum + item.total, 0);
  }, [items]);

  const tempVat = useMemo(() => {
    // 14% tax calculated automatically
    return Math.round(tempSubtotal * 0.14);
  }, [tempSubtotal]);

  const tempTotalAmount = useMemo(() => {
    return tempSubtotal + tempVat - discount;
  }, [tempSubtotal, tempVat, discount]);

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemDesc || itemPrice <= 0 || itemQty <= 0) {
      alert("يرجى ملء وصف البند، والكمية، وسعر الوحدة بشكل صحيح!");
      return;
    }

    const newItem: InvoiceItem = {
      description: itemDesc,
      quantity: itemQty,
      unitPrice: itemPrice,
      total: itemQty * itemPrice
    };

    setItems([...items, newItem]);
    setItemDesc('');
    setItemQty(1);
    setItemPrice(0);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSaveInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId) {
      alert("يرجى اختيار العميل المطلوب لإصدار الفاتورة!");
      return;
    }
    if (items.length === 0) {
      alert("يجب إضافة بند واحد على الأقل داخل الفاتورة!");
      return;
    }

    onAddInvoice({
      customerId,
      invoiceType,
      items,
      subtotal: tempSubtotal,
      vat: tempVat,
      discount,
      totalAmount: tempTotalAmount,
      status,
      notes
    });

    // Reset Form
    setCustomerId('');
    setItems([{ description: 'غسيل وصيانة تكييف سبليت 2.25 حصان بالجراب الشلاف', quantity: 2, unitPrice: 450, total: 900 }]);
    setDiscount(0);
    setStatus('unpaid');
    setNotes('');
    setActiveTab('list');
  };

  // Convert status to localized text
  const getInvoiceStatusBadge = (s: Invoice['status']) => {
    switch (s) {
      case 'paid':
        return <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-lg">تم سدادها</span>;
      case 'unpaid':
        return <span className="px-2.5 py-1 bg-red-50 text-red-700 text-xs font-bold rounded-lg animate-pulse">لم تسدد</span>;
      case 'partially_paid':
        return <span className="px-2.5 py-1 bg-amber-50 text-amber-700 text-xs font-bold rounded-lg">سداد جزئي</span>;
    }
  };

  const getInvoiceTypeLabel = (t: Invoice['invoiceType']) => {
    switch (t) {
      case 'quote':
        return "عرض سعر فني رسمي";
      case 'invoice':
        return "فاتورة مبيعات داخلية";
      case 'tax_invoice':
        return "فاتورة ضريبية معتمدة 14%";
    }
  };

  return (
    <div className="space-y-6" id="invoices-module">
      
      {/* Tabs list */}
      <div className="flex border-b border-gray-100 bg-white p-2 rounded-2xl shadow-xs gap-2">
        <button
          onClick={() => { setActiveTab('list'); setSelectedInvoiceId(null); }}
          className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors cursor-pointer ${activeTab === 'list' ? 'bg-sky-50 text-sky-700' : 'text-gray-600 hover:bg-gray-50'}`}
        >
          الفواتير وعروض الأسعار
        </button>
        <button
          onClick={() => setActiveTab('add')}
          className={`flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors cursor-pointer ${activeTab === 'add' ? 'bg-sky-50 text-sky-700' : 'text-gray-600 hover:bg-gray-50'}`}
        >
          <Receipt className="w-4 h-4" />
          تحرير فاتورة / عرض سعر
        </button>
        {activeTab === 'print' && selectedInvoice && (
          <button
            className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-sky-50 text-sky-700 cursor-default"
          >
            عرض وطباعة: {selectedInvoice.invoiceNumber}
          </button>
        )}
      </div>

      {activeTab === 'list' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden text-right">
          <div className="p-5 border-b border-gray-50">
            <h4 className="font-bold text-slate-800 text-lg">دفتر الفواتير والتحصيلات الضريبية</h4>
            <p className="text-xs text-gray-400 mt-1">تراقب جميع التعاملات المالية، الحسابات، وصافي ضريبة القيمة المضافة لشركة M Group Cool</p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-right">
              <thead className="bg-slate-50 text-slate-500 font-sans text-xs">
                <tr>
                  <th className="px-6 py-4">رقم الفاتورة</th>
                  <th className="px-6 py-4">العميل</th>
                  <th className="px-6 py-4">تاريخ الإصدار</th>
                  <th className="px-6 py-4">النوع</th>
                  <th className="px-6 py-4">المجموع الاجمالي</th>
                  <th className="px-6 py-4">الحالة ماليًا</th>
                  <th className="px-6 py-4 text-left">أدوات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {invoices.length > 0 ? (
                  invoices.map(i => {
                    const client = customers.find(c => c.id === i.customerId);
                    return (
                      <tr key={(i.invoiceNumber || i.id)} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 font-mono font-bold text-slate-800 text-xs">{i.invoiceNumber}</td>
                        <td className="px-6 py-4 font-semibold">{client?.name || "عميل عام / غير مسجل"}</td>
                        <td className="px-6 py-4 font-mono text-xs">{i.date}</td>
                        <td className="px-6 py-4 text-xs text-sky-600 font-medium">{getInvoiceTypeLabel(i.invoiceType)}</td>
                        <td className="px-6 py-4 font-bold font-mono text-slate-800">{(i.totalAmount || 0).toLocaleString()} ج.م</td>
                        <td className="px-6 py-4">
                          {i.invoiceType === 'quote' ? (
                            <div className="flex flex-col items-end gap-1">
                              {i.status === 'paid' || (i as any).quoteStatus === 'accepted' ? (
                                <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-500 text-[10px] font-bold rounded flex items-center gap-1">
                                  <span>مقبول ومؤكد ✅</span>
                                </span>
                              ) : (i as any).quoteStatus === 'rejected' ? (
                                <span className="px-2 py-0.5 bg-red-500/10 text-red-500 text-[10px] font-bold rounded flex items-center gap-1">
                                  <span>مرفوض عميل ❌</span>
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-500 text-[10px] font-bold rounded flex items-center gap-1 animate-pulse">
                                  <span>معلق قيد الرد ⌛</span>
                                </span>
                              )}
                            </div>
                          ) : (
                            getInvoiceStatusBadge(i.status)
                          )}
                        </td>
                        <td className="px-6 py-4 text-left gap-2 flex items-center justify-end flex-wrap max-w-sm">
                          <button
                            onClick={() => { setSelectedInvoiceId((i.invoiceNumber || i.id)); setActiveTab('print'); }}
                            className="p-1 px-2 bg-sky-50 text-sky-700 hover:bg-sky-100 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            طباعة
                          </button>
                          
                          {i.invoiceType === 'quote' && (i as any).quoteStatus !== 'accepted' && i.status !== 'paid' && (
                            <>
                              <button
                                onClick={() => {
                                  onUpdateInvoice((i.invoiceNumber || i.id), { quoteStatus: 'accepted' } as any);
                                  alert("تم قبول عرض السعر بنجاح!");
                                }}
                                className="px-1.5 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 rounded-lg text-[10px] font-bold cursor-pointer"
                              >
                                قبول 👍
                              </button>
                              <button
                                onClick={() => {
                                  onUpdateInvoice((i.invoiceNumber || i.id), { quoteStatus: 'rejected' } as any);
                                  alert("تم تدوين رفض العميل لعرض السعر.");
                                }}
                                className="px-1.5 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-600 rounded-lg text-[10px] font-bold cursor-pointer"
                              >
                                رفض 👎
                              </button>
                            </>
                          )}

                          {i.invoiceType === 'quote' && (
                            <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-lg border border-slate-100">
                              <span className="text-[9px] text-slate-400 px-1">تحويل إلى:</span>
                              <button
                                onClick={() => {
                                  onUpdateInvoice((i.invoiceNumber || i.id), { invoiceType: 'invoice', status: 'unpaid' });
                                  alert(`تم تحويل عرض السعر ${i.invoiceNumber} إلى فاتورة مبيعات مستحقة بنجاح!`);
                                }}
                                className="px-1.5 py-0.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded text-[9px] font-bold cursor-pointer"
                              >
                                فاتورة 🧾
                              </button>
                              {onAddOrder && (
                                <>
                                  <button
                                    onClick={() => {
                                      onAddOrder({
                                        customerId: i.customerId,
                                        orderType: 'installation',
                                        description: `أمر تركيب مستند لعرض السعر رقم ${i.invoiceNumber}`,
                                        status: 'pending',
                                        technicianId: '',
                                        notes: `تم توليد هذا الأمر تلقائياً من عرض السعر رقم ${i.invoiceNumber} بمبلغ وقدره ${i.totalAmount} ج.م`
                                      });
                                      alert(`تم إصدار أمر تركيب وتكليف فني لعميل عرض السعر بنجاح!`);
                                    }}
                                    className="px-1.5 py-0.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded text-[9px] font-bold cursor-pointer"
                                  >
                                    تثبيت 🔧
                                  </button>
                                  <button
                                    onClick={() => {
                                      onAddOrder({
                                        customerId: i.customerId,
                                        orderType: 'maintenance',
                                        description: `عقود صيانة مستحقة لعرض السعر ${i.invoiceNumber}`,
                                        status: 'pending',
                                        technicianId: '',
                                        notes: `صيانة دورية مفصلة مستوجبة من عرض سعر ${i.invoiceNumber}`
                                      });
                                      alert(`تم توليد أمر وجدول صيانة HVAC للعميل بنجاح!`);
                                    }}
                                    className="px-1.5 py-0.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded text-[9px] font-bold cursor-pointer"
                                  >
                                    صيانة ❄️
                                  </button>
                                </>
                              )}
                            </div>
                          )}

                          {i.invoiceType !== 'quote' && i.status !== 'paid' && (
                            <button
                              onClick={() => {
                                onUpdateInvoice((i.invoiceNumber || i.id), { status: 'paid' });
                                alert("تم تسجيل استلام وتحصيل مبلغ الفاتورة كاملاً!");
                              }}
                              className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-[11px] font-bold cursor-pointer animate-pulse"
                            >
                              تسجيل كمسددة
                            </button>
                          )}
 
                          <button
                            onClick={() => { if (confirm("هل تريد حذف الفاتورة مالياً؟")) onDeleteInvoice((i.invoiceNumber || i.id)); }}
                            className="p-1 text-red-500 hover:bg-red-50 rounded-lg cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-gray-400 text-xs">
                      لا توجد فواتير أو مستندات تحصيل صادرة حالياً.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Creation form */}
      {activeTab === 'add' && (
        <form onSubmit={handleSaveInvoice} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs space-y-6 text-right">
          <h3 className="font-bold text-slate-800 text-lg">تحرير مستند مالي جديد</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            
            {/* Customer select */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">اختر العميل المفوتر لقيمة الخدمات <span className="text-red-500">*</span></label>
              <select
                required
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm text-slate-800 outline-none text-right cursor-pointer"
              >
                <option value="">-- اختر من قائمة العملاء --</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>{c.name} ({c.id})</option>
                ))}
              </select>
            </div>

            {/* Document type */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">نوع المستند المالي الصادر</label>
              <select
                value={invoiceType}
                onChange={(e) => setInvoiceType(e.target.value as Invoice['invoiceType'])}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm text-slate-800 outline-none text-right cursor-pointer"
              >
                <option value="quote">عرض سعر فني رسمي (Quote)</option>
                <option value="invoice">فاتورة تحصيل داخلية مبسطة (Simple Invoice)</option>
                <option value="tax_invoice">فاتورة ضريبية رسمية مع تفقيط ضريبي 14% (Tax Invoice)</option>
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">حالة سداد الفاتورة المبدئية</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as Invoice['status'])}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm text-slate-800 outline-none text-right cursor-pointer"
              >
                <option value="unpaid">لم تسدد بعد - قيد المتابعة للتحصيل</option>
                <option value="partially_paid">سداد دفعات جزئية (عربون)</option>
                <option value="paid">مسددة بالكامل (تحصيل وريدي نقد أو فيزا)</option>
              </select>
            </div>

            {/* Discount */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">خصم تجاري خاص بالعميل (ج.م)</label>
              <input
                type="number"
                value={discount}
                onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm text-slate-800 outline-none text-left font-mono"
              />
            </div>
          </div>

          {/* ITEM ADDER */}
          <div className="border border-slate-100 p-4 rounded-xl bg-slate-50 space-y-4">
            <span className="text-xs font-bold text-slate-700 block">تفاصيل بنود الفاتورة / الأعمال والقطع الموردة</span>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-600">وصف العمل أو اسم قطعة الغيار الموردة</label>
                <input
                  type="text"
                  value={itemDesc}
                  onChange={(e) => setItemDesc(e.target.value)}
                  placeholder="مكثف كبستور أصلي 45 ميكرو فاراد"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600">الكمية</label>
                <input
                  type="number"
                  min="1"
                  value={itemQty}
                  onChange={(e) => setItemQty(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600">سعر الوحدة ج.م</label>
                <div className="flex gap-1.5">
                  <input
                    type="number"
                    value={itemPrice}
                    onChange={(e) => setItemPrice(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-left"
                  />
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="px-3.5 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    أضف
                  </button>
                </div>
              </div>
            </div>

            {/* Added Items table preview */}
            <div className="bg-white rounded-lg overflow-hidden border border-slate-200">
              <table className="w-full text-xs text-right divide-y divide-slate-200">
                <thead className="bg-slate-50 text-slate-500 font-sans">
                  <tr>
                    <th className="px-3 py-2 text-right">وصف البند والعمل</th>
                    <th className="px-3 py-2 text-center">الكمية</th>
                    <th className="px-3 py-2 text-center">السعر</th>
                    <th className="px-3 py-2 text-center">المجموع</th>
                    <th className="px-3 py-2 text-left">أدوات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((item, index) => (
                    <tr key={index} className="text-slate-700">
                      <td className="px-3 py-2 font-medium">{item.description}</td>
                      <td className="px-3 py-2 text-center font-mono">{item.quantity}</td>
                      <td className="px-3 py-2 text-center font-mono">{item.unitPrice} ج.م</td>
                      <td className="px-3 py-2 text-center font-mono font-bold text-slate-800">{item.total} ج.م</td>
                      <td className="px-3 py-2 text-left">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(index)}
                          className="p-1 text-red-500 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Calculations summaries */}
            <div className="flex flex-col md:flex-row justify-end text-sm pt-4 border-t border-slate-200 gap-6">
              <div className="space-y-1 text-slate-600 w-full md:w-64">
                <div className="flex justify-between">
                  <span>المجموع الفرعي للأعمال:</span>
                  <span className="font-mono">{tempSubtotal.toLocaleString('ar-EG')} ج.م</span>
                </div>
                {invoiceType === 'tax_invoice' && (
                  <div className="flex justify-between text-teal-600 font-medium">
                    <span>قيمة ضريبة المبيعات المقررة (14%):</span>
                    <span className="font-mono">+{tempVat.toLocaleString('ar-EG')} ج.م</span>
                  </div>
                )}
                <div className="flex justify-between text-red-500">
                  <span>الخصم التجاري الممنوح:</span>
                  <span className="font-mono">-{discount.toLocaleString('ar-EG')} ج.م</span>
                </div>
                <div className="flex justify-between border-t border-slate-100 pt-1 text-slate-800 font-bold text-lg">
                  <span>المجموع النهائي الكلي:</span>
                  <span className="font-mono text-primary">{tempTotalAmount.toLocaleString('ar-EG')} ج.م</span>
                </div>
              </div>
            </div>

          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">شروط الدفع / شروط الصيانة المسجلة</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="الضمان ساري على صمام الغاز والقطع الموردة لمدة 6 أشهر من تاريخ التركيب الفعلي..."
              className="w-full h-24 px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm text-slate-800 outline-none focus:border-primary focus:bg-white text-right resize-none"
            />
          </div>

          <div className="flex gap-2 justify-end pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setActiveTab('list')}
              className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-200 transition-colors cursor-pointer"
            >
              إلغاء التعديل
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-semibold transition-colors cursor-pointer"
            >
              مزامنة وحفظ الفاتورة
            </button>
          </div>
        </form>
      )}

      {/* PRINT VERSION PREVIEW */}
      {activeTab === 'print' && selectedInvoice && (
        <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-md max-w-4xl mx-auto space-y-8 text-right relative" id="print-area">
          
          <style dangerouslySetInnerHTML={{ __html: `
            @media print {
              body, html {
                background: #fff !important;
                color: #000 !important;
              }
              #mgroupcool-erp-app, aside, header, nav, .print\\:hidden, button, .flex-shrink-0 {
                display: none !important;
              }
              #print-area {
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 100% !important;
                border: none !important;
                box-shadow: none !important;
                padding: 0 !important;
                margin: 0 !important;
                visibility: visible !important;
              }
              #print-area * {
                visibility: visible !important;
              }
              @page {
                size: A4;
                margin: 15mm;
              }
            }
          `}} />

          {/* Decorative Printing buttons */}
          <div className="absolute top-5 left-5 flex gap-2 print:hidden">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold cursor-pointer shadow-xs hover:bg-slate-800 transition-colors"
            >
              <Printer className="w-4 h-4" />
              اطبع المستند الحالي / حفظ PDF
            </button>
            <button
              onClick={() => setActiveTab('list')}
              className="px-4 py-2 border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg cursor-pointer"
            >
              العودة للدفتر
            </button>
          </div>

          {/* Letterhead */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b pb-6 border-slate-200 gap-4 pt-8 md:pt-0">
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0">
                <MGroupCoolLogo size={55} variant="icon" customLogoUrl={settings?.logoData} />
              </div>
              <div className="space-y-1">
                <h2 className="text-2xl font-black text-slate-900 font-sans tracking-tight">{settings?.companyName || "M Group Cool"}</h2>
                <span className="text-xs font-semibold text-slate-500 font-sans block">لأعمال التكييف والتبريد والمقاولات والصيانة الشاملة</span>
                <p className="text-[10px] text-gray-400">القاهرة - الجيزة - جمهورية مصر العربية | هاتف: 01011501170</p>
              </div>
            </div>
            <div className="text-left md:text-left space-y-1 font-mono">
              <span className="text-amber-600 bg-amber-50 px-2.5 py-1 text-xs font-bold rounded">
                {getInvoiceTypeLabel(selectedInvoice.invoiceType)}
              </span>
              <div className="text-xs text-slate-500 mt-2">رقم: <strong className="text-slate-800">{selectedInvoice.invoiceNumber || "INV-NEW"}</strong></div>
              <div className="text-xs text-slate-500">التاريخ: <strong>{selectedInvoice.date || new Date().toLocaleDateString('ar-EG')}</strong></div>
            </div>
          </div>

          {/* Buyer billing details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-2">
            <div className="space-y-1.5">
              <span className="text-gray-400 block font-semibold text-[11px]">موجّه إلى السادة:</span>
              <strong className="text-slate-900 text-sm block">{targetCustomerForPrint?.name || "عميل عام / نقدي"}</strong>
              <div className="text-slate-600 leading-normal">
                {targetCustomerForPrint?.address && <p>{targetCustomerForPrint.address}</p>}
                {targetCustomerForPrint?.governorate && <p className="mt-0.5">المحافظة: {targetCustomerForPrint.governorate} - الحي: {targetCustomerForPrint.region}</p>}
              </div>
            </div>
            <div className="md:text-left space-y-1">
              <span className="text-gray-400 block font-semibold text-[11px]">معلومات الاتصال بالعميل:</span>
              <span className="font-mono text-slate-800 text-xs block">{targetCustomerForPrint?.phone || "غير مسجل"}</span>
              {targetCustomerForPrint?.phone2 && <span className="font-mono text-slate-500 block text-[11px]">{targetCustomerForPrint.phone2}</span>}
              {targetCustomerForPrint?.email && <span className="text-slate-600 block text-[11px]">{targetCustomerForPrint.email}</span>}
            </div>
          </div>

          {/* Items detailed table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden mt-6">
            <table className="w-full text-xs text-right divide-y divide-slate-200">
              <thead className="bg-slate-50 text-slate-500 font-sans">
                <tr>
                  <th className="px-6 py-3 text-right"># وصف البند والأشغال الموردة</th>
                  <th className="px-6 py-3 text-center">الكمية</th>
                  <th className="px-6 py-3 text-center">السعر الفردي</th>
                  <th className="px-6 py-3 text-left">الإجمالي ج.م</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {(selectedInvoice.items || []).map((item, index) => (
                  <tr key={index}>
                    <td className="px-6 py-3.5 font-medium">{item.description || "بند خدمة مخصص"}</td>
                    <td className="px-6 py-3.5 text-center font-mono">{item.quantity || 1}</td>
                    <td className="px-6 py-3.5 text-center font-mono">{Number(item.unitPrice || item.price || 0).toLocaleString('ar-EG')} ج.م</td>
                    <td className="px-6 py-3.5 text-left font-mono font-bold text-slate-900">{Number(item.total || 0).toLocaleString('ar-EG')} ج.m</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals panel */}
          <div className="flex justify-between items-start pt-4 border-t border-slate-100">
            <div className="w-1/2 text-xs text-slate-500 leading-relaxed max-w-sm">
              <strong className="block text-slate-800 mb-1">تعليمات الضريبة وتحصل الأعمال:</strong>
              <p>تخضع جميع الفواتير الصادرة لأحكام الصيانة وساعات الضمان الموقعة ببنود M Group Cool. هذا المستند مسجل رسمياً بقاعدة بيانات الشركة لإثبات الزيارات وضمان الكفاءة القصوى لأجهزة التبريد.</p>
              {selectedInvoice.notes && (
                <div className="mt-3 p-3 bg-slate-50 rounded-lg text-slate-700 border border-slate-100">
                  <strong>ملاحظات التعاقد:</strong> {selectedInvoice.notes}
                </div>
              )}
            </div>

            <div className="w-1/3 text-xs space-y-2 text-slate-600 font-sans">
              <div className="flex justify-between">
                <span>المجموع الإجمالي للأعمال:</span>
                <span className="font-mono">{Number(selectedInvoice.subtotal || 0).toLocaleString('ar-EG')} ج.م</span>
              </div>
              {selectedInvoice.invoiceType === 'tax_invoice' && (
                <div className="flex justify-between text-teal-600 font-semibold">
                  <span>ضريبة القيمة المضافة 14%:</span>
                  <span className="font-mono">+{Number(selectedInvoice.vat || 0).toLocaleString('ar-EG')} ج.م</span>
                </div>
              )}
              {Number(selectedInvoice.discount || 0) > 0 && (
                <div className="flex justify-between text-red-500">
                  <span>الخصم المسموح به:</span>
                  <span className="font-mono">-{Number(selectedInvoice.discount || 0).toLocaleString('ar-EG')} ج.م</span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t border-slate-200 text-slate-900 font-extrabold text-base">
                <span>المجموع الصافي للتسوية:</span>
                <span className="font-mono text-primary">{Number(selectedInvoice.totalAmount || 0).toLocaleString('ar-EG')} ج.م</span>
              </div>
              <div className="pt-2 flex justify-between items-center">
                <span>حالة التحصيل:</span>
                <span className="font-bold">{selectedInvoice.status === 'paid' ? "✓ مدفوعة" : "⚠️ معلقة قيد الانتظار"}</span>
              </div>
            </div>
          </div>

          {/* Authentication and signatures */}
          <div className="grid grid-cols-2 pt-12 text-center text-xs text-slate-500 gap-4">
            <div>
              <span className="block mb-10 font-bold text-slate-700">توقيع المستلم (العميل):</span>
              <p className="border-t border-slate-200/60 pt-2 w-40 mx-auto">توقيع العميل بالاستلام</p>
            </div>
            <div>
              <span className="block mb-10 font-bold text-teal-800">إدارة الحسابات (M Group Cool):</span>
              <p className="border-t border-indigo-200/60 pt-2 w-40 mx-auto">توقيع المشرف العام المعتمد</p>
            </div>
          </div>

          <div className="text-center text-[10px] text-slate-400 pt-6 border-t border-slate-100 font-sans">
            M Group Cool ERP + CRM System - 2026. نظام صمم تكنولوجياً لضمان معايير تبريد فائقة.
          </div>
        </div>
      )}

    </div>
  );
}
