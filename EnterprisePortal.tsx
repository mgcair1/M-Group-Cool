/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { 
  Wrench, Settings, Users, FileText, Layers, Compass, Calendar, Sparkles, 
  Trash2, Plus, Search, BookOpen, TrendingUp, ShieldAlert, Check, 
  Camera, Share2, ClipboardList, PenTool, CheckSquare, Printer, CheckCircle, RefreshCw, Cpu
} from 'lucide-react';
import { CompanySettings, Customer, Device, MaintenanceOrder, Invoice, Employee } from '../types';
import { TRANSLATIONS } from '../translations';
import MGroupCoolLogo from './MGroupCoolLogo';

interface EnterprisePortalProps {
  settings: CompanySettings;
  updateSettings: (data: Partial<CompanySettings>) => void;
  customers: Customer[];
  devices: Device[];
  orders: MaintenanceOrder[];
  invoices: Invoice[];
  employees: Employee[];
  onAddOrder: (data: any) => void;
  onUpdateOrder: (id: string, data: any) => void;
  onAddCustomer: (data: any) => void;
}

export default function EnterprisePortal({
  settings,
  updateSettings,
  customers,
  devices,
  orders,
  invoices,
  employees,
  onAddOrder,
  onUpdateOrder,
  onAddCustomer
}: EnterprisePortalProps) {
  const lang = settings.language || 'ar';
  const t = TRANSLATIONS[lang];

  const [activeTab, setActiveTab] = useState<'designer' | 'cust_portal' | 'tech_portal' | 'hvac_box' | 'partners' | 'diagnose'>('cust_portal');

  // --- AUDIO FEEDACK SYSTEM ---
  const triggerAudio = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.12);
    } catch (e) {
      console.warn("Audio Context not supported in this frame scope or requires user click", e);
    }
  };

  // --- 1. SYSTEM DESIGNER ---
  const [designerSection, setDesignerSection] = useState<'branding' | 'labels' | 'fields' | 'roles' | 'audits'>('branding');
  const [newFieldName, setNewFieldName] = useState('');
  const [newFieldLabelEn, setNewFieldLabelEn] = useState('');
  const [newFieldModel, setNewFieldModel] = useState<'customer' | 'device' | 'order'>('customer');
  const [newFieldType, setNewFieldType] = useState<'text' | 'number' | 'date'>('text');
  const [newFieldRequired, setNewFieldRequired] = useState(false);
  const [designerAlert, setDesignerAlert] = useState('');

  // Dynamic values
  const [brandName, setBrandName] = useState(settings.companyName);
  const [themeModeText, setThemeModeText] = useState<'light' | 'dark' | 'auto'>(settings.themeMode || 'dark');
  const [menuCustomersAr, setMenuCustomersAr] = useState(settings.customNames?.customers_ar || '');
  const [menuCustomersEn, setMenuCustomersEn] = useState(settings.customNames?.customers_en || '');
  const [menuOrdersAr, setMenuOrdersAr] = useState(settings.customNames?.orders_ar || '');
  const [menuOrdersEn, setMenuOrdersEn] = useState(settings.customNames?.orders_en || '');
  const [logoInput, setLogoInput] = useState(settings.logoData || '');

  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoInput(reader.result as string);
        triggerAudio();
      };
      reader.readAsDataURL(file);
    }
  };

  // Role Designer
  const [newRoleAr, setNewRoleAr] = useState('');
  const [newRoleEn, setNewRoleEn] = useState('');
  const [newRoleCode, setNewRoleCode] = useState('');

  const handleSaveBranding = () => {
    updateSettings({
      companyName: brandName,
      themeMode: themeModeText as any,
      logoData: logoInput
    });
    setDesignerAlert(lang === 'ar' ? 'تم تحديث ألوان الهوية البصرية بنجاح!' : 'Branding updated successfully!');
    triggerAudio();
  };

  const handleSaveLabels = () => {
    updateSettings({
      customNames: {
        ...settings.customNames,
        customers_ar: menuCustomersAr || "العملاء والأجهزه",
        customers_en: menuCustomersEn || "Customers & CRM",
        orders_ar: menuOrdersAr || "أوامر التشغيل وتكليف الفنيين",
        orders_en: menuOrdersEn || "Service & Maintenance Orders"
      }
    });
    setDesignerAlert(lang === 'ar' ? 'تم تحديث مسميات القوائم الجانبية تلقائياً!' : 'Sidebar labels customized successfully!');
    triggerAudio();
  };

  const handleAddCustomField = () => {
    if (!newFieldName || !newFieldLabelEn) {
      setDesignerAlert(lang === 'ar' ? 'يرجى كتابة تسمية الحقل' : 'Please fill field labels');
      return;
    }
    const currentFields = settings.fieldsConfig || [];
    const newField = {
      id: "FLD-" + Math.random().toString(36).substr(2, 9).toUpperCase(),
      model: newFieldModel,
      labelAr: newFieldName,
      labelEn: newFieldLabelEn,
      type: newFieldType,
      required: newFieldRequired,
      order: currentFields.length + 1
    };
    updateSettings({
      fieldsConfig: [...currentFields, newField]
    });
    setNewFieldName('');
    setNewFieldLabelEn('');
    setDesignerAlert(lang === 'ar' ? 'تمت إضافة الحقل الديناميكي وتدشينه بالنماذج!' : 'Dynamic custom field added!');
    triggerAudio();
  };

  const handleDeleteField = (fId: string) => {
    const currentFields = settings.fieldsConfig || [];
    updateSettings({
      fieldsConfig: currentFields.filter(f => f.id !== fId)
    });
    triggerAudio();
  };

  const handleAddRole = () => {
    if (!newRoleAr || !newRoleEn || !newRoleCode) {
      setDesignerAlert(lang === 'ar' ? 'يرجى ملء بيانات المسمى الوظيفية' : 'Please fill role descriptions');
      return;
    }
    const currentRoles = settings.customRoles || [];
    const newRole = {
      id: "RL-" + (currentRoles.length + 1),
      code: newRoleCode.toLowerCase().replace(/\s+/g, '_'),
      nameAr: newRoleAr,
      nameEn: newRoleEn
    };
    updateSettings({
      customRoles: [...currentRoles, newRole]
    });
    setNewRoleAr('');
    setNewRoleEn('');
    setNewRoleCode('');
    setDesignerAlert(lang === 'ar' ? 'تم تدشين الرول والصلاحية الميدانية بنجاح!' : 'Dynamic permission profile deployed!');
    triggerAudio();
  };

  const handleClearAuditLogs = () => {
    if (window.confirm(lang === 'ar' ? 'هل أنت متأكد من تفريغ سجل الرقابة نهائيا؟ لا يمكن التراجع.' : 'Are you sure to wipe the security audit logs? This is irreversible.')) {
      updateSettings({ auditLogs: [] });
      triggerAudio();
    }
  };

  // --- 2. SMART CUSTOMER PORTAL ---
  const [custPortalSearch, setCustPortalSearch] = useState('');
  const [loggedCustomer, setLoggedCustomer] = useState<Customer | null>(null);
  const [custPortalError, setCustPortalError] = useState('');
  
  // Custom Service Request
  const [reqDeviceName, setReqDeviceName] = useState('');
  const [reqIssueType, setReqIssueType] = useState(lang === 'ar' ? 'غسيل وصيانة تكييف' : 'Preventative AC Wash');
  const [reqNotes, setReqNotes] = useState('');
  const [reqSuccessMsg, setReqSuccessMsg] = useState('');

  const handleCustomerLogin = () => {
    const found = customers.find(c => 
      c.phone.includes(custPortalSearch) || 
      c.name.toLowerCase().includes(custPortalSearch.toLowerCase())
    );
    if (found) {
      setLoggedCustomer(found);
      setCustPortalError('');
      setReqSuccessMsg('');
    } else {
      setLoggedCustomer(null);
      setCustPortalError(t.customer_portal_not_found);
    }
  };

  const handleSubmitServiceTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loggedCustomer || !reqDeviceName) return;

    // Simulate placing a new order directly in active maintenance list
    onAddOrder({
      customerId: loggedCustomer.id,
      assignedTechId: "EMP-001", // Default dispatch supervisor
      serviceType: reqIssueType + " - Via Portal",
      priority: "medium",
      status: "new",
      cost: reqIssueType.includes("غسيل") ? 350 : 600,
      collectionAmount: 0,
      notes: `${reqDeviceName} - ${reqNotes}. تم التقديم ذاتياً من بوابة العميل.`
    });

    setReqSuccessMsg(t.request_submitted_success);
    setReqDeviceName('');
    setReqNotes('');
    triggerAudio();
  };


  // --- 3. TECHNICIAN PORTAL ---
  const [selectedTechId, setSelectedTechId] = useState('EMP-001');
  const [activeTechOrder, setActiveTechOrder] = useState<MaintenanceOrder | null>(null);
  const [techFeedbackMsg, setTechFeedbackMsg] = useState('');
  const [techStatus, setTechStatus] = useState<'progress' | 'completed' | 'cancelled'>('completed');
  const [custSignatureName, setCustSignatureName] = useState('');
  const [techPhotoBefore, setTechPhotoBefore] = useState('');
  const [techPhotoAfter, setTechPhotoAfter] = useState('');

  const techOrders = orders.filter(o => o.technicianId === selectedTechId);

  // Signatures canvas drawers logic
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const drawStart = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    setIsDrawing(true);
    ctx.beginPath();
    const pos = getPos(e, canvas);
    ctx.moveTo(pos.x, pos.y);
  };

  const drawMove = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const pos = getPos(e, canvas);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = '#2563eb';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.stroke();
  };

  const getPos = (e: any, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  const saveSignatureAndComplete = () => {
    const canvas = canvasRef.current;
    if (!canvas || !activeTechOrder) return;
    
    const sigBase64 = canvas.toDataURL();
    
    // Save signature directly into settings structure map
    const newSignatures = { ...settings.deviceSignatures };
    newSignatures[activeTechOrder.id] = {
      clientSig: sigBase64,
      techSig: 'GEN-TECH-SIG-EMULATED-MD5',
      clientName: custSignatureName || loggedCustomer?.name || 'العميل المستلم',
      techName: employees.find(e => e.id === selectedTechId)?.name || 'الفني المختص',
      signedDate: new Date().toLocaleDateString('ar-EG')
    };

    updateSettings({
      deviceSignatures: newSignatures
    });

    // Update active order to completed/closed
    onUpdateOrder(activeTechOrder.id, {
      status: techStatus,
      notes: activeTechOrder.notes + ` \n [تقرير الفني]: ${techFeedbackMsg}`
    });

    setActiveTechOrder(null);
    setTechFeedbackMsg('');
    setCustSignatureName('');
    setTechPhotoBefore('');
    setTechPhotoAfter('');
    alert(lang === 'ar' ? 'تم تسجيل التوقيع وتحديث حالة أمر التشغيل وتصفيته بنجاح!' : 'Signature captured and order completed successfully!');
    triggerAudio();
  };

  // Simulated live snap uploading
  const handleFakePhotoUpload = (type: 'before' | 'after') => {
    const fakeBase64 = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200"><rect width="100%" height="100%" fill="%231e293b"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%2394a3b8" font-size="16">M Group Cool Field Specimen Shot</text></svg>';
    if (type === 'before') setTechPhotoBefore(fakeBase64);
    else setTechPhotoAfter(fakeBase64);
  };


  // --- 4. HVAC LOADS CALCULATOR ---
  const [calcWidth, setCalcWidth] = useState(4);
  const [calcLength, setCalcLength] = useState(5);
  const [calcHeight, setCalcHeight] = useState(3);
  const [sunExposed, setSunExposed] = useState(false);
  const [calcSpPrice, setCalcSpPrice] = useState(24000);
  const [calcCostPrice, setCalcCostPrice] = useState(18500);

  // Computations
  const surfaceArea = calcWidth * calcLength;
  const volume = surfaceArea * calcHeight;
  
  // Thermodynamic factor: 300 BTU/m3 shaded, 400 BTU/m3 sun-exposed/topfloor
  const requiredBtu = volume * (sunExposed ? 400 : 300);
  
  // 1 HP = 8000 BTU cooling power in Egyptian standard rating
  const hpNeededOrig = requiredBtu / 8000;
  // standardize to commercial sizes: 1.5, 2.25, 3.0, 4.0, 5.0
  let hpRecommended = 1.5;
  if (hpNeededOrig <= 1.5) hpRecommended = 1.5;
  else if (hpNeededOrig <= 2.25) hpRecommended = 2.25;
  else if (hpNeededOrig <= 3.0) hpRecommended = 3.0;
  else if (hpNeededOrig <= 4.0) hpRecommended = 4.0;
  else hpRecommended = 5.0;

  const estimatedFreonKg = hpRecommended * 0.95; // ~0.95kg freon charge per HP
  const estimatedPipesM = 5; // standard installer kit is 5m copper lines
  const copperPipesCost = estimatedPipesM * 1150; // default COPPER kit EGP price per meter
  
  const companyProfit = calcSpPrice - calcCostPrice;
  const partnerSplitMohamed = companyProfit * 0.40; // 40% Mohamed Ashraf, 60% partner default
  const partnerSplitPartner = companyProfit * 0.60;
  const calculatedTechComm = Number(hpRecommended) * 250; // 250 EGP per HP as technician bonus


  // --- 5. PARTNERS DIVISION SLATE ---
  const [partnerRatio, setPartnerRatio] = useState<'50-50' | '40-60' | '30-70'>('40-60');
  
  // Compile financials
  const totalInvoiced = invoices.reduce((acc, inv) => acc + (inv.totalAmount || inv.subtotal), 0);
  // simulate overhead expense elements
  const totalExpensesLogged = orders.filter(o => o.status === 'completed').reduce((acc, o) => acc + o.collectionAmount, 0) * 0.15 + (12500); // base + simulated cost
  const calculatedNetRemainder = totalInvoiced - totalExpensesLogged;

  let mohamedPercent = 50;
  let partnerPercent = 50;
  if (partnerRatio === '40-60') { mohamedPercent = 40; partnerPercent = 60; }
  else if (partnerRatio === '30-70') { mohamedPercent = 30; partnerPercent = 70; }

  const mohamedShareSum = calculatedNetRemainder > 0 ? (calculatedNetRemainder * (mohamedPercent / 100)) : 0;
  const partnerShareSum = calculatedNetRemainder > 0 ? (calculatedNetRemainder * (partnerPercent / 100)) : 0;


  // --- 6. TROUBLESHOOTING KNOWLEDGE DE-MINIMIS ---
  const [diagnosticSearch, setDiagnosticSearch] = useState('');
  const helpArticles = settings.knowledgeBase || [];
  const filteredArticles = helpArticles.filter(item => 
    item.titleAr.includes(diagnosticSearch) || 
    item.titleEn.toLowerCase().includes(diagnosticSearch.toLowerCase())
  );

  return (
    <div className="space-y-6" id="enterprise-portal-box">
      
      {/* Visual Navigation Pill Bar */}
      <div className="flex flex-wrap gap-2 pb-2 border-b border-slate-800 print:hidden overflow-x-auto">
        
        <button
          onClick={() => { setActiveTab('cust_portal'); triggerAudio(); }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-colors cursor-pointer ${activeTab === 'cust_portal' ? 'bg-indigo-600 text-white' : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'}`}
        >
          <Users className="w-4 h-4" />
          {t.customer_portal}
        </button>

        <button
          onClick={() => { setActiveTab('tech_portal'); triggerAudio(); }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-colors cursor-pointer ${activeTab === 'tech_portal' ? 'bg-indigo-600 text-white' : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'}`}
        >
          <Wrench className="w-4 h-4" />
          {t.tech_portal}
        </button>

        <button
          onClick={() => { setActiveTab('hvac_box'); triggerAudio(); }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-colors cursor-pointer ${activeTab === 'hvac_box' ? 'bg-indigo-600 text-white' : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'}`}
        >
          <Compass className="w-4 h-4" />
          {t.hvac_calc}
        </button>

        <button
          onClick={() => { setActiveTab('partners'); triggerAudio(); }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-colors cursor-pointer ${activeTab === 'partners' ? 'bg-indigo-600 text-white' : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'}`}
        >
          <TrendingUp className="w-4 h-4" />
          {t.partner_dashboard}
        </button>

        <button
          onClick={() => { setActiveTab('diagnose'); triggerAudio(); }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-colors cursor-pointer ${activeTab === 'diagnose' ? 'bg-indigo-600 text-white' : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'}`}
        >
          <BookOpen className="w-4 h-4" />
          {t.knowledge_base}
        </button>

        <button
          onClick={() => { setActiveTab('designer'); triggerAudio(); }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-colors cursor-pointer ${activeTab === 'designer' ? 'bg-sky-600 text-white animate-pulse' : 'bg-slate-900 border border-slate-800 text-sky-400 hover:text-white'}`}
        >
          <Settings className="w-4 h-4" />
          {t.system_designer}
        </button>

      </div>

      {/* ======================= TAB 1: SYSTEM DESIGNER ======================= */}
      {activeTab === 'designer' && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 text-right">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-4 border-b border-slate-800">
            <span className="px-3 py-1 bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-mono rounded-lg">
              SUPER_ADMIN ACCOUNT ONLY
            </span>
            <h2 className="text-lg font-extrabold text-white flex items-center gap-2 gap-x-2">
              <Settings className="w-5 h-5 text-sky-400" />
              أدوات مصمم النظام والرقابة النقدية والتحكم اللغوي المفتوح
            </h2>
          </div>

          {designerAlert && (
            <div className="mb-4 p-3.5 bg-sky-500/10 border border-sky-500/20 text-sky-400 rounded-xl text-xs font-semibold">
              {designerAlert}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            
            {/* Sidebar Controls */}
            <div className="space-y-1 bg-slate-950 p-3 rounded-2xl border border-slate-800 h-fit">
              <button
                onClick={() => setDesignerSection('branding')}
                className={`w-full text-right px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${designerSection === 'branding' ? 'bg-sky-500 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-900'}`}
              >
                تخصيص الهوية البصرية وخلفيات التطبيق
              </button>
              <button
                onClick={() => setDesignerSection('labels')}
                className={`w-full text-right px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${designerSection === 'labels' ? 'bg-sky-500 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-900'}`}
              >
                تعديل مسميات أزرار القائمة (Labels)
              </button>
              <button
                onClick={() => setDesignerSection('fields')}
                className={`w-full text-right px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${designerSection === 'fields' ? 'bg-sky-500 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-900'}`}
              >
                الحقول الديناميكية الإضافية للنماذج
              </button>
              <button
                onClick={() => setDesignerSection('roles')}
                className={`w-full text-right px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${designerSection === 'roles' ? 'bg-sky-500 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-900'}`}
              >
                إنشاء صلاحيات ميدانية مخصصة بدون كود
              </button>
              <button
                onClick={() => setDesignerSection('audits')}
                className={`w-full text-right px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${designerSection === 'audits' ? 'bg-red-500/10 text-red-400 border border-red-500/10' : 'text-slate-400 hover:text-white hover:bg-slate-900'}`}
              >
                سجل رقابة العمليات والمسح الشامل (Audit Logs)
              </button>
            </div>

            {/* Sub Viewport */}
            <div className="lg:col-span-3 space-y-6">
              
              {/* BRANDING */}
              {designerSection === 'branding' && (
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-slate-200">اللوجو والمظهر والباسورد العام</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2 p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
                      <label className="block text-xs font-bold text-slate-300">معاينة الهوية وشعار الشركة الفعلي</label>
                      <div className="flex flex-col sm:flex-row items-center gap-6 p-4 bg-slate-950 rounded-xl">
                        <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-center w-36 h-36">
                          <MGroupCoolLogo size="100%" variant="full" customLogoUrl={logoInput} />
                        </div>
                        <div className="flex-1 space-y-2 text-right">
                          <h4 className="text-xs font-bold text-slate-200">صورة الشعار المعتمدة في النظام</h4>
                          <p className="text-[10px] text-slate-400 leading-relaxed">
                            يتم استخدام هذا الشعار في شاشة تسجيل الدخول، القائمة الجانبية، رأس التقارير، عقود الصيانة، وفواتير التكييف. يمكنك الاختيار بين شعار M Group الافتراضي ثلاثي الأبعاد المدمج أو رفع شعار مخصص.
                          </p>
                          <div className="flex flex-wrap gap-2 pt-2">
                            <label className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-750 text-white rounded-lg text-[10px] font-bold cursor-pointer transition-colors">
                              {lang === 'ar' ? 'رفع شعار جديد مخصص' : 'Upload Custom Logo'}
                              <input 
                                type="file" 
                                accept="image/*" 
                                onChange={handleLogoFileChange}
                                className="hidden" 
                              />
                            </label>
                            {logoInput && (
                              <button
                                type="button"
                                onClick={() => { setLogoInput(''); triggerAudio(); }}
                                className="px-3 py-1.5 bg-red-500/15 hover:bg-red-500/25 text-red-400 rounded-lg text-[10px] font-bold cursor-pointer transition-colors"
                              >
                                {lang === 'ar' ? 'استعادة شعار M Group ثلاثي الأبعاد الافتراضي' : 'Reset to Premium 3D Logo'}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs text-slate-400 mb-2">اسم شركة التكييف العام</label>
                      <input 
                        type="text" 
                        value={brandName}
                        onChange={(e) => setBrandName(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-2">رابط أو كود لوجو مخصص (Base64) يدوي</label>
                      <input 
                        type="text" 
                        placeholder="https://example.com/logo.png..."
                        value={logoInput}
                        onChange={(e) => setLogoInput(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white text-left font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-2">المظهر الافتراضي للتطبيق</label>
                      <select 
                        value={themeModeText}
                        onChange={(e) => setThemeModeText(e.target.value as 'light' | 'dark' | 'auto')}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white"
                      >
                        <option value="dark">Elegant Dark (خيار مصمم معتم أنيق)</option>
                        <option value="light">Light Mode (مظهر ناصع البياض)</option>
                        <option value="auto">Auto System (الانسجام مع إعداد جهاز العميل)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-2">التحكم في لغة واجهة المستخدم</label>
                      <select 
                        value={lang}
                        onChange={(e) => {
                          updateSettings({ language: e.target.value as any });
                          setDesignerAlert(lang === 'ar' ? 'تمت الترجمة الكاملة للغة ونظام الارتباط سحابيا!' : 'Universal Translation Activated!');
                          triggerAudio();
                        }}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white"
                      >
                        <option value="ar">العربية (RTL Layout) 🇪🇬</option>
                        <option value="en">English (LTR Layout) 🇺🇸</option>
                      </select>
                    </div>
                  </div>

                  <button
                    onClick={handleSaveBranding}
                    className="px-6 py-2.5 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-xs font-bold cursor-pointer"
                  >
                    تطبيق وحفظ الهوية وتعديل الألوان
                  </button>
                </div>
              )}

              {/* MENU LABELS */}
              {designerSection === 'labels' && (
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-slate-200">إعادة تسمية أزرار وأقسام الـ ERP</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">تتيح لك كمدير نظام سوبرأدمن تعديل المسميات فورياً ليراها الموظفون بأي لهجة بدون كود.</p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-slate-400 mb-2">اسم وحدة العملاء بالعربية</label>
                      <input 
                        type="text" 
                        placeholder="العملاء والأجهزة"
                        value={menuCustomersAr}
                        onChange={(e) => setMenuCustomersAr(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-2">اسم وحدة العملاء بالإنجليزية</label>
                      <input 
                        type="text" 
                        placeholder="Customers & CRM"
                        value={menuCustomersEn}
                        onChange={(e) => setMenuCustomersEn(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white text-left font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-2">اسم وحدة أوامر التشغيل بالعربية</label>
                      <input 
                        type="text" 
                        placeholder="أوامر التشغيل وتكليف الفنيين"
                        value={menuOrdersAr}
                        onChange={(e) => setMenuOrdersAr(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-2">اسم وحدة الصيانة بالإنجليزية</label>
                      <input 
                        type="text" 
                        placeholder="Service & Maintenance Orders"
                        value={menuOrdersEn}
                        onChange={(e) => setMenuOrdersEn(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white text-left font-mono"
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleSaveLabels}
                    className="px-6 py-2.5 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-xs font-bold cursor-pointer"
                  >
                    حفظ مسميات القوائم الجديدة
                  </button>
                </div>
              )}

              {/* DYNAMIC FIELDS */}
              {designerSection === 'fields' && (
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-slate-200">بناء حقول إضافية لنماذج الإدخال</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">أنشئ حقولاً مخصصة تظهر تلقائياً لمديري الشؤون الإدارية في استمارات العملاء أو أجهزة التكييف.</p>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">Entity المستهدف</label>
                      <select 
                        value={newFieldModel}
                        onChange={(e: any) => setNewFieldModel(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 text-white rounded-lg p-2 text-xs"
                      >
                        <option value="customer">Customer (العميل)</option>
                        <option value="device">Device (أجهزة التكييف)</option>
                        <option value="order">Maintenance Order (أمر التشغيل)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">اسم الحقل بالعربية</label>
                      <input 
                        type="text" 
                        placeholder="الرقم الرقمي القومي"
                        value={newFieldName}
                        onChange={(e) => setNewFieldName(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 text-white rounded-lg p-2 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">Label English</label>
                      <input 
                        type="text" 
                        placeholder="National Identification"
                        value={newFieldLabelEn}
                        onChange={(e) => setNewFieldLabelEn(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 text-white rounded-lg p-2 text-xs text-left font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">تنسيق البيانات</label>
                      <select 
                        value={newFieldType}
                        onChange={(e: any) => setNewFieldType(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 text-white rounded-lg p-2 text-xs"
                      >
                        <option value="text">نص مائل (Text)</option>
                        <option value="number">أرقام/قيمة (Number)</option>
                        <option value="date">تاريخ معين (Date)</option>
                      </select>
                    </div>
                    <div className="md:col-span-4 flex items-center gap-2 mt-2">
                      <input 
                        type="checkbox"
                        checked={newFieldRequired}
                        onChange={(e) => setNewFieldRequired(e.target.checked)}
                        className="rounded bg-slate-900 border-slate-800 w-4 h-4 text-sky-500"
                        id="chk_req"
                      />
                      <label htmlFor="chk_req" className="text-xs text-slate-400">جعل المستند أو هذا الحقل إلزامياً ولا يكتمل الحفظ إلّا به</label>
                    </div>
                  </div>

                  <button
                    onClick={handleAddCustomField}
                    className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    تفعيل الحقل باللوحة والموديل
                  </button>

                  <div className="mt-4">
                    <h4 className="text-xs font-bold text-slate-300 mb-2">الحقول النشطة حالياً عبر الشاشات مسبقاً</h4>
                    <div className="bg-slate-950 rounded-xl divide-y divide-slate-900 border border-slate-800 max-h-48 overflow-y-auto">
                      {(settings.fieldsConfig || []).length > 0 ? (
                        (settings.fieldsConfig || []).map(f => (
                          <div key={f.id} className="p-3 text-xs flex justify-between items-center text-slate-300">
                            <button 
                              onClick={() => handleDeleteField(f.id)}
                              className="p-1 hover:text-red-400 text-slate-500 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                            <div className="text-left font-mono text-[10px] text-slate-500">
                              model: <strong className="text-sky-400">{f.model}</strong> | type: {f.type} {f.required && ' | (Required)'}
                            </div>
                            <span className="font-semibold">{lang === 'ar' ? f.labelAr : f.labelEn}</span>
                          </div>
                        ))
                      ) : (
                        <p className="p-4 text-center text-slate-500 text-[10px]">لا توجد حقول ديناميكية مطبقة حالياً. استعمل البانوراما بالأعلى لإطلاق حقل مخصص.</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* CUSTOM ROLES */}
              {designerSection === 'roles' && (
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-slate-200">تأسيس أدوار المستخدمين وصلاحياتهم</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">أنشئ رتب تشغيل مخصصة دون قيود برمجية.</p>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">المسمى الوظيفي بالعربية</label>
                      <input 
                        type="text" 
                        placeholder="فني تكييف أول"
                        value={newRoleAr}
                        onChange={(e) => setNewRoleAr(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 text-white rounded-lg p-2 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Description in English</label>
                      <input 
                        type="text" 
                        placeholder="Lead HVAC Service Master"
                        value={newRoleEn}
                        onChange={(e) => setNewRoleEn(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 text-white rounded-lg p-2 text-xs text-left"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">كود التمييز البرمجي (Unique Key)</label>
                      <input 
                        type="text" 
                        placeholder="lead_technician"
                        value={newRoleCode}
                        onChange={(e) => setNewRoleCode(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 text-white rounded-lg p-2 text-xs text-left font-mono"
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleAddRole}
                    className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    تدشين الرتبة بملف المستخدمين الميدانيين
                  </button>

                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-3">
                    <h4 className="text-xs font-bold text-slate-300 mb-2">أدوار التشغيل المعتمدة حالياً وصلاحيتها</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      <div className="p-3 bg-slate-900/50 rounded-lg text-xs space-y-1">
                        <strong className="text-white block font-sans">Super Admin (المشرف العام)</strong>
                        <span className="text-[10px] text-amber-500 font-mono">full_system_access_immutable</span>
                      </div>
                      <div className="p-3 bg-slate-900/50 rounded-lg text-xs space-y-1">
                        <strong className="text-white block font-sans">Technician (فني صيانة)</strong>
                        <span className="text-[10px] text-green-500 font-mono">dispatch_tasks_assigned_only</span>
                      </div>
                      {(settings.customRoles || []).map(r => (
                        <div key={r.id} className="p-3 bg-indigo-950/20 border border-indigo-500/10 rounded-lg text-xs space-y-1">
                          <strong className="text-indigo-300 block font-sans">{lang === 'ar' ? r.nameAr : r.nameEn}</strong>
                          <span className="text-[10px] text-indigo-400 font-mono">{r.code}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* AUDITS */}
              {designerSection === 'audits' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <button
                      onClick={handleClearAuditLogs}
                      className="text-xs font-bold px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg cursor-pointer transition-colors"
                    >
                      مسح سجل الرقابة بالكامل (Super Admin Only)
                    </button>
                    <h3 className="text-sm font-bold text-white">تفاصيل الرقابة الفيدرالية وسجلات العمليات والأخطاء</h3>
                  </div>

                  <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden max-h-80 overflow-y-auto">
                    <table className="w-full text-right text-xs">
                      <thead className="bg-slate-900 text-slate-400 border-b border-slate-800">
                        <tr>
                          <th className="p-3">رقم العملية</th>
                          <th className="p-3">القائم بالعملية</th>
                          <th className="p-3">الحدث</th>
                          <th className="p-3">مستوى الحدث</th>
                          <th className="p-3">التفاصيل / التعديلات التاريخية</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-900 text-slate-300">
                        {(settings.auditLogs || []).length > 0 ? (
                          (settings.auditLogs || []).map(log => (
                            <tr key={log.id} className="hover:bg-slate-900/50 transition-colors">
                              <td className="p-3 font-mono text-[10px]">{log.id}</td>
                              <td className="p-3">
                                <span className="block font-semibold">{log.userEmail}</span>
                                <span className="text-[9px] text-slate-500 font-mono">{log.timestamp}</span>
                              </td>
                              <td className="p-3">
                                <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold ${
                                  log.action === 'CREATE' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                                  log.action === 'UPDATE' ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20' :
                                  'bg-red-500/10 text-red-500 border border-red-500/20'
                                }`}>
                                  {log.action}
                                </span>
                              </td>
                              <td className="p-3 text-sky-400 font-mono text-[10px]">{log.entity}</td>
                              <td className="p-3 text-[11px] font-sans text-slate-400 max-w-xs truncate" title={log.details}>
                                {log.details}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={5} className="p-8 text-center text-slate-500 text-[10px]">
                              سجل الرقابة فارغ حتى الآن. كافة عمليات الإضافة والحذف السحابية ستسجل هنا تلقائياً لضمان النزاهة الإدارية.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {/* ======================= TAB 2: SMART CUSTOMER PORTAL ======================= */}
      {activeTab === 'cust_portal' && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 text-right space-y-6">
          <div className="flex justify-between items-center pb-4 border-b border-slate-800">
            <span className="px-3 py-1 bg-green-500/10 border border-green-500/20 text-green-400 text-[10px] font-mono rounded-lg">
              SELF_SERVICE_PORTAL_LOGINS
            </span>
            <h2 className="text-lg font-extrabold text-white flex items-center gap-2 gap-x-2">
              <Users className="w-5 h-5 text-indigo-400" />
              {t.customer_portal_login_title}
            </h2>
          </div>

          {!loggedCustomer ? (
            <div className="max-w-xl mx-auto space-y-4 py-8">
              <div className="text-center p-4 bg-slate-950 rounded-2xl border border-slate-800">
                <span className="p-3 bg-indigo-500/10 rounded-full text-indigo-400 inline-block mb-3">
                  <PenTool className="w-6 h-6" />
                </span>
                <p className="text-xs text-slate-300 leading-relaxed font-semibold">
                  {t.customer_portal_hint}
                </p>
              </div>

              <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-3">
                <label className="block text-xs text-slate-400">اسم العميل بالكامل أو رقم الموبايل المسجل لدينا</label>
                <div className="flex gap-2">
                  <button 
                    onClick={handleCustomerLogin}
                    className="px-5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl cursor-pointer"
                  >
                    دخول البوابة
                  </button>
                  <input 
                    type="text" 
                    placeholder="مثل: 01012345678 أو أحمد محمود..."
                    value={custPortalSearch}
                    onChange={(e) => setCustPortalSearch(e.target.value)}
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white text-right"
                  />
                </div>
                {custPortalError && (
                  <p className="text-red-400 text-xs text-right mt-1">{custPortalError}</p>
                )}
              </div>

              <div className="p-4 rounded-xl border border-dashed border-slate-800 text-center">
                <p className="text-[10px] text-slate-500">
                  هل أنت عميل جديد؟ تواصل وتكامل مباشرة وبنقرة واحدة مع مسؤول الدعم على رقم الواتساب: 
                  <strong className="text-slate-400 font-mono block mt-1">01143766442</strong>
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              
              {/* Profile Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-slate-950 border border-slate-800 rounded-2xl">
                <button
                  onClick={() => { setLoggedCustomer(null); triggerAudio(); }}
                  className="px-3 py-1 bg-red-600/10 hover:bg-red-600 text-red-400 hover:text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
                >
                  تسجيل خروج من البوابة
                </button>
                <div className="text-right">
                  <h3 className="font-extrabold text-white text-sm">مرحباً بك، {loggedCustomer.name} 👋</h3>
                  <p className="text-[10px] text-gray-400 font-sans mt-0.5">منطقة: {loggedCustomer.region} | كود العميل: {loggedCustomer.id}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* 1. DEVICES TABLE & WARRANTY */}
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4">
                  <h3 className="text-xs font-extrabold text-indigo-400 uppercase tracking-wider">{t.your_devices}</h3>
                  
                  <div className="divide-y divide-slate-900 border border-slate-900 rounded-xl overflow-hidden text-right text-xs">
                    {devices.filter(d => d.customerId === loggedCustomer.id).length > 0 ? (
                      devices.filter(d => d.customerId === loggedCustomer.id).map(dev => {
                        const installDateParsed = dev.installationDate ? new Date(dev.installationDate.split('/').reverse().join('-')) : new Error();
                        const isExpired = false; // Mocking expiry limit
                        return (
                          <div key={dev.id} className="p-4 bg-slate-900/40 hover:bg-slate-900/70 transition-colors space-y-2">
                            <div className="flex justify-between items-center">
                              <span className={`px-2 py-0.5 rounded-md text-[9px] font-extrabold ${isExpired ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
                                {isExpired ? 'الضمان منتهي' : 'ساري الضمان بالشركة'}
                              </span>
                              <strong className="text-white font-sans">{dev.brand} - {dev.capacity} حصان</strong>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-400">
                              <div>نوع التكييف: <strong className="text-slate-300">{dev.type}</strong></div>
                              <div>تاريخ التركيب الداخلي: <strong className="text-slate-300">{dev.installationDate || 'غير مدون'}</strong></div>
                              <div className="col-span-2">السيريال المسجل: <span className="font-mono text-indigo-300">{dev.serialNumber || 'MGC-89304'}</span></div>
                            </div>

                            {/* DEVICE QR CODE TRIGGER */}
                            <div className="pt-2 border-t border-slate-900 flex justify-between items-center text-[10px]">
                              <button
                                onClick={() => {
                                  alert(`كود الـ QR الخاص بجهازك ${dev.brand} (${dev.id}):\nالعميل: ${loggedCustomer.name}\nتاريخ التركيب: ${dev.installationDate}\nالضمان: ساري\nيرجى مسح الملصق الموجود على جانب تكييفك في حال احتجت لصيانة سريعة من الفني.`);
                                  triggerAudio();
                                }}
                                className="px-2.5 py-1 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 rounded-lg flex items-center gap-1 cursor-pointer"
                              >
                                عرض كود الـ QR للجهاز
                              </button>
                              <span className="text-[9px] text-slate-500">تم الفحص بواسطة: م. محمد أشرف</span>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <p className="p-8 text-center text-slate-500 text-[10px]">لم نقم بتسجيل أجهزة تكييف نشطة لحسابك بعد.</p>
                    )}
                  </div>
                </div>

                {/* 2. INVOICES & PAYMENT STATUS */}
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4">
                  <h3 className="text-xs font-extrabold text-indigo-400 uppercase tracking-wider">{t.your_invoices}</h3>
                  
                  <div className="divide-y divide-slate-900 border border-slate-900 rounded-xl overflow-hidden text-right text-xs">
                    {invoices.filter(i => i.customerId === loggedCustomer.id).length > 0 ? (
                      invoices.filter(i => i.customerId === loggedCustomer.id).map(inv => (
                        <div key={inv.invoiceNumber} className="p-4 bg-slate-900/40 hover:bg-slate-900/70 transition-colors space-y-1">
                          <div className="flex justify-between items-center">
                            <span className={`px-2 py-0.5 rounded-lg text-[9px] font-bold ${
                              inv.status === 'paid' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                            }`}>
                              {inv.status === 'paid' ? 'مسددة بالكامل' : 'قيد الانتظار والدفع'}
                            </span>
                            <strong className="text-white font-mono">{inv.invoiceNumber}</strong>
                          </div>
                          <div className="flex justify-between items-center text-[10px] text-slate-400 mt-1">
                            <span>تاريخ الفاتورة: 30/05/2026</span>
                            <div>القيمة الإجمالية: <strong className="text-slate-200 font-mono">{inv.totalAmount || inv.subtotal} جنيه مصري</strong></div>
                          </div>
                          
                          {/* Invoice Signatures Display! */}
                          {settings.deviceSignatures && settings.deviceSignatures[inv.invoiceNumber] && (
                            <div className="mt-2 p-2 bg-indigo-950/20 border border-indigo-500/20 rounded-xl space-y-1">
                              <span className="text-[8px] text-indigo-400 block">الفاتورة مصدق عليها بالتوقيع الإلكتروني</span>
                              <div className="flex justify-between items-center">
                                <img src={settings.deviceSignatures[inv.invoiceNumber]?.clientSig} alt="sig" className="h-6 bg-white/70 rounded px-1" />
                                <span className="text-[9px] text-slate-300 font-mono">موافق ومستلم: أحمد محمود</span>
                              </div>
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="p-8 text-center text-slate-500 text-[10px]">لا توجد فواتير أو مستحقات مالية مسجلة باسمك حالياً.</p>
                    )}
                  </div>
                </div>

                {/* 3. REQUEST SERVICE FORM */}
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 col-span-1 md:col-span-2 space-y-4">
                  <h3 className="text-xs font-extrabold text-indigo-400 uppercase tracking-wider">{t.submit_service_request}</h3>
                  
                  {reqSuccessMsg && (
                    <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs font-semibold">
                      {reqSuccessMsg}
                    </div>
                  )}

                  <form onSubmit={handleSubmitServiceTicket} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs text-slate-400 mb-2">اختر جهاز التكييف المعطل</label>
                      <input 
                        type="text" 
                        required
                        placeholder="مثال: تكييف كاريير 3 حصان الصالون..."
                        value={reqDeviceName}
                        onChange={(e) => setReqDeviceName(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white text-right"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-2">نوع الطلب المطلوبة</label>
                      <select 
                        value={reqIssueType}
                        onChange={(e) => setReqIssueType(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white"
                      >
                        <option value="غسيل وصيانة تكييف">غسيل وصيانة تكييف دورية</option>
                        <option value="شحن فريون R410A">شحن فريون وإصلاح التسريب</option>
                        <option value="عطل ميكانيكي / كهربائي">تكييف لا يبرد (عطل كمبريسور)</option>
                        <option value="طلب مبيعات وتركيب">طلب معاينة وتركيب تكييف جديد</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-2">الملاحظات أو كود الخطأ</label>
                      <input 
                        type="text" 
                        placeholder="اكتب تفاصيل إضافية مثل: ينقط ماي..."
                        value={reqNotes}
                        onChange={(e) => setReqNotes(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white text-right"
                      />
                    </div>
                    <div className="md:col-span-3 text-left">
                      <button 
                        type="submit"
                        className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold rounded-xl transition-all cursor-pointer"
                      >
                        إرسال الطلب الفوري للصيانة السريعة
                      </button>
                    </div>
                  </form>
                </div>

              </div>

            </div>
          )}
        </div>
      )}

      {/* ======================= TAB 3: TECHNICIAN DISPATCH ======================= */}
      {activeTab === 'tech_portal' && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 text-right space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-800">
            <div>
              <label className="block text-xs text-slate-400 mb-1">تحديد الموظف الفني لمتابعة زياراته المكلفة</label>
              <select 
                value={selectedTechId}
                onChange={(e) => setSelectedTechId(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-slate-300 rounded-lg p-1.5 text-xs font-bold"
              >
                <option value="EMP-001">محمد أشرف (فني رئيسي)</option>
                <option value="EMP-002">أحمد يوسف (مساعد فني صيانة)</option>
                <option value="EMP-003">محمود طارق (فني الكترونيات)</option>
              </select>
            </div>
            <h2 className="text-lg font-extrabold text-white flex items-center gap-2 gap-x-2">
              <Wrench className="w-5 h-5 text-indigo-400" />
              {t.tech_portal}
            </h2>
          </div>

          {!activeTechOrder ? (
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-300 uppercase">{t.assigned_orders}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {techOrders.map(o => (
                  <div key={o.id} className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold ${
                        o.status === 'completed' ? 'bg-green-500/10 text-green-400' : 'bg-amber-500/10 text-amber-500 animate-pulse'
                      }`}>
                        {o.status === 'completed' ? t.status_completed : t.status_progress}
                      </span>
                      <strong className="text-indigo-400 font-mono font-bold">{o.id}</strong>
                    </div>

                    <div className="grid grid-cols-1 gap-1 text-xs text-slate-400">
                      <div>نوع الخدمة المطلوبة: <strong className="text-white font-semibold">{o.serviceType}</strong></div>
                      <div>العميل المستهدف: <strong className="text-slate-300">{customers.find(c => c.id === o.customerId)?.name || 'غير معروف'}</strong></div>
                      <div>رقم تليفون العميل: <span className="text-indigo-300 font-mono font-bold">{customers.find(c => c.id === o.customerId)?.phone || ''}</span></div>
                      <div>مطلوب كاش على المهمة: <strong className="text-emerald-400 font-mono">{o.cost} جنيه مصري</strong></div>
                    </div>

                    {o.status !== 'completed' && (
                      <button
                        onClick={() => { setActiveTechOrder(o); triggerAudio(); }}
                        className="w-full mt-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                      >
                        إدارة تنفيذ المهمة وغسل التكييف وجمع التوقيع
                      </button>
                    )}
                  </div>
                ))}

                {techOrders.length === 0 && (
                  <p className="p-8 text-center text-slate-500 text-[10px] col-span-2">لا توجد زيارات أو أعمال فنية مكلفة لك اليوم.</p>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-6">
              
              <div className="flex justify-between items-center pb-4 border-b border-slate-900">
                <button 
                  onClick={() => setActiveTechOrder(null)}
                  className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-slate-400 rounded-lg text-xs"
                >
                  الرجوع للمفكرة
                </button>
                <h3 className="font-extrabold text-white text-xs">إتمام وتوقيع أوردر صيانة: {activeTechOrder.id}</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                
                {/* STATUS & FEEDBACK */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs text-slate-400 mb-2">تحديث حالة الإنجاز الميداني</label>
                    <select 
                      value={techStatus}
                      onChange={(e: any) => setTechStatus(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl p-2.5"
                    >
                      <option value="completed">تم الصيانة وغسل فلتر التكييف واختبار الكبس بنجاح</option>
                      <option value="cancelled">ألغيت بسبب عدم وجود العميل بالبيت أو تلف إضافي</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs text-slate-400 mb-2">كراسة الفني وتشخيص المشكلة</label>
                    <textarea 
                      required
                      placeholder="اكتب بالتفصيل مثلا: تم غسل الوحدة الداخلية، والكباس يعمل بكفاءة 14 أمبير..."
                      value={techFeedbackMsg}
                      onChange={(e) => setTechFeedbackMsg(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl p-3 h-28 text-right font-sans"
                    />
                  </div>

                  {/* CAMERA IMAGES BEFORE / AFTER SIMULATED */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <span className="block text-[10px] text-slate-400">{t.before_photo}</span>
                      {techPhotoBefore ? (
                        <img src={techPhotoBefore} alt="before" className="rounded-lg h-24 object-cover border border-slate-800 w-full" />
                      ) : (
                        <button 
                          type="button"
                          onClick={() => handleFakePhotoUpload('before')}
                          className="w-full h-24 bg-slate-900 hover:bg-slate-850 rounded-lg flex flex-col justify-center items-center text-slate-500 border border-slate-800 hover:text-indigo-400 cursor-pointer"
                        >
                          <Camera className="w-5 h-5 mb-1" />
                          رفع كبسة قبل
                        </button>
                      )}
                    </div>
                    <div className="space-y-1">
                      <span className="block text-[10px] text-slate-400">{t.after_photo}</span>
                      {techPhotoAfter ? (
                        <img src={techPhotoAfter} alt="after" className="rounded-lg h-24 object-cover border border-slate-800 w-full" />
                      ) : (
                        <button 
                          type="button"
                          onClick={() => handleFakePhotoUpload('after')}
                          className="w-full h-24 bg-slate-900 hover:bg-slate-850 rounded-lg flex flex-col justify-center items-center text-slate-500 border border-slate-800 hover:text-indigo-400 cursor-pointer"
                        >
                          <Camera className="w-5 h-5 mb-1" />
                          رفع كبسة بعد
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* ELECTRONIC SIGNATURE CANVAS DRAWING AREA */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs text-slate-400 mb-2">اسم العميل المستلم للتوقيع</label>
                    <input 
                      type="text" 
                      required
                      placeholder="اسم العميل لربط التوقيع إلكترونياً..."
                      value={custSignatureName}
                      onChange={(e) => setCustSignatureName(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white text-right"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs text-slate-400">{t.signature_client} (ارسم بيدك هنا)</label>
                    <div className="bg-white rounded-xl overflow-hidden border border-slate-300">
                      <canvas 
                        ref={canvasRef}
                        width={300}
                        height={120}
                        className="w-full h-[120px] cursor-crosshair bg-white"
                        onMouseDown={drawStart}
                        onMouseMove={drawMove}
                        onMouseUp={() => setIsDrawing(false)}
                        onTouchStart={drawStart}
                        onTouchMove={drawMove}
                        onTouchEnd={() => setIsDrawing(false)}
                      />
                    </div>
                    <div className="flex justify-between">
                      <button 
                        onClick={clearSignature}
                        className="text-[10px] font-bold text-red-500 border border-red-500/20 px-2 py-1 rounded bg-red-500/10 cursor-pointer hover:bg-red-500 hover:text-white transition-colors"
                      >
                        {t.clear_sig}
                      </button>
                      <span className="text-[9px] text-slate-500 font-sans">معتمد سحابياً لدى تكييف M Group Cool</span>
                    </div>
                  </div>

                  <button
                    onClick={saveSignatureAndComplete}
                    className="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors"
                  >
                    إقفال المهمة وتأكيد التوقيع وإطلاق الفاتورة المالية
                  </button>
                </div>

              </div>

            </div>
          )}
        </div>
      )}

      {/* ======================= TAB 4: HVAC CALCULATOR ======================= */}
      {activeTab === 'hvac_box' && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 text-right space-y-6">
          <div className="flex justify-between items-center pb-4 border-b border-slate-800">
            <span className="px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-mono rounded-lg">
              THERMODYNAMICS_CALCULATORS
            </span>
            <h2 className="text-lg font-extrabold text-white flex items-center gap-2 gap-x-2">
              <Compass className="w-5 h-5 text-indigo-400" />
              {t.horsepower_calc}
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-xs text-slate-300">
            
            {/* INPUT CONTROLS */}
            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
              <h3 className="text-xs font-bold text-slate-300 uppercase">مواصفات وأبعاد الغرفة</h3>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">{t.room_width}</label>
                  <input 
                    type="number" 
                    value={calcWidth} 
                    onChange={(e) => setCalcWidth(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs font-mono text-center text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">{t.room_length}</label>
                  <input 
                    type="number" 
                    value={calcLength} 
                    onChange={(e) => setCalcLength(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs font-mono text-center text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">{t.room_height}</label>
                  <input 
                    type="number" 
                    value={calcHeight} 
                    onChange={(e) => setCalcHeight(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs font-mono text-center text-white"
                  />
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input 
                    type="checkbox"
                    checked={sunExposed}
                    onChange={(e) => setSunExposed(e.target.checked)}
                    className="rounded bg-slate-900 border-slate-800 w-4 h-4 text-emerald-500"
                    id="chk_sun"
                  />
                  <label htmlFor="chk_sun" className="text-[10px] text-slate-450">{t.top_floor_glass}</label>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-900 space-y-3">
                <h4 className="text-[10px] font-bold text-slate-400">أسعار تقديرية للهامش الربحي والعمولة</h4>
                <div>
                  <label className="block text-[9px] text-slate-400 mb-1">سعر بيع التكييف بالكامل للعميل (EGP)</label>
                  <input 
                    type="number" 
                    value={calcSpPrice} 
                    onChange={(e) => setCalcSpPrice(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs font-mono text-center text-white"
                  />
                </div>
                <div>
                  <label className="block text-[9px] text-slate-400 mb-1">تكلفة الشراء والقطع والعمالة على الشركة (EGP)</label>
                  <input 
                    type="number" 
                    value={calcCostPrice} 
                    onChange={(e) => setCalcCostPrice(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs font-mono text-center text-white"
                  />
                </div>
              </div>
            </div>

            {/* CAPACITY CALCS RESULTS */}
            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-5">
              <h3 className="text-xs font-bold text-slate-300 uppercase">نتائج التقييم الحراري للحمل</h3>
              
              <div className="space-y-4">
                <div className="p-3 bg-indigo-950/20 border border-indigo-500/10 rounded-xl space-y-1">
                  <span className="text-[10px] text-slate-450">الحجم الكلي للفراغ السعري</span>
                  <div className="text-lg font-mono font-extrabold text-white">{volume} متر مكعب</div>
                </div>

                <div className="p-3 bg-emerald-950/20 border border-emerald-500/10 rounded-xl space-y-1">
                  <span className="text-[10px] text-slate-450">{t.recommended_capacity}</span>
                  <div className="text-lg font-mono font-extrabold text-emerald-400">{hpRecommended} حصان</div>
                  <span className="text-[9px] text-slate-500 block">يقابلها ~{requiredBtu.toLocaleString()} BTU/H تبريد</span>
                </div>

                <div className="p-3 bg-slate-900/40 rounded-xl space-y-2 text-[11px] text-slate-400">
                  <div className="flex justify-between">
                    <strong className="text-white font-mono font-bold">{estimatedFreonKg.toFixed(2)} كيلو جرام</strong>
                    <span>{t.estimated_freon}</span>
                  </div>
                  <div className="flex justify-between">
                    <strong className="text-white font-mono font-bold">{copperPipesCost} جنيه مصري</strong>
                    <span>تكلفة النحاس المقدرة (5 أمتار)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* COMMERCIAL CALCULS RESULTS */}
            <div className="bg-indigo-950/10 border border-indigo-900/30 p-5 rounded-2xl space-y-5">
              <h3 className="text-xs font-extrabold text-indigo-400 uppercase tracking-wide">{t.cost_estimation}</h3>
              
              <div className="space-y-4">
                <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl space-y-1">
                  <span className="text-[10px] text-indigo-300">{t.expected_profit} (للخزينة)</span>
                  <div className="text-lg font-mono font-extrabold text-indigo-400">+{companyProfit} جنيه مصري</div>
                </div>

                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl space-y-1 animate-pulse">
                  <span className="text-[10px] text-amber-300">{t.tech_commission} (بونص للفني)</span>
                  <div className="text-lg font-mono font-extrabold text-amber-400">+{calculatedTechComm} جنيه مصري</div>
                  <span className="text-[9px] text-slate-500 block">تستقطع تلقائياً وتضاف لبطاقة الفني بالمرتبات</span>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl text-[10px] space-y-2 text-slate-400">
                  <span className="text-[9px] block text-slate-500 font-bold">توزيع الأرباح السنوي على الشركاء بالعملية:</span>
                  <div className="flex justify-between">
                    <strong className="text-slate-200 font-mono">+{partnerSplitMohamed} جنيه</strong>
                    <span>محمود أشرف (شريك 40%)</span>
                  </div>
                  <div className="flex justify-between">
                    <strong className="text-slate-200 font-mono">+{partnerSplitPartner} جنيه</strong>
                    <span>الشركاء الكويتيين (شريك 60%)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* NEW SECTION: DETAILED DEVICE CAPACITIES REFERENCE MATRIX */}
            <div className="lg:col-span-3 bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800 pb-4">
                <div className="text-right">
                  <h3 className="text-sm font-extrabold text-white flex items-center justify-end gap-2">
                    <span>مصفوفة ومواصفات السحابة الفنية لقدرات الأجهزة</span>
                    <Cpu className="w-5 h-5 text-indigo-400" />
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-1">الدليل الهندسي الشامل لترشيد وتدقيق السعة التبريدية واختيار موصلات المحرك وتوصيلات الفريون.</p>
                </div>
                
                <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-450 text-[10px] font-bold rounded-lg border border-emerald-500/20">
                  سعات مطابقة للكود المصري للتكييف والمحافظة على الطاقة ⚡
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {[
                  { hp: 1.5, btu: '12,000', area: '12م²', amp: '5.5A', liquid: '1/4"', gas: '3/8"', charge: '0.85كج', desc: 'غرف نوم صغيرة ومكاتب مصغرة', w: 3, l: 4, h: 2.8, price: 21000, cost: 16500 },
                  { hp: 2.25, btu: '18,000', area: '18م²', amp: '8.2A', liquid: '1/4"', gas: '1/2"', charge: '1.15كج', desc: 'صالات استقبال وغرف معيشة متوسطة', w: 4, l: 4.5, h: 2.8, price: 29000, cost: 22000 },
                  { hp: 3.0, btu: '24,000', area: '24م²', amp: '11.0A', liquid: '1/4"', gas: '5/8"', charge: '1.55كج', desc: 'مجالس واسعة وصالات عائلية ممتدة', w: 4, l: 6, h: 2.8, price: 38000, cost: 29000 },
                  { hp: 4.0, btu: '32,000', area: '32م²', amp: '14.5A', liquid: '3/8"', gas: '5/8"', charge: '1.95كج', desc: 'قاعات اجتماعات ومكاتب استقبال ممتدة', w: 5, l: 6.4, h: 2.8, price: 52000, cost: 41000 },
                  { hp: 5.0, btu: '36,000', area: '40م²', amp: '16.8A', liquid: '3/8"', gas: '3/4"', charge: '2.40كج', desc: 'معارض تجارية واسعة وفيلات وصالات كبرى', w: 5, l: 8, h: 2.8, price: 61000, cost: 48000 },
                  { hp: 6.0, btu: '48,000', area: '50م²', amp: '21.5A', liquid: '3/8"', gas: '3/4"', charge: '3.10كج', desc: 'مساجد وقاعات ومقرات إدارية كبرى', w: 6, l: 8.3, h: 2.8, price: 78000, cost: 62000 },
                  { hp: 7.5, btu: '60,000', area: '65م²', amp: '26.0A', liquid: '1/2"', gas: '7/8"', charge: '4.20كج', desc: 'هايبر ماركت كبرى ومطابخ فنادق متطورة', w: 8, l: 8.2, h: 2.8, price: 95000, cost: 76000 }
                ].map((item, idx) => (
                  <div key={idx} className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-3 relative group hover:border-indigo-500/40 transition-all flex flex-col justify-between">
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-mono text-emerald-400 font-extrabold">{item.btu} BTU</span>
                        <h4 className="text-xs font-extrabold text-white font-sans">{item.hp} حصان</h4>
                      </div>
                      <p className="text-[10px] text-slate-400 font-medium">{item.desc}</p>
                      
                      <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[9px] font-mono text-slate-400 pt-2 border-t border-slate-950">
                        <div>التغطية الأقصى: <strong className="text-slate-300">{item.area}</strong></div>
                        <div>سحب تيار: <strong className="text-slate-300">{item.amp}</strong></div>
                        <div>أنبوب السائل: <strong className="text-slate-300">{item.liquid}</strong></div>
                        <div>أنبوب الغاز: <strong className="text-slate-300">{item.gas}</strong></div>
                        <div className="col-span-2">شحنة الفريون: <strong className="text-emerald-500">{item.charge}</strong></div>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setCalcWidth(item.w);
                        setCalcLength(item.l);
                        setCalcHeight(item.h);
                        setCalcSpPrice(item.price);
                        setCalcCostPrice(item.cost);
                        alert(`تمت تهيئة نموذج المحاكاة الهندسي ببيانات تكييف عيار ${item.hp} حصان بنجاح! شاهد النتائج بالأعلى.`);
                      }}
                      className="w-full mt-3 py-1.5 bg-slate-950 border border-slate-850 group-hover:bg-indigo-600 group-hover:border-indigo-500 text-slate-300 group-hover:text-white rounded-lg text-[10px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
                    >
                      🧪 محاكاة واختبار هذه القدرة للغرفة
                    </button>
                  </div>
                ))}
              </div>

              {/* Dynamic educational notice */}
              <div className="bg-slate-900/40 p-4 border border-slate-800 rounded-xl flex items-start gap-3 justify-end text-right text-[10px] text-slate-400 leading-relaxed">
                <div>
                  <strong className="text-slate-200 block mb-1">💡 فكرة عن التحجيم واختيار القدرات:</strong>
                  تعتمد القدرة الموصى بها على حساب الحجم الكلي ومعدّل التعرض للشمس. في حال وجود واجهات زجاجية واسعة أو في الدور الأخير، يوصى دائماً بزيادة قدرة التكييف بنسبة تقارب 25% لتفادي الجهد المستمر للكبّاس وتوفير الطاقة الكهربائية والتشغيل الصحي الهادئ.
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ======================= TAB 5: PARTNERS PANEL ======================= */}
      {activeTab === 'partners' && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 text-right space-y-6">
          <div className="flex justify-between items-center pb-4 border-b border-slate-800">
            <span className="px-3 py-1 bg-sky-500/10 border border-sky-500/20 text-sky-450 text-[10px] font-mono rounded-lg">
              PARTNERSHIP_REVENUE_METRICS
            </span>
            <h2 className="text-lg font-extrabold text-white flex items-center gap-2 gap-x-2">
              <TrendingUp className="w-5 h-5 text-indigo-400" />
              {t.partner_dashboard}
            </h2>
          </div>

          <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex flex-wrap justify-between items-center gap-3">
            <div className="flex items-center gap-2">
              <select 
                value={partnerRatio} 
                onChange={(e: any) => setPartnerRatio(e.target.value)}
                className="bg-slate-900 border border-slate-800 text-white rounded-lg p-1.5 text-xs font-bold font-mono"
              >
                <option value="50-50">توزيع مناصفة 50% / 50%</option>
                <option value="40-60">توزيع الشراكة الرسمية 40% / 60%</option>
                <option value="30-70">توزيع خاص 30% / 70%</option>
              </select>
              <label className="text-xs text-slate-400">اختر نسبة تقاسم الأرباح السنوية للشركة</label>
            </div>
            
            <p className="text-[10px] text-slate-500 max-w-sm leading-normal">
              يتم جمع كافة المقبوضات والفواتير والتحصيلات في ERP وتصفية مصروفات العمالة وتوزيع الشركاء آلياً لضمان سرية وأمان الأرصدة.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* General financial overview card */}
            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4 text-xs text-slate-400">
              <h3 className="text-xs font-extrabold text-white">الملخص المالي الفعلي للشركة</h3>
              
              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b border-slate-900">
                  <strong className="text-white font-mono">{totalInvoiced.toLocaleString()} ج.م</strong>
                  <span>إجمالي المبيعات والفواتير المطلقة</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-900">
                  <strong className="text-red-400 font-mono">-{totalExpensesLogged.toLocaleString()} ج.م</strong>
                  <span>إجمالي تكاليف التشغيل والمصروفات المأهولة</span>
                </div>
                <div className="flex justify-between py-2 font-bold text-emerald-400">
                  <strong className="font-mono">{calculatedNetRemainder.toLocaleString()} ج.م</strong>
                  <span>صافي السيولة النقدية المتبقية بالأرباح</span>
                </div>
              </div>
            </div>

            {/* MOHAMED ASHRAF CARD */}
            <div className="bg-indigo-950/20 border border-indigo-500/10 p-5 rounded-2xl space-y-4 text-xs text-right">
              <div className="flex gap-2 items-center justify-end">
                <span className="p-2 bg-indigo-500/15 text-indigo-400 rounded-xl">
                  <PenTool className="w-4 h-4" />
                </span>
                <h3 className="font-extrabold text-white text-sm">محمد أشرف (مؤسس وشريك)</h3>
              </div>
              
              <div className="p-3 bg-slate-950 rounded-xl space-y-2">
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span className="text-white font-mono font-bold">{mohamedPercent}%</span>
                  <span>نسبة حصة الأرباح المأخوذة</span>
                </div>
                <div className="flex justify-between items-center text-sm font-bold text-indigo-400 pt-1.5 border-t border-slate-900">
                  <span className="font-mono">{mohamedShareSum.toLocaleString()} ج.م</span>
                  <span>المستحق الصافي بالتوزيع</span>
                </div>
              </div>
              <p className="text-[10px] text-slate-500 leading-normal">
                تشمل أرباح مبيعات كاريير وشحن الفريون ورفع أجور الصيانة الدورية الدسمة.
              </p>
            </div>

            {/* PARTNER CARD */}
            <div className="bg-emerald-950/20 border border-emerald-500/10 p-5 rounded-2xl space-y-4 text-xs text-right">
              <div className="flex gap-2 items-center justify-end">
                <span className="p-2 bg-emerald-500/15 text-emerald-400 rounded-xl">
                  <TrendingUp className="w-4 h-4" />
                </span>
                <h3 className="font-extrabold text-white text-sm">مجموعة الشركاء المستثمرين</h3>
              </div>
              
              <div className="p-3 bg-slate-950 rounded-xl space-y-2">
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span className="text-white font-mono font-bold">{partnerPercent}%</span>
                  <span>نسبة حصة رأس المال المأخوذة</span>
                </div>
                <div className="flex justify-between items-center text-sm font-bold text-emerald-400 pt-1.5 border-t border-slate-900">
                  <span className="font-mono">{partnerShareSum.toLocaleString()} ج.م</span>
                  <span>المستحق الصافي بالتوزيع</span>
                </div>
              </div>
              <p className="text-[10px] text-slate-500 leading-normal">
                تسوى وتتحول الأرصدة تلقائياً بالتنسيق مع المشرف الحظري المعتمد لوزارة الإيراد.
              </p>
            </div>

          </div>
        </div>
      )}

      {/* ======================= TAB 6: DIAGNOSTICS & FAULTS ======================= */}
      {activeTab === 'diagnose' && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 text-right space-y-6">
          <div className="flex justify-between items-center pb-4 border-b border-slate-800">
            <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-mono rounded-lg">
              HVAC_DIAGNOSTIC_DOCS_KNOWLEDGE_BASE
            </span>
            <h2 className="text-lg font-extrabold text-white flex items-center gap-2 gap-x-2">
              <BookOpen className="w-5 h-5 text-indigo-400" />
              {t.knowledge_base}
            </h2>
          </div>

          <div className="relative">
            <Search className="absolute right-4 top-3.5 w-4 h-4 text-slate-500" />
            <input 
              type="text" 
              placeholder="اكتب العطل أو المشكلة لإعطاء حلول مسبقة للفني (مثل: تساقط مياه، لا يبرد)..."
              value={diagnosticSearch}
              onChange={(e) => setDiagnosticSearch(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pr-10 pl-4 py-3 text-xs text-white text-right"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {filteredArticles.map(art => (
              <div key={art.id} className="bg-slate-950 border border-slate-850 rounded-2xl p-5 space-y-3 hover:border-slate-700 transition-all">
                <div className="flex gap-2 items-center justify-end">
                  <span className="px-2 py-0.5 bg-red-500/10 text-red-400 text-[9px] font-bold rounded-md">عطل متكرر</span>
                  <h3 className="font-extrabold text-white text-xs">{lang === 'ar' ? art.titleAr : art.titleEn}</h3>
                </div>
                
                <div className="text-[11px] text-slate-400 leading-relaxed bg-slate-900/40 p-3 rounded-xl whitespace-pre-line text-right">
                  {lang === 'ar' ? art.solutionsAr : art.solutionsEn}
                </div>
              </div>
            ))}

            {filteredArticles.length === 0 && (
              <p className="p-8 text-center text-slate-500 text-[10px] col-span-3">لا توجد دكتات أو أعطال مطابقة لبحثك في الدليل الميداني.</p>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
