/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useRef } from 'react';
import { 
  Users, Smartphone, Wrench, FileText, ClipboardList, Layers, Table, CreditCard, 
  HelpCircle, Shield, Settings, Database, Trash2, Edit3, Plus, Search, Check, 
  X, AlertTriangle, Download, Upload, Eye, History, UserCheck, CheckCircle2,
  Lock, ArrowRightLeft, FileCheck, ShieldAlert, Cpu, Bell, Volume2, HardDrive
} from 'lucide-react';
import { 
  Customer, Device, MaintenanceOrder, Contract, Invoice, 
  Payment, Expense, Employee, AttendanceRecord, Supplier, 
  Product, UserProfile, CompanySettings, UserRole 
} from '../types';
import { dataService } from '../dataService';

interface SystemAdministrationProps {
  currentUser: UserProfile;
  customers: Customer[];
  devices: Device[];
  orders: MaintenanceOrder[];
  contracts: Contract[];
  invoices: Invoice[];
  payments: Payment[];
  expenses: Expense[];
  products: Product[];
  suppliers: Supplier[];
  employees: Employee[];
  attendance: AttendanceRecord[];
  users: UserProfile[];
  settings: CompanySettings;
  updateSettings: (data: Partial<CompanySettings>) => void;
}

type AdminTab = 
  | 'company_settings' 
  | 'user_accounts' 
  | 'backup_restore' 
  | 'audit_logs'
  | 'customers' 
  | 'devices' 
  | 'orders' 
  | 'contracts' 
  | 'quotations' 
  | 'invoices' 
  | 'payments' 
  | 'expenses' 
  | 'inventory' 
  | 'suppliers' 
  | 'employees' 
  | 'attendance'
  | 'technicians';

export default function SystemAdministration({
  currentUser,
  customers,
  devices,
  orders,
  contracts,
  invoices,
  payments,
  expenses,
  products,
  suppliers,
  employees,
  attendance,
  users,
  settings,
  updateSettings
}: SystemAdministrationProps) {

  // Active Admin Subsystem Tab
  const [activeTab, setActiveTab] = useState<AdminTab>('company_settings');

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');

  // Alerts & Messages
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Edit / Add Modal States
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingItemType, setEditingItemType] = useState<AdminTab | null>(null);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [addMode, setAddMode] = useState(false);

  // Dynamic values for forms
  const [formData, setFormData] = useState<any>({});

  // Backup states
  const [backupJson, setBackupJson] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check Permissions: MANAGER can create and edit, SUPER_ADMIN can do anything.
  const isSuperAdmin = currentUser.role === UserRole.SUPER_ADMIN;
  const isManager = currentUser.role === UserRole.MANAGER;
  const isAccountant = currentUser.role === UserRole.ACCOUNTANT;
  const isHr = (currentUser.role as string) === 'hr' || currentUser.role === UserRole.ADMIN;
  
  const hasEditPermission = (tab: AdminTab) => {
    if (isSuperAdmin) return true;
    if (isManager) return true; // Manager can edit everything
    if (isAccountant && ['invoices', 'quotations', 'payments', 'expenses'].includes(tab)) return true;
    if (isHr && ['employees', 'attendance', 'user_accounts'].includes(tab)) return true;
    return false;
  };

  const hasDeletePermission = (tab: AdminTab) => {
    if (isSuperAdmin) return true;
    return false; // Only SUPER_ADMIN can delete
  };

  const hasViewPermission = (tab: AdminTab) => {
    if (isSuperAdmin || isManager) return true;
    if (isAccountant && ['invoices', 'quotations', 'payments', 'expenses', 'inventory', 'suppliers', 'company_settings'].includes(tab)) return true;
    if (isHr && ['employees', 'attendance', 'user_accounts', 'company_settings'].includes(tab)) return true;
    if (currentUser.role === UserRole.TECHNICIAN && ['orders', 'devices'].includes(tab)) return true;
    if (currentUser.role === UserRole.VIEWER) return true;
    return false;
  };

  // Helper to show flash messages
  const showSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(''), 4000);
  };
  const showError = (msg: string) => {
    setErrorMessage(msg);
    setTimeout(() => setErrorMessage(''), 5000);
  };

  // 1. COMPANY SETTINGS FORM STATE
  const [compName, setCompName] = useState(settings.companyName || 'مجموعة إم جروب كول');
  const [compLogo, setCompLogo] = useState(settings.logoData || '');
  const [compAddress, setCompAddress] = useState(settings.address || 'القاهرة، مصر');
  const [compPhones, setCompPhones] = useState(settings.phones || '01000000000');
  const [compEmail, setCompEmail] = useState(settings.email || 'info@mgroupcool.com');
  const [compTaxNumber, setCompTaxNumber] = useState(settings.taxNumber || '100-200-300');
  const [compVatRate, setCompVatRate] = useState(settings.vatRate || 14);
  const [compInvoiceTerms, setCompInvoiceTerms] = useState(settings.invoiceTerms || 'شروط دفع نقدي / تحصيل فوري لغسيل وشحن التكييفات');

  const handleSaveCompanySettings = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasEditPermission('company_settings')) {
      showError('ليست لديك الصلاحية الكافية لتعديل بيانات الشركة!');
      return;
    }
    updateSettings({
      companyName: compName,
      logoData: compLogo,
      address: compAddress,
      phones: compPhones,
      email: compEmail,
      taxNumber: compTaxNumber,
      vatRate: Number(compVatRate),
      invoiceTerms: compInvoiceTerms
    });
    showSuccess('تم تحديث وحفظ بيانات وصلاحيات الشركة بنجاح في السيرفر!');
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1.5 * 1024 * 1024) {
        showError('حجم اللوجو كبير! يرجى اختيار لوجو أصغر من 1.5 ميغابايت لتسهيل التحميل.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setCompLogo(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // 2. BACKUP & RESTORE ACTIONS
  const handleExportBackup = () => {
    const dataStr = dataService.exportBackup();
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const exportFileDefaultName = `m_group_cool_erp_firestore_backup_${new Date().toISOString().slice(0, 10)}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    showSuccess('تم تصدير نسخة احتياطية مشفرة وتحميلها محلياً بصيغة JSON!');
  };

  const handleImportBackup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasEditPermission('backup_restore')) {
      showError('غير مصرح لك باستيراد نسخ غامضة للنظام!');
      return;
    }
    if (!backupJson.trim()) {
      showError('يرجى لصق كود النسخة أولاً!');
      return;
    }
    const success = dataService.importBackup(backupJson);
    if (success) {
      showSuccess('تم بنجاح تحميل النسخة الاحتياطية وإعادة بناء الـ Firestore ومحاكاة البيانات!');
      setBackupJson('');
      setTimeout(() => window.location.reload(), 1500);
    } else {
      showError('ملف النسخة الاحتياطية تالف أو يحوي تراكيب غير مطابقة للمواصفات!');
    }
  };

  const handleBackupFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setBackupJson(event.target?.result as string || '');
      };
      reader.readAsText(file);
    }
  };

  // FILTERED LIST GENERATORS
  const itemsList = useMemo(() => {
    const queryLower = searchQuery.toLowerCase();

    switch (activeTab) {
      case 'customers':
        return customers.filter(c => 
          c.name.toLowerCase().includes(queryLower) || 
          c.phone.includes(queryLower) || 
          (c.address && c.address.toLowerCase().includes(queryLower))
        );
      case 'devices':
        return devices.filter(d => 
          d.brand.toLowerCase().includes(queryLower) || 
          (d.type || '').toLowerCase().includes(queryLower) ||
          d.id.toLowerCase().includes(queryLower)
        );
      case 'orders':
        return orders.filter(o => 
          o.id.toLowerCase().includes(queryLower) || 
          o.serviceType.toLowerCase().includes(queryLower) || 
          o.status.toLowerCase().includes(queryLower)
        );
      case 'contracts':
        return contracts.filter(c => 
          c.contractNumber.toLowerCase().includes(queryLower) || 
          c.customerId.toLowerCase().includes(queryLower)
        );
      case 'quotations':
        return invoices.filter(i => i.type === 'quote' && (
          i.invoiceNumber.toLowerCase().includes(queryLower) || 
          i.status.toLowerCase().includes(queryLower)
        ));
      case 'invoices':
        return invoices.filter(i => i.type !== 'quote' && (
          i.invoiceNumber.toLowerCase().includes(queryLower) || 
          i.status.toLowerCase().includes(queryLower)
        ));
      case 'payments':
        return payments.filter(p => 
          p.id.toLowerCase().includes(queryLower) || 
          p.invoiceId.toLowerCase().includes(queryLower) ||
          p.paymentType.toLowerCase().includes(queryLower)
        );
      case 'expenses':
        return expenses.filter(e => 
          e.category.toLowerCase().includes(queryLower) || 
          (e.description && e.description.toLowerCase().includes(queryLower))
        );
      case 'inventory':
        return products.filter(p => 
          p.name.toLowerCase().includes(queryLower) || 
          p.category.toLowerCase().includes(queryLower) || 
          (p.sku || '').toLowerCase().includes(queryLower)
        );
      case 'suppliers':
        return suppliers.filter(s => 
          (s.name || '').toLowerCase().includes(queryLower) || 
          s.phone.includes(queryLower)
        );
      case 'employees':
        return employees.filter(e => 
          e.name.toLowerCase().includes(queryLower) || 
          (e.jobTitle || '').toLowerCase().includes(queryLower)
        );
      case 'attendance':
        return attendance.filter(a => {
          const emp = employees.find(e => e.id === a.employeeId);
          return (
            a.date.includes(queryLower) ||
            a.status.toLowerCase().includes(queryLower) ||
            (emp && emp.name.toLowerCase().includes(queryLower))
          );
        });
      case 'technicians':
        return employees.filter(e => (e.jobTitle || '').includes('فني') || (e.jobTitle || '').toLowerCase().includes('tech')).filter(e =>
          e.name.toLowerCase().includes(queryLower)
        );
      case 'user_accounts':
        return users.filter(u => 
          u.name.toLowerCase().includes(queryLower) || 
          u.email.toLowerCase().includes(queryLower) ||
          u.role.toLowerCase().includes(queryLower)
        );
      default:
        return [];
    }
  }, [activeTab, customers, devices, orders, contracts, invoices, payments, expenses, products, suppliers, employees, attendance, users, searchQuery]);

  // DELETE ACTION ROUTER
  const handleDeleteItem = (id: string) => {
    if (!hasDeletePermission(activeTab)) {
      showError('عذراً، يجب تسجيل الدخول بحساب المشرف العام الأساسي (SUPER_ADMIN) للتمكن من حذف السجلات نهائياً من الـ Firestore!');
      return;
    }

    if (!confirm('تحذير صارم: أنت على وشك حذف هذا السجل بشكل نهائي لا رجعة فيه من خوادم السحابة. هل أنت متأكد تماماً؟')) {
      return;
    }

    try {
      switch (activeTab) {
        case 'customers':
          dataService.deleteCustomer(id);
          break;
        case 'devices':
          dataService.deleteDevice(id);
          break;
        case 'orders':
          dataService.deleteOrder(id);
          break;
        case 'contracts':
          dataService.deleteContract(id);
          break;
        case 'quotations':
        case 'invoices':
          dataService.deleteInvoice(id);
          break;
        case 'payments':
          dataService.deletePayment(id);
          break;
        case 'expenses':
          dataService.deleteExpense(id);
          break;
        case 'inventory':
          dataService.deleteProduct(id);
          break;
        case 'suppliers':
          dataService.deleteSupplier(id);
          break;
        case 'employees':
        case 'technicians':
          dataService.deleteEmployee(id);
          break;
        case 'attendance':
          dataService.deleteAttendance(id);
          break;
        case 'user_accounts':
          dataService.deleteUser(id);
          break;
        default:
          break;
      }
      showSuccess('تم حذف السجل من خوادم Firestore بكفاءة وتم تسجيل العملية بسجل الرقابة للشركة!');
    } catch (e: any) {
      showError(e.message || 'فشلت عملية الحذف!');
    }
  };

  // OPEN EDIT MODAL WITH DEFAULT VALUES PRE-LOADED
  const openEditModal = (item: any = null) => {
    if (item) {
      setAddMode(false);
      setEditingItemId(item.id || item.uid || item.contractNumber || item.invoiceNumber || null);
      setFormData({ ...item });
    } else {
      setAddMode(true);
      setEditingItemId(null);
      // set blank defaults
      const blanks: any = {};
      if (activeTab === 'customers') {
        blanks.name = ''; blanks.phone = ''; blanks.phone2 = ''; blanks.email = ''; blanks.address = ''; blanks.governorate = 'القاهرة'; blanks.region = 'التجمع الخامس'; blanks.customerSource = 'مباشر'; blanks.notes = '';
      } else if (activeTab === 'devices') {
        blanks.customerId = customers[0]?.id || ''; blanks.brand = 'Carrier'; blanks.modelType = 'سبليت حائطى'; blanks.capacity = '1.5 حصان'; blanks.notes = ''; blanks.installationDate = ''; blanks.lastServiceDate = '';
      } else if (activeTab === 'orders') {
        blanks.customerId = customers[0]?.id || ''; blanks.deviceId = devices[0]?.id || ''; blanks.serviceType = 'شحن فريون وغسيل كيميائي'; blanks.assignedTo = employees[0]?.id || ''; blanks.status = 'pending'; blanks.cost = 0; blanks.collectionAmount = 0; blanks.notes = '';
      } else if (activeTab === 'contracts') {
        blanks.customerId = customers[0]?.id || ''; blanks.startDate = ''; blanks.endDate = ''; blanks.annualPrice = 1200; blanks.visitsScheduled = 4; blanks.visitsDone = 0; blanks.status = 'active';
      } else if (activeTab === 'quotations' || activeTab === 'invoices') {
        blanks.customerId = customers[0]?.id || ''; blanks.type = activeTab === 'quotations' ? 'quote' : 'invoice'; blanks.subtotal = 0; blanks.vatRate = settings.vatRate || 14; blanks.status = 'unpaid'; blanks.items = [{ description: 'صيانة تكييفات للشركة الموقرة', quantity: 1, price: 0, total: 0 }]; blanks.notes = '';
      } else if (activeTab === 'payments') {
        blanks.invoiceId = invoices[0]?.invoiceNumber || ''; blanks.customerId = customers[0]?.id || ''; blanks.amount = 0; blanks.paymentType = 'نقدي'; blanks.notes = '';
      } else if (activeTab === 'expenses') {
        blanks.category = 'إيجار فرع ومخازن'; blanks.amount = 1000; blanks.date = ''; blanks.notes = ''; blanks.paymentMethod = 'خزينة الشركة';
      } else if (activeTab === 'inventory') {
        blanks.name = ''; blanks.sku = ''; blanks.price = 500; blanks.cost = 350; blanks.quantity = 20; blanks.category = 'قطع غيار'; blanks.reorderLevel = 5; blanks.unit = 'كجم';
      } else if (activeTab === 'suppliers') {
        blanks.name = ''; blanks.contactName = ''; blanks.phone = ''; blanks.email = ''; blanks.address = ''; blanks.governorate = 'القاهرة'; blanks.balance = 0;
      } else if (activeTab === 'employees' || activeTab === 'technicians') {
        blanks.name = ''; blanks.position = activeTab === 'technicians' ? 'فني تكييف أول' : 'موظف مبيعات'; blanks.phone = ''; blanks.email = ''; blanks.salary = 3000; blanks.dailyRate = 120; blanks.overtimeRate = 25; blanks.hireDate = ''; blanks.notes = '';
      } else if (activeTab === 'attendance') {
        blanks.employeeId = employees[0]?.id || ''; blanks.date = ''; blanks.status = 'present'; blanks.checkIn = '09:00'; blanks.checkOut = '19:00'; blanks.workingHours = 8; blanks.overtimeHours = 0;
      } else if (activeTab === 'user_accounts') {
        blanks.name = ''; blanks.email = ''; blanks.role = UserRole.VIEWER;
      }
      setFormData(blanks);
    }
    setEditingItemType(activeTab);
    setIsEditModalOpen(true);
  };

  // SAVE SUBMIT ROUTER FOR ALL MONOLITHIC EDITS / ADDS
  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasEditPermission(activeTab)) {
      showError('عذراً، لا تمتلك الصلاحيات الإدارية المطلوبة لإتمام رول التعديل / الإضافة في Firestore!');
      return;
    }

    try {
      const type = editingItemType;
      const id = editingItemId;

      if (addMode) {
        // ADD NEW SUITE
        switch (type) {
          case 'customers':
            dataService.addCustomer(formData);
            break;
          case 'devices':
            dataService.addDevice(formData);
            break;
          case 'orders':
            dataService.addOrder(formData);
            break;
          case 'contracts':
            dataService.addContract(formData);
            break;
          case 'quotations':
          case 'invoices':
            dataService.addInvoice(formData);
            break;
          case 'payments':
            dataService.addPayment(formData);
            break;
          case 'expenses':
            dataService.addExpense(formData);
            break;
          case 'inventory':
            dataService.addProduct(formData);
            break;
          case 'suppliers':
            dataService.addSupplier(formData);
            break;
          case 'employees':
          case 'technicians':
            dataService.addEmployee(formData);
            break;
          case 'attendance':
            dataService.addAttendance(formData);
            break;
          case 'user_accounts':
            dataService.addUser(formData);
            break;
          default:
            break;
        }
        showSuccess('تمت إضافة السجل الجديد وحفظه للـ Firestore بكفاءة وسرعة فائقة!');
      } else {
        // UPDATE EXISTING SUITE
        if (!id) return;
        switch (type) {
          case 'customers':
            dataService.updateCustomer(id, formData);
            break;
          case 'devices':
            dataService.updateDevice(id, formData);
            break;
          case 'orders':
            dataService.updateOrder(id, formData);
            break;
          case 'contracts':
            dataService.updateContract(id, formData);
            break;
          case 'quotations':
          case 'invoices':
            dataService.updateInvoice(id, formData);
            break;
          case 'payments':
            dataService.updatePayment(id, formData);
            break;
          case 'expenses':
            dataService.updateExpense(id, formData);
            break;
          case 'inventory':
            dataService.updateProduct(id, formData);
            break;
          case 'suppliers':
            dataService.updateSupplier(id, formData);
            break;
          case 'employees':
          case 'technicians':
            dataService.updateEmployee(id, formData);
            break;
          case 'attendance':
            dataService.updateAttendance(id, formData);
            break;
          case 'user_accounts':
            dataService.updateUser(id, formData);
            break;
          default:
            break;
        }
        showSuccess('تم حفظ وحقن المتغيرات المحدثة بالـ Firestore ومزامنة رول الرقابة!');
      }
      setIsEditModalOpen(false);
    } catch (err: any) {
      showError(err.message || 'خطأ أثناء الحفظ!');
    }
  };

  // HELPER TO MAP CUSTOMER / EMPS STATS IN LISTS
  const getCustomerName = (cId: string) => customers.find(c => c.id === cId)?.name || 'ميلادي / غير مسجل';
  const getEmployeeName = (empId: string) => employees.find(e => e.id === empId)?.name || 'فني حر';
  const getDeviceDetails = (dId: string) => {
    const dev = devices.find(d => d.id === dId);
    return dev ? `${dev.brand} [${dev.capacity}]` : 'تكييف عام';
  };

  return (
    <div className="bg-slate-900 border border-slate-800 text-slate-100 p-6 rounded-3xl space-y-6 text-right max-w-7xl mx-auto min-h-screen relative" id="system-admin-control-center">
      
      {/* 2U HEADER */}
      <header className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-800 pb-5 gap-4">
        <div>
          <span className="bg-sky-500/10 text-sky-400 text-[10px] px-3 py-1 rounded-full font-mono font-bold tracking-widest text-[9px] uppercase">
            SUPER ADMIN ENTERPRISE POWER STATION
          </span>
          <h2 className="text-2xl font-black text-white mt-1.5 font-sans flex items-center justify-end gap-2.5">
            بوابة الإدارة والنظم الشاملة
            <Settings className="w-7 h-7 text-sky-500 animate-spin-slow" />
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            مساحة حوكمة مشفرة للـ Super Admin لتشغيل وصيانة وحقن قاعدة بيانات شركة تكييفات M Group Cool
          </p>
        </div>
        
        {/* Active operator card */}
        <div className="bg-slate-950 border border-slate-800 p-3 rounded-2xl flex items-center gap-3 justify-end text-right self-start">
          <div>
            <p className="text-xs font-bold text-white leading-none">{currentUser.name}</p>
            <p className="text-[10px] text-slate-400 mt-1 font-mono">{currentUser.email}</p>
          </div>
          <div className="p-2.5 bg-sky-500/10 border border-sky-500/30 text-sky-400 rounded-xl">
            <Lock className="w-5 h-5" />
          </div>
        </div>
      </header>

      {/* FLASH MESSAGES */}
      {successMessage && (
        <div className="p-4 bg-emerald-950/80 border border-emerald-800 rounded-2xl flex items-center justify-between text-right animate-pulse">
          <button onClick={() => setSuccessMessage('')} className="text-emerald-400 hover:text-white"><X className="w-4 h-4" /></button>
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-emerald-300 font-sans">{successMessage}</span>
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 bg-red-950/80 border border-red-800 rounded-2xl flex items-center justify-between text-right">
          <button onClick={() => setErrorMessage('')} className="text-red-400 hover:text-white"><X className="w-4 h-4" /></button>
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-red-300 font-sans">{errorMessage}</span>
            <ShieldAlert className="w-5 h-5 text-red-400" />
          </div>
        </div>
      )}

      {/* CORE FRAMEWORK GRID: Nav (Right) vs Panels (Left) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        
        {/* RIGHT COLUMN: Tab Navigators */}
        <nav className="bg-slate-950 border border-slate-800/80 p-3 rounded-2xl space-y-1 lg:col-span-1 text-right text-xs">
          
          <div className="px-3 py-1.5 border-b border-slate-800 mb-2">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">إعدادات النظم</span>
          </div>

          <button
            onClick={() => { setActiveTab('company_settings'); setSearchQuery(''); }}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-bold transition-all cursor-pointer ${activeTab === 'company_settings' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-900 hover:text-white'}`}
          >
            <Settings className="w-4 h-4" />
            <span>بيانات الشركة والضرائب</span>
          </button>

          <button
            onClick={() => { setActiveTab('user_accounts'); setSearchQuery(''); }}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-bold transition-all cursor-pointer ${activeTab === 'user_accounts' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-900 hover:text-white'}`}
          >
            <Shield className="w-4 h-4" />
            <span>إدارة الحسابات والرولات</span>
          </button>

          <button
            onClick={() => { setActiveTab('backup_restore'); setSearchQuery(''); }}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-bold transition-all cursor-pointer ${activeTab === 'backup_restore' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-900 hover:text-white'}`}
          >
            <Database className="w-4 h-4" />
            <span>النسخ الاحتياطي واستيراد الـ Firestore</span>
          </button>

          <button
            onClick={() => { setActiveTab('audit_logs'); setSearchQuery(''); }}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-bold transition-all cursor-pointer ${activeTab === 'audit_logs' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-900 hover:text-white'}`}
          >
            <History className="w-4 h-4" />
            <span>سجل الرقابة والأرشفة (Audit)</span>
          </button>

          <div className="px-3 py-1.5 border-b border-slate-800 my-2 pt-3">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">الموديولات والعملاء</span>
          </div>

          {[
            { id: 'customers', label: 'العملاء المستهدفين', count: customers.length, icon: Users },
            { id: 'devices', label: 'تكييفات العملاء الملحقة', count: devices.length, icon: Smartphone },
            { id: 'orders', label: 'أوامر تشغيل HVAC', count: orders.length, icon: Wrench },
            { id: 'contracts', label: 'عقود الصيانة الدورية', count: contracts.length, icon: ClipboardList },
            { id: 'quotations', label: 'عروض الأسعار والبروبوزال', count: invoices.filter(i => i.type === 'quote').length, icon: FileCheck },
            { id: 'invoices', label: 'الفواتير والمطالبات', count: invoices.filter(i => i.type !== 'quote').length, icon: FileText },
            { id: 'payments', label: 'المدفوعات والمستندات', count: payments.length, icon: CreditCard },
            { id: 'expenses', label: 'المصاريف والرواتب والمكافآت', count: expenses.length, icon: Table },
            { id: 'inventory', label: 'المخزون وقطع التكييف', count: products.length, icon: Layers },
            { id: 'suppliers', label: 'موردي الأجهزة والمواسير', count: suppliers.length, icon: ArrowRightLeft },
            { id: 'employees', label: 'موظفي وقرارات الرواتب', count: employees.length, icon: Users },
            { id: 'attendance', label: 'حضور ودفتر الفنيين', count: attendance.length, icon: History },
            { id: 'technicians', label: 'إسكان وقدرات الفنيين الميدانية', count: employees.filter(e => (e.jobTitle || '').includes('فني')).length, icon: Cpu }
          ].map(mod => {
            const Icon = mod.icon;
            return (
              <button
                key={mod.id}
                onClick={() => { setActiveTab(mod.id as AdminTab); setSearchQuery(''); }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all cursor-pointer ${activeTab === mod.id ? 'bg-sky-600 text-white font-bold' : 'text-slate-400 hover:bg-slate-900/50 hover:text-white'}`}
              >
                <div className="flex items-center gap-1.5 font-mono text-[9px]">
                  <span className="px-1.5 py-0.5 rounded-full bg-slate-800 text-sky-400 font-bold">{mod.count}</span>
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <span>{mod.label}</span>
              </button>
            );
          })}
        </nav>

        {/* LEFT COLUMN: Operations & UI Panels based on activeTab */}
        <section className="bg-slate-950 border border-slate-800/80 p-5 rounded-2xl lg:col-span-3 min-h-[500px]">
          
          {/* A. COMPANY SETTINGS VIEW */}
          {activeTab === 'company_settings' && (
            <div className="space-y-5">
              <div className="border-b border-slate-800 pb-3">
                <h3 className="text-lg font-bold text-white font-sans">بيانات هويات الشركة والضرائب</h3>
                <p className="text-slate-400 text-xs">تعديل معلومات الترويسات وحجم ضريبة القيمة المضافة لتقارير تكييف M Group Cool</p>
              </div>

              <form onSubmit={handleSaveCompanySettings} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-400 text-xs font-semibold mb-1.5">اسم الشركة (عربي)</label>
                    <input
                      type="text"
                      required
                      value={compName}
                      onChange={(e) => setCompName(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 p-2.5 rounded-xl text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 text-xs font-semibold mb-1.5">لوجو الشركة (ملف صورة)</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="w-full text-xs text-slate-400 cursor-pointer bg-slate-900 border border-slate-800 p-1.5 rounded-xl"
                    />
                    {compLogo && (
                      <img src={compLogo} alt="Logo preview" className="h-10 mt-2 object-contain" />
                    )}
                  </div>
                  <div>
                    <label className="block text-slate-400 text-xs font-semibold mb-1.5">عنوان الشركة التفصيلي</label>
                    <input
                      type="text"
                      value={compAddress}
                      onChange={(e) => setCompAddress(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 p-2.5 rounded-xl text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 text-xs font-semibold mb-1.5">هواتف الاتصال والدعم</label>
                    <input
                      type="text"
                      value={compPhones}
                      onChange={(e) => setCompPhones(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 p-2.5 rounded-xl text-xs text-white uppercase font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 text-xs font-semibold mb-1.5">بريد الإدارة المالي</label>
                    <input
                      type="email"
                      value={compEmail}
                      onChange={(e) => setCompEmail(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 p-2.5 rounded-xl text-xs text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 text-xs font-semibold mb-1.5">البطاقة والملف والسجل الضريبي</label>
                    <input
                      type="text"
                      value={compTaxNumber}
                      onChange={(e) => setCompTaxNumber(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 p-2.5 rounded-xl text-xs text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 text-xs font-semibold mb-1.5">نسبة ضريبة القيمة المضافة (%)</label>
                    <input
                      type="number"
                      value={compVatRate}
                      onChange={(e) => setCompVatRate(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-800 p-2.5 rounded-xl text-xs text-white font-mono text-center"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 text-xs font-semibold mb-1.5">شروط الدفع والتسليم الافتراضية</label>
                  <textarea
                    rows={3}
                    value={compInvoiceTerms}
                    onChange={(e) => setCompInvoiceTerms(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 p-2.5 rounded-xl text-xs text-white"
                  />
                </div>

                {hasEditPermission('company_settings') && (
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition-all flex items-center justify-end gap-2 pr-4 cursor-pointer"
                  >
                    حفظ وإشهار ومزامنة هويات الشركة
                    <Check className="w-4 h-4" />
                  </button>
                )}
              </form>
            </div>
          )}

          {/* B. USER ACCOUNTS MANAGER */}
          {activeTab === 'user_accounts' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 gap-2 flex-wrap">
                <button
                  onClick={() => openEditModal()}
                  className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  إضافة حساب مستخدم جديد
                </button>
                <div>
                  <h3 className="text-lg font-bold text-white font-sans">حوكمة الدخول وحسابات الشركاء</h3>
                  <p className="text-slate-400 text-xs">تعيين الرولات وقائمة الموظفين المصرح لهم بدخول المنصة الرقمية</p>
                </div>
              </div>

              {/* LIST USERS */}
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400">
                      <th className="p-3">اسم الموظف</th>
                      <th className="p-3 font-mono">البريد الإلكتروني</th>
                      <th className="p-3">دوره الإداري المالي</th>
                      <th className="p-3 flex justify-end">التحكم والإجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900">
                    {users.map(u => (
                      <tr key={u.uid} className="hover:bg-slate-900/30 transition-all">
                        <td className="p-3 font-bold text-white flex items-center gap-2">
                          <span className={`w-2.5 h-2.5 rounded-full ${u.email === 'mgc.air1@gmail.com' ? 'bg-sky-500 animate-pulse' : 'bg-slate-600'}`} />
                          {u.name}
                        </td>
                        <td className="p-3 font-mono text-slate-300">{u.email}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase ${
                            u.role === UserRole.SUPER_ADMIN ? 'bg-red-500/10 text-red-500 border border-red-500/30' :
                            u.role === UserRole.MANAGER ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/30' :
                            u.role === UserRole.ACCOUNTANT ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' :
                            (u.role as string) === 'hr' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/30' : 'bg-slate-800/80 text-slate-400'
                          }`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2 justify-end">
                            <button
                              onClick={() => openEditModal(u)}
                              className="p-1 px-2.5 hover:bg-slate-800 text-sky-400 rounded-md text-[10px] flex items-center gap-1 cursor-pointer"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              تعديل دورة الصلاحية
                            </button>
                            {u.email !== 'mgc.air1@gmail.com' && u.role !== UserRole.SUPER_ADMIN && (
                              <button
                                onClick={() => handleDeleteItem(u.uid)}
                                className="p-1 px-2 text-red-400 hover:bg-red-950/20 rounded-md cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* C. BACKUP AND FIREBASE IMPORT */}
          {activeTab === 'backup_restore' && (
            <div className="space-y-5">
              <div className="border-b border-slate-800 pb-3">
                <h3 className="text-lg font-bold text-white font-sans">تصدير واسترجاع ملفات الـ Firestore</h3>
                <p className="text-slate-400 text-xs">تحميل وتدبيج كامل قاعدة البيانات في ملف بجهازك للحفاظ على بيانات تكييف شركة M Group Cool</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 flex flex-col justify-between">
                  <div>
                    <h4 className="font-bold text-white text-sm mb-2">تصدير ملف المزامنة والنسخ الخارجي</h4>
                    <p className="text-slate-400 text-xs leading-relaxed">
                      ينصح محرك الرقابة بالاحتفاظ بملف المزامنة (JSON) بشكل دوري نهاية كل أسبوع كوقاية من أي حوادث.
                    </p>
                  </div>
                  <button
                    onClick={handleExportBackup}
                    className="w-full mt-4 flex items-center justify-center gap-2 py-2.5 bg-slate-800 hover:bg-slate-750 text-sky-400 rounded-xl text-xs font-semibold cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    تصدير وتحميل النسخة الاحتياطية
                  </button>
                </div>

                <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-3">
                  <h4 className="font-bold text-white text-sm">استرجاع وحقن الـ Firestore</h4>
                  <form onSubmit={handleImportBackup} className="space-y-3">
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">اختر ملف .json من جهازك:</label>
                      <input
                        type="file"
                        accept=".json"
                        ref={fileInputRef}
                        onChange={handleBackupFile}
                        className="w-full text-xs text-slate-300 bg-slate-950 p-2 border border-slate-800 rounded-xl cursor-pointer"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">أو الصق البيانات المشفرة هنا:</label>
                      <textarea
                        value={backupJson}
                        onChange={(e) => setBackupJson(e.target.value)}
                        placeholder='{"customers": [...], "orders": [...]}'
                        className="w-full h-16 bg-slate-950 border border-slate-850 rounded-xl p-2 text-[10px] text-left font-mono outline-none text-slate-400"
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full flex items-center justify-center gap-2 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold cursor-pointer"
                    >
                      <Upload className="w-4 h-4" />
                      رفع وحقن السيرفر
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* D. AUDIT LOGS DISPLAY */}
          {activeTab === 'audit_logs' && (
            <div className="space-y-5" id="security-biomarkers-auditing">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 gap-2 flex-wrap">
                <button
                  onClick={() => {
                    if (confirm('تنبيه: هل تود مسح أرشيف الرقابة بالكامل نهائياً؟')) {
                      updateSettings({ auditLogs: [] });
                      showSuccess('تم تفريغ الأرشيف الأمني بنجاح!');
                    }
                  }}
                  className="px-2.5 py-1 bg-red-950/40 hover:bg-red-900 text-red-300 rounded-lg text-[10px] border border-red-800/40 cursor-pointer"
                >
                  تفريغ أرشيف المراقبة
                </button>
                <div>
                  <h3 className="text-lg font-bold text-white font-sans">أرشيف رقابة النظم والأمن الحيوي للشركة</h3>
                  <p className="text-slate-400 text-xs">مستودع المراقبة الفنية لضبط حركة الموظفين ومحاسبة المستخدمين</p>
                </div>
              </div>

              {/* SEARCH INPUT */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="ابحث تصفية الحدث، اسم المنفذ للعملية (مثلاً: update, delete)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 px-4 text-xs text-white placeholder-slate-500 text-right"
                />
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
              </div>

              {/* LOGS LIST */}
              <div className="space-y-3 font-sans max-h-[450px] overflow-y-auto pr-1">
                {(settings.auditLogs || []).length === 0 ? (
                  <p className="text-center text-xs text-slate-500 py-10">دفتر المراقبة نظيف، لا حوادث مرورية مهددة!</p>
                ) : (
                  (settings.auditLogs || [])
                    .filter(log => 
                      log.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      log.userEmail.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .map(log => (
                      <div key={log.id} className="bg-slate-900/60 border border-slate-850 p-3 rounded-xl hover:bg-slate-900 transition-all text-xs space-y-2">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <span className="text-[10px] font-mono text-slate-500 font-semibold">{log.timestamp}</span>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded-md text-[9px] font-mono font-bold bg-slate-800 text-slate-400">ID: {log.entityId}</span>
                            <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold ${
                              log.action === 'CREATE' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                              log.action === 'UPDATE' ? 'bg-sky-500/10 text-sky-450 border border-sky-500/20' :
                              'bg-red-500/10 text-red-400 border border-red-500/20'
                            }`}>{log.action}</span>
                          </div>
                          <span className="font-bold text-white font-mono text-[10px]">{log.userEmail}</span>
                        </div>
                        <p className="text-slate-300 leading-normal text-[11px] bg-slate-950 p-2 rounded-lg font-mono border border-slate-900 break-words text-left dir-ltr">
                          {log.details}
                        </p>
                      </div>
                    ))
                )}
              </div>
            </div>
          )}

          {/* E. LIST VIEWS FOR MODULE 1-14 */}
          {![ 'company_settings', 'user_accounts', 'backup_restore', 'audit_logs' ].includes(activeTab) && (
            <div className="space-y-4">
              
              {/* FILTER / HEADER */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openEditModal()}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    إضافة عنصر جديد
                  </button>
                  {/* CSV Export/Print trigger */}
                  <button
                    onClick={() => window.print()}
                    className="p-1 px-2.5 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 rounded-xl text-[10px] font-bold"
                  >
                    طباعة / تقرير
                  </button>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white font-sans">إدارة كتل {activeTab.toUpperCase()}</h3>
                  <p className="text-slate-400 text-xs">قائمة السجلات وتخزين البيانات المتزامن مع السحابة</p>
                </div>
              </div>

              {/* SEARCH FILTER */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="ابحث لتصفية العناصر المعروضة بقاعدة البيانات الموقرة..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-xs text-white placeholder-slate-500 text-right"
                />
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3.5 top-3" />
              </div>

              {/* DYNAMIC DATA TABLE FOR THE MODULE */}
              <div className="overflow-x-auto">
                {itemsList.length === 0 ? (
                  <p className="text-center text-xs text-slate-500 py-10">لا تحوي قاعدة البيانات أي سجلات متطابقة!</p>
                ) : (
                  <table className="w-full text-right text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400 text-[10px]">
                        <th className="p-3">المعرف</th>
                        <th className="p-3">البيانات الفنية الأساسية</th>
                        <th className="p-3">تفاصيل إضافية</th>
                        <th className="p-3">الحالة / الرصيد</th>
                        <th className="p-3 flex justify-end">التحكم والإجراءات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-900">
                      {itemsList.map((item: any, idx: number) => {
                        const keyId = item.id || item.uid || item.contractNumber || item.invoiceNumber || `ITEM-${idx}`;
                        return (
                          <tr key={keyId} className="hover:bg-slate-900/20 transition-all">
                            <td className="p-3 font-mono text-[10px] text-slate-500 font-bold">{keyId}</td>
                            
                            {/* TD 2: Core Details based on Tab */}
                            <td className="p-3">
                              {activeTab === 'customers' && (
                                <div>
                                  <p className="font-bold text-white">{item.name}</p>
                                  <p className="text-slate-400 font-mono text-[10px]">{item.phone}</p>
                                </div>
                              )}
                              {activeTab === 'devices' && (
                                <div>
                                  <p className="font-bold text-white">{item.brand} - {item.modelType}</p>
                                  <p className="text-slate-400 font-sans text-[10px]">عميل: {getCustomerName(item.customerId)}</p>
                                </div>
                              )}
                              {activeTab === 'orders' && (
                                <div>
                                  <p className="font-bold text-white">{item.serviceType}</p>
                                  <p className="text-slate-400 text-[10px]">عميل: {getCustomerName(item.customerId)}</p>
                                </div>
                              )}
                              {activeTab === 'contracts' && (
                                <div>
                                  <p className="font-bold text-white">زيارات سنوية: {item.visitsScheduled}</p>
                                  <p className="text-slate-400 text-[10px]">عميل: {getCustomerName(item.customerId)}</p>
                                </div>
                              )}
                              {activeTab === 'quotations' && (
                                <div>
                                  <p className="font-bold text-sky-400">عرض سعر صيانة</p>
                                  <p className="text-slate-400 text-[10px]">عميل: {getCustomerName(item.customerId)}</p>
                                </div>
                              )}
                              {activeTab === 'invoices' && (
                                <div>
                                  <p className="font-bold text-white">{item.type === 'tax_invoice' ? 'فاتورة ضريبية' : 'فاتورة مبسطة'}</p>
                                  <p className="text-slate-400 text-[10px]">عميل: {getCustomerName(item.customerId)}</p>
                                </div>
                              )}
                              {activeTab === 'payments' && (
                                <div>
                                  <p className="font-bold text-white">دفعة استلام مالي: {item.amount} ج.م</p>
                                  <p className="text-slate-400 font-mono text-[10px]">سداد لفاتورة: {item.invoiceId}</p>
                                </div>
                              )}
                              {activeTab === 'expenses' && (
                                <div>
                                  <p className="font-bold text-white">{item.category}</p>
                                  <p className="text-slate-450 text-[10px]">{item.notes}</p>
                                </div>
                              )}
                              {activeTab === 'inventory' && (
                                <div>
                                  <p className="font-bold text-white">{item.name}</p>
                                  <p className="text-slate-400 font-mono text-[10px]">{item.sku} [فئة: {item.category}]</p>
                                </div>
                              )}
                              {activeTab === 'suppliers' && (
                                <div>
                                  <p className="font-bold text-white">{item.name}</p>
                                  <p className="text-slate-400 text-[10px]">المسئول: {item.contactName}</p>
                                </div>
                              )}
                              {activeTab === 'employees' && (
                                <div>
                                  <p className="font-bold text-white">{item.name}</p>
                                  <p className="text-slate-400 text-[10px]">{item.position}</p>
                                </div>
                              )}
                              {activeTab === 'attendance' && (
                                <div>
                                  <p className="font-bold text-white">{getEmployeeName(item.employeeId)}</p>
                                  <p className="text-slate-400 text-[10px]">حضور بتاريخ: {item.date}</p>
                                </div>
                              )}
                              {activeTab === 'technicians' && (
                                <div>
                                  <p className="font-bold text-white">{item.name}</p>
                                  <p className="text-sky-400 text-[10px] font-semibold">{item.position}</p>
                                </div>
                              )}
                            </td>

                            {/* TD 3: Secondary Details */}
                            <td className="p-3 text-slate-400">
                              {activeTab === 'customers' && <span className="font-sans text-[10px]">{item.governorate} - {item.region}</span>}
                              {activeTab === 'devices' && <span className="text-[10px]">{item.capacity} | الموديل: {item.modelType}</span>}
                              {activeTab === 'orders' && <span className="text-[10px]">فني: {getEmployeeName(item.assignedTo)}</span>}
                              {activeTab === 'contracts' && <span className="text-[10px]">{item.startDate} إلى {item.endDate}</span>}
                              {(activeTab === 'quotations' || activeTab === 'invoices') && (
                                <span className="font-mono text-[11px] text-sky-400 font-bold">{item.totalAmount} ج.م</span>
                              )}
                              {activeTab === 'payments' && <span className="text-[10px]">{item.paymentType} | تاريخ: {item.paymentDate}</span>}
                              {activeTab === 'expenses' && <span className="text-[10px]">{item.date} | سداد: {item.paymentMethod}</span>}
                              {activeTab === 'inventory' && <span className="text-[10px]">{item.price} ج.م للبيع | وحدة: {item.unit}</span>}
                              {activeTab === 'suppliers' && <span className="text-[10px] font-mono">{item.phone}</span>}
                              {activeTab === 'employees' && <span className="text-[10px]">تاريخ التعيين: {item.hireDate}</span>}
                              {activeTab === 'attendance' && <span className="text-[10px]">ساعات المأموية: {item.workingHours} س | إضافي: {item.overtimeHours} س</span>}
                              {activeTab === 'technicians' && <span className="text-[10px]">الراتب الأساسي: {item.salary} ج.م</span>}
                            </td>

                            {/* TD 4: State statuses */}
                            <td className="p-3">
                              {activeTab === 'customers' && (
                                <span className="px-2 py-0.5 rounded-md text-[9px] bg-slate-800 text-slate-300 font-semibold">{item.customerSource}</span>
                              )}
                              {activeTab === 'devices' && (
                                <span className="text-[10px] font-mono font-bold text-slate-400">{item.installationDate || 'غير مسجل'}</span>
                              )}
                              {activeTab === 'orders' && (
                                <span className={`px-2 py-0.5 rounded-md text-[9px] font-semibold ${
                                  item.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                  item.status === 'in_progress' ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20' :
                                  'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                                }`}>{item.status}</span>
                              )}
                              {activeTab === 'contracts' && (
                                <span className={`px-2 py-0.5 rounded-md text-[9px] font-semibold ${item.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-slate-400'}`}>{item.status}</span>
                              )}
                              {(activeTab === 'quotations' || activeTab === 'invoices') && (
                                <span className={`px-2 py-0.5 rounded-md text-[9px] font-semibold ${
                                  item.status === 'paid' ? 'bg-emerald-500/10 text-emerald-400' :
                                  item.status === 'partially_paid' ? 'bg-sky-500/10 text-sky-400' : 'bg-red-500/10 text-red-400'
                                }`}>{item.status}</span>
                              )}
                              {activeTab === 'payments' && <span className="text-[10px] text-slate-500 font-sans">{item.notes || 'لا توجد ملاحظات'}</span>}
                              {activeTab === 'expenses' && <span className="font-mono text-[11px] text-red-400 font-bold">{item.amount} ج.م</span>}
                              {activeTab === 'inventory' && (
                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold font-mono ${item.quantity <= item.reorderLevel ? 'bg-red-500/20 text-red-500 animate-pulse' : 'bg-slate-800 text-sky-400'}`}>{item.quantity} وحدة</span>
                              )}
                              {activeTab === 'suppliers' && <span className="font-mono font-bold text-sky-400">{item.balance} ج.م</span>}
                              {activeTab === 'employees' && <span className="font-mono font-bold text-slate-300">{item.salary} ج.م</span>}
                              {activeTab === 'attendance' && (
                                <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                                  item.status === 'present' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                                }`}>{item.status}</span>
                              )}
                              {activeTab === 'technicians' && (
                                <span className="text-[10px] text-sky-400 font-bold pl-2">مفعل</span>
                              )}
                            </td>

                            {/* TD 5: Action controllers */}
                            <td className="p-3">
                              <div className="flex items-center gap-2.5 justify-end">
                                <button
                                  onClick={() => openEditModal(item)}
                                  className="p-1 px-2.5 hover:bg-slate-800 text-sky-400 rounded-md text-[10px] flex items-center gap-1 cursor-pointer"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                  تعديل
                                </button>
                                {hasDeletePermission(activeTab) && (
                                  <button
                                    onClick={() => handleDeleteItem(keyId)}
                                    className="p-1 px-1.5 text-red-400 hover:bg-red-950/20 rounded-md cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}
        </section>
      </div>

      {/* MONOLITHIC MODAL DIALOG: For all Edits & Additions */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 text-right overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 lg:w-3/5 md:w-4/5 w-full rounded-2xl max-h-[90vh] overflow-y-auto p-6 space-y-4">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 gap-2">
              <button 
                onClick={() => setIsEditModalOpen(false)}
                className="p-1.5 bg-slate-850 hover:bg-slate-800 text-slate-400 rounded-lg hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
              <h3 className="text-md font-bold text-white font-sans">
                {addMode ? 'إضافة سجل جديد' : 'تعديل وحفظ بيانات السجل'} | موديول: {editingItemType?.toUpperCase()}
              </h3>
            </div>

            <form onSubmit={handleSaveItem} className="space-y-4">
              
              {/* CUSTOMERS FORM FIELDS */}
              {editingItemType === 'customers' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">اسم العميل التفصيلي (عربي)</label>
                    <input
                      type="text"
                      required
                      value={formData.name || ''}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 p-2 text-xs rounded-xl text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">رقم الهاتف الأساسي</label>
                    <input
                      type="text"
                      required
                      value={formData.phone || ''}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 p-2 text-xs rounded-xl text-white uppercase font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">الهاتف الثاني / الخط الاحتياطي</label>
                    <input
                      type="text"
                      value={formData.phone2 || ''}
                      onChange={(e) => setFormData({ ...formData, phone2: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 p-2 text-xs rounded-xl text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">البريد الإلكتروني للعميل</label>
                    <input
                      type="email"
                      value={formData.email || ''}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 p-2 text-xs rounded-xl text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">المكعب السكني / المنطقة</label>
                    <input
                      type="text"
                      value={formData.region || ''}
                      onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 p-2 text-xs rounded-xl text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">العنوان التفصيلي ومكان المعاينة</label>
                    <input
                      type="text"
                      value={formData.address || ''}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 p-2 text-xs rounded-xl text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">المصدر التسويقي</label>
                    <input
                      type="text"
                      value={formData.customerSource || 'مباشر'}
                      onChange={(e) => setFormData({ ...formData, customerSource: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 p-2 text-xs rounded-xl text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">ملاحظات وطلبات خاصة</label>
                    <textarea
                      value={formData.notes || ''}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 p-2 text-xs rounded-xl text-white"
                    />
                  </div>
                </div>
              )}

              {/* DEVICES FORM FIELDS */}
              {editingItemType === 'devices' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">اختر العميل المصاحب</label>
                    <select
                      value={formData.customerId || ''}
                      onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 p-2 text-xs rounded-xl text-white"
                    >
                      {customers.map(c => (
                        <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">براند التكييف (الشركة المصنعة)</label>
                    <input
                      type="text"
                      required
                      value={formData.brand || ''}
                      onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 p-2 text-xs rounded-xl text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">طراز التكييف (مثلاً: حائطى، كونسيلد)</label>
                    <input
                      type="text"
                      value={formData.modelType || ''}
                      onChange={(e) => setFormData({ ...formData, modelType: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 p-2 text-xs rounded-xl text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">القدرة للتبريد (مثلاً: 1.5 حصان، 3 حصان)</label>
                    <input
                      type="text"
                      value={formData.capacity || ''}
                      onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 p-2 text-xs rounded-xl text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">تاريخ التركيب الأساسي</label>
                    <input
                      type="text"
                      placeholder="DD/MM/YYYY"
                      value={formData.installationDate || ''}
                      onChange={(e) => setFormData({ ...formData, installationDate: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 p-2 text-xs rounded-xl text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">ملاحظات فنية (مثل حالة كويل المروحة)</label>
                    <textarea
                      value={formData.notes || ''}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 p-2 text-xs rounded-xl text-white"
                    />
                  </div>
                </div>
              )}

              {/* WORK ORDERS FORM FIELDS */}
              {editingItemType === 'orders' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">العميل</label>
                    <select
                      value={formData.customerId || ''}
                      onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 p-2 text-xs rounded-xl text-white"
                    >
                      {customers.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">تكييف العميل الملحق المطلوب صيانته</label>
                    <select
                      value={formData.deviceId || ''}
                      onChange={(e) => setFormData({ ...formData, deviceId: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 p-2 text-xs rounded-xl text-white"
                    >
                      {devices.filter(d => d.customerId === formData.customerId).map(d => (
                        <option key={d.id} value={d.id}>{d.brand} [{d.capacity}]</option>
                      ))}
                      <option value="تكييف عام">تكييف عام / جهاز آخر</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">اسم المهمة المطلوبة لغسيل وشحن</label>
                    <input
                      type="text"
                      required
                      value={formData.serviceType || ''}
                      onChange={(e) => setFormData({ ...formData, serviceType: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 p-2 text-xs rounded-xl text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">الفني المسؤول الميداني</label>
                    <select
                      value={formData.assignedTo || ''}
                      onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 p-2 text-xs rounded-xl text-white"
                    >
                      {employees.map(e => (
                        <option key={e.id} value={e.id}>{e.name} [{e.jobTitle}]</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">قيمة الفاتورة المطلوبة (ج.م)</label>
                    <input
                      type="number"
                      value={formData.cost || 0}
                      onChange={(e) => setFormData({ ...formData, cost: Number(e.target.value) })}
                      className="w-full bg-slate-950 border border-slate-800 p-2 text-xs rounded-xl text-white font-mono text-center"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">المبلغ المحصل فعلياً (ج.م)</label>
                    <input
                      type="number"
                      value={formData.collectionAmount || 0}
                      onChange={(e) => setFormData({ ...formData, collectionAmount: Number(e.target.value) })}
                      className="w-full bg-slate-950 border border-slate-800 p-2 text-xs rounded-xl text-white font-mono text-center"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">حالة أمر المأمورية الفنية</label>
                    <select
                      value={formData.status || 'pending'}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                      className="w-full bg-slate-950 border border-slate-800 p-2 text-xs rounded-xl text-white"
                    >
                      <option value="pending">انتظار المراجعة (Pending)</option>
                      <option value="in_progress">قيد التنفيذ (In Progress)</option>
                      <option value="completed">تم التنفيذ والاستلام المالي (Completed)</option>
                      <option value="cancelled">مُلغى (Cancelled)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">تقرير الصيانة للفني</label>
                    <textarea
                      value={formData.notes || ''}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 p-2 text-xs rounded-xl text-white"
                    />
                  </div>
                </div>
              )}

              {/* CONTRACTS FORM FIELDS */}
              {editingItemType === 'contracts' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">العميل المستفيد</label>
                    <select
                      value={formData.customerId || ''}
                      onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 p-2 text-xs rounded-xl text-white"
                    >
                      {customers.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">بدء تاريخ العقد السنوي</label>
                    <input
                      type="text"
                      placeholder="DD/MM/YYYY"
                      value={formData.startDate || ''}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 p-2 text-xs rounded-xl text-white font-mono text-center"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">نهو تاريخ العقد السنوي</label>
                    <input
                      type="text"
                      placeholder="DD/MM/YYYY"
                      value={formData.endDate || ''}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 p-2 text-xs rounded-xl text-white font-mono text-center"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">القيمة الإجمالية للعقد (ج.م)</label>
                    <input
                      type="number"
                      value={formData.annualPrice || 0}
                      onChange={(e) => setFormData({ ...formData, annualPrice: Number(e.target.value) })}
                      className="w-full bg-slate-950 border border-slate-800 p-2 text-xs rounded-xl text-white font-mono text-center"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">الزيارات المستهدفة سنوياً</label>
                    <input
                      type="number"
                      value={formData.visitsScheduled || 4}
                      onChange={(e) => setFormData({ ...formData, visitsScheduled: Number(e.target.value) })}
                      className="w-full bg-slate-950 border border-slate-800 p-2 text-xs rounded-xl text-white font-mono text-center"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">حالة العقد</label>
                    <select
                      value={formData.status || 'active'}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                      className="w-full bg-slate-950 border border-slate-800 p-2 text-xs rounded-xl text-white"
                    >
                      <option value="active">سائر ومفعّل (Active)</option>
                      <option value="expired">منقضي الصلاحية (Expired)</option>
                    </select>
                  </div>
                </div>
              )}

              {/* QUOTATIONS & INVOICES FORM FIELDS */}
              {(editingItemType === 'quotations' || editingItemType === 'invoices') && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">المستفيد</label>
                    <select
                      value={formData.customerId || ''}
                      onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 p-2 text-xs rounded-xl text-white"
                    >
                      {customers.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">رتبة ونوع الملف</label>
                    <select
                      value={formData.type || 'invoice'}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                      className="w-full bg-slate-950 border border-slate-800 p-2 text-xs rounded-xl text-white"
                    >
                      <option value="quote">عرض سعر وصيانة مبدئي (Quote)</option>
                      <option value="invoice">فاتورة تشغيل عادية (Invoice)</option>
                      <option value="tax_invoice">فاتورة ضريبية رسمية للشركات (Tax Invoice)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">قيمة الأعمال الأساسية (المبلغ قبل الضريبة)</label>
                    <input
                      type="number"
                      value={formData.subtotal || 0}
                      onChange={(e) => {
                        const sub = Number(e.target.value);
                        setFormData({ ...formData, subtotal: sub });
                      }}
                      className="w-full bg-slate-950 border border-slate-800 p-2 text-xs rounded-xl text-white font-mono text-center"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">معدل الضريبة المحتسبة (%)</label>
                    <input
                      type="number"
                      value={formData.vatRate || 14}
                      onChange={(e) => setFormData({ ...formData, vatRate: Number(e.target.value) })}
                      className="w-full bg-slate-950 border border-slate-800 p-2 text-xs rounded-xl text-white font-mono text-center"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">حالة السداد الفاتورية</label>
                    <select
                      value={formData.status || 'unpaid'}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                      className="w-full bg-slate-950 border border-slate-800 p-2 text-xs rounded-xl text-white"
                    >
                      <option value="unpaid">غير معتمد الدفع (Unpaid)</option>
                      <option value="partially_paid">مسدد جزئياً (Partially Paid)</option>
                      <option value="paid">مسدد بالكامل بخزينة الشركة (Paid)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">شرح السلعة / الخدمة</label>
                    <textarea
                      value={formData.notes || ''}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 p-2 text-xs rounded-xl text-white"
                    />
                  </div>
                </div>
              )}

              {/* PAYMENTS FORM FIELDS */}
              {editingItemType === 'payments' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">اختر الفاتورة المرتبطة بالتحصيل المالي</label>
                    <select
                      value={formData.invoiceId || ''}
                      onChange={(e) => setFormData({ ...formData, invoiceId: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 p-2 text-xs rounded-xl text-white font-mono"
                    >
                      {invoices.map(i => (
                        <option key={i.invoiceNumber} value={i.invoiceNumber}>{i.invoiceNumber} (عميل: {getCustomerName(i.customerId)} - القيمة: {i.totalAmount})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">اختر العميل المودع</label>
                    <select
                      value={formData.customerId || ''}
                      onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 p-2 text-xs rounded-xl text-white"
                    >
                      {customers.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">المبلغ المودع المحصّل (ج.م)</label>
                    <input
                      type="number"
                      required
                      value={formData.amount || 0}
                      onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                      className="w-full bg-slate-950 border border-slate-800 p-2 text-xs rounded-xl text-white font-mono text-center"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">طريقة الإيداع والاستلام</label>
                    <select
                      value={formData.paymentType || 'نقدي'}
                      onChange={(e) => setFormData({ ...formData, paymentType: e.target.value as any })}
                      className="w-full bg-slate-950 border border-slate-800 p-2 text-xs rounded-xl text-white"
                    >
                      <option value="نقدي">نقدي عبر خزينة المكتب (Cash)</option>
                      <option value="تحويل بنكي">تحويل بنكي سريع رسمي (Bank Transfer)</option>
                      <option value="شيك">شيك لآجل للتحصيل (Cheque)</option>
                      <option value="فودافون كاش">محفظة فودافون كاش (Vodafone Cash)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">ملاحظات التحصيل (مثل رقم المرجع)</label>
                    <textarea
                      value={formData.notes || ''}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 p-2 text-xs rounded-xl text-white"
                    />
                  </div>
                </div>
              )}

              {/* EXPENSES FORM FIELDS */}
              {editingItemType === 'expenses' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">فئة ومصروف التوريد</label>
                    <select
                      value={formData.category || 'مهمات ومواسير نحاس'}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 p-2 text-xs rounded-xl text-white"
                    >
                      <option value="مهمات ومواسير نحاس">مهمات ومواسير نحاس وفريون</option>
                      <option value="وقود وانتقالات وعربات الفنيين">وقود وانتقالات وعربات صيانة</option>
                      <option value="رواتب الموظفين والمكافآت">رواتب الموظفين والمهندسين</option>
                      <option value="إيجار الفروع وفاتورة الكهرباء">إيجار الفروع وفاتورة المرافق والإنترنت</option>
                      <option value="مشتريات تكييفات للعميل">مشتريات تكييفات (Carrier/Midea)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">المبلغ الإجمالي المنصرف (ج.م)</label>
                    <input
                      type="number"
                      required
                      value={formData.amount || 0}
                      onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                      className="w-full bg-slate-950 border border-slate-800 p-2 text-xs rounded-xl text-white font-mono text-center"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">تاريخ وقوع المصروف</label>
                    <input
                      type="text"
                      placeholder="DD/MM/YYYY"
                      value={formData.date || ''}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 p-2 text-xs rounded-xl text-white font-mono text-center"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">صندوق ومستودع الصرف</label>
                    <input
                      type="text"
                      value={formData.paymentMethod || 'خزينة الفرع'}
                      onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 p-2 text-xs rounded-xl text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">بيان وإيضاح المصروف التوريدي</label>
                    <textarea
                      value={formData.notes || ''}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 p-2 text-xs rounded-xl text-white"
                    />
                  </div>
                </div>
              )}

              {/* PRODUCTS / INVENTORY FORM FIELDS */}
              {editingItemType === 'inventory' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">اسم الصنف / قطع غيار التكييف</label>
                    <input
                      type="text"
                      required
                      value={formData.name || ''}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 p-2 text-xs rounded-xl text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">الباركود والموديل الفريد (SKU)</label>
                    <input
                      type="text"
                      required
                      value={formData.sku || ''}
                      onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 p-2 text-xs rounded-xl text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">فئة المخزن الرئيسي</label>
                    <select
                      value={formData.category || 'فريون'}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 p-2 text-xs rounded-xl text-white"
                    >
                      <option value="فريون">أسطوانة فريون (Freon R22/R410)</option>
                      <option value="قطع غيار">قطع غيار ومكثفات (Capacitors)</option>
                      <option value="أدوات ومواسير">مواسير نحاس وعزل (Copper pipes)</option>
                      <option value="فلاتر وتطهير">كيماويات وفلاتر تطهير</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">سعر بيع التوريد للعميل (ج.م)</label>
                    <input
                      type="number"
                      value={formData.price || 0}
                      onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                      className="w-full bg-slate-950 border border-slate-800 p-2 text-xs rounded-xl text-white font-mono text-center"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">تكلفة الشراء والجمارك (ج.م)</label>
                    <input
                      type="number"
                      value={formData.cost || 0}
                      onChange={(e) => setFormData({ ...formData, cost: Number(e.target.value) })}
                      className="w-full bg-slate-950 border border-slate-800 p-2 text-xs rounded-xl text-white font-mono text-center"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">الرصيد المتاح حالياً بالمخازن</label>
                    <input
                      type="number"
                      value={formData.quantity || 0}
                      onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                      className="w-full bg-slate-950 border border-slate-800 p-2 text-xs rounded-xl text-white font-mono text-center"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">وحدة الوزن الأصولية (مثل: كجم، كرتونة)</label>
                    <input
                      type="text"
                      value={formData.unit || 'وحدة'}
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 p-2 text-xs rounded-xl text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">الحد الحرج لإشعار النقص (Reorder)</label>
                    <input
                      type="number"
                      value={formData.reorderLevel || 5}
                      onChange={(e) => setFormData({ ...formData, reorderLevel: Number(e.target.value) })}
                      className="w-full bg-slate-950 border border-slate-800 p-2 text-xs rounded-xl text-white font-mono text-center"
                    />
                  </div>
                </div>
              )}

              {/* SUPPLIERS FORM FIELDS */}
              {editingItemType === 'suppliers' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">اسم المورد / المصنع</label>
                    <input
                      type="text"
                      required
                      value={formData.name || ''}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 p-2 text-xs rounded-xl text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">المندوب المسؤول للتسليم والمحاسبة</label>
                    <input
                      type="text"
                      value={formData.contactName || ''}
                      onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 p-2 text-xs rounded-xl text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">رقم هاتف المورد للمبيعات</label>
                    <input
                      type="text"
                      required
                      value={formData.phone || ''}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 p-2 text-xs rounded-xl text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">البريد الإلكتروني للطلبيات</label>
                    <input
                      type="email"
                      value={formData.email || ''}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 p-2 text-xs rounded-xl text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">مستحقات مالية للمورد (ج.م)</label>
                    <input
                      type="number"
                      value={formData.balance || 0}
                      onChange={(e) => setFormData({ ...formData, balance: Number(e.target.value) })}
                      className="w-full bg-slate-950 border border-slate-800 p-2 text-xs rounded-xl text-white font-mono text-center"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">العنوان والمقر والتنسيق المالي</label>
                    <textarea
                      value={formData.address || ''}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 p-2 text-xs rounded-xl text-white"
                    />
                  </div>
                </div>
              )}

              {/* EMPLOYEES & TECHNICIANS FORM FIELDS */}
              {(editingItemType === 'employees' || editingItemType === 'technicians') && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">اسم الموظف / الفني كاملاً</label>
                    <input
                      type="text"
                      required
                      value={formData.name || ''}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 p-2 text-xs rounded-xl text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">المسمى الوظيفي المالي</label>
                    <input
                      type="text"
                      required
                      value={formData.position || ''}
                      onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 p-2 text-xs rounded-xl text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">رقم الهاتف لسرعة تفعيل المأمورية</label>
                    <input
                      type="text"
                      required
                      value={formData.phone || ''}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 p-2 text-xs rounded-xl text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">الراتب الشهري الأساسي (ج.م)</label>
                    <input
                      type="number"
                      value={formData.salary || 3000}
                      onChange={(e) => setFormData({ ...formData, salary: Number(e.target.value) })}
                      className="w-full bg-slate-950 border border-slate-800 p-2 text-xs rounded-xl text-white font-mono text-center"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">حساب اليومية العادية للشغل الميداني</label>
                    <input
                      type="number"
                      value={formData.dailyRate || 120}
                      onChange={(e) => setFormData({ ...formData, dailyRate: Number(e.target.value) })}
                      className="w-full bg-slate-950 border border-slate-800 p-2 text-xs rounded-xl text-white font-mono text-center"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">سعر ساعة الإضافي (Overtime)</label>
                    <input
                      type="number"
                      value={formData.overtimeRate || 25}
                      onChange={(e) => setFormData({ ...formData, overtimeRate: Number(e.target.value) })}
                      className="w-full bg-slate-950 border border-slate-800 p-2 text-xs rounded-xl text-white font-mono text-center"
                    />
                  </div>
                </div>
              )}

              {/* ATTENDANCE FORM FIELDS */}
              {editingItemType === 'attendance' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">الفني / الموظف المعني بالدفتر</label>
                    <select
                      value={formData.employeeId || ''}
                      onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 p-2 text-xs rounded-xl text-white"
                    >
                      {employees.map(e => (
                        <option key={e.id} value={e.id}>{e.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">تاريخ اليوم المالي المعني</label>
                    <input
                      type="text"
                      placeholder="DD/MM/YYYY"
                      value={formData.date || ''}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 p-2 text-xs rounded-xl text-white font-mono text-center"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">حالة الحضور والانصراف السريعة</label>
                    <select
                      value={formData.status || 'present'}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                      className="w-full bg-slate-950 border border-slate-800 p-2 text-xs rounded-xl text-white"
                    >
                      <option value="present">حاضر ملبّي (Present)</option>
                      <option value="absent">غائب غير مبرر (Absent)</option>
                      <option value="vacation">أجازة رسمية مدفوعة (Vacation)</option>
                      <option value="holiday">عطلة وطنية (Holiday)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">ساعات العمل الفعلية للشركة</label>
                    <input
                      type="number"
                      value={formData.workingHours || 8}
                      onChange={(e) => setFormData({ ...formData, workingHours: Number(e.target.value) })}
                      className="w-full bg-slate-950 border border-slate-800 p-2 text-xs rounded-xl text-white font-mono text-center"
                    />
                  </div>
                </div>
              )}

              {/* USER ACCOUNTS CONFIG FORM */}
              {editingItemType === 'user_accounts' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">الاسم التعريفي للموظف</label>
                    <input
                      type="text"
                      required
                      value={formData.name || ''}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 p-2 text-xs rounded-xl text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">البريد الإلكتروني لدخول جوجل</label>
                    <input
                      type="email"
                      required
                      value={formData.email || ''}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 p-2 text-xs rounded-xl text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">الدور والصلاحيات الإدارية المطلقة</label>
                    <select
                      value={formData.role || UserRole.VIEWER}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                      className="w-full bg-slate-950 border border-slate-800 p-2 text-xs rounded-xl text-white"
                    >
                      <option value={UserRole.VIEWER}>مشاهد وقارئ تقارير فقط (Viewer)</option>
                      <option value={UserRole.TECHNICIAN}>فني تكييفات ميداني مأمورية (Technician)</option>
                      <option value={'hr'}>مدير علاقات وشئون موظفين ورواتب (HR)</option>
                      <option value={UserRole.ACCOUNTANT}>موجه مالي وحسابات ومصروفات (Accountant)</option>
                      <option value={UserRole.MANAGER}>حق مبيعات واستلام تشغيلي (Manager)</option>
                      <option value={UserRole.SUPER_ADMIN}>مشرف النظام العام المالي لـ M Group Cool (SUPER_ADMIN)</option>
                    </select>
                  </div>
                </div>
              )}

              <footer className="border-t border-slate-800 pt-3 flex items-center justify-end gap-3">
                <button
                  type="button" 
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 bg-slate-850 hover:bg-slate-800 text-slate-400 text-xs font-semibold rounded-xl cursor-pointer"
                >
                  إلغاء الأمر
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl cursor-pointer"
                >
                  حفظ في Firestore ومزامنة
                </button>
              </footer>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
