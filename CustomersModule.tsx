/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Customer, Device } from '../types';
import { 
  UserPlus, 
  Search, 
  MapPin, 
  Phone, 
  Mail, 
  Star, 
  Trash2, 
  Edit, 
  ChevronDown, 
  Plus, 
  Cpu, 
  MessageSquare, 
  Download, 
  Printer,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import { 
  Award, 
  ShieldCheck, 
  Calendar, 
  Clock, 
  DollarSign, 
  FileText, 
  AlertTriangle, 
  CheckCircle,
  MessageCircle,
  TrendingUp,
  User,
  Wrench
} from 'lucide-react';

interface CustomersModuleProps {
  customers: Customer[];
  devices: Device[];
  onAddCustomer: (data: Omit<Customer, 'id' | 'createdAt'>) => Customer;
  onUpdateCustomer: (id: string, data: Partial<Customer>) => void;
  onDeleteCustomer: (id: string) => void;
  onAddDevice: (data: Omit<Device, 'id'>) => Device;
  onDeleteDevice: (id: string) => void;
  orders?: any[];
  invoices?: any[];
  payments?: any[];
  contracts?: any[];
  voiceTrigger?: any;
  lang?: 'ar' | 'en';
}

const EGYPT_GOVERNORATES = [
  "القاهرة", "الجيزة", "الإسكندرية", "القليوبية", "البحيرة", "الشرقية", 
  "الغربية", "المنوفية", "الدقهلية", "الفيوم", "بني سويف", "المنيا", 
  "أسيوط", "سوهاج", "قنا", "الأقصر", "أسوان", "البحر الأحمر", "مطروح"
];

const CUSTOMER_SOURCES_MAP: Record<string, { ar: string; en: string }> = {
  "Facebook": { ar: "فيسبوك - إعلانات ممولة", en: "Facebook Ads" },
  "Instagram": { ar: "إنستجرام - صور وعروض", en: "Instagram Campaign" },
  "TikTok": { ar: "تيك توك - فيديوهات", en: "TikTok Viral" },
  "WhatsApp": { ar: "واتساب - حملات الشركة", en: "WhatsApp Group" },
  "Google": { ar: "بحث جوجل والخرائط المباشرة", en: "Google Search & Maps" },
  "Referral": { ar: "توصية صديق وعميل دائم", en: "Customer Referral" },
  "Existing Customer": { ar: "قاعدة بيانات العملاء القدامى", en: "Existing Database" },
  "Engineer": { ar: "مهندسين ومقاولي التركيبات", en: "Engineer Collaboration" },
  "Mohamed Ashraf": { ar: "حملات م. محمد أشرف الشخصية", en: "Mohamed Ashraf Referral" },
  "Mahmoud": { ar: "حملات م. محمود التشغيلية", en: "Mahmoud Referral" },
  "Other": { ar: "قنوات تسويقية أخرى", en: "Other Sources" }
};

const CUSTOMER_SOURCES = Object.keys(CUSTOMER_SOURCES_MAP);

export default function CustomersModule({
  customers,
  devices,
  onAddCustomer,
  onUpdateCustomer,
  onDeleteCustomer,
  onAddDevice,
  onDeleteDevice,
  orders = [],
  invoices = [],
  payments = [],
  contracts = [],
  voiceTrigger,
  lang = 'ar'
}: CustomersModuleProps) {

  // State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGov, setSelectedGov] = useState('');
  const [activeTab, setActiveTab] = useState<'list' | 'add' | 'profile' | 'roi'>('list');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  // Top-level states for Customer Edit / CRM Rating and Profile Interactions to prevent IIFE conditional render Hook rule violations
  const [isEditingCustomer, setIsEditingCustomer] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editPhone2, setEditPhone2] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editGov, setEditGov] = useState('القاهرة');
  const [editRegion, setEditRegion] = useState('');
  const [editSource, setEditSource] = useState('فيسبوك');
  const [editNotes, setEditNotes] = useState('');
  const [editRating, setEditRating] = useState(5);

  // Call log Form local state
  const [callType, setCallType] = useState<'call' | 'whatsapp' | 'followup'>('call');
  const [callOutcome, setCallOutcome] = useState('تم الاتصال وجلسة عمل مجدولة');
  const [callNotes, setCallNotes] = useState('');
  const [agentName, setAgentName] = useState('إدارة علاقات العملاء');

  React.useEffect(() => {
    if (!voiceTrigger || voiceTrigger.module !== 'crm') return;
    if (voiceTrigger.subAction === 'add_customer') {
      setActiveTab('add');
    } else if (voiceTrigger.subAction === 'open_first_customer') {
      if (customers.length > 0) {
        setSelectedCustomerId(customers[0].id);
        setActiveTab('profile');
      }
    }
  }, [voiceTrigger, customers]);

  // New Customer Form State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [phone2, setPhone2] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [governorate, setGovernorate] = useState('القاهرة');
  const [region, setRegion] = useState('');
  const [customerSource, setCustomerSource] = useState('فيسبوك');
  const [notes, setNotes] = useState('');
  const [rating, setRating] = useState(5);
  // Default coordinates for Egypt (Cairo center)
  const [latitude, setLatitude] = useState(30.0444);
  const [longitude, setLongitude] = useState(31.2357);

  // New Device Form State
  const [showAddDevicePanel, setShowAddDevicePanel] = useState(false);
  const [deviceBrand, setDeviceBrand] = useState('شارب (Sharp)');
  const [deviceType, setDeviceType] = useState('سبليت (Split)');
  const [deviceCapacity, setDeviceCapacity] = useState('2.25 حصان');
  const [deviceSerial, setDeviceSerial] = useState('');
  const [deviceInstallDate, setDeviceInstallDate] = useState('');
  const [deviceWarranty, setDeviceWarranty] = useState('');
  const [warrantyType, setWarrantyType] = useState<'company' | 'manufacturer'>('company');
  const [warrantyStartDate, setWarrantyStartDate] = useState('');
  const [warrantyEndDate, setWarrantyEndDate] = useState('');

  // Selected profile data
  const selectedCustomer = useMemo(() => {
    return customers.find(c => c.id === selectedCustomerId);
  }, [customers, selectedCustomerId]);

  React.useEffect(() => {
    if (selectedCustomer) {
      setEditName(selectedCustomer.name || '');
      setEditPhone(selectedCustomer.phone || '');
      setEditPhone2(selectedCustomer.phone2 || '');
      setEditEmail(selectedCustomer.email || '');
      setEditAddress(selectedCustomer.address || '');
      setEditGov(selectedCustomer.governorate || 'القاهرة');
      setEditRegion(selectedCustomer.region || '');
      setEditSource(selectedCustomer.customerSource || 'فيسبوك');
      setEditNotes(selectedCustomer.notes || '');
      setEditRating(selectedCustomer.rating || 5);
      setIsEditingCustomer(false);
    }
  }, [selectedCustomer]);

  const customerDevices = useMemo(() => {
    if (!selectedCustomerId) return [];
    return devices.filter(d => d.customerId === selectedCustomerId);
  }, [devices, selectedCustomerId]);

  // Filters
  const filteredCustomers = useMemo(() => {
    return customers.filter(c => {
      const matchSearch = 
        c.name.includes(searchTerm) || 
        c.id.includes(searchTerm) || 
        c.phone.includes(searchTerm) || 
        (c.address && c.address.includes(searchTerm));
      const matchGov = selectedGov === '' || c.governorate === selectedGov;
      return matchSearch && matchGov;
    });
  }, [customers, searchTerm, selectedGov]);

  const handleSaveCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone || !address) {
      alert("يرجى ملء الاسم ورقم الهاتف والعنوان بالكامل!");
      return;
    }
    
    onAddCustomer({
      name,
      phone,
      phone2,
      email,
      address,
      governorate,
      region,
      customerSource,
      notes,
      rating,
      location: { latitude, longitude }
    });

    // Reset Form
    setName('');
    setPhone('');
    setPhone2('');
    setEmail('');
    setAddress('');
    setRegion('');
    setNotes('');
    setRating(5);
    setActiveTab('list');
  };

  const handleSaveDevice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId) return;

    onAddDevice({
      customerId: selectedCustomerId,
      brand: deviceBrand,
      type: deviceType,
      capacity: deviceCapacity,
      serialNumber: deviceSerial,
      installationDate: deviceInstallDate,
      warranty: deviceWarranty,
      warrantyType,
      warrantyStartDate: warrantyStartDate || deviceInstallDate,
      warrantyEndDate,
      warrantyStatus: warrantyEndDate ? (new Date(warrantyEndDate.split('/').reverse().join('-')).getTime() > Date.now() ? 'active' : 'expired') : 'active'
    } as any);

    // Reset Form
    setDeviceBrand('شارب (Sharp)');
    setDeviceType('سبليت (Split)');
    setDeviceCapacity('2.25/حصان');
    setDeviceSerial('');
    setDeviceWarranty('');
    setWarrantyStartDate('');
    setWarrantyEndDate('');
    setShowAddDevicePanel(false);
  };

  // WhatsApp Messaging Logic
  const sendWhatsAppMessage = (phoneNum: string, templateType: 'confirm' | 'followup' | 'reminder') => {
    // Standard Egyptian Prefix 20
    let cleanPhone = phoneNum.replace(/[\s-+]/g, "");
    if (cleanPhone.startsWith("01")) {
      cleanPhone = "20" + cleanPhone.substring(1);
    } else if (cleanPhone.startsWith("1")) {
      cleanPhone = "20" + cleanPhone;
    }

    let text = "";
    const customerName = selectedCustomer?.name || "يا فندم";
    const customerCode = selectedCustomer?.id || "";

    if (templateType === 'confirm') {
      text = `السلام عليكم ورحمة الله وبركاته، مع سيادتك إدارة الصيانة والمتابعة من الشركة *M Group Cool*. بنأكد موعد الزيارة للفني لموقعكم الجغرافي المسجل لدينا غداً لإجراء خدمة التكييف المطلوبة. كود العميل: ${customerCode}. يرجى تأكيد جهوزيتكم. نشكركم لاختياركم لنا!`;
    } else if (templateType === 'followup') {
      text = `أهلاً وسهلاً بحضرتك أ. *${customerName}*، حابين نطمئن من حضرتك بخصوص جودة أداء جهاز التكييف ومستوى كفاءة خدمة غسيل/صيانة الجهاز التي قام بها فريق الفنيين اليوم. رضاكم هو هدفنا الأول! من M Group Cool.`;
    } else if (templateType === 'reminder') {
      text = `عميلنا العزيز أ. *${customerName}*، تذكركم شركة *M Group Cool* بأن موعد الزيارة الدورية لغسيل وصيانة تكييفكم قد اقترب، للحفاظ على كفاءة تبريد عالية وجودة هواء نقي. لحجز موعد مناسب، برجاء الرد على هذه الرسالة.`;
    }

    const waUrl = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(text)}`;
    window.open(waUrl, "_blank");
  };

  // Google Maps navigation url
  const openGoogleMaps = (lat: number, lng: number) => {
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
    window.open(mapsUrl, "_blank");
  };

  // Simulation of CSS print / standard CSV downloader (Excel alternative)
  const exportToExcel = () => {
    let csvContent = "data:text/csv;charset=utf-8,\uFEFF";
    csvContent += "كود العميل,الاسم,الهاتف,المحافظة,المنطقة,العنوان,المصدر,التقييم,تاريخ التسجيل\r\n";
    
    customers.forEach(c => {
      csvContent += `${c.id},${c.name},${c.phone},${c.governorate},${c.region},${c.address},${c.customerSource},${c.rating},${c.createdAt}\r\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `m_group_cool_customers_report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6" id="customers-module">
      
      {/* Tab Selectors */}
      <div className="flex border-b border-gray-100 bg-white dark:bg-slate-900 p-2 rounded-2xl shadow-xs gap-2">
        <button
          onClick={() => { setActiveTab('list'); setSelectedCustomerId(null); }}
          className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors cursor-pointer ${activeTab === 'list' ? 'bg-sky-50 text-sky-700' : 'text-gray-600 hover:bg-gray-50'}`}
        >
          قائمة العملاء
        </button>
        <button
          onClick={() => setActiveTab('add')}
          className={`flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors cursor-pointer ${activeTab === 'add' ? 'bg-sky-50 text-sky-700' : 'text-gray-600 hover:bg-gray-50'}`}
        >
          <UserPlus className="w-4 h-4" />
          إضافة عميل جديد
        </button>
        <button
          onClick={() => setActiveTab('roi')}
          className={`flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors cursor-pointer ${activeTab === 'roi' ? 'bg-sky-50 text-sky-700' : 'text-gray-600 hover:bg-gray-50'}`}
        >
          <TrendingUp className="w-4 h-4" />
          {lang === 'ar' ? 'العائد التسويقي والقنوات (ROI)' : 'Marketing & ROI'}
        </button>
        {activeTab === 'profile' && selectedCustomer && (
          <button
            className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-sky-50 text-sky-700 cursor-default"
          >
            ملف العميل: {selectedCustomer.name}
          </button>
        )}
      </div>

      {activeTab === 'list' && (
        <div className="space-y-4">
          
          {/* Filters shelf */}
          <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-xs">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="ابحث بالاسم، الكود، الهاتف، أو العنوان..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm text-slate-800 outline-none focus:border-primary focus:bg-white transition-all text-right"
              />
              <Search className="w-5 h-5 text-gray-400 absolute right-3 top-3" />
            </div>
            
            <div className="w-full md:w-56">
              <select
                value={selectedGov}
                onChange={(e) => setSelectedGov(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm text-slate-700 outline-none focus:border-primary text-right cursor-pointer"
              >
                <option value="">جميع المحافظات</option>
                {EGYPT_GOVERNORATES.map(gov => (
                  <option key={gov} value={gov}>{gov}</option>
                ))}
              </select>
            </div>

            <div className="flex gap-2 self-end md:self-auto">
              <button 
                onClick={exportToExcel}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-teal-50 text-teal-700 hover:bg-teal-100 rounded-xl text-xs font-semibold select-none cursor-pointer"
              >
                <Download className="w-4 h-4" />
                تصدير Excel
              </button>
              <button 
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-sky-50 text-sky-700 hover:bg-sky-100 rounded-xl text-xs font-semibold select-none cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                طباعة الكشف
              </button>
            </div>
          </div>

          {/* Customers Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredCustomers.length > 0 ? (
              filteredCustomers.map(c => {
                const countOfDevices = devices.filter(d => d.customerId === c.id).length;
                return (
                  <div 
                    key={c.id} 
                    className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs hover:shadow-md hover:border-gray-200 transition-all text-right flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between">
                        <span className="text-xs font-mono font-bold px-2.5 py-1 bg-slate-100 text-slate-500 rounded-md">
                          {c.id}
                        </span>
                        <div className="flex text-amber-400">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star 
                              key={i} 
                              className={`w-3.5 h-3.5 ${i < c.rating ? 'fill-current' : 'text-gray-200'}`} 
                            />
                          ))}
                        </div>
                      </div>

                      <h4 className="mt-3 font-bold text-slate-800 text-lg">{c.name}</h4>
                      
                      <div className="space-y-2 mt-4 text-sm text-slate-600">
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                          <span className="font-mono">{c.phone}</span>
                          {c.phone2 && <span className="font-mono text-xs text-gray-400"> / {c.phone2}</span>}
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-sky-500 flex-shrink-0" />
                          <span>{c.governorate}، {c.region}</span>
                        </div>

                        {c.email && (
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                            <span className="text-xs">{c.email}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-5 pt-4 border-t border-slate-50 flex items-center justify-between">
                      <span className="text-xs text-slate-400">
                        عدد الأجهزة: <strong className="text-slate-700">{countOfDevices}</strong>
                      </span>
                      
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => { setSelectedCustomerId(c.id); setActiveTab('profile'); }}
                          className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold cursor-pointer"
                        >
                          الملف الكامل والزيارات
                        </button>
                        <button
                          onClick={() => { if (confirm("هل أنت متأكد من حذف العميل؟")) onDeleteCustomer(c.id); }}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-span-full py-12 bg-white rounded-2xl text-center border border-gray-100">
                <p className="text-slate-400 text-sm">لا يوجد عملاء يطابقون خيارات البحث والفرز.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Adding profile */}
      {activeTab === 'add' && (
        <form onSubmit={handleSaveCustomer} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs space-y-6 text-right">
          <h3 className="font-bold text-slate-800 text-lg">إدخال عميل جديد</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">الاسم بالكامل <span className="text-red-500">*</span></label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="المهندس شريف منير العسال"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm text-slate-800 outline-none focus:border-primary focus:bg-white text-right"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">الهاتف الأساسي <span className="text-red-500">*</span></label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="01012345678"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm text-slate-800 outline-none focus:border-primary focus:bg-white text-left font-mono"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">الهاتف الإضافي (اختياري)</label>
              <input
                type="tel"
                value={phone2}
                onChange={(e) => setPhone2(e.target.value)}
                placeholder="0225432109"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm text-slate-800 outline-none focus:border-primary focus:bg-white text-left font-mono"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">البريد الإلكتروني (اختياري)</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="client@mail.com"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm text-slate-800 outline-none focus:border-primary focus:bg-white text-left"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">المحافظة <span className="text-red-500">*</span></label>
              <select
                value={governorate}
                onChange={(e) => setGovernorate(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm text-slate-800 outline-none focus:border-primary focus:bg-white text-right cursor-pointer"
              >
                {EGYPT_GOVERNORATES.map(gov => (
                  <option key={gov} value={gov}>{gov}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">المنطقة / الحي <span className="text-red-500">*</span></label>
              <input
                type="text"
                required
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                placeholder="التجمع الخامس، الشيخ زايد، إلخ"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm text-slate-800 outline-none focus:border-primary focus:bg-white text-right"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">العنوان بالتفصيل <span className="text-red-500">*</span></label>
              <input
                type="text"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="شارع التسعين الشمالي، بجوار البنك الأهلي، شقة 2"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm text-slate-800 outline-none focus:border-primary focus:bg-white text-right"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">مصدر العميل</label>
              <select
                value={customerSource}
                onChange={(e) => setCustomerSource(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm text-slate-800 outline-none focus:border-primary focus:bg-white text-right cursor-pointer"
              >
                {CUSTOMER_SOURCES.map(src => (
                  <option key={src} value={src}>{src}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">تقييم مبدئي للعميل</label>
              <div className="flex gap-2 items-center h-10 mt-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setRating(i + 1)}
                    className="p-1 hover:scale-110 transition-transform cursor-pointer"
                  >
                    <Star className={`w-6 h-6 ${i < rating ? 'text-amber-400 fill-amber-400' : 'text-gray-300'}`} />
                  </button>
                ))}
              </div>
            </div>

            {/* Google Maps Geographic Pins Drop Simulation */}
            <div className="md:col-span-2 bg-slate-50 p-4 rounded-xl border border-dotted border-slate-300 space-y-3">
              <span className="text-xs font-semibold text-slate-500 block">تحديد خطوط العرض والطول لخرائط جوجل (مأمورية الفنيين)</span>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600">خط العرض (Latitude)</label>
                  <input
                    type="number"
                    step="any"
                    value={latitude}
                    onChange={(e) => setLatitude(parseFloat(e.target.value))}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600">خط الطول (Longitude)</label>
                  <input
                    type="number"
                    step="any"
                    value={longitude}
                    onChange={(e) => setLongitude(parseFloat(e.target.value))}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-mono"
                  />
                </div>
              </div>
              <p className="text-xs text-gray-500">
                موقعه الافتراضي يشير إلى وسط القاهرة، وسيتمكن الفني بلمسة زر من فتح خرائط جوجل للذهاب للعميل مباشرة لتجنب التشنجات ومشاكل التوصيل.
              </p>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">ملاحظات هامة</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="على سبيل المثال: يفضل الاتصال به مساءً فقط، يمتلك كلاب حراسة..."
                className="w-full h-24 px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm text-slate-800 outline-none focus:border-primary focus:bg-white text-right resize-none"
              />
            </div>
          </div>

          <div className="flex gap-2 justify-end">
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
              حفظ بيانات العميل
            </button>
          </div>
        </form>
      )}

      {/* Customer Full profile */}
      {activeTab === 'profile' && selectedCustomer && (() => {
        // Compute scoring metrics
        const completedOrders = orders.filter(o => o.customerId === selectedCustomer.id && o.status === 'completed');
        const orderCount = completedOrders.length;
        const customerPayments = payments.filter(p => p.customerId === selectedCustomer.id);
        const totalPaid = customerPayments.reduce((sum, p) => sum + (p.amount || p.subtotal || 0), 0);
        const customerContracts = contracts.filter(c => c.customerId === selectedCustomer.id);
        const totalContractValue = customerContracts.reduce((sum, c) => sum + (c.value || 0), 0);
        
        let scoringLevel: 'VIP' | 'Gold' | 'Silver' | 'Standard' = 'Standard';
        let scoringColor = 'text-slate-500 bg-slate-50 border-slate-200';
        let scoringBadge = 'Standard (برونزي)';
        let scoringBadgeEn = 'Standard Level';
        
        if (totalPaid >= 15000 || totalContractValue >= 5000 || orderCount >= 5) {
          scoringLevel = 'VIP';
          scoringColor = 'text-purple-700 bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800 animate-pulse';
          scoringBadge = '💎 VIP (الجهة الأكثر تميزاً)';
          scoringBadgeEn = '💎 VIP Partner';
        } else if (totalPaid >= 8500 || orderCount >= 3) {
          scoringLevel = 'Gold';
          scoringColor = 'text-amber-700 bg-amber-50 dark:bg-amber-950/40 border-amber-250 dark:border-amber-800';
          scoringBadge = '🌟 فئة ذهبية (Gold)';
          scoringBadgeEn = '🌟 Gold Partner';
        } else if (totalPaid >= 3500 || orderCount >= 2) {
          scoringLevel = 'Silver';
          scoringColor = 'text-blue-700 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800';
          scoringBadge = '🛡️ فئة فضية (Silver)';
          scoringBadgeEn = '🛡️ Silver Partner';
        }

        // Note: Call log Form states are moved to top-level to prevent React Hook violations

        const handleSaveInteraction = (e: React.FormEvent) => {
          e.preventDefault();
          const date = new Date();
          const formattedDate = `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
          const newInteraction = {
            id: 'INT-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
            type: callType,
            date: formattedDate,
            outcome: callOutcome,
            notes: callNotes,
            agentName: agentName
          };
          const currentInteractions = (selectedCustomer as any).interactions || [];
          onUpdateCustomer(selectedCustomer.id, {
            ...selectedCustomer,
            interactions: [...currentInteractions, newInteraction]
          } as any);
          setCallNotes('');
          alert('تم تسجيل كول سنتر الاتصال وإضافته للتايم لاين بنجاح!');
        };

        // Timeline parsing
        const timelineEvents = (() => {
          const events: any[] = [];
          
          if (selectedCustomer.createdAt) {
            events.push({
              type: 'contact',
              title: 'أول اتصال وتسجيل بالمنظومة',
              titleEn: 'First contact & CRM registration',
              dateStr: selectedCustomer.createdAt,
              date: parseTimelineDate(selectedCustomer.createdAt),
              desc: `تم فتح حساب العميل الجديد وتسجيل بيانات الهوية الجغرافية: ${selectedCustomer.governorate} - ${selectedCustomer.region}`,
              descEn: `Client profile created under geographic coordinate parameters: ${selectedCustomer.governorate} - ${selectedCustomer.region}`,
              color: 'border-blue-500 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400'
            });
          }

          const cOrders = orders.filter(o => o.customerId === selectedCustomer.id);
          cOrders.forEach(o => {
            events.push({
              type: 'order',
              title: `أمر تشغيل: ${o.serviceType}`,
              titleEn: `Work Order: ${o.serviceType}`,
              dateStr: o.date,
              date: parseTimelineDate(o.date),
              desc: `كود الأمر (${o.id}) - فني: ${o.technicianId} | تكلفة التكليف: ${o.cost || 0} ج.م | الحالة: ${o.status === 'completed' ? 'منفذة ومغلقة' : 'قيد المتابعة مروياً'}`,
              descEn: `Order ID (${o.id}) - Tech: ${o.technicianId} | Labor cost: ${o.cost || 0} EGP | Status: ${o.status}`,
              color: o.status === 'completed' ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400' : 'border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400'
            });
          });

          const cInvoices = invoices.filter(i => i.customerId === selectedCustomer.id);
          cInvoices.forEach(i => {
            events.push({
              type: 'invoice',
              title: i.status === 'draft' ? 'عرض سعر تكييف وتأسيس' : 'فاتورة مبيعات وحسابات',
              titleEn: i.status === 'draft' ? 'Design Proposal / Quotation' : 'Corporate Tax Invoice',
              dateStr: i.date,
              date: parseTimelineDate(i.date),
              desc: `مستند (${i.invoiceNumber}) - القيمة: ${i.totalAmount || i.subtotal || 0} ج.م | حالة الدفع: ${i.status === 'paid' ? 'مسددة بالكامل' : 'قيد التحصيل'}`,
              descEn: `Receipt (${i.invoiceNumber}) - Subtotal: ${i.totalAmount || i.subtotal || 0} EGP | Payment: ${i.status}`,
              color: 'border-slate-500 bg-slate-50 dark:bg-slate-900 border-dashed text-slate-600 dark:text-slate-300'
            });
          });

          const cPayments = payments.filter(p => p.customerId === selectedCustomer.id);
          cPayments.forEach(p => {
            events.push({
              type: 'payment',
              title: `إشعار تحصيل مالي (${p.paymentType})`,
              titleEn: `Finance Deposit Logged (${p.paymentType})`,
              dateStr: p.paymentDate,
              date: parseTimelineDate(p.paymentDate),
              desc: `توريد مبلغ ${p.amount} ج.م معتمد بالخزينة لـ M Group | ملاحظة: ${p.notes || 'سداد عادي'}`,
              descEn: `Vault received ${p.amount} EGP cash credit | Memo: ${p.notes || 'invoice payment'}`,
              color: 'border-green-500 bg-green-50 dark:bg-green-950/40 text-green-600 dark:text-green-400'
            });
          });

          const cContracts = contracts.filter(c => c.customerId === selectedCustomer.id);
          cContracts.forEach(c => {
            events.push({
              type: 'contract',
              title: 'عقد صيانة دورية سنوي',
              titleEn: 'Annual Maintenance SLA Contract',
              dateStr: c.startDate,
              date: parseTimelineDate(c.startDate),
              desc: `رقم العقد (${c.contractNumber}) بقيمة ${c.value} ج.م | عدد الأجهزة: ${c.devicesCount} | الزيارات السنوية: ${c.visitsCount} زيارة. ينتهي في ${c.endDate}`,
              descEn: `Contract (${c.contractNumber}) - SLA value: ${c.value} EGP under ${c.visitsCount} checkpoints. Ends: ${c.endDate}`,
              color: 'border-purple-500 bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 font-bold'
            });
          });

          const cInteractions = (selectedCustomer as any).interactions || [];
          cInteractions.forEach((int: any) => {
            events.push({
              type: int.type,
              title: `اتصال كول سنتر: ${int.type === 'call' ? 'مكالمة هاتفية' : int.type === 'whatsapp' ? 'مراسلة واتساب' : 'متابعة ميدانية'}`,
              titleEn: `Call Center: ${int.type === 'call' ? 'Phone conversation' : int.type === 'whatsapp' ? 'WhatsApp Log' : 'Follow up'}`,
              dateStr: int.date,
              date: parseTimelineDate(int.date),
              desc: `النتيجة: ${int.outcome} | ملاحظات: ${int.notes} | المندوب: ${int.agentName}`,
              descEn: `Outcome: ${int.outcome} | Details: ${int.notes} | Agent: ${int.agentName}`,
              color: 'border-teal-500 bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400'
            });
          });

          return events.sort((a, b) => b.date.getTime() - a.date.getTime());
        })();

        function parseTimelineDate(dateStr: string): Date {
          try {
            const cleanStr = dateStr.split(' ')[0];
            const parts = cleanStr.split('/');
            if (parts.length === 3) {
              return new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
            }
          } catch (e) {}
          return new Date();
        }

        const allOrders = orders.filter(o => o.customerId === selectedCustomer.id);
        const totalOrdersCount = allOrders.length;

        const customerInvoices = invoices.filter(i => i.customerId === selectedCustomer.id);
        const totalInvoicesAmount = customerInvoices.reduce((sum, i) => sum + (i.totalAmount || i.subtotal || 0), 0);

        const customerBalance = totalInvoicesAmount - totalPaid;

        const completedAndInProgressOrders = allOrders.filter(o => o.status === 'completed' || o.status === 'in_progress');
        const lastVisitDateStr = completedAndInProgressOrders.length > 0 
          ? completedAndInProgressOrders.sort((a, b) => parseTimelineDate(b.date).getTime() - parseTimelineDate(a.date).getTime())[0].date
          : 'لا توجد زيارة سابقة';

        // HEURISTIC PREDICTIVE MAINTENANCE RISKS FOR APPLIANCES
        const predictiveRisks = customerDevices.map(d => {
          const failures = completedOrders.filter(o => o.deviceId === d.id);
          const issues = [];
          
          if (failures.length >= 2) {
            issues.push({
              level: 'high',
              titleAr: 'مخاطر تسريب فريون متكررة وعيوب لحام ⚠️',
              titleEn: 'Repeated Gas Leak & Copper Weld Risk ⚠️',
              descAr: 'تم تسجيل عمليات تعبئة متتالية للغاز. يوصى بفحص اللحامات والمواسير بالنيتروجين فوراً.',
              descEn: 'Multiple Freon recharges detected. Nitrogen pressure test strongly recommended on copper pipes.'
            });
          }
          if (d.capacity.includes("3") || d.capacity.includes("4") || d.capacity.includes("5")) {
            issues.push({
              level: 'medium',
              titleAr: 'سخونة الكباس الكهربائي لزيادة الحمل ⚡',
              titleEn: 'Compressor High Load Thermal Risk ⚡',
              descAr: 'القدرة الحصانية للجهاز تزيد عن 3 حصان. يوصى بتركيب واقي ومثبت للتيار الكهربائي لحمايته.',
              descEn: 'Appliance holds large horsepower. Voltage stabilizer is suggested to prevent compressor burnout.'
            });
          }
          
          issues.push({
            level: 'low',
            titleAr: 'أتربة متراكمة وانسداد مجرى التصريف (غسيل وقائي) 🧼',
            titleEn: 'Preventive Filter Wash & Drain Cleanup 🧼',
            descAr: 'الفترة الاسترشادية تخطت 6 أشهر. ينصح بطلب زيارة غسيل بالجراب لإبقاء درجة كفاءة التبريد عالية.',
            descEn: 'More than 6 months elapsed since setup. Book dynamic bag wash for peak thermal execution.'
          });

          return { device: d, issues };
        });

        return (
          <div className="space-y-6 text-right" id="customer-profile-view">
            
            {isEditingCustomer && (
              <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-2xl w-full text-right space-y-4 max-h-[90vh] overflow-y-auto shadow-2xl">
                  <div className="flex justify-between items-center border-b pb-3 border-gray-100 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => setIsEditingCustomer(false)}
                      className="px-3 py-1 bg-red-105 hover:bg-red-200 text-red-600 rounded-lg text-xs font-black cursor-pointer"
                    >
                      إلغاء وتراجع
                    </button>
                    <h3 className="font-sans font-black text-slate-900 dark:text-slate-100 text-sm">✏️ تعديل بيانات العميل وصدارة التقييم</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-gray-305 mb-1">اسم العميل بالكامل</label>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-850 dark:text-white text-right"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-gray-305 mb-1">رقم الهاتف الأساسي</label>
                      <input
                        type="text"
                        value={editPhone}
                        onChange={(e) => setEditPhone(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-850 dark:text-white font-mono text-left"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-gray-305 mb-1">الهاتف الإضافي / الطوارئ</label>
                      <input
                        type="text"
                        value={editPhone2}
                        onChange={(e) => setEditPhone2(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-850 dark:text-white font-mono text-left"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-gray-305 mb-1">البريد الإلكتروني للتعاقد</label>
                      <input
                        type="email"
                        value={editEmail}
                        onChange={(e) => setEditEmail(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-850 dark:text-white text-left font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-gray-305 mb-1">المحافظة</label>
                      <select
                        value={editGov}
                        onChange={(e) => setEditGov(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-850 dark:text-white"
                      >
                        {EGYPT_GOVERNORATES.map(g => (
                          <option key={g} value={g}>{g}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-gray-305 mb-1">المنطقة والحي السكني</label>
                      <input
                        type="text"
                        value={editRegion}
                        onChange={(e) => setEditRegion(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-850 dark:text-white text-right"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-gray-305 mb-1">قناة الاستقطاب</label>
                      <select
                        value={editSource}
                        onChange={(e) => setEditSource(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-850 dark:text-white"
                      >
                        {CUSTOMER_SOURCES.map(source => (
                          <option key={source} value={source}>{CUSTOMER_SOURCES_MAP[source]?.[lang] || source}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-gray-305 mb-1">تقييم العميل بالنجوم (Customer Rating)</label>
                      <div className="flex items-center gap-1.5 justify-end py-1">
                        {[1, 2, 3, 4, 5].map((num) => (
                          <button
                            type="button"
                            key={num}
                            onClick={() => setEditRating(num)}
                            className="p-1 hover:scale-110 transition-transform cursor-pointer"
                          >
                            <Star className={`w-5 h-5 ${num <= editRating ? 'text-amber-400 fill-amber-400' : 'text-gray-300'}`} />
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-xs font-semibold text-slate-600 dark:text-gray-305 mb-1">العنوان التفصيلي وتوجيهات الشاحنات</label>
                      <input
                        type="text"
                        value={editAddress}
                        onChange={(e) => setEditAddress(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-850 dark:text-white text-right"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-semibold text-slate-600 dark:text-gray-305 mb-1">ملاحظات سرية للإدارة الفنية</label>
                      <textarea
                        value={editNotes}
                        onChange={(e) => setEditNotes(e.target.value)}
                        className="w-full h-16 p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-850 dark:text-white text-right resize-none"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 justify-end pt-3 border-t border-gray-100 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => setIsEditingCustomer(false)}
                      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 text-gray-750 dark:text-gray-200 text-xs font-semibold rounded-xl"
                    >
                      إلغاء
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (!editName || !editPhone) {
                          alert('اسم العميل والهاتف حقول الزامية!');
                          return;
                        }
                        onUpdateCustomer(selectedCustomer.id, {
                          name: editName,
                          phone: editPhone,
                          phone2: editPhone2,
                          email: editEmail,
                          governorate: editGov,
                          region: editRegion,
                          customerSource: editSource,
                          address: editAddress,
                          notes: editNotes,
                          rating: editRating
                        });
                        setIsEditingCustomer(false);
                        alert('تم تحديث بيانات وتصنيف العميل بنجاح!');
                      }}
                      className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl cursor-pointer"
                    >
                      💾 حفظ التغـييرات والتقـييم
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Top row with Back button and Name */}
            <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-2xl border border-gray-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => { setActiveTab('list'); setSelectedCustomerId(null); }}
                  className="px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-slate-650 dark:text-slate-200 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <ChevronRight className="w-4 h-4" />
                  <span>العودة للاستعراض</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingCustomer(true)}
                  className="px-4 py-2 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:border-indigo-850 dark:text-indigo-305 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  ✏️ تعديل بيانات والتقييم
                </button>
              </div>
              <h2 className="text-sm font-black text-slate-800 dark:text-slate-100 flex items-center gap-1">
                <span>ملف مبيعات وتكييف العميل:</span>
                <span className="text-indigo-600 dark:text-indigo-400 font-extrabold">{selectedCustomer.name}</span>
              </h2>
            </div>

            {/* Premium Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
              
              <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-gray-100 dark:border-slate-800 text-center space-y-1 shadow-xs">
                <span className="text-[10px] text-slate-400 font-bold block">عدد الأجهزة</span>
                <strong className="text-base font-black text-slate-800 dark:text-slate-100 block">{customerDevices.length}</strong>
              </div>

              <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-gray-100 dark:border-slate-800 text-center space-y-1 shadow-xs">
                <span className="text-[10px] text-slate-400 font-bold block">إجمالي مأموريات التشغيل</span>
                <strong className="text-base font-black text-slate-800 dark:text-slate-100 block">{totalOrdersCount}</strong>
              </div>

              <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-gray-100 dark:border-slate-800 text-center space-y-1 shadow-xs">
                <span className="text-[10px] text-slate-400 font-bold block">إجمالي الفواتير</span>
                <strong className="text-base font-black text-blue-600 dark:text-blue-400 block">{(totalInvoicesAmount || 0).toLocaleString()} ج.م</strong>
              </div>

              <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-gray-100 dark:border-slate-800 text-center space-y-1 shadow-xs">
                <span className="text-[10px] text-slate-400 font-bold block">إجمالي المدفوعات</span>
                <strong className="text-base font-black text-emerald-600 block">{(totalPaid || 0).toLocaleString()} ج.م</strong>
              </div>

              <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-gray-100 dark:border-slate-800 text-center space-y-1 shadow-xs">
                <span className="text-[10px] text-slate-400 font-bold block">الرصيد المالي المتبقي (Balance)</span>
                <strong className={`text-base font-black block ${customerBalance > 0 ? 'text-amber-600' : customerBalance < 0 ? 'text-red-500' : 'text-slate-500'}`}>{(customerBalance || 0).toLocaleString()} ج.م</strong>
              </div>

              <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-gray-100 dark:border-slate-800 text-center space-y-1 shadow-xs col-span-2 md:col-span-1">
                <span className="text-[10px] text-slate-400 font-bold block">آخر زيارة صيانة</span>
                <strong className="text-xs font-black text-slate-800 dark:text-slate-100 block mt-1">{lastVisitDateStr}</strong>
              </div>

            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-right">
              
              {/* COLUMN 1: CUSTOMER SCORES & CRM DETAILS */}
            <div className="space-y-6 lg:col-span-1">
              
              {/* Core card with Scoring system */}
              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-gray-100 dark:border-slate-800 space-y-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 px-3 py-1 rounded-md">{selectedCustomer.id}</span>
                  <span className="text-xs text-gray-400">سجل: {selectedCustomer.createdAt}</span>
                </div>
                
                <h3 className="font-bold text-slate-800 dark:text-slate-100 text-xl">{selectedCustomer.name}</h3>

                {/* SCORING TIERS LEVEL UI */}
                <div className={`p-3.5 border rounded-xl flex items-center justify-between gap-3 ${scoringColor}`}>
                  <div>
                    <span className="text-[10px] uppercase font-black block tracking-wider opacity-75">
                      {lang === 'ar' ? 'تصنيف نظام CRM المالي' : 'Corporate CRM Score Rating'}
                    </span>
                    <strong className="text-xs font-extrabold block mt-0.5">
                      {lang === 'ar' ? scoringBadge : scoringBadgeEn}
                    </strong>
                  </div>
                  <Award className="w-8 h-8 flex-shrink-0 animate-bounce" />
                </div>

                <div className="space-y-3 pt-3 border-t border-slate-50 dark:border-slate-800 text-sm text-slate-700 dark:text-slate-300">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 text-xs">إجمالي المبالغ المدفوعة:</span>
                    <span className="font-mono text-xs font-black text-emerald-600">{totalPaid.toLocaleString()} ج.م</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 text-xs">حجم عقود الصيانة المفعّلة:</span>
                    <span className="font-mono text-xs font-black text-purple-600">{totalContractValue.toLocaleString()} ج.م ({customerContracts.length} عقد)</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 text-xs">الزيارات المنفذة التراكمية:</span>
                    <span className="font-mono text-xs font-bold">{orderCount} زيارات ناجحة</span>
                  </div>
                  
                  <div className="flex items-center justify-between pt-2 border-t border-slate-50 dark:border-slate-800">
                    <span className="text-gray-400">رقم الهاتف:</span>
                    <a href={`tel:${selectedCustomer.phone}`} className="font-mono text-primary font-semibold flex items-center gap-1 text-xs">
                      {selectedCustomer.phone}
                      <Phone className="w-4 h-4 text-emerald-500" />
                    </a>
                  </div>
                  {selectedCustomer.phone2 && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">الهاتف الإضافي:</span>
                      <span className="font-mono text-xs">{selectedCustomer.phone2}</span>
                    </div>
                  )}
                  {selectedCustomer.email && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 text-xs">البريد الإلكتروني:</span>
                      <span className="text-xs">{selectedCustomer.email}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 text-xs">النطاق والمنطقة:</span>
                    <span className="text-xs">{selectedCustomer.governorate}، {selectedCustomer.region}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 text-xs">قناة استقطاب التسويق:</span>
                    <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded text-xs">{selectedCustomer.customerSource}</span>
                  </div>
                  <div className="space-y-1 mt-1 pt-2">
                    <span className="text-gray-400 text-xs block">العنوان والتوجيهات:</span>
                    <p className="bg-slate-50 dark:bg-slate-950 p-2.5 rounded-lg text-xs leading-relaxed text-slate-600 dark:text-slate-400">{selectedCustomer.address}</p>
                  </div>
                </div>

                {/* WhatsApp & Google Maps Utils */}
                <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                  {selectedCustomer.location && (
                    <button
                      onClick={() => openGoogleMaps(selectedCustomer.location!.latitude, selectedCustomer.location!.longitude)}
                      className="w-full flex items-center justify-center gap-2 py-2 bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-450 hover:bg-sky-100 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                    >
                      <MapPin className="w-4 h-4" />
                      تحديد الموقع الجغرافي بالرقم المرفق
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  )}
                  
                  <div className="border border-slate-100 dark:border-slate-800 p-3 rounded-lg bg-slate-50 dark:bg-slate-950 space-y-1.5">
                    <span className="text-[10px] font-black text-slate-500 block mb-1">تذكير بنماذج الواتساب الفورية</span>
                    <button
                      onClick={() => sendWhatsAppMessage(selectedCustomer.phone, 'confirm')}
                      className="w-full flex items-center justify-between px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-emerald-50 rounded text-xs text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                    >
                      <span>تأكيد موعد الزيارة 📆</span>
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-500" />
                    </button>
                    <button
                      onClick={() => sendWhatsAppMessage(selectedCustomer.phone, 'followup')}
                      className="w-full flex items-center justify-between px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-emerald-50 rounded text-xs text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                    >
                      <span>رضا العميل ومتابعة كول سنتر 📞</span>
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-500" />
                    </button>
                  </div>
                </div>
              </div>

              {/* CALL CENTER LOG MODULE INTEGRATION */}
              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-gray-100 dark:border-slate-800 space-y-4 shadow-sm">
                <div className="flex items-center gap-2">
                  <Phone className="w-5 h-5 text-indigo-500 animate-pulse" />
                  <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                    {lang === 'ar' ? 'وحدة كول سنتر وسجل الاتصالات' : 'Call Center Interaction Logger'}
                  </h4>
                </div>
                
                <form onSubmit={handleSaveInteraction} className="space-y-3.5 pt-2 text-right">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 mb-1">قناة الاتصال والمتابعة</label>
                    <div className="grid grid-cols-3 gap-1">
                      <button
                        type="button"
                        onClick={() => setCallType('call')}
                        className={`py-1 text-center font-bold text-xs rounded transition-colors ${callType === 'call' ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}
                      >
                        اتصال
                      </button>
                      <button
                        type="button"
                        onClick={() => setCallType('whatsapp')}
                        className={`py-1 text-center font-bold text-xs rounded transition-colors ${callType === 'whatsapp' ? 'bg-emerald-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}
                      >
                        واتساب
                      </button>
                      <button
                        type="button"
                        onClick={() => setCallType('followup')}
                        className={`py-1 text-center font-bold text-xs rounded transition-colors ${callType === 'followup' ? 'bg-purple-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}
                      >
                        متابعة
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 mb-1">النتيجة والمخرجات</label>
                    <select
                      value={callOutcome}
                      onChange={(e) => setCallOutcome(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded text-xs dark:text-white"
                    >
                      <option value="تم الاتصال وجلسة صيانة مجدولة">تم الاتصال وجلسة صيانة مجدولة</option>
                      <option value="العميل لا يجيب حالياً / اتصال معلق">العميل لا يجيب حالياً / اتصال معلق</option>
                      <option value="تم حل الشكوى هاتفياً والعميل لائق">تم حل الشكوى هاتفياً والعميل راضٍ</option>
                      <option value="استعلام وسؤال عن بيع غاز وتكييف جديد">استعلام وسؤال عن توريد تكييف جديد</option>
                      <option value="موافقة على تجديد العقد السنوي">موافقة على تجديد العقد السنوي</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 mb-1">تفاصيل المحادثة والفوائد</label>
                    <textarea
                      value={callNotes}
                      onChange={(e) => setCallNotes(e.target.value)}
                      placeholder="اكتب التقرير الهاتفي هنا بالتفصيل لملف العميل..."
                      required
                      rows={3}
                      className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded text-xs dark:text-white text-right"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 mb-1">الموظف المسؤول</label>
                    <input
                      type="text"
                      value={agentName}
                      onChange={(e) => setAgentName(e.target.value)}
                      className="w-full px-2.5 py-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded text-xs dark:text-white"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-750 text-white rounded-lg text-xs font-bold cursor-pointer transition-colors"
                  >
                    تدوين الاتصال بالتايم لاين
                  </button>
                </form>
              </div>
            </div>

            {/* COLUMN 2 & 3: DEVICES, PREDICTIVE MAINTENANCE, CHRONOLOGICAL TIMELINE */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Connected Devices Grid with Predictive AI Highlights */}
              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-gray-100 dark:border-slate-800 space-y-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-800 dark:text-slate-100 text-base">أجهزة العميل والتشخيص الاستباقي الذكي (Predictive)</h4>
                  <button
                    onClick={() => setShowAddDevicePanel(!showAddDevicePanel)}
                    className="flex items-center gap-1 text-xs font-bold text-primary hover:underline cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    تسجيل وربط جهاز جديد
                  </button>
                </div>

                {/* Add Device Panel Form */}
                {showAddDevicePanel && (
                  <form onSubmit={handleSaveDevice} className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-100 dark:border-slate-800 space-y-4">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">ثبت مصفوفة وأبعاد تكييف الغرفة</span>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-right">
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">الماركة</label>
                        <select
                          value={deviceBrand}
                          onChange={(e) => setDeviceBrand(e.target.value)}
                          className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs"
                        >
                          <option>شارب (Sharp)</option>
                          <option>كاريير (Carrier)</option>
                          <option>إل جي (LG)</option>
                          <option>يونيون آير (Unionaire)</option>
                          <option>دايكين (Daikin)</option>
                          <option>تورنيدو (Tornado)</option>
                          <option>أخرى</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">النوع</label>
                        <select
                          value={deviceType}
                          onChange={(e) => setDeviceType(e.target.value)}
                          className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs"
                        >
                          <option>سبليت (Split)</option>
                          <option>كونسيلد (Concealed)</option>
                          <option>مركزي كاسيت (Cassette)</option>
                          <option>صحراوي / فريستاند</option>
                          <option>شباك (Window)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">القدرة بالحصان</label>
                        <select
                          value={deviceCapacity}
                          onChange={(e) => setDeviceCapacity(e.target.value)}
                          className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs"
                        >
                          <option>1.5 حصان</option>
                          <option>2.25 حصان</option>
                          <option>3 حصان</option>
                          <option>4 حصان</option>
                          <option>5 حصان</option>
                          <option>أعلى من 5 حصان</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">الرقم التسلسلي</label>
                        <input
                          type="text"
                          value={deviceSerial}
                          onChange={(e) => setDeviceSerial(e.target.value)}
                          placeholder="S/N: 987654..."
                          className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-right"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">تاريخ التركيب الأولي</label>
                        <input
                          type="text"
                          value={deviceInstallDate}
                          onChange={(e) => setDeviceInstallDate(e.target.value)}
                          placeholder="DD/MM/YYYY"
                          className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-right"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">الضمان</label>
                        <input
                          type="text"
                          value={deviceWarranty}
                          onChange={(e) => setDeviceWarranty(e.target.value)}
                          placeholder="مثال: خمس سنوات ممتدة"
                          className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-right"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">نوع مسمى الضمان</label>
                        <select
                          value={warrantyType}
                          onChange={(e: any) => setWarrantyType(e.target.value)}
                          className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-right"
                        >
                          <option value="company">ضمان الشركة (الوكيل المعتمد)</option>
                          <option value="manufacturer">ضمان المصنع الرئيسي</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">تاريخ نهاية الضمان</label>
                        <input
                          type="text"
                          value={warrantyEndDate}
                          onChange={(e) => setWarrantyEndDate(e.target.value)}
                          placeholder="DD/MM/YYYY"
                          className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-right"
                        />
                      </div>
                    </div>

                    <div className="flex gap-2 justify-end">
                      <button
                        type="button"
                        onClick={() => setShowAddDevicePanel(false)}
                        className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg text-xs font-semibold cursor-pointer"
                      >
                        {lang === 'ar' ? 'إلغاء' : 'Cancel'}
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-semibold cursor-pointer"
                      >
                        {lang === 'ar' ? 'ربط وحفظ الجهاز' : 'Save & Link'}
                      </button>
                    </div>
                  </form>
                )}

                {/* Devices lists with predictive cards */}
                <div className="space-y-4">
                  {predictiveRisks.length > 0 ? (
                    predictiveRisks.map(({ device, issues }) => (
                      <div key={device.id} className="p-4 bg-slate-55 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800 space-y-3">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                          <div className="flex gap-2 items-center">
                            <span className="p-2 bg-white dark:bg-slate-900 text-sky-600 rounded border border-slate-100 dark:border-slate-800">
                              <Cpu className="w-4 h-4" />
                            </span>
                            <div>
                              <h5 className="font-bold text-slate-800 dark:text-slate-100 text-xs">
                                {device.brand} - {device.type} ({device.capacity})
                              </h5>
                              <p className="text-[10px] text-slate-400 mt-0.5">S/N: {device.serialNumber || 'غير مسجل'} | تركيب: {device.installationDate || 'غير مسجل'}</p>
                              {(device as any).warrantyType && (
                                <p className="text-[10px] text-indigo-400 mt-1 font-semibold flex items-center gap-1">
                                  <span>{lang === 'ar' ? 'نوع الضمان:' : 'Warranty Type:'} {(device as any).warrantyType === 'company' ? (lang === 'ar' ? 'ضمان الشركة' : 'Company') : (lang === 'ar' ? 'ضمان المصنع' : 'Manufacturer')}</span>
                                  <span>|</span>
                                  <span>{lang === 'ar' ? 'نهاية الضمان:' : 'Expiry:'} {(device as any).warrantyEndDate || 'غير محدد'}</span>
                                  <span className={`px-1 rounded text-[8px] font-bold ${
                                    (device as any).warrantyEndDate && new Date((device as any).warrantyEndDate.split('/').reverse().join('-')).getTime() < Date.now()
                                      ? 'bg-red-500/15 text-red-400' 
                                      : 'bg-emerald-500/15 text-emerald-400'
                                  }`}>
                                    {(device as any).warrantyEndDate && new Date((device as any).warrantyEndDate.split('/').reverse().join('-')).getTime() < Date.now()
                                      ? (lang === 'ar' ? 'منتهي' : 'Expired')
                                      : (lang === 'ar' ? 'ساري' : 'Active')}
                                  </span>
                                </p>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => { if (confirm("هل تريد إزالة هذا الجهاز لعميل؟")) onDeleteDevice(device.id); }}
                            className="p-1 px-2.5 text-red-500 hover:bg-white text-[10px] font-bold border hover:border-red-100 rounded-md transition-colors cursor-pointer"
                          >
                            إلغاء الجهاز ❌
                          </button>
                        </div>

                        {/* PREDICTIVE RISK BULLETS */}
                        <div className="p-3.5 bg-indigo-950/20 dark:bg-slate-900 border border-indigo-500/10 rounded-lg space-y-2.5 text-right">
                          <span className="inline-flex items-center gap-1.5 text-[9px] font-extrabold text-indigo-400 uppercase tracking-widest">
                            <AlertTriangle className="w-3.5 h-3.5 animate-pulse text-indigo-400" />
                            {lang === 'ar' ? 'تقرير الصيانة التنبؤية بالذكاء الاصطناعي (HVAC Diagnostics)' : 'AI Predictive Protection Log'}
                          </span>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                            {issues.map((iss, i) => (
                              <div key={i} className="p-2 bg-white dark:bg-slate-950 rounded border border-slate-10 border-indigo-500/5 space-y-1 text-right">
                                <h6 className="font-extrabold text-[11px] text-amber-600 dark:text-amber-400 flex items-center gap-1 justify-end">
                                  {lang === 'ar' ? iss.titleAr : iss.titleEn}
                                </h6>
                                <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-normal">
                                  {lang === 'ar' ? iss.descAr : iss.descEn}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-6 text-center text-gray-400 text-xs">
                      {lang === 'ar' ? 'لم يتم تسجيل أجهزة تكييف لهذا العميل حالياً.' : 'No devices bound to this client directory.'}
                    </div>
                  )}
                </div>
              </div>

              {/* CHRONOLOGICAL CUSTOMER TIMELINE */}
              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-gray-100 dark:border-slate-800 space-y-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{lang === 'ar' ? 'تاريخ المعاملات التراكمي' : 'Descending Transaction log'}</span>
                  <h4 className="font-black text-slate-800 dark:text-slate-100 text-base flex items-center gap-2">
                    <Clock className="w-5 h-5 text-indigo-600" />
                    {lang === 'ar' ? 'خط الزمن المتكامل للمعاملات (Customer Timeline)' : 'Unified Chronological Customer Timeline'}
                  </h4>
                </div>

                <div className="relative border-r border-slate-100 dark:border-slate-850 pr-4 rtl:pr-4 ltr:pl-4 ltr:border-l ltr:border-r-0 space-y-6 pt-2 pb-2">
                  {timelineEvents.map((ev, idx) => {
                    let pillColor = 'border-slate-200 bg-slate-50';
                    if (ev.type === 'contact') pillColor = 'border-blue-300 bg-blue-50 text-blue-600';
                    else if (ev.type === 'order') pillColor = 'border-amber-300 bg-amber-50 text-amber-600';
                    else if (ev.type === 'invoice') pillColor = 'border-purple-300 bg-purple-50 text-purple-600';
                    else if (ev.type === 'payment') pillColor = 'border-emerald-300 bg-emerald-50 text-emerald-600';
                    else if (ev.type === 'contract') pillColor = 'border-rose-300 bg-rose-50 text-rose-600';
                    
                    return (
                      <div key={idx} className="relative text-right items-start group">
                        {/* Timeline node circle */}
                        <span className="absolute -right-[21px] rtl:-right-[21px] ltr:-left-[21px] ltr:right-auto top-[3px] w-3 h-3 rounded-full bg-indigo-600 border border-white dark:border-slate-900 group-hover:scale-125 transition-transform duration-200"></span>

                        {/* Event Content card */}
                        <div className="p-4 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100/50 dark:hover:bg-slate-900 rounded-2xl border border-slate-100/60 dark:border-slate-800/80 transition-colors space-y-1.5">
                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1.5">
                            <span className="text-[10px] font-mono text-slate-400 font-bold bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 px-2 py-0.5 rounded shadow-3xs">{ev.dateStr}</span>
                            <h5 className="font-extrabold text-slate-800 dark:text-slate-205 text-xs">
                              {lang === 'ar' ? ev.title : ev.titleEn}
                            </h5>
                          </div>
                          <p className="text-[11px] text-slate-650 dark:text-slate-400 leading-relaxed font-sans">
                            {lang === 'ar' ? ev.desc : ev.descEn}
                          </p>
                        </div>
                      </div>
                    );
                  })}

                  {timelineEvents.length === 0 && (
                    <div className="py-6 text-center text-xs text-gray-400">
                      {lang === 'ar' ? 'لا يوجد أحداث أو فواتير مسجلة لهذا العميل حتى الآن.' : 'No active history recorded.'}
                    </div>
                  )}
                </div>
              </div>
            </div>

          </div>
          </div>
        );
      })()}

      {activeTab === 'roi' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 text-right space-y-6">
          <div className="flex justify-between items-center pb-4 border-b border-gray-100 dark:border-slate-800">
            <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-mono rounded-lg">
              MARKETING_ROI_ANALYTICS
            </span>
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-sky-500" />
              {lang === 'ar' ? 'تقرير قياس العائد التسويقي (ROI) وتدفق العملاء وحجم المبيعات' : 'Marketing Channels Acquisition & Productive ROI Report'}
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-xl text-right">
              <span className="text-[10px] text-gray-400 block mb-1">{lang === 'ar' ? 'إجمالي قنوات الاستقطاب' : 'Total Marketing Channels'}</span>
              <strong className="text-xl font-bold dark:text-white font-mono">{CUSTOMER_SOURCES.length}</strong>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-xl text-right">
              <span className="text-[10px] text-gray-400 block mb-1">{lang === 'ar' ? 'عملاء منصات التواصل المباشر' : 'Direct Social Media Clients'}</span>
              <strong className="text-xl font-bold dark:text-white font-mono">
                {customers.filter(c => ['فيسبوك', 'Facebook', 'Instagram', 'TikTok', 'WhatsApp'].includes(c.customerSource || '')).length}
              </strong>
            </div>
            <div className="p-4 bg-indigo-50/20 dark:bg-[#1e1b4b]/20 border border-indigo-500/10 rounded-xl text-right">
              <span className="text-[10px] text-indigo-400 block mb-1">{lang === 'ar' ? 'إجمالي إيرادات الحملات والتحصيل' : 'Total Sales by Marketing'}</span>
              <strong className="text-xl font-bold text-indigo-400 font-mono">
                {invoices.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0).toLocaleString()} {lang === 'ar' ? 'ج.م' : 'EGP'}
              </strong>
            </div>
            <div className="p-4 bg-emerald-50/20 dark:bg-[#064e3b]/20 border border-emerald-500/10 rounded-xl text-right">
              <span className="text-[10px] text-emerald-400 block mb-1">{lang === 'ar' ? 'متوسط مبيعات العميل الفعلي' : 'Average Value Per Client'}</span>
              <strong className="text-xl font-bold text-emerald-400 font-mono">
                {customers.length > 0 ? Math.round(invoices.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0) / customers.length).toLocaleString() : 0} {lang === 'ar' ? 'ج.م' : 'EGP'}
              </strong>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-right border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 border-b border-gray-100 dark:border-slate-850">
                  <th className="p-3.5 font-bold">{lang === 'ar' ? 'قناة الاستقطاب / المصدر' : 'Acquisition Source'}</th>
                  <th className="p-3.5 font-bold text-center">{lang === 'ar' ? 'عدد العملاء المسجلين' : 'Registered Clients'}</th>
                  <th className="p-3.5 font-bold text-center">{lang === 'ar' ? 'الأعمال المنجزة' : 'Completed Works'}</th>
                  <th className="p-3.5 font-bold text-center">{lang === 'ar' ? 'طريقة الاستهداف' : 'Acquisition Strategy'}</th>
                  <th className="p-3.5 font-bold text-center">{lang === 'ar' ? 'مجموع المبيعات والفواتير' : 'Total Revenue'}</th>
                  <th className="p-3.5 font-bold text-left">{lang === 'ar' ? 'معدل التحويل (CR)' : 'Conversion Rate (CR)'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                {CUSTOMER_SOURCES.map(srcKey => {
                  const srcCustomers = customers.filter(c => {
                    const s = c.customerSource || 'Other';
                    if (srcKey === 'Facebook' && (s === 'فيسبوك' || s === 'Facebook' || s === 'Facebook Ads')) return true;
                    if (srcKey === 'Referral' && (s === 'توصية عميل' || s === 'Referral' || s === 'Customer Referral')) return true;
                    if (srcKey === 'Other' && (s === 'أخرى' || s === 'Other' || s === 'Other Sources')) return true;
                    return s.toLowerCase() === srcKey.toLowerCase();
                  });

                  const count = srcCustomers.length;
                  const srcInvoices = invoices.filter(inv => srcCustomers.some(sc => sc.id === inv.customerId));
                  const revenue = srcInvoices.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);
                  const completedJobs = orders.filter(ord => ord.status === 'completed' && srcCustomers.some(sc => sc.id === ord.customerId)).length;
                  
                  const hasOrderCount = srcCustomers.filter(cust => orders.some(o => o.customerId === cust.id)).length;
                  const cr = count > 0 ? Math.round((hasOrderCount / count) * 100) : 0;
                  
                  const sourceLabels: Record<string, string> = {
                    "Facebook": "فيسبوك - إعلانات ممولة",
                    "Instagram": "إنستجرام - صور وعروض",
                    "TikTok": "تيك توك - فيديوهات قصيرة",
                    "WhatsApp": "واتساب - حملات وبث مباشر",
                    "Google": "جوجل وبحث الخرائط الذكية",
                    "Referral": "توصية صديق وعميل دائم المظهر",
                    "Existing Customer": "قاعدة بيانات العملاء القديمة",
                    "Engineer": "مهندس استشاري خارجي",
                    "Mohamed Ashraf": "توجيهات م. محمد أشرف الشخصية",
                    "Mahmoud": "توجيهات م. محمود الشخصية",
                    "Other": "قنوات أخرى عشوائية"
                  };

                  return (
                    <tr key={srcKey} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="p-4 font-bold text-slate-800 dark:text-slate-200">
                        {lang === 'ar' ? (sourceLabels[srcKey] || srcKey) : srcKey}
                      </td>
                      <td className="p-4 text-center font-mono font-bold text-slate-700 dark:text-slate-350">{count}</td>
                      <td className="p-4 text-center font-mono text-slate-500 dark:text-slate-400">{completedJobs} زيارة</td>
                      <td className="p-4 text-center text-slate-500 dark:text-slate-400">
                        {srcKey === 'Mohamed Ashraf' || srcKey === 'Mahmoud' ? (lang === 'ar' ? 'استقطاب مباشر وعلاقات' : 'Direct Referral') : (lang === 'ar' ? 'استهداف رقمي ممول' : 'Digital Ad Targeting')}
                      </td>
                      <td className="p-4 text-center font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {revenue.toLocaleString()} {lang === 'ar' ? 'ج.م' : 'EGP'}
                      </td>
                      <td className="p-4 text-left font-mono">
                        <div className="flex items-center gap-2 justify-end">
                          <div className="w-16 bg-gray-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-sky-500 h-full" style={{ width: `${cr}%` }} />
                          </div>
                          <span className="font-bold text-sky-500">{cr}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
