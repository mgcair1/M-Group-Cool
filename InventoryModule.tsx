/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Product, Supplier, CompanySettings } from '../types';
import { 
  Layers, 
  Plus, 
  Trash2, 
  AlertTriangle, 
  Package, 
  Phone, 
  Mail, 
  ShoppingBag,
  ExternalLink,
  ChevronDown,
  Coins,
  Truck,
  Wrench,
  Search,
  FileText,
  CheckCircle,
  Cpu
} from 'lucide-react';

interface InventoryModuleProps {
  products: Product[];
  suppliers: Supplier[];
  onAddProduct: (data: Omit<Product, 'id'>) => Product;
  onUpdateProduct: (id: string, data: Partial<Product>) => void;
  onDeleteProduct: (id: string) => void;
  onAddSupplier: (data: Omit<Supplier, 'id'>) => Supplier;
  onDeleteSupplier: (id: string) => void;
  settings: CompanySettings;
  updateSettings: (data: Partial<CompanySettings>) => void;
}

export default function InventoryModule({
  products,
  suppliers,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  onAddSupplier,
  onDeleteSupplier,
  settings,
  updateSettings
}: InventoryModuleProps) {

  const [activeTab, setActiveTab] = useState<'products' | 'suppliers' | 'suppliers_ledger' | 'assets' | 'vehicles'>('products');
  
  // New Product fields state
  const [sku, setSku] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('قطع غيار تبريد');
  const [quantity, setQuantity] = useState<number>(10);
  const [reorderLevel, setReorderLevel] = useState<number>(3);
  const [buyPrice, setBuyPrice] = useState<number>(350);
  const [sellPrice, setSellPrice] = useState<number>(500);

  // New Supplier fields state
  const [supplierName, setSupplierName] = useState('');
  const [contactName, setContactName] = useState('');
  const [supplierPhone, setSupplierPhone] = useState('');
  const [supplierEmail, setSupplierEmail] = useState('');
  const [supplierCategories, setSupplierCategories] = useState('فريون وقطع غيار ومقاولات');

  // Supplier Ledger states
  const [selectedLedgerSupplier, setSelectedLedgerSupplier] = useState('');
  const [payAmount, setPayAmount] = useState<number>(0);
  const [paySource, setPaySource] = useState<'cash' | 'bank'>('cash');
  const [payNotes, setPayNotes] = useState('');

  // Asset states
  const [newAssetName, setNewAssetName] = useState('');
  const [newAssetType, setNewAssetType] = useState('أجهزة حاسوب ومكاتب');
  const [newAssetValue, setNewAssetValue] = useState<number>(12000);
  const [newAssetHolder, setNewAssetHolder] = useState('');
  const [newAssetStatus, setNewAssetStatus] = useState('storage');

  // Vehicle states
  const [newPlate, setNewPlate] = useState('');
  const [newModel, setNewModel] = useState('');
  const [newDriver, setNewDriver] = useState('');
  const [newInsuExpiry, setNewInsuExpiry] = useState('');
  const [newLicExpiry, setNewLicExpiry] = useState('');

  // Built-in preloaded datasets with local state sync fallbacks
  const defaultPayments = useMemo(() => [
    { id: 'pay_1', supplierId: 'sup-1', supplierName: 'مجموعة العربي للتبريد والتكييف', amount: 45000, date: '30/05/2026', source: 'خزينة الكاش الرئيسية', notes: 'سداد دفعة تحت الحساب لشحنة كباسات يابانية' },
    { id: 'pay_2', supplierId: 'sup-2', supplierName: 'ميراكو كاريير مصر ش.م.م', amount: 150000, date: '28/05/2026', source: 'البنك الأهلي المصري', notes: 'حساب توريد أجهزة كاريير أوبتيماكس' }
  ], []);

  const currentPayments = useMemo(() => {
    return settings && (settings as any).supplierLedgerPayments && (settings as any).supplierLedgerPayments.length > 0
      ? (settings as any).supplierLedgerPayments
      : defaultPayments;
  }, [settings, defaultPayments]);

  const defaultAssets = useMemo(() => [
    { id: 'ast_1', name: 'جهاز لابتوب Dell عهدة إدارة حسابات الشركة', type: 'أجهزة حاسوب ومكاتب', value: 25000, holder: 'سارة محاسب', status: 'assigned' },
    { id: 'ast_2', name: 'طلمبة تفريغ فريوم ثنائية المرحلتين HVAC Vacuum Pump', type: 'معدات صيانة وعدد', value: 8500, holder: 'المهندس مصطفى عاصي', status: 'assigned' },
    { id: 'ast_3', name: 'طقم عدد لحام نحاس وإيطالي متكامل مع ليات وتأريض', type: 'معدات صيانة وعدد', value: 6400, holder: 'فني حمودة المعتمد', status: 'assigned' }
  ], []);

  const currentAssets = useMemo(() => {
    return settings && (settings as any).assets && (settings as any).assets.length > 0
      ? (settings as any).assets
      : defaultAssets;
  }, [settings, defaultAssets]);

  const defaultVehicles = useMemo(() => [
    { id: 'veh_1', plate: 'أ ب ج 9876', model: 'شيفورليه ديمكس رربع نقل حمولة غاز وصيانة 2024', driver: 'عبده السائق', insuExpiry: '25/08/2026', licExpiry: '15/06/2026', fuelLog: 450 },
    { id: 'veh_2', plate: 'ن ل م 3452', model: 'سوزوكي فان لنقل فنيي الصيانة الدورية 2023', driver: 'محمود عوض', insuExpiry: '10/04/2026', licExpiry: '30/07/2026', fuelLog: 320 }
  ], []);

  const currentVehicles = useMemo(() => {
    return settings && (settings as any).vehicles && (settings as any).vehicles.length > 0
      ? (settings as any).vehicles
      : defaultVehicles;
  }, [settings, defaultVehicles]);

  // Compute products below reorder levels
  const lowStockAlerts = useMemo(() => {
    return (products || []).filter(p => p.quantity <= p.reorderLevel);
  }, [products]);

  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || quantity < 0) {
      alert("يرجى ملء الاسم وتحديد الكمية بشكل صالح!");
      return;
    }

    onAddProduct({
      sku: sku || 'SKU-' + Math.floor(Math.random() * 10000),
      name,
      category,
      quantity,
      reorderLevel,
      buyPrice,
      sellPrice
    });

    // Reset Form
    setSku('');
    setName('');
    setQuantity(10);
    setReorderLevel(3);
    setBuyPrice(350);
    setSellPrice(500);
    alert("تم تدوين الصنف وإدراجه بمخازن الشركة!");
  };

  const handleAddSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierName || !supplierPhone) {
      alert("يرجى تدوين اسم الجهة الموردة ورقم الهاتف على الأقل!");
      return;
    }

    onAddSupplier({
      companyName: supplierName,
      contactName,
      phone: supplierPhone,
      email: supplierEmail,
      categories: supplierCategories
    });

    // Reset Form
    setSupplierName('');
    setContactName('');
    setSupplierPhone('');
    setSupplierEmail('');
    setSupplierCategories('فريون وقطع غيار ومقاولات');
    alert("تم تدوين المورد بنجاح بنظام CRM المندمج!");
  };

  return (
    <div className="space-y-6" id="inventory-module">
      
      {/* Tab Selectors */}
      <div className="flex border-b border-gray-100 bg-white p-2 rounded-2xl shadow-xs gap-2 flex-wrap text-right">
        <button
          onClick={() => setActiveTab('products')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${activeTab === 'products' ? 'bg-sky-50 text-sky-700 font-extrabold' : 'text-gray-600 hover:bg-gray-50'}`}
        >
          مستودعات الأصناف والخامات (المخزن)
        </button>
        <button
          onClick={() => setActiveTab('suppliers')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${activeTab === 'suppliers' ? 'bg-sky-50 text-sky-700 font-extrabold' : 'text-gray-600 hover:bg-gray-50'}`}
        >
          سجل الموردين المعتمدين (Suppliers)
        </button>
        <button
          onClick={() => setActiveTab('suppliers_ledger')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${activeTab === 'suppliers_ledger' ? 'bg-sky-50 text-sky-700 font-extrabold' : 'text-gray-600 hover:bg-gray-50'}`}
        >
          حسابات ومديونية الموردين 🧾
        </button>
        <button
          onClick={() => setActiveTab('assets')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${activeTab === 'assets' ? 'bg-sky-50 text-sky-700 font-extrabold' : 'text-gray-600 hover:bg-gray-50'}`}
        >
          سجل الأصول والعهد الفنية 💻
        </button>
        <button
          onClick={() => setActiveTab('vehicles')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${activeTab === 'vehicles' ? 'bg-sky-50 text-sky-700 font-extrabold' : 'text-gray-600 hover:bg-gray-50'}`}
        >
          أسطول سيارات النقل 🚚
        </button>
      </div>

      {activeTab === 'products' && (
        <div className="space-y-5 text-right">
          
          {/* Reorder Level Banner */}
          {lowStockAlerts.length > 0 && (
            <div className="p-4 bg-red-50 border-r-4 border-red-500 rounded-lg flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="p-2 bg-red-100 rounded-full text-red-600 animate-pulse">
                  <AlertTriangle className="w-5 h-5" />
                </span>
                <div>
                  <h4 className="font-bold text-red-900 text-sm">تنبيه مستويات المخزون المنخفضة</h4>
                  <p className="text-xs text-red-700 mt-0.5">يوجد عدد ({lowStockAlerts.length}) أصناف تخطت نقطة إعادة الطلب الحرجة وتحتاج لتوريد إضافي فوري.</p>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Products Ledger Card */}
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
                <h4 className="font-bold text-slate-800 text-lg mb-4">جرد قطع الغيار المتاحة للتركيب</h4>
                
                <div className="overflow-x-auto text-right">
                  <table className="w-full text-xs text-slate-700 divide-y divide-slate-100">
                    <thead className="bg-slate-50 text-slate-500 font-sans">
                      <tr>
                        <th className="px-4 py-3 text-right">الرمز الدولي</th>
                        <th className="px-4 py-3 text-right">عنوان الصنف</th>
                        <th className="px-4 py-3 text-center">التصنيف</th>
                        <th className="px-4 py-3 text-center">الرصيد المتاح</th>
                        <th className="px-4 py-3 text-center">البيع</th>
                        <th className="px-4 py-3 text-left">أدوات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-sans">
                      {products.map(p => (
                        <tr key={p.id} className={p.quantity <= p.reorderLevel ? "bg-red-50/40 hover:bg-red-50/60" : "hover:bg-slate-50/50"}>
                          <td className="px-4 py-3 font-mono text-slate-400 font-bold">{p.sku}</td>
                          <td className="px-4 py-3 font-bold text-slate-800 text-sm">{p.name}</td>
                          <td className="px-4 py-3 text-center">
                            <span className="px-2 py-0.5 bg-slate-100 rounded text-gray-500 font-medium">{p.category}</span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`font-bold px-2 py-0.5 rounded ${p.quantity <= p.reorderLevel ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-800'}`}>
                              {p.quantity} قطع
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center font-bold font-mono">{Number(p.sellPrice ?? p.price ?? 0).toLocaleString('ar-EG')} ج.م</td>
                          <td className="px-4 py-3 text-left">
                            <div className="flex gap-1 justify-end h-7 items-center">
                              <button
                                onClick={() => {
                                  const steps = prompt("يرجى إدخال الرصيد الجديد للصنف:");
                                  if (steps !== null) {
                                    const qty = parseInt(steps);
                                    if (!isNaN(qty)) onUpdateProduct(p.id, { quantity: qty });
                                  }
                                }}
                                className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded font-bold"
                              >
                                تعديل الرصيد
                              </button>
                              <button
                                onClick={() => { if (confirm("حذف الصنف؟")) onDeleteProduct(p.id); }}
                                className="p-1 text-red-500 hover:bg-red-100 rounded"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Product registration form */}
            <div className="lg:col-span-1">
              <form onSubmit={handleAddProduct} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-4">
                <h4 className="font-bold text-slate-800 text-base">إضافة صنف ومخزون جديد</h4>
                
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">الرمز التعريفي الفريد (SKU / باركود)</label>
                  <input
                    type="text"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    placeholder="E.g. COPELAND-3PK"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg text-xs font-mono text-left"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">اسم الصنف قطعة الغيار بالتفصيل</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="كابستور تكييف شارب 1.5 حصان"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">تصنيف المخزن</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg text-xs cursor-pointer text-right"
                  >
                    <option>أنابيب غاز فريون R410a</option>
                    <option>أنابيب غاز فريون R22</option>
                    <option>كبستور ومكثفات تكييف</option>
                    <option>ريموت تكييف ذكي يونيفرسال</option>
                    <option>مواسير نحاس جنوب أفريقي</option>
                    <option>قطع غيار صمامات ودائرة الكهرباء</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-0.5">الرصيد الأولي</label>
                    <input
                      type="number"
                      value={quantity}
                      onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg text-xs font-mono text-left"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-0.5">الرصيد الأدنى للتنبيه</label>
                    <input
                      type="number"
                      value={reorderLevel}
                      onChange={(e) => setReorderLevel(parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg text-xs font-mono text-left"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-0.5">سجل الشراء (ج.م)</label>
                    <input
                      type="number"
                      value={buyPrice}
                      onChange={(e) => setBuyPrice(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg text-xs font-mono text-left"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-0.5">سجل البيع للعميل</label>
                    <input
                      type="number"
                      value={sellPrice}
                      onChange={(e) => setSellPrice(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg text-xs font-mono text-left"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  حفظ الصنف وتدوين الجرد
                </button>
              </form>
            </div>

          </div>
        </div>
      )}

      {/* SUPPLIERS LEDGER VIEW */}
      {activeTab === 'suppliers' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-right">
          
          {/* Supplier Grid list */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
              <h4 className="font-bold text-slate-800 text-lg mb-4">كشف الموردين المعتمدين لشركة M Group Cool</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {suppliers.map(sup => (
                  <div key={sup.id} className="p-4 bg-slate-50 border border-slate-100 rounded-xl relative">
                    
                    <div className="flex items-start justify-between">
                      <span className="text-[10px] font-mono text-slate-400 bg-white p-1 rounded font-bold border border-slate-100 shadow-3xs">{sup.id}</span>
                      <button
                        onClick={() => onDeleteSupplier(sup.id)}
                        className="p-1 text-red-400 hover:text-red-500 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <h5 className="font-bold text-slate-800 text-sm mt-2">{sup.companyName}</h5>
                    <p className="text-xs text-slate-500 mt-1">الجهة: <strong className="text-slate-700">{sup.contactName}</strong></p>
                    
                    <div className="space-y-1.5 mt-3 text-xs text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="font-mono">{sup.phone}</span>
                      </div>
                      {sup.email && (
                        <div className="flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-indigo-500" />
                          <span>{sup.email}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1.5">
                        <Package className="w-3.5 h-3.5 text-amber-500" />
                        <span>منظومة: {sup.categories}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Supplier addition form */}
          <div className="lg:col-span-1">
            <form onSubmit={handleAddSupplier} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-4">
              <h4 className="font-bold text-slate-800 text-base">تسجيل مورد معتمد جديد</h4>
              
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">اسم مؤسسة التوريد</label>
                <input
                  type="text"
                  required
                  value={supplierName}
                  onChange={(e) => setSupplierName(e.target.value)}
                  placeholder="شركة فريونات الفتح مصر"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">اسم مندوب الاتصال</label>
                <input
                  type="text"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="م. أحمد السلّاب"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">رقم الهاتف للاتصال والطلبات</label>
                <input
                  type="tel"
                  required
                  value={supplierPhone}
                  onChange={(e) => setSupplierPhone(e.target.value)}
                  placeholder="01119765432"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg text-xs font-mono text-left"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">البريد الإلكتروني للطلبيات</label>
                <input
                  type="email"
                  value={supplierEmail}
                  onChange={(e) => setSupplierEmail(e.target.value)}
                  placeholder="sales@supplier.com"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg text-xs text-left font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">فئة قطع الغيار والمواد المورّدة</label>
                <input
                  type="text"
                  value={supplierCategories}
                  onChange={(e) => setSupplierCategories(e.target.value)}
                  placeholder="مواسير نحاس وصمامات تكييف يونيون آير"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg text-xs"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl transition-colors cursor-pointer"
              >
                حفظ وتسجيل المورد المعتمد
              </button>
            </form>
          </div>

        </div>
      )}

      {/* ======================= TAB 3: SUPPLIER LEDGER & BALANCES ======================= */}
      {activeTab === 'suppliers_ledger' && (
        <div className="space-y-6 text-right">
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Record Payment Form */}
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-4">
              <h4 className="font-bold text-slate-800 text-sm flex items-center justify-end gap-2">
                <span>تنزيل مديونية وتسجيل دفعة لمورد</span>
                <Coins className="w-5 h-5 text-indigo-500" />
              </h4>
              <p className="text-[10px] text-slate-400">يقوم هذا الإجراء بخصم المبلغ من الحساب النقدي المختار وتسوية مديونية المورد ديناميكياً.</p>

              <form onSubmit={(e) => {
                e.preventDefault();
                if (!selectedLedgerSupplier || payAmount <= 0) {
                  alert("يرجى اختيار المورد وقيمة الدفع بنجاح!");
                  return;
                }
                const sup = suppliers.find(s => s.id === selectedLedgerSupplier) || { companyName: 'مورد خارجي غير مسمى' };
                const newPayment = {
                  id: 'pay_' + Date.now(),
                  supplierId: selectedLedgerSupplier,
                  supplierName: sup.companyName,
                  amount: payAmount,
                  date: '31/05/2026',
                  source: paySource === 'cash' ? 'خزينة الكاش الرئيسية' : 'البنك الأهلي المصري',
                  notes: payNotes || 'دفعة توريد مستحقات جارية'
                };

                const updated = [newPayment, ...currentPayments];
                updateSettings({
                  supplierLedgerPayments: updated as any
                });

                // Deduct from cash registers or bank accounts
                if (settings) {
                  const currentRegisters = settings.cashRegisters || [];
                  const currentBankAccounts = settings.bankAccounts || [];
                  
                  if (paySource === 'cash' && currentRegisters.length > 0) {
                    const updatedRegs = [...currentRegisters];
                    updatedRegs[0].balance = Math.max(0, updatedRegs[0].balance - payAmount);
                    updateSettings({ cashRegisters: updatedRegs });
                  } else if (paySource === 'bank' && currentBankAccounts.length > 0) {
                    const updatedBanks = [...currentBankAccounts];
                    updatedBanks[0].balance = Math.max(0, updatedBanks[0].balance - payAmount);
                    updateSettings({ bankAccounts: updatedBanks });
                  }
                }

                setPayAmount(0);
                setPayNotes('');
                alert("تم إدراج دفعة التوريد وتعديل مديونية المورد وتوثيق الخصم في التدفق النقدي!");
              }} className="space-y-3">
                
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">المورد المستهدف</label>
                  <select
                    value={selectedLedgerSupplier}
                    onChange={(e) => setSelectedLedgerSupplier(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg text-xs"
                    required
                  >
                    <option value="">-- اختر مورد ومصنع --</option>
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>{s.companyName}</option>
                    ))}
                    <option value="sup-1">مجموعة العربي للتبريد والتكييف</option>
                    <option value="sup-2">ميراكو كاريير مصر ش.م.م</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">المبلغ المدفوع (ج.م)</label>
                  <input
                    type="number"
                    value={payAmount}
                    onChange={(e) => setPayAmount(parseInt(e.target.value) || 0)}
                    placeholder="مثال: 15000"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg text-xs text-left font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">قناة الخصم الصادرة</label>
                  <select
                    value={paySource}
                    onChange={(e: any) => setPaySource(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg text-xs"
                  >
                    <option value="cash">خزينة الكاش الرئيسية - المعادي</option>
                    <option value="bank">حساب البنك الأهلي المصري للشركة</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">مذكرات وتبيان الدفع</label>
                  <input
                    type="text"
                    value={payNotes}
                    onChange={(e) => setPayNotes(e.target.value)}
                    placeholder="مثال: تسوية دفعة شاسيهات الـ 4 حصان"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg text-xs"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  توثيق وصرف دفعة المورد ❄️
                </button>
              </form>
            </div>

            {/* Balances & Logs Ledger */}
            <div className="md:col-span-2 bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-4">
              <h4 className="font-bold text-slate-800 text-sm">{settings?.language === 'ar' ? 'سجل المديونيات وحركة حساب الموردين' : 'Supplier Accounting & Ledger'}</h4>
              
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-right border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 border-b border-slate-100">
                      <th className="p-3">المورد</th>
                      <th className="p-3 text-center">المديونية الأساسية</th>
                      <th className="p-3 text-center">حسابات جارية مدفوعة</th>
                      <th className="p-3 text-center">صافي الرصيد المستحق</th>
                      <th className="p-3 text-left">مجموع التعاملات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {suppliers.concat([
                      { id: 'sup-1', companyName: 'مجموعة العربي للتبريد والتكييف', contactName: 'مبيعات العربي', categories: 'قطع ومواسير', phone: '0100223932', email: 'arab@co.com' },
                      { id: 'sup-2', companyName: 'ميراكو كاريير مصر ش.م.م', contactName: 'تنفيدي كاريير', categories: 'أجهزة متكاملة', phone: '0112423982', email: 'carrier@eg.com' }
                    ] as any).map((sup, idx) => {
                      // Dynamic computation based on payments
                      const relatedPayments = currentPayments.filter((p: any) => p.supplierId === sup.id);
                      const paidSum = relatedPayments.reduce((s: number, p: any) => s + (p.amount || 0), 0);
                      const baseDebt = idx === 0 ? 120000 : idx === 1 ? 250000 : 35000;
                      const remaining = Math.max(0, baseDebt - paidSum);

                      return (
                        <tr key={sup.id + '-' + idx} className="hover:bg-slate-50/40 transition-colors">
                          <td className="p-3 font-bold text-slate-800">{sup.companyName}</td>
                          <td className="p-3 text-center font-mono text-slate-400">{baseDebt.toLocaleString()} ج.م</td>
                          <td className="p-3 text-center font-mono text-emerald-600 font-bold">-{paidSum.toLocaleString()} ج.م</td>
                          <td className="p-3 text-center font-mono font-extrabold text-red-600">
                            {remaining.toLocaleString()} ج.م
                          </td>
                          <td className="p-3 text-left">
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded font-mono text-[9px]">
                              {relatedPayments.length} فواتير دفع
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Dynamic Ledger History Audit */}
              <div className="pt-4 border-t border-slate-100 space-y-2">
                <h5 className="font-bold text-xs text-slate-600">آجر حركات الصرف المسددة</h5>
                <div className="space-y-1.5 max-h-44 overflow-y-auto">
                  {currentPayments.map((p: any) => (
                    <div key={p.id} className="p-2.5 bg-slate-50 rounded-lg flex justify-between items-center text-xs">
                      <span className="font-mono text-slate-400">{p.date}</span>
                      <p className="text-slate-600">
                        سدد <strong className="text-emerald-600 font-mono">{p.amount.toLocaleString()} ج.م</strong> لجهة (<strong>{p.supplierName}</strong>) | عبر {p.source}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>

        </div>
      )}

      {/* ======================= TAB 4: ASSETS & TECH CUSTODY ======================= */}
      {activeTab === 'assets' && (
        <div className="space-y-6 text-right">
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Asset Add Form */}
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-4">
              <h4 className="font-bold text-slate-800 text-sm flex items-center justify-end gap-2">
                <span>إدراج أصل وتعيين عهدة فنية جديدة</span>
                <Wrench className="w-5 h-5 text-sky-500" />
              </h4>
              <p className="text-[10px] text-slate-400">يسجل هذا الملف الأصول الملموسة للشركة (أجهزة، تكييفات للورشة، سيارات، أو أدوات يوزعها م. محمد أشرف كمستند عهدة للعمال).</p>

              <form onSubmit={(e) => {
                e.preventDefault();
                if (!newAssetName) {
                  alert("يرجى تسمية الأصل أو المعدة!");
                  return;
                }
                const newAsset = {
                  id: 'ast_' + Date.now(),
                  name: newAssetName,
                  type: newAssetType,
                  value: newAssetValue,
                  holder: newAssetHolder || 'مخزن الشركة الرئيسي (المعادي)',
                  status: newAssetHolder ? 'assigned' : 'storage'
                };

                const updated = [newAsset, ...currentAssets];
                updateSettings({
                  assets: updated as any
                });

                setNewAssetName('');
                setNewAssetHolder('');
                alert("تم تسييل وحفظ الأصل، وتوزيع عهدة الدعم اللوجيستي بنجاح!");
              }} className="space-y-3">
                
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">اسم الأصل أو المعدة</label>
                  <input
                    type="text"
                    value={newAssetName}
                    onChange={(e) => setNewAssetName(e.target.value)}
                    placeholder="مثال: منفاخ ومغسلة ضغط عالي مائي 150 بار"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg text-xs"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">تصنيف وترميز الأصل</label>
                  <select
                    value={newAssetType}
                    onChange={(e) => setNewAssetType(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg text-xs"
                  >
                    <option value="أجهزة حاسوب ومكاتب">أجهزة حاسوب ومكاتب للمشرفين</option>
                    <option value="معدات صيانة وعدد">معدات صيانة وعدد ثقيلة (خامات)</option>
                    <option value="سيارات ومركبات">سيارات ومركبات النقل اللوجستي</option>
                    <option value="أخرى">أخرى غير مصنفة</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">القيمة التقديرية (ج.م)</label>
                  <input
                    type="number"
                    value={newAssetValue}
                    onChange={(e) => setNewAssetValue(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg text-xs text-left font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">المستلم والمسؤول عن العهدة (اختياري)</label>
                  <input
                    type="text"
                    value={newAssetHolder}
                    onChange={(e) => setNewAssetHolder(e.target.value)}
                    placeholder="مثال: الفني حمزة الشاذلي"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg text-xs"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  تعيين عهدة وحفظ الأصل 💻
                </button>
              </form>
            </div>

            {/* Assets Inventory Display */}
            <div className="md:col-span-2 bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-4">
              <h4 className="font-bold text-slate-800 text-sm">أرشيف الأصول الثابتة والعهدة التشغيلية الجارية</h4>
              
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-right">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 border-b border-slate-100">
                      <th className="p-3">اسم المستند/الأصل</th>
                      <th className="p-3 text-center">الفئة</th>
                      <th className="p-3 text-center">القيمة</th>
                      <th className="p-3 text-center">العهدة والمستلم</th>
                      <th className="p-3 text-left">مستوى الحالة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {currentAssets.map((a: any) => (
                      <tr key={a.id} className="hover:bg-slate-50/40 transition-colors">
                        <td className="p-3 font-semibold text-slate-800">{a.name}</td>
                        <td className="p-3 text-center text-slate-400 text-[11px]">{a.type}</td>
                        <td className="p-3 text-center font-mono text-indigo-600 font-bold">{parseInt(a.value || 0).toLocaleString()} ج.م</td>
                        <td className="p-3 text-center">
                          <span className="px-2 py-1 bg-sky-50 text-sky-700 rounded-lg text-[10px] font-semibold">
                            {a.holder || 'بالمقر الرئيسي (المخزن)'}
                          </span>
                        </td>
                        <td className="p-3 text-left">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            a.status === 'assigned' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                          }`}>
                            {a.status === 'assigned' ? 'مسند كعهدة نشطة' : 'متوفر بالمقر'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl flex items-center justify-between text-[11px] text-slate-500">
                <span>إيرادات الأصول المؤمنة حالياً: <strong className="font-mono text-slate-700">{currentAssets.reduce((sum: number, a: any) => sum + parseInt(a.value || 0), 0).toLocaleString()} ج.م</strong></span>
                <span>تخضع جميع العهد لمشرف الأوعية واللجان الهندسية لشركة M Group Cool.</span>
              </div>

            </div>

          </div>

        </div>
      )}

      {/* ======================= TAB 5: VEHICLE FLEET MANAGEMENT ======================= */}
      {activeTab === 'vehicles' && (
        <div className="space-y-6 text-right">
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Add Vehicle Form */}
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-4">
              <h4 className="font-bold text-slate-800 text-sm flex items-center justify-end gap-2">
                <span>ترخيص وإدراج مركبة توزيع جديدة</span>
                <Truck className="w-5 h-5 text-indigo-500" />
              </h4>
              <p className="text-[10px] text-slate-400">يسجل ويراقب مواعيد انتهاء تأمين الرخص ورخص حركة الصيانة لسيارات يونيون إير والورديات.</p>

              <form onSubmit={(e) => {
                e.preventDefault();
                if (!newPlate || !newModel) {
                  alert("يرجى إدخال لوحة وموديل السيارة أولاً!");
                  return;
                }
                const newVeh = {
                  id: 'veh_' + Date.now(),
                  plate: newPlate,
                  model: newModel,
                  driver: newDriver || 'لم يعين سائق',
                  insuExpiry: newInsuExpiry || '30/12/2026',
                  licExpiry: newLicExpiry || '15/06/2026',
                  fuelLog: 100
                };

                const updated = [newVeh, ...currentVehicles];
                updateSettings({
                  vehicles: updated as any
                });

                setNewPlate('');
                setNewModel('');
                setNewDriver('');
                setNewInsuExpiry('');
                setNewLicExpiry('');
                alert("تم تسجيل تذكرة حركة المركبة، ومراقبة رخصة القيادة بنجاح!");
              }} className="space-y-3">
                
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">لوحة السيارة الرقمية</label>
                  <input
                    type="text"
                    value={newPlate}
                    onChange={(e) => setNewPlate(e.target.value)}
                    placeholder="مثال: أ ب ج 1122"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg text-xs text-right font-semibold"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">موديل السيارة ومواصفاتها</label>
                  <input
                    type="text"
                    value={newModel}
                    onChange={(e) => setNewModel(e.target.value)}
                    placeholder="مثال: ديمكس ربع نقل حمولة الفريون"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg text-xs"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">السائق المعين للرحلات</label>
                  <input
                    type="text"
                    value={newDriver}
                    onChange={(e) => setNewDriver(e.target.value)}
                    placeholder="مثال: السائق عم عوض"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">تاريخ انتهاء الفحص الفني والرخصة</label>
                  <input
                    type="text"
                    value={newLicExpiry}
                    onChange={(e) => setNewLicExpiry(e.target.value)}
                    placeholder="DD/MM/YYYY"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg text-xs text-left font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">تاريخ انتهاء التأمين الاختياري</label>
                  <input
                    type="text"
                    value={newInsuExpiry}
                    onChange={(e) => setNewInsuExpiry(e.target.value)}
                    placeholder="DD/MM/YYYY"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg text-xs text-left font-mono"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  حفظ وتسجيل تذكرة السيارة اللوجيستية ❄️
                </button>
              </form>
            </div>

            {/* Vehicle List Display with expirations alarm */}
            <div className="md:col-span-2 bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-4">
              <h4 className="font-bold text-slate-800 text-sm">أسطول سيارات ومركبات التوزيع والنقل لشركة M Group Cool</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentVehicles.map((v: any) => {
                  // Alarm Check: is license or insurance expiring within 30 days or is already expired
                  const today = Date.now();
                  const licDateParts = (v.licExpiry || '30/12/2026').split('/');
                  const hasLicExp = licDateParts.length === 3;
                  const licTime = hasLicExp ? new Date(licDateParts.reverse().join('-')).getTime() : today + 100000000;
                  const daysToLic = Math.round((licTime - today) / (1000 * 3600 * 24));
                  const isCriticalLic = daysToLic <= 30;

                  return (
                    <div key={v.id} className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="px-2.5 py-1 bg-indigo-50 border border-indigo-100 text-indigo-700 font-bold text-xs font-mono rounded-lg">
                          {v.plate}
                        </span>
                        <h5 className="font-bold text-slate-800 text-xs">{v.model}</h5>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-500 text-right">
                        <div>
                          <strong>السائق:</strong> {v.driver}
                        </div>
                        <div>
                          <strong>استهلاك الفل:</strong> {v.fuelLog || 0} لتر / شهري
                        </div>
                        <div>
                          <strong>نهاية رخصة الفحص:</strong> {v.licExpiry}
                        </div>
                        <div>
                          <strong>انتهاء التأمين:</strong> {v.insuExpiry}
                        </div>
                      </div>

                      {isCriticalLic ? (
                        <div className="p-2 bg-red-50 border border-red-100 rounded-lg text-[10px] text-red-600 flex items-center gap-1.5 justify-end">
                          <span>انتباه: ترخيص السيارة ينتهي خلال {daysToLic} يوم! يرجى السداد.</span>
                          <AlertTriangle className="w-3.5 h-3.5 text-red-650 animate-bounce" />
                        </div>
                      ) : (
                        <div className="p-2 bg-emerald-50 border border-emerald-100 rounded-lg text-[10px] text-emerald-700 flex items-center gap-1.5 justify-end">
                          <span>الرخص سارية وتم التأمين عليها بنجاح.</span>
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}
