/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { MaintenanceOrder, Customer, Device, Employee } from '../types';
import { dataService } from '../dataService';
import { 
  FilePlus, 
  Wrench, 
  User, 
  Calendar, 
  CheckCircle, 
  Clock, 
  XCircle, 
  AlertCircle,
  Plus,
  Compass,
  DollarSign,
  Camera,
  FolderOpen,
  Image as ImageIcon,
  ChevronDown
} from 'lucide-react';

interface WorkOrdersModuleProps {
  orders: MaintenanceOrder[];
  customers: Customer[];
  devices: Device[];
  employees: Employee[];
  onAddOrder: (data: Omit<MaintenanceOrder, 'id' | 'date'>) => MaintenanceOrder;
  onUpdateOrder: (id: string, data: Partial<MaintenanceOrder>) => void;
  onDeleteOrder: (id: string) => void;
  voiceTrigger?: any;
}

const SERVICE_TYPES = [
  "صيانة وتنظيف",
  "صيانة وإصلاح",
  "صيانة فضية",
  "صيانة ذهبية",
  "صيانة VIP",
  "تركيب جديد",
  "فك ونقل",
  "فك وتركيب"
];

export default function WorkOrdersModule({
  orders,
  customers,
  devices,
  employees,
  onAddOrder,
  onUpdateOrder,
  onDeleteOrder,
  voiceTrigger
}: WorkOrdersModuleProps) {

  // State
  const [activeTab, setActiveTab] = useState<'list' | 'add'>('list');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Top-level stats for Editing Work Order
  const [editingOrder, setEditingOrder] = useState<MaintenanceOrder | null>(null);
  const [editTechId, setEditTechId] = useState('');
  const [editServiceType, setEditServiceType] = useState('');
  const [editPriority, setEditPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [editStatus, setEditStatus] = useState<any>('new');
  const [editCost, setEditCost] = useState('0');
  const [editCollection, setEditCollection] = useState('0');
  const [editExpenses, setEditExpenses] = useState('0');
  const [editNotes, setEditNotes] = useState('');

  React.useEffect(() => {
    if (editingOrder) {
      setEditTechId(editingOrder.technicianId || '');
      setEditServiceType(editingOrder.serviceType || '');
      setEditPriority(editingOrder.priority || 'medium');
      setEditStatus(editingOrder.status || 'new');
      setEditCost(String(editingOrder.cost || 0));
      setEditCollection(String(editingOrder.collectionAmount || 0));
      setEditExpenses(String(editingOrder.expenses || 0));
      setEditNotes(editingOrder.notes || '');
    }
  }, [editingOrder]);

  React.useEffect(() => {
    if (!voiceTrigger || voiceTrigger.module !== 'orders') return;
    if (voiceTrigger.subAction === 'create_order') {
      setActiveTab('add');
    }
  }, [voiceTrigger]);

  // Customer Centric Fast Inputs
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerRegion, setCustomerRegion] = useState('');

  // Selected existing devices (if any exist for matchedCustomer)
  const [selectedExistingDeviceIds, setSelectedExistingDeviceIds] = useState<string[]>([]);
  
  // Temporary new devices to be saved on-the-fly
  const [newDevicesToCreate, setNewDevicesToCreate] = useState<{
    brand: string;
    capacity: string;
    model: string;
    serialNumber: string;
    notes: string;
  }[]>([]);

  // Input states for a single draft device
  const [deviceBrand, setDeviceBrand] = useState('شارب (Sharp)');
  const [deviceCapacity, setDeviceCapacity] = useState('1.5 حصان');
  const [deviceModel, setDeviceModel] = useState('');
  const [deviceSerial, setDeviceSerial] = useState('');
  const [deviceNotes, setDeviceNotes] = useState('');

  // Form main states
  const [technicianId, setTechnicianId] = useState('');
  const [assistantId, setAssistantId] = useState('');
  const [serviceType, setServiceType] = useState('صيانة وتنظيف');
  const [cost, setCost] = useState<number>(450);
  const [collectionAmount, setCollectionAmount] = useState<number>(0);
  const [expenses, setExpenses] = useState<number>(0);
  const [notes, setNotes] = useState('');
  
  // Visual state attachments (Base64 buffers)
  const [photoBefore, setPhotoBefore] = useState<string>('');
  const [photoAfter, setPhotoAfter] = useState<string>('');

  // Dropdowns
  const techniciansList = useMemo(() => {
    return employees.filter(e => e.jobTitle.includes("فني") || e.id === "EMP-001" || e.id === "EMP-002");
  }, [employees]);

  const assistantsList = useMemo(() => {
    return employees.filter(e => e.jobTitle.includes("مساعد") || e.id === "EMP-002");
  }, [employees]);

  // Automatic Lookup Logic
  const matchedCustomer = useMemo(() => {
    const phone = customerPhone.trim();
    const name = customerName.trim();
    if (!phone && !name) return null;
    return customers.find(c => 
      (phone && c.phone.trim() === phone) || 
      (name && c.name.trim().toLowerCase() === name.toLowerCase())
    );
  }, [customers, customerName, customerPhone]);

  const matchedCustomerDevices = useMemo(() => {
    if (!matchedCustomer) return [];
    return devices.filter(d => d.customerId === matchedCustomer.id);
  }, [devices, matchedCustomer]);

  const filteredOrders = useMemo(() => {
    return orders.filter(o => statusFilter === 'all' || o.status === statusFilter);
  }, [orders, statusFilter]);

  // Image reader helpers
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>, stateSetter: (b64: string) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("حجم الصورة كبير جداً! يرجى اختيار صورة أصغر من 2 ميغابايت للحفاظ على كفاءة المزامنة السريعة.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        stateSetter(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !customerPhone.trim()) {
      alert("يرجى إدخال اسم العميل ورقم الهاتف على الأقل!");
      return;
    }

    // 1. Get or create Customer
    let targetCustomerId = '';
    if (matchedCustomer) {
      targetCustomerId = matchedCustomer.id;
      // Option to update customer's address
      if (customerAddress.trim() && customerAddress.trim() !== matchedCustomer.address) {
        dataService.updateCustomer(matchedCustomer.id, { address: customerAddress.trim() });
      }
    } else {
      // Create a brand new customer automatically in backend
      const newC = dataService.addCustomer({
        name: customerName.trim(),
        phone: customerPhone.trim(),
        phone2: '',
        email: '',
        address: customerAddress.trim() || 'غير محدد',
        governorate: 'القاهرة',
        region: customerRegion.trim() || 'صيانة تكييف',
        customerSource: 'مباشر (سجل تكييفات سريع)',
        notes: 'تمت الإضافة تلقائياً من محرر مأموية التشغيل المباشرة',
        rating: 5
      });
      targetCustomerId = newC.id;
    }

    // 2. Add devices
    const savedDeviceIds = [...selectedExistingDeviceIds];
    const devicesListToSave = [...newDevicesToCreate];

    // If they populated the device text inputs but didn't hit [+] button, auto-add it too!
    if (deviceBrand && deviceCapacity && (deviceModel || deviceSerial || deviceNotes)) {
      devicesListToSave.push({
        brand: deviceBrand,
        capacity: deviceCapacity,
        model: deviceModel,
        serialNumber: deviceSerial,
        notes: deviceNotes
      });
    }

    for (const dev of devicesListToSave) {
      const newDev = dataService.addDevice({
        customerId: targetCustomerId,
        brand: dev.brand,
        type: 'سبليت (Split)',
        capacity: dev.capacity,
        serialNumber: dev.serialNumber || '',
        model: dev.model || '',
        notes: dev.notes || ''
      });
      savedDeviceIds.push(newDev.id);
    }

    // 3. Create the Work Order with all linked device IDs formatted
    const finalDeviceIdsStr = savedDeviceIds.join(';');

    onAddOrder({
      customerId: targetCustomerId,
      deviceId: finalDeviceIdsStr,
      technicianId: technicianId || '',
      assistantId: assistantId || undefined,
      serviceType,
      status: 'new',
      cost: cost || 0,
      collectionAmount: collectionAmount || 0,
      expenses: expenses || 0,
      photoBefore: photoBefore || undefined,
      photoAfter: photoAfter || undefined,
      notes
    });

    // Reset fields
    setCustomerName('');
    setCustomerPhone('');
    setCustomerAddress('');
    setCustomerRegion('');
    setSelectedExistingDeviceIds([]);
    setNewDevicesToCreate([]);
    setDeviceBrand('شارب (Sharp)');
    setDeviceCapacity('1.5 حصان');
    setDeviceModel('');
    setDeviceSerial('');
    setDeviceNotes('');
    setTechnicianId('');
    setAssistantId('');
    setCost(450);
    setCollectionAmount(0);
    setExpenses(0);
    setNotes('');
    setPhotoBefore('');
    setPhotoAfter('');
    setActiveTab('list');
  };

  const getStatusBadge = (status: MaintenanceOrder['status']) => {
    switch (status) {
      case 'new':
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-50 text-red-700 text-xs font-bold rounded-full">● جديد</span>;
      case 'in_progress':
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 text-xs font-bold rounded-full animate-pulse">● في التنفيذ</span>;
      case 'completed':
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full">✓ مكتمل ومقفل</span>;
      case 'cancelled':
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-500 text-xs font-bold rounded-full">✕ ملغي</span>;
    }
  };

  return (
    <div className="space-y-6" id="work-orders-module">
      
      {editingOrder && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-2xl w-full text-right space-y-4 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center border-b pb-3 border-gray-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setEditingOrder(null)}
                className="px-3 py-1 bg-red-105 hover:bg-red-200 text-red-600 rounded-lg text-xs font-black cursor-pointer"
              >
                إلغاء وتراجع
              </button>
              <h3 className="font-sans font-black text-slate-900 dark:text-slate-100 text-sm">✏️ تعديل ومزامنة أمر التشغيل وصيانة الفنيين</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-655 dark:text-gray-305 mb-1">الفني المسؤول المكلف</label>
                <select
                  value={editTechId}
                  onChange={(e) => setEditTechId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-850 dark:text-white"
                >
                  <option value="">-- اختر فني من الإداريين الميدانيين --</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name} ({emp.role})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-655 dark:text-gray-305 mb-1">طبيعة ونوع الخدمة المخططة</label>
                <select
                  value={editServiceType}
                  onChange={(e) => setEditServiceType(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-850 dark:text-white"
                >
                  {SERVICE_TYPES.map(st => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-655 dark:text-gray-305 mb-1 text-right">أولويّة المهمة الفنية</label>
                <select
                  value={editPriority}
                  onChange={(e: any) => setEditPriority(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-850 dark:text-white"
                >
                  <option value="low">منخفضة (Low)</option>
                  <option value="medium">متوسطة العجلة (Medium)</option>
                  <option value="high">شديدة الأهمية وعاجلة (High)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-655 dark:text-gray-305 mb-1 text-right">حالة تقدم المهمة</label>
                <select
                  value={editStatus}
                  onChange={(e: any) => setEditStatus(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-850 dark:text-white font-bold"
                >
                  <option value="new">مستلمة جديدة (New)</option>
                  <option value="assigned">تم التكليف والتحوط (Assigned)</option>
                  <option value="in_progress">الفني بالميدان وقاريء العطل (In Progress)</option>
                  <option value="completed">تم الصيانة والتحصيل بنجاح (Completed)</option>
                  <option value="cancelled">ألغي مؤقتاً (Cancelled)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-655 dark:text-gray-305 mb-1">التكلفة والرسوم ج.م</label>
                <input
                  type="number"
                  value={editCost}
                  onChange={(e) => setEditCost(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-850 dark:text-white font-mono text-left"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-655 dark:text-gray-305 mb-1 font-sans">المبلغ المالي المحصل الفعلي ج.م</label>
                <input
                  type="number"
                  value={editCollection}
                  onChange={(e) => setEditCollection(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-850 dark:text-white font-mono text-left text-emerald-600 font-bold"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-655 dark:text-gray-305 mb-1">مصاريف التشغيل والمواد الموردة فليكس ج.م</label>
                <input
                  type="number"
                  value={editExpenses}
                  onChange={(e) => setEditExpenses(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-850 dark:text-white font-mono text-left text-red-500 font-bold"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-655 dark:text-gray-305 mb-1">ملاحظات وتقرير صيانة المشابك</label>
                <textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="w-full h-20 p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-850 dark:text-white text-right resize-none"
                  placeholder="ملاحظات العطل وتوقيت الذهاب والتسريبات..."
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-3 border-t border-gray-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setEditingOrder(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 text-gray-750 dark:text-gray-200 text-xs font-semibold rounded-xl"
              >
                إلغاء الأمر
              </button>
              <button
                type="button"
                onClick={() => {
                  onUpdateOrder(editingOrder.id, {
                    technicianId: editTechId,
                    serviceType: editServiceType,
                    priority: editPriority,
                    status: editStatus,
                    cost: Number(editCost) || 0,
                    collectionAmount: Number(editCollection) || 0,
                    expenses: Number(editExpenses) || 0,
                    notes: editNotes
                  });
                  setEditingOrder(null);
                  alert('تم تحديث ومزامنة أمر التشغيل وتوريدات الفني المالي بنجاح!');
                }}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl cursor-pointer"
              >
                💾 حفظ التغـييرات والأرقام
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Upper tabs */}
      <div className="flex border-b border-gray-100 bg-white p-2 rounded-2xl shadow-xs gap-2">
        <button
          onClick={() => setActiveTab('list')}
          className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors cursor-pointer ${activeTab === 'list' ? 'bg-sky-50 text-sky-700' : 'text-gray-600 hover:bg-gray-50'}`}
        >
          أوامر التشغيل (مخطط الصيانة)
        </button>
        <button
          onClick={() => setActiveTab('add')}
          className={`flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors cursor-pointer ${activeTab === 'add' ? 'bg-sky-50 text-sky-700' : 'text-gray-600 hover:bg-gray-50'}`}
        >
          <FilePlus className="w-4 h-4" />
          إنشاء أمر تشغيل جديد
        </button>
      </div>

      {activeTab === 'list' && (
        <div className="space-y-5">
          
          {/* Filtering row */}
          <div className="flex gap-2 p-3 bg-white border border-gray-100 rounded-2xl shadow-xs justify-end">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer ${statusFilter === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
            >
              الكل
            </button>
            <button
              onClick={() => setStatusFilter('new')}
              className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer ${statusFilter === 'new' ? 'bg-red-50 text-red-700' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
            >
              جديد
            </button>
            <button
              onClick={() => setStatusFilter('in_progress')}
              className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer ${statusFilter === 'in_progress' ? 'bg-amber-50 text-amber-700' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
            >
              جاري العمل
            </button>
            <button
              onClick={() => setStatusFilter('completed')}
              className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer ${statusFilter === 'completed' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
            >
              مكتمل
            </button>
          </div>

          {/* Grid list of Orders */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-right">
            {filteredOrders.length > 0 ? (
              filteredOrders.map(o => {
                const targetCustomer = customers.find(c => c.id === o.customerId);
                const targetDevice = devices.find(d => d.id === o.deviceId);
                const targetTech = employees.find(e => e.id === o.technicianId);
                const targetAssistant = employees.find(e => e.id === o.assistantId);

                return (
                  <div key={o.id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs hover:shadow-md transition-all space-y-4">
                    
                    {/* Header card info */}
                    <div className="flex items-center justify-between">
                      {getStatusBadge(o.status)}
                      <div className="text-right">
                        <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded">{o.id}</span>
                        <div className="flex items-center gap-1.5 mt-2 justify-end text-xs text-gray-400">
                          <span className="font-mono">{o.date}</span>
                          <Calendar className="w-3.5 h-3.5" />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm text-slate-700 pt-3 border-t border-slate-50">
                      <div>
                        <span className="text-gray-400 inline-block w-20">العميل:</span>
                        <strong className="text-slate-800">{targetCustomer?.name || "عميل محذوف"}</strong>
                      </div>
                      <div>
                        <span className="text-gray-400 inline-block w-20">العنوان والحي:</span>
                        <span className="text-slate-600 text-xs">{targetCustomer?.address}</span>
                      </div>
                      <div>
                        <span className="text-gray-400 inline-block w-20">الأجهزة:</span>
                        <span className="text-slate-600 inline-flex flex-wrap gap-1 align-middle">
                          {(() => {
                            if (!o.deviceId) return <span className="text-slate-400 text-xs text-right">بدون أجهزة</span>;
                            const ids = o.deviceId.split(';');
                            const matched = ids.map(id => devices.find(d => d.id === id)).filter(Boolean) as Device[];
                            if (matched.length === 0) return <span className="text-slate-400 text-xs">غير محدد</span>;
                            return matched.map((d, index) => (
                              <span key={index} className="inline-block bg-slate-100 text-slate-800 text-[10px] px-2 py-0.5 rounded font-bold">
                                {d.brand} - {d.capacity} {d.model ? `(${d.model})` : ''}
                              </span>
                            ));
                          })()}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400 inline-block w-20">أمر الخدمة:</span>
                        <strong className="text-sky-700">{o.serviceType}</strong>
                      </div>
                      <div className="flex gap-4">
                        <div>
                          <span className="text-gray-400">الفني:</span> <strong className="text-slate-800 text-xs">{targetTech?.name || "غير محدد"}</strong>
                        </div>
                        {targetAssistant && (
                          <div>
                            <span className="text-gray-400">المساعد:</span> <strong className="text-slate-800 text-xs">{targetAssistant.name}</strong>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Financial stats of order */}
                    <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-xl text-center text-xs">
                      <div>
                        <span className="text-gray-400 block mb-0.5">التكلفة</span>
                        <strong className="text-slate-800">{o.cost.toLocaleString('ar-EG')} ج.م</strong>
                      </div>
                      <div>
                        <span className="text-gray-400 block mb-0.5">المحصل المالي</span>
                        <strong className={o.collectionAmount >= o.cost ? "text-emerald-600" : "text-amber-600"}>
                          {o.collectionAmount.toLocaleString('ar-EG')} ج.م
                        </strong>
                      </div>
                      <div>
                        <span className="text-gray-400 block mb-0.5">المصروفات</span>
                        <strong className="text-red-500">{o.expenses.toLocaleString('ar-EG')} ج.م</strong>
                      </div>
                    </div>

                    {/* BEFORE / AFTER PHOTO PREVIEWS */}
                    {(o.photoBefore || o.photoAfter) && (
                      <div className="grid grid-cols-2 gap-2 pt-2">
                        {o.photoBefore ? (
                          <div className="relative rounded-lg overflow-hidden border border-slate-200 h-24 bg-slate-50 flex flex-col justify-end">
                            <img src={o.photoBefore} alt="قبل" className="w-full h-full object-cover absolute inset-0" />
                            <span className="relative z-10 px-2 py-0.5 bg-black/60 text-white text-[10px] font-bold">الحالة قبل الصيانة</span>
                          </div>
                        ) : (
                          <div className="rounded-lg border border-dotted border-slate-200 h-24 flex items-center justify-center text-gray-400 text-[10px]">
                            بدون صورة قبل
                          </div>
                        )}

                        {o.photoAfter ? (
                          <div className="relative rounded-lg overflow-hidden border border-slate-200 h-24 bg-slate-50 flex flex-col justify-end">
                            <img src={o.photoAfter} alt="بعد" className="w-full h-full object-cover absolute inset-0" />
                            <span className="relative z-10 px-2 py-0.5 bg-emerald-700/85 text-white text-[10px] font-bold">الحالة بعد الغسيل</span>
                          </div>
                        ) : (
                          <div className="rounded-lg border border-dotted border-slate-200 h-24 flex items-center justify-center text-gray-400 text-[10px]">
                            بدون صورة بعد
                          </div>
                        )}
                      </div>
                    )}

                    {o.notes && (
                      <div className="bg-amber-50/50 p-2.5 rounded-lg border border-amber-100 text-[11px] text-amber-900 leading-relaxed">
                        <strong>ملاحظات ومعالجة الفني:</strong> {o.notes}
                      </div>
                    )}

                    {/* Operational controls */}
                    <div className="flex gap-2 pt-3 border-t border-slate-50 justify-end">
                      {o.status === 'new' && (
                        <button
                          onClick={() => onUpdateOrder(o.id, { status: 'in_progress' })}
                          className="px-3.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                        >
                          بدء تشغيل المهمة للفني
                        </button>
                      )}
                      {o.status === 'in_progress' && (
                        <div className="flex gap-1">
                          <input 
                            type="number"
                            placeholder="تحصيل مالي ج.م?"
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              (o as any)._editedCollection = val;
                            }}
                            className="w-24 px-2 py-1 border rounded text-xs"
                          />
                          <button
                            onClick={() => {
                              const extraCollection = (o as any)._editedCollection || o.cost;
                              onUpdateOrder(o.id, { 
                                status: 'completed', 
                                collectionAmount: extraCollection 
                              });
                            }}
                            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
                          >
                            إنهاء وإغلاق
                          </button>
                        </div>
                      )}
                      
                      <button
                        type="button"
                        onClick={() => setEditingOrder(o)}
                        className="px-3 py-1.5 text-indigo-600 hover:bg-indigo-50 text-xs font-semibold rounded-lg cursor-pointer text-right"
                      >
                        تعديل وبيانات الأمر ✏️
                      </button>

                      <button
                        onClick={() => { if (confirm("هل تريد حذف أمر الصيانة؟")) onDeleteOrder(o.id); }}
                        className="px-3 py-1.5 text-red-500 hover:bg-red-50 text-xs font-semibold rounded-lg cursor-pointer"
                      >
                        إلغاء الأمر وحذفه
                      </button>
                    </div>

                  </div>
                );
              })
            ) : (
              <div className="col-span-full py-16 bg-white rounded-2xl border border-gray-100 text-center">
                <p className="text-gray-400 text-sm">لا توجد مأموريات صيانة في هذا الاختيار حالياً.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Adding Order Form */}
      {activeTab === 'add' && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs space-y-6 text-right">
          <div className="flex items-center gap-2 mb-4 justify-end">
            <h3 className="font-bold text-slate-800 text-lg">تحرير مأمورية صيانة وتكليف للعمل</h3>
            <Wrench className="w-5 h-5 text-primary" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            
            {/* Customer Inputs */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-4 md:col-span-2">
              <span className="text-xs font-black text-indigo-600 block">بيانات العميل الأساسية (حقل الاسم والهاتف إلزامي فقط)</span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">اسم العميل</label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="أدخل اسم العميل بالكامل..."
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">رقم الهاتف القديم أو الجديد</label>
                  <input
                    type="tel"
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="رقم الهاتف للتواصل والبحث..."
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-left font-mono outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">العنوان بالتفصيل (اختياري)</label>
                  <input
                    type="text"
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                    placeholder="الشارع، الحي، العمارة، رقم الشقة..."
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">المنطقة والحي (اختياري)</label>
                  <input
                    type="text"
                    value={customerRegion}
                    onChange={(e) => setCustomerRegion(e.target.value)}
                    placeholder="أكتوبر، التجمع، المهندسين، الوراق، إلخ..."
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm outline-none"
                  />
                </div>
              </div>

              {/* Automatic Search Indicator & Existing Devices Selection */}
              {matchedCustomer ? (
                <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-emerald-800 uppercase">🟢 عميل مسجل بالنظام</span>
                    <strong className="text-xs text-slate-900">{matchedCustomer.name} (كود: {matchedCustomer.id})</strong>
                  </div>
                  <p className="text-[11px] text-emerald-700">لقد عثر النظام على هذا العميل مسبقاً وسيجري اختيار السجل والربط المالي به تلقائياً لمنع التكرار المزدوج للعملاء.</p>
                  
                  {/* Existing Devices List */}
                  {matchedCustomerDevices.length > 0 ? (
                    <div className="space-y-1.5 pt-2 border-t border-emerald-100">
                      <span className="text-xs font-bold text-slate-700 block">حدد أجهزة العميل المشمولة بالزيارة والغسيل أو الصيانة:</span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                        {matchedCustomerDevices.map(d => {
                          const isChecked = selectedExistingDeviceIds.includes(d.id);
                          return (
                            <label key={d.id} className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-100 hover:bg-slate-50 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => {
                                  if (isChecked) {
                                    setSelectedExistingDeviceIds(selectedExistingDeviceIds.filter(id => id !== d.id));
                                  } else {
                                    setSelectedExistingDeviceIds([...selectedExistingDeviceIds, d.id]);
                                  }
                                }}
                                className="rounded text-primary cursor-pointer"
                              />
                              <span className="text-xs text-slate-700">
                                {d.brand} - {d.capacity} {d.model ? `(${d.model})` : ''}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-400">لا توجد أجهزة مسجلة لهذا العميل مسبقاً. تمكن من تسجيل أول جهاز له بالأسفل.</p>
                  )}
                </div>
              ) : (
                customerPhone || customerName ? (
                  <div className="p-3 bg-sky-50 dark:bg-sky-950/20 border border-sky-100 rounded-xl">
                    <p className="text-xs text-sky-700 font-medium">📋 سيقوم النظام تلقائياً بإنشاء ملف تعريف جديد لهذا العميل المكتشف للمرة الأولى في قوائم ERP.</p>
                  </div>
                ) : null
              )}
            </div>

            {/* Devices Section */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-4 md:col-span-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-black text-indigo-600 block">ملف أجهزة التكييف المشمولة بالزيارة</span>
                <span className="text-[10px] text-slate-400 font-semibold">(اختياري)</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                <div className="md:col-span-1">
                  <label className="block text-[10px] font-semibold text-slate-600 mb-1">ماركة التكييف</label>
                  <select
                    value={deviceBrand}
                    onChange={(e) => setDeviceBrand(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs"
                  >
                    <option>شارب (Sharp)</option>
                    <option>كاريير (Carrier)</option>
                    <option>إل جي (LG)</option>
                    <option>يونيون آير (Unionaire)</option>
                    <option>دايكين (Daikin)</option>
                    <option>تورنيدو (Tornado)</option>
                    <option>أخرى / ماركة بديلة</option>
                  </select>
                </div>
                <div className="md:col-span-1">
                  <label className="block text-[10px] font-semibold text-slate-600 mb-1">القدرة بالحصان</label>
                  <select
                    value={deviceCapacity}
                    onChange={(e) => setDeviceCapacity(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs"
                  >
                    <option>1.5 حصان</option>
                    <option>2.25 حصان</option>
                    <option>3 حصان</option>
                    <option>4 حصان</option>
                    <option>5 حصان</option>
                    <option>أعلى من 5 حصان</option>
                  </select>
                </div>
                <div className="md:col-span-1">
                  <label className="block text-[10px] font-semibold text-slate-600 mb-1">الموديل (اختياري)</label>
                  <input
                    type="text"
                    value={deviceModel}
                    onChange={(e) => setDeviceModel(e.target.value)}
                    placeholder="مثال: سبليت بارد.."
                    className="w-full px-3 py-0 relative text-right items-center align-middle bg-white border border-slate-200 rounded-lg text-xs h-[30px]"
                  />
                </div>
                <div className="md:col-span-1">
                  <label className="block text-[10px] font-semibold text-slate-600 mb-1">الرقم التسلسلي (اختياري)</label>
                  <input
                    type="text"
                    value={deviceSerial}
                    onChange={(e) => setDeviceSerial(e.target.value)}
                    placeholder="S/N..."
                    className="w-full px-3 py-0 relative text-right items-center align-middle bg-white border border-slate-200 rounded-lg text-xs h-[30px]"
                  />
                </div>
                <div className="md:col-span-1">
                  <label className="block text-[10px] font-semibold text-slate-600 mb-1">ملاحظات للجهاز (اختياري)</label>
                  <input
                    type="text"
                    value={deviceNotes}
                    onChange={(e) => setDeviceNotes(e.target.value)}
                    placeholder="مثال: يثبت بالصالة"
                    className="w-full px-3 py-0 relative text-right items-center align-middle bg-white border border-slate-200 rounded-lg text-xs h-[30px]"
                  />
                </div>
              </div>

              {/* Add device button */}
              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={() => {
                    if (deviceBrand && deviceCapacity) {
                      setNewDevicesToCreate([...newDevicesToCreate, {
                        brand: deviceBrand,
                        capacity: deviceCapacity,
                        model: deviceModel,
                        serialNumber: deviceSerial,
                        notes: deviceNotes
                      }]);
                      // Reset local inputs
                      setDeviceModel('');
                      setDeviceSerial('');
                      setDeviceNotes('');
                    }
                  }}
                  className="px-4 py-2 bg-indigo-55 border border-indigo-250 text-indigo-700 hover:bg-indigo-100 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  <span>تسجيل جهاز تكييف صيانة إضافي لهذه المأمورية</span>
                </button>
              </div>

              {/* List of drafted devices */}
              {newDevicesToCreate.length > 0 && (
                <div className="space-y-1 pt-2 border-t border-slate-200">
                  <span className="text-[10px] font-black text-slate-500 block">أجهزة تكييف جديدة مضافة في مأمورية العمل الحالية لبطاقة العميل:</span>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {newDevicesToCreate.map((dev, idx) => (
                      <span key={idx} className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-100 text-indigo-800 rounded-lg text-xs font-bold">
                        <span>{dev.brand} - {dev.capacity} {dev.model ? `(${dev.model})` : ''}</span>
                        <button
                          type="button"
                          onClick={() => setNewDevicesToCreate(newDevicesToCreate.filter((_, i) => i !== idx))}
                          className="hover:text-red-500 text-slate-400 font-extrabold focus:outline-none text-[11px]"
                        >
                          ✕
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Service Type */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">نوع مأمورية التشغيل</label>
              <select
                value={serviceType}
                onChange={(e) => setServiceType(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm text-slate-800 outline-none text-right cursor-pointer"
              >
                {SERVICE_TYPES.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            {/* Designated Technicians */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">مهندس / فني الصيانة المكلف بالزيارة (اختياري)</label>
              <select
                value={technicianId}
                onChange={(e) => setTechnicianId(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm text-slate-800 outline-none text-right cursor-pointer"
              >
                <option value="">-- اختر فني الصيانة الرئيسي أو دعه فارغاً --</option>
                {techniciansList.map(tech => (
                  <option key={tech.id} value={tech.id}>{tech.name} ({tech.jobTitle})</option>
                ))}
              </select>
            </div>

            {/* Designated Assistant */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">مساعد التكييف المكلف (اختياري)</label>
              <select
                value={assistantId}
                onChange={(e) => setAssistantId(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm text-slate-800 outline-none text-right cursor-pointer"
              >
                <option value="">-- بدون مساعد (مهندس فردي) --</option>
                {assistantsList.map(ast => (
                  <option key={ast.id} value={ast.id}>{ast.name}</option>
                ))}
              </select>
            </div>

            {/* Financial variables */}
            <div className="grid grid-cols-3 gap-3 md:col-span-1">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">سعر الخدمة ج.م</label>
                <input
                  type="number"
                  value={cost}
                  onChange={(e) => setCost(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg text-sm text-left font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">مبلغ العربون المحصل</label>
                <input
                  type="number"
                  value={collectionAmount}
                  onChange={(e) => setCollectionAmount(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg text-sm text-left font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">المصروفات المقدرة</label>
                <input
                  type="number"
                  value={expenses}
                  onChange={(e) => setExpenses(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg text-sm text-left font-mono"
                />
              </div>
            </div>

            {/* Image Before Capture Drag / drop */}
            <div className="border border-dotted border-slate-300 p-4 rounded-xl space-y-2 text-center bg-slate-50 relative">
              <label className="cursor-pointer block">
                <div className="flex flex-col items-center gap-1">
                  <Camera className="w-8 h-8 text-slate-400 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-bold text-slate-700">تحميل صورة جهار التكييف قبل الصيانة</span>
                  <span className="text-[10px] text-slate-400">سحب أو إدراج ملفات الصور (أقل من 2MB)</span>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handlePhotoUpload(e, setPhotoBefore)}
                  className="hidden"
                />
              </label>
              {photoBefore && (
                <div className="mt-2 text-xs flex items-center justify-center gap-1.5 text-emerald-600 font-medium">
                  <ImageIcon className="w-4 h-4" />
                  تم تحميل الصورة بنجاح وتوفير حجم الموثوقية
                </div>
              )}
            </div>

            {/* Image After Capture Drag / drop */}
            <div className="border border-dotted border-slate-300 p-4 rounded-xl space-y-2 text-center bg-slate-50 relative">
              <label className="cursor-pointer block">
                <div className="flex flex-col items-center gap-1">
                  <Camera className="w-8 h-8 text-slate-300" />
                  <span className="text-xs font-bold text-slate-700">تحميل شكل مروحة ووحدات الغسيل بعد الصيانة</span>
                  <span className="text-[10px] text-slate-400">إثبات فعلي لـ M Group Cool (أقل من 2MB)</span>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handlePhotoUpload(e, setPhotoAfter)}
                  className="hidden"
                />
              </label>
              {photoAfter && (
                <div className="mt-2 text-xs flex items-center justify-center gap-1.5 text-emerald-600 font-medium">
                  <ImageIcon className="w-4 h-4" />
                  تم تحميل الصورة للوحدات الخارجية/الداخلية بنجاح
                </div>
              )}
            </div>

            {/* Notes */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">مواصفات العطل أو تعليمات الإدارة للفني</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="برجاء غسيل فلاتر الوحدة الداخلية بالكامل، والتأكد من عدم وجود تسريب لغاز فريون R410a بالمواسير الخارجية..."
                className="w-full h-24 px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm text-slate-800 outline-none focus:border-primary focus:bg-white text-right resize-none"
              />
            </div>

          </div>

          <div className="flex gap-2 justify-end pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setActiveTab('list')}
              className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-200 transition-colors cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-semibold transition-colors cursor-pointer"
            >
              تكليف الفني وإصدار أمر التشغيل لـ M Group
            </button>
          </div>
        </form>
      )}

    </div>
  );
}
