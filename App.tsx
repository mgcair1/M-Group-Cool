/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { dataService } from './dataService';
import { 
  Users, 
  Wrench, 
  FileText, 
  Calendar, 
  Layers, 
  Sparkles, 
  Settings, 
  LogOut, 
  Bell, 
  Lock, 
  Menu, 
  X, 
  Volume2, 
  VolumeX,
  Compass,
  AlertCircle,
  Chrome
} from 'lucide-react';

// Import sub-modules
import Dashboard from './components/Dashboard';
import CustomersModule from './components/CustomersModule';
import WorkOrdersModule from './components/WorkOrdersModule';
import InvoicesModule from './components/InvoicesModule';
import EmployeePayrollModule from './components/EmployeePayrollModule';
import InventoryModule from './components/InventoryModule';
import AiAssistantModule from './components/AiAssistantModule';
import SettingsBackupModule from './components/SettingsBackupModule';
import EnterprisePortal from './components/EnterprisePortal';
import MGroupCoolLogo from './components/MGroupCoolLogo';
import MGroupVoiceAssistant from './components/MGroupVoiceAssistant';
import SystemAdministration from './components/SystemAdministration';
import { TRANSLATIONS } from './translations';

export default function App() {
  
  // Realtime state observation hook
  const [state, setState] = useState({
    currentUser: dataService.getCurrentUser(),
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
    notifications: dataService.getNotifications(),
    settings: dataService.getSettings(),
    users: dataService.getUsers()
  });

  const [activeModule, setActiveModule] = useState<string>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsPanelOpen, setNotificationsPanelOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [voiceAssistantOpen, setVoiceAssistantOpen] = useState(false);
  const [currentVoiceTrigger, setCurrentVoiceTrigger] = useState<any>(null);

  const [syncPanelOpen, setSyncPanelOpen] = useState(false);
  const [pendingQueue, setPendingQueue] = useState<any[]>([]);

  useEffect(() => {
    const updateQueueDetails = async () => {
      const q = await dataService.getSyncQueue();
      setPendingQueue(q);
    };
    updateQueueDetails();
    const unsub = dataService.subscribe(() => {
      updateQueueDetails();
    });
    return () => unsub();
  }, []);

  const handleVoiceAction = (commandText: string, actionData: any) => {
    setActiveModule(actionData.module);
    setCurrentVoiceTrigger(actionData);
    // clear after 2 seconds to allow multiple triggers
    setTimeout(() => {
      setCurrentVoiceTrigger(null);
    }, 2000);
  };

  // Authentication states
  const [loginEmail, setLoginEmail] = useState('mgc.air1@gmail.com');
  const [loginPassword, setLoginPassword] = useState('00000000');
  const [newPassword, setNewPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Subscribe to raw data mutations (realtime connection sync alternative)
  useEffect(() => {
    const unsubscribe = dataService.subscribe(() => {
      setState({
        currentUser: dataService.getCurrentUser(),
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
        notifications: dataService.getNotifications(),
        settings: dataService.getSettings(),
        users: dataService.getUsers()
      });
    });
    return () => unsubscribe();
  }, []);

  const lang = state.settings.language || 'ar';
  const t = TRANSLATIONS[lang];
  const isRtl = lang === 'ar';

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    const result = dataService.login(loginEmail, loginPassword);
    if (!result.success) {
      setLoginError(result.error || 'عذرًا، خطأ بالتحقق من الحساب');
    }
  };

  const handlePasswordChangeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      alert("يرجى اختيار كلمة مرور قوية من 6 أحرف أو أرقام على الأقل لضمان متطلبات الحماية والتحصيلات!");
      return;
    }
    const success = dataService.changePassword(newPassword);
    if (success) {
      alert("تم تحديث وتفعيل كلمة المرور بنجاح! تم تنشيط حساب السوبر أدمن.");
      setNewPassword('');
    }
  };

  const totalProfits = state.payments.reduce((sum, p) => sum + p.amount, 0) - 
                        (state.expenses.reduce((sum, e) => sum + e.amount, 0) + 
                         state.orders.reduce((sum, o) => sum + (o.expenses || 0), 0));

  const isDark = state.settings.themeMode !== 'light';

  return (
    <div 
      className={`min-h-screen ${isDark ? 'dark bg-[#0f172a] text-slate-100' : 'bg-slate-50 text-slate-800'} flex flex-col font-sans select-none`} 
      dir={isRtl ? 'rtl' : 'ltr'} 
      id="mgroupcool-erp-app"
    >
      
      {/* 1. NOT LOGGED IN LOGIN SCREEN */}
      {!state.currentUser ? (
        <div className="flex-1 flex items-center justify-center p-5 min-h-screen" id="login-container">
          <form onSubmit={handleLogin} className={`w-full max-w-md p-8 ${isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-100 text-slate-800'} border rounded-3xl shadow-xl space-y-6 text-right`}>
            
            <div className="text-center space-y-4">
              <div className="flex justify-center mb-2">
                <MGroupCoolLogo size={120} variant="full" customLogoUrl={state.settings.logoLogin || state.settings.logoData} />
              </div>
              <h2 className={`text-2xl font-black ${isDark ? 'text-white' : 'text-slate-900'} font-sans`}>{state.settings.companyName}</h2>
              <p className="text-xs text-gray-400 font-sans">{t.login_subtitle}</p>
            </div>

            {loginError && (
              <div className="p-3 bg-red-50 text-red-700 rounded-xl text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <div>
              <label className={`block text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-600'} mb-1.5`}>{t.login_email}</label>
              <input
                type="email"
                required
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="mgc.air1@gmail.com"
                className={`w-full px-4 py-3 ${isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-100 text-slate-800'} border rounded-xl text-sm font-semibold outline-none focus:border-indigo-500 text-left font-mono`}
              />
            </div>

            <div>
              <label className={`block text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-600'} mb-1.5`}>{t.login_password}</label>
              <input
                type="password"
                required
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="00000000"
                className={`w-full px-4 py-3 ${isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-100 text-slate-800'} border rounded-xl text-sm outline-none focus:border-indigo-500 text-left font-mono`}
              />
              <span className="text-[10px] text-gray-400 mt-1 block">{t.login_help_text}</span>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-all cursor-pointer"
              id="submit-login-btn"
            >
              {t.login_btn}
            </button>

            {!dataService.isMock() && (
              <>
                <div className="relative flex py-2 items-center" id="divider-container">
                  <div className={`flex-grow border-t ${isDark ? 'border-slate-800' : 'border-slate-100'}`}></div>
                  <span className="flex-shrink mx-4 text-gray-400 text-[10px] font-bold font-sans">{t.login_divider}</span>
                  <div className={`flex-grow border-t ${isDark ? 'border-slate-800' : 'border-slate-100'}`}></div>
                </div>

                <button
                  type="button"
                  id="google-signin-btn"
                  onClick={async () => {
                    setLoginError('');
                    const res = await dataService.loginWithGoogle();
                    if (!res.success) {
                      setLoginError(res.error || 'عذرًا، فشل تسجيل الدخول بجوجل');
                    }
                  }}
                  className={`w-full py-3 ${isDark ? 'bg-slate-950 hover:bg-slate-9D border-slate-800 text-white' : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200'} border rounded-xl text-sm font-semibold transition-all cursor-pointer flex items-center justify-center gap-2`}
                >
                  <Chrome className="w-5 h-5 text-red-500" />
                  <span className="font-sans">تسجيل الدخول المستمر عبر Google</span>
                </button>
              </>
            )}
          </form>
        </div>
      ) : (
        
        /* 2. CHOOSE TO FORCE PASSWORD CHANGE ON FIRST LOGIN REGISTERED IN INSTRUCTIONS */
        state.currentUser.needsPasswordChange ? (
          <div className="flex-1 flex items-center justify-center p-5 min-h-screen" id="password-change-container">
            <form onSubmit={handlePasswordChangeSubmit} className="w-full max-w-md p-8 bg-white border border-gray-100 rounded-3xl shadow-xl space-y-6 text-right">
              
              <div className="text-center space-y-2">
                <span className="inline-flex p-4 bg-amber-50 text-amber-600 rounded-2xl">
                  <Lock className="w-8 h-8 animate-pulse" />
                </span>
                <h2 className="text-xl font-bold text-slate-900 font-sans">تحديث كلمة مرور المشرف العام</h2>
                <p className="text-xs text-gray-500 leading-relaxed font-sans">
                  من أجل توفير متطلبات حماية الخزينة وصافي أرباح شركة تكييف وصيانة M Group Cool، يرجى كتابة وتحديث كلمة المرور الجديدة لتجاوز كود المصنع الافتراضي (00000000).
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">كلمة المرور المحمية الجديدة</label>
                <input
                  type="password"
                  required
                  placeholder="عشرة أحرف أو أرقام على الأقل..."
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm outline-none focus:border-primary text-left font-mono"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition-colors cursor-pointer"
              >
                تنشيط وتفعيل حماية النظام
              </button>
            </form>
          </div>
        ) : (
          
          /* 3. COMPLETE ERP CRM WORKSPACE */
          <div className="flex-1 flex flex-col md:flex-row print:bg-white" id="erp-workspace">
            
            {/* RTL Sidebar layout */}
            <aside className={`w-full md:w-64 bg-slate-900 text-slate-300 flex-shrink-0 flex flex-col justify-between p-4 border-l border-slate-800 print:hidden ${mobileMenuOpen ? 'block' : 'hidden md:flex'}`}>
              <div className="space-y-6">
                
                {/* Letters label */}
                <div className={`flex items-center justify-between pb-4 ${isDark ? 'border-slate-800' : 'border-slate-200'} border-b`}>
                  <div className={`flex items-center gap-2.5 ${isRtl ? 'text-right' : 'text-left'}`}>
                    <div className="flex-shrink-0">
                      <MGroupCoolLogo size={36} variant="icon" customLogoUrl={state.settings.logoData} />
                    </div>
                    <div>
                      <h3 className={`font-extrabold ${isDark ? 'text-white' : 'text-slate-900'} text-xs font-sans tracking-wide`}>{state.settings.companyName}</h3>
                      <p className="text-[9px] text-gray-400 font-sans">{lang === 'ar' ? 'تكييف ومقاولات وصيانة' : 'HVAC contracting & repairs'}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setMobileMenuOpen(false)}
                    className="md:hidden p-1 bg-slate-800 text-gray-400 rounded-lg hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Sidebar Navigation */}
                <nav className="space-y-1 text-xs">
                  
                  <button
                    onClick={() => { setActiveModule('dashboard'); setMobileMenuOpen(false); }}
                    className={`w-full flex items-center justify-start gap-3 px-4 py-3 rounded-xl font-bold transition-all cursor-pointer ${activeModule === 'dashboard' ? 'bg-indigo-600 text-white shadow-xs' : 'hover:bg-white/5 text-slate-400'}`}
                  >
                    <span className="w-4"><Compass className="w-4 h-4" /></span>
                    {t.dashboard}
                  </button>

                  <button
                    onClick={() => { setActiveModule('customers'); setMobileMenuOpen(false); }}
                    className={`w-full flex items-center justify-start gap-3 px-4 py-3 rounded-xl font-bold transition-all cursor-pointer ${activeModule === 'customers' ? 'bg-indigo-600 text-white shadow-xs' : 'hover:bg-white/5 text-slate-400'}`}
                  >
                    <span className="w-4"><Users className="w-4 h-4" /></span>
                    {state.settings.customNames && (lang === 'ar' ? state.settings.customNames.customers_ar : state.settings.customNames.customers_en) || t.customers}
                  </button>

                  <button
                    onClick={() => { setActiveModule('orders'); setMobileMenuOpen(false); }}
                    className={`w-full flex items-center justify-start gap-3 px-4 py-3 rounded-xl font-bold transition-all cursor-pointer ${activeModule === 'orders' ? 'bg-indigo-600 text-white shadow-xs' : 'hover:bg-white/5 text-slate-400'}`}
                  >
                    <span className="w-4"><Wrench className="w-4 h-4" /></span>
                    {state.settings.customNames && (lang === 'ar' ? state.settings.customNames.orders_ar : state.settings.customNames.orders_en) || t.orders}
                  </button>

                  <button
                    onClick={() => { setActiveModule('invoices'); setMobileMenuOpen(false); }}
                    className={`w-full flex items-center justify-start gap-3 px-4 py-3 rounded-xl font-bold transition-all cursor-pointer ${activeModule === 'invoices' ? 'bg-indigo-600 text-white shadow-xs' : 'hover:bg-white/5 text-slate-400'}`}
                  >
                    <span className="w-4"><FileText className="w-4 h-4" /></span>
                    {state.settings.customNames && (lang === 'ar' ? state.settings.customNames.invoices_ar : state.settings.customNames.invoices_en) || t.invoices}
                  </button>

                  <button
                    onClick={() => { setActiveModule('payroll'); setMobileMenuOpen(false); }}
                    className={`w-full flex items-center justify-start gap-3 px-4 py-3 rounded-xl font-bold transition-all cursor-pointer ${activeModule === 'payroll' ? 'bg-indigo-600 text-white shadow-xs' : 'hover:bg-white/5 text-slate-400'}`}
                  >
                    <span className="w-4"><Calendar className="w-4 h-4" /></span>
                    {state.settings.customNames && (lang === 'ar' ? state.settings.customNames.payroll_ar : state.settings.customNames.payroll_en) || t.payroll}
                  </button>

                  <button
                    onClick={() => { setActiveModule('inventory'); setMobileMenuOpen(false); }}
                    className={`w-full flex items-center justify-start gap-3 px-4 py-3 rounded-xl font-bold transition-all cursor-pointer ${activeModule === 'inventory' ? 'bg-indigo-600 text-white shadow-xs' : 'hover:bg-white/5 text-slate-400'}`}
                  >
                    <span className="w-4"><Layers className="w-4 h-4" /></span>
                    {state.settings.customNames && (lang === 'ar' ? state.settings.customNames.inventory_ar : state.settings.customNames.inventory_en) || t.inventory}
                  </button>

                  <button
                    onClick={() => { setActiveModule('enterprise_portal'); setMobileMenuOpen(false); }}
                    className={`w-full flex items-center justify-start gap-3 px-4 py-3 rounded-xl font-bold transition-all cursor-pointer ${activeModule === 'enterprise_portal' ? 'bg-indigo-600 text-white shadow-md' : 'hover:bg-white/5 text-slate-400'}`}
                  >
                    <span className="w-4"><Settings className="w-4 h-4" /></span>
                    {lang === 'ar' ? 'بوابة التشغيل الشاملة' : 'Operations Portal'}
                  </button>

                  <button
                    onClick={() => { setActiveModule('ai_assistant'); setMobileMenuOpen(false); }}
                    className={`w-full flex items-center justify-start gap-3 px-4 py-3 rounded-xl font-bold transition-all cursor-pointer ${activeModule === 'ai_assistant' ? 'bg-indigo-600 text-white shadow-xs animate-pulse' : 'hover:bg-white/5 text-slate-450 text-sky-400'}`}
                  >
                    <span className="w-4"><Sparkles className="w-4 h-4 text-sky-400" /></span>
                    {t.ai_assistant}
                  </button>

                  <button
                    onClick={() => { setActiveModule('settings'); setMobileMenuOpen(false); }}
                    className={`w-full flex items-center justify-start gap-3 px-4 py-3 rounded-xl font-bold transition-all cursor-pointer ${activeModule === 'settings' ? 'bg-indigo-600 text-white shadow-xs' : 'hover:bg-white/5 text-slate-400'}`}
                  >
                    <span className="w-4"><Settings className="w-4 h-4" /></span>
                    {t.settings}
                  </button>

                  {['SUPER_ADMIN', 'MANAGER'].includes(state.currentUser?.role || '') && (
                    <button
                      onClick={() => { setActiveModule('system_admin'); setMobileMenuOpen(false); }}
                      className={`w-full flex items-center justify-start gap-3 px-4 py-3 rounded-xl font-bold transition-all cursor-pointer ${activeModule === 'system_admin' ? 'bg-indigo-600 text-white shadow-lg animate-pulse' : 'hover:bg-white/5 text-sky-400 bg-sky-500/5'}`}
                    >
                      <span className="w-4"><Lock className="w-4 h-4 text-sky-400" /></span>
                      <span className="text-sky-350 text-xs font-black">حوكمة وإدارة النظام (١٤ موديول)</span>
                    </button>
                  )}

                </nav>
              </div>

              {/* Sidebar Logout bottom section */}
              <div className="pt-6 border-t border-slate-800 text-xs">
                <div className="flex items-center justify-between mb-4">
                  <div className="rtl:text-right text-slate-400">
                    <span className="block font-bold text-white text-[11px] font-sans">الإدارة العامة</span>
                    <span className="text-[10px] font-mono text-slate-500">mgc.air1@gmail.com</span>
                  </div>
                </div>
                <button
                  onClick={() => dataService.logout()}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-red-500/10 hover:bg-red-500 hover:text-white text-red-400 rounded-xl font-bold transition-all cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  تسجيل خروج آمن
                </button>
              </div>
            </aside>

            {/* Main content viewport */}
            <main className="flex-1 flex flex-col min-w-0 font-sans print:p-0">
              
              {/* Header bar */}
              <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6 flex-shrink-0 print:hidden">
                <div className="flex gap-3 items-center">
                  <button 
                    onClick={() => setMobileMenuOpen(true)}
                    className="md:hidden p-2 text-slate-600 bg-slate-50 border rounded-lg hover:bg-slate-100"
                  >
                    <Menu className="w-5 h-5" />
                  </button>

                  {/* Offline-First Sync Status Pill Indicator */}
                  <div className="relative">
                    <button
                      onClick={() => setSyncPanelOpen(!syncPanelOpen)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold font-sans cursor-pointer transition-all duration-300 ${
                        dataService.getSyncStatus() === 'offline' 
                          ? 'bg-rose-50 text-rose-700 border border-rose-100'
                          : dataService.getSyncStatus() === 'syncing'
                          ? 'bg-amber-50 text-amber-700 border border-amber-100 animate-pulse'
                          : dataService.getSyncStatus() === 'synced'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                          : 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${
                        dataService.getSyncStatus() === 'offline' 
                          ? 'bg-rose-600 animate-pulse'
                          : dataService.getSyncStatus() === 'syncing'
                          ? 'bg-amber-500 animate-ping'
                          : dataService.getSyncStatus() === 'synced'
                          ? 'bg-emerald-600'
                          : 'bg-green-500'
                      }`} />
                      
                      <span>
                        {dataService.getSyncStatus() === 'offline' && (lang === 'ar' ? 'غير متصل (Offline)' : 'Offline')}
                        {dataService.getSyncStatus() === 'syncing' && (lang === 'ar' ? `مزامنة... (${pendingQueue.length})` : `Syncing... (${pendingQueue.length})`)}
                        {dataService.getSyncStatus() === 'synced' && (lang === 'ar' ? 'تمت المزامنة بنجاح (Synced)' : 'Synced & Saved')}
                        {dataService.getSyncStatus() === 'online' && (lang === 'ar' ? 'متصل (Online)' : 'Online')}
                      </span>
                    </button>

                    {syncPanelOpen && (
                      <div className={`absolute ${isRtl ? 'right-0' : 'left-0'} mt-2 w-80 bg-white border border-gray-100 rounded-2xl shadow-xl z-50 text-right py-3 px-4 space-y-3`}>
                        <div className="flex items-center justify-between border-b pb-2">
                          <button
                            onClick={() => {
                              dataService.processSyncQueue();
                              setSyncPanelOpen(false);
                            }}
                            className="px-2.5 py-1 bg-indigo-600 text-white rounded-lg text-[10px] hover:bg-indigo-700 font-bold transition-all cursor-pointer"
                          >
                            مزامنة الآن (Sync)
                          </button>
                          <span className="font-bold text-xs text-slate-800">قائمة العمليات معلقة ({pendingQueue.length})</span>
                        </div>
                        
                        <div className="max-h-48 overflow-y-auto divide-y divide-slate-50 text-xs">
                          {pendingQueue.length > 0 ? (
                            <div className="space-y-1.5 py-1.5 text-[11px]">
                              <p className="text-[10px] text-amber-600 leading-relaxed mb-2">
                                هذه التعديلات تم حفظها محلياً وبأمان في غلاف خارجي IndexedDB وسترفع لقاعدة البيانات فور توفر الاتصال.
                              </p>
                              {pendingQueue.slice(0, 5).map((item: any, idx: number) => (
                                <div key={idx} className="flex justify-between items-center text-[10px] py-1 text-slate-600 border-b border-slate-50">
                                  <span className={`px-1.5 py-0.5 rounded text-[8px] font-mono font-bold ${item.operation === 'DELETE' ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'}`}>
                                    {item.operation === 'DELETE' ? 'حذف (DEL)' : 'حفظ (PUT)'}
                                  </span>
                                  <span className="font-mono text-left truncate max-w-[150px] font-semibold text-gray-500" dir="ltr">
                                    {item.path}
                                  </span>
                                </div>
                              ))}
                              {pendingQueue.length > 5 && (
                                <p className="text-center text-[9px] text-slate-400 py-1 font-semibold">... و {pendingQueue.length - 5} عمليات أخرى معلقة</p>
                              )}
                            </div>
                          ) : (
                            <div className="py-4 text-center">
                              <p className="text-slate-500 text-[10px]">قاعدة البيانات السحابية مطابقة ومحدثة بالكامل.</p>
                              <p className="text-[9px] text-gray-400 mt-1">نظام تخطيط موارد M Group Cool CRM آمن وغير متصل.</p>
                            </div>
                          )}
                        </div>
                        
                        <div className="text-[9px] border-t pt-2 text-gray-400 flex justify-between items-center bg-slate-50/50 -mx-4 -mb-3 px-4 py-2">
                          <span>IndexedDB Persistent API: <strong className="text-emerald-600 font-bold">Active</strong></span>
                          <span>Timestamp Resolve: Latest Wins</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right side notification badge, sound, and brand indicators */}
                <div className="flex items-center gap-4">
                  
                  {/* Sound on/off controls */}
                  <button
                    onClick={() => setSoundEnabled(!soundEnabled)}
                    className="p-2 hover:bg-slate-50 rounded-xl text-gray-500 hover:text-slate-800 transition-colors"
                  >
                    {soundEnabled ? <Volume2 className="w-5 h-5 text-sky-500" /> : <VolumeX className="w-5 h-5 text-gray-400" />}
                  </button>

                  {/* Notifications alerts popup */}
                  <div className="relative">
                    <button
                      onClick={() => setNotificationsPanelOpen(!notificationsPanelOpen)}
                      className="p-2 hover:bg-slate-50 rounded-xl text-gray-500 hover:text-slate-800 transition-colors relative cursor-pointer"
                    >
                      <Bell className="w-5 h-5" />
                      {state.notifications.filter(n => !n.read).length > 0 && (
                        <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse" />
                      )}
                    </button>

                    {/* Notifications Panel Box */}
                    {notificationsPanelOpen && (
                      <div className="absolute left-0 mt-2 w-80 bg-white border border-gray-100 rounded-2xl shadow-xl z-50 text-right py-2 overflow-hidden">
                        <div className="px-4 py-2 border-b border-slate-50 flex items-center justify-between">
                          <button 
                            onClick={() => dataService.clearAllNotifications()}
                            className="text-[10px] text-red-500 hover:underline cursor-pointer"
                          >
                            مسح الكل
                          </button>
                          <span className="font-bold text-xs text-slate-800">منبهات غسيل التكييف والحصيلات</span>
                        </div>
                        
                        <div className="max-h-72 overflow-y-auto divide-y divide-slate-50">
                          {state.notifications.length > 0 ? (
                            state.notifications.map(n => (
                              <div 
                                key={n.id} 
                                className={`p-3 text-xs space-y-1 cursor-pointer transition-colors ${n.read ? 'bg-white' : 'bg-sky-50/50 hover:bg-sky-50'}`}
                                onClick={() => {
                                  dataService.markNotificationRead(n.id);
                                  setNotificationsPanelOpen(false);
                                }}
                              >
                                <div className="flex items-center justify-between">
                                  <span className="text-[9px] text-gray-400 font-mono">{n.date}</span>
                                  <strong className="text-slate-800 font-sans block">{n.title}</strong>
                                </div>
                                <p className="text-slate-500 leading-normal">{n.body}</p>
                              </div>
                            ))
                          ) : (
                            <p className="py-6 text-center text-gray-400 text-[10px]">لا توجد منبهات أو تحصيلات قيد المتابعة حالياً.</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="h-4 w-px bg-slate-200" />
                  
                  {/* Local date/time marker */}
                  <span className="text-xs font-mono text-gray-500 hidden sm:inline">31/05/2026</span>
                </div>
              </header>

              {/* Modular Views */}
              <div className="flex-1 overflow-y-auto p-6 print:p-0">
                {activeModule === 'dashboard' && (
                  <Dashboard
                    customers={state.customers}
                    orders={state.orders}
                    invoices={state.invoices}
                    expenses={state.expenses}
                    payments={state.payments}
                    contracts={state.contracts}
                    onNavigate={(mId) => setActiveModule(mId)}
                  />
                )}

                {activeModule === 'customers' && (
                  <CustomersModule
                    customers={state.customers}
                    devices={state.devices}
                    onAddCustomer={(data) => dataService.addCustomer(data)}
                    onUpdateCustomer={(id, data) => dataService.updateCustomer(id, data)}
                    onDeleteCustomer={(id) => dataService.deleteCustomer(id)}
                    onAddDevice={(data) => dataService.addDevice(data)}
                    onDeleteDevice={(id) => dataService.deleteDevice(id)}
                    orders={state.orders}
                    invoices={state.invoices}
                    payments={state.payments}
                    contracts={state.contracts}
                    voiceTrigger={currentVoiceTrigger}
                    lang={lang}
                  />
                )}

                {activeModule === 'orders' && (
                  <WorkOrdersModule
                    orders={state.orders}
                    customers={state.customers}
                    devices={state.devices}
                    employees={state.employees}
                    onAddOrder={(data) => dataService.addOrder(data)}
                    onUpdateOrder={(id, data) => dataService.updateOrder(id, data)}
                    onDeleteOrder={(id) => dataService.deleteOrder(id)}
                    voiceTrigger={currentVoiceTrigger}
                  />
                )}

                {activeModule === 'invoices' && (
                  <InvoicesModule
                    invoices={state.invoices}
                    customers={state.customers}
                    onAddInvoice={(data) => dataService.addInvoice(data)}
                    onUpdateInvoice={(id, data) => dataService.updateInvoice(id, data)}
                    onDeleteInvoice={(id) => dataService.deleteInvoice(id)}
                    settings={state.settings}
                    voiceTrigger={currentVoiceTrigger}
                    onAddOrder={(data) => dataService.addOrder(data)}
                    updateSettings={(data) => dataService.updateSettings(data)}
                  />
                )}

                {activeModule === 'payroll' && (
                  <EmployeePayrollModule
                    employees={state.employees}
                    attendance={state.attendance}
                    onAddEmployee={(data) => dataService.addEmployee(data)}
                    onAddAttendance={(data) => dataService.addAttendance(data)}
                    totalCompanyProfits={totalProfits}
                  />
                )}

                {activeModule === 'inventory' && (
                  <InventoryModule
                    products={state.products}
                    suppliers={state.suppliers}
                    onAddProduct={(data) => dataService.addProduct(data)}
                    onUpdateProduct={(id, data) => dataService.updateProduct(id, data)}
                    onDeleteProduct={(id) => dataService.deleteProduct(id)}
                    onAddSupplier={(data) => dataService.addSupplier(data)}
                    onDeleteSupplier={(id) => dataService.deleteSupplier(id)}
                    settings={state.settings}
                    updateSettings={(data) => dataService.updateSettings(data)}
                  />
                )}

                {activeModule === 'enterprise_portal' && (
                  <EnterprisePortal
                    settings={state.settings}
                    updateSettings={(data) => dataService.updateSettings(data)}
                    customers={state.customers}
                    devices={state.devices}
                    orders={state.orders}
                    invoices={state.invoices}
                    employees={state.employees}
                    onAddOrder={(data) => dataService.addOrder(data)}
                    onUpdateOrder={(id, data) => dataService.updateOrder(id, data)}
                    onAddCustomer={(data) => dataService.addCustomer(data)}
                  />
                )}

                {activeModule === 'ai_assistant' && (
                  <AiAssistantModule 
                    stateContext={{
                      customers: state.customers,
                      orders: state.orders,
                      invoices: state.invoices,
                      expenses: state.expenses,
                      payments: state.payments,
                      contracts: state.contracts,
                      employees: state.employees,
                      products: state.products,
                      suppliers: state.suppliers
                    }}
                  />
                )}

                {activeModule === 'settings' && (
                  <SettingsBackupModule
                    onExportBackup={() => dataService.exportBackup()}
                    onImportBackup={(jsonStr) => dataService.importBackup(jsonStr)}
                    onResetDatabase={() => localStorage.removeItem('mgroupcool_erp_state')}
                  />
                )}

                {activeModule === 'system_admin' && (
                  <SystemAdministration
                    currentUser={state.currentUser!}
                    customers={state.customers}
                    devices={state.devices}
                    orders={state.orders}
                    contracts={state.contracts}
                    invoices={state.invoices}
                    payments={state.payments}
                    expenses={state.expenses}
                    products={state.products}
                    suppliers={state.suppliers}
                    employees={state.employees}
                    attendance={state.attendance}
                    users={state.users || []}
                    settings={state.settings}
                    updateSettings={(data) => dataService.updateSettings(data)}
                  />
                )}
              </div>

              {/* Floating M Group Voice Control Orb */}
              <div className="fixed bottom-6 left-6 z-50 print:hidden">
                <button
                  type="button"
                  onClick={() => setVoiceAssistantOpen(!voiceAssistantOpen)}
                  className="flex items-center gap-2 p-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-2xl transition-all duration-300 scale-100 hover:scale-110 cursor-pointer border border-indigo-400 group"
                >
                  <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-500 text-xs font-black whitespace-nowrap pl-0 group-hover:pl-1">
                    {lang === 'ar' ? 'المساعد الصوتي المساعد' : 'Smart Voice Assistant'}
                  </span>
                  <span className="relative flex h-6 w-6 items-center justify-center">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-60"></span>
                    <span className="relative inline-flex rounded-full bg-indigo-600 p-1">
                      🗣️
                    </span>
                  </span>
                </button>

                {voiceAssistantOpen && (
                  <div className="absolute bottom-16 left-0 w-[320px] sm:w-[420px] max-w-lg z-50">
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setVoiceAssistantOpen(false)}
                        className="absolute top-4 left-4 text-gray-400 hover:text-gray-650 font-extrabold text-sm z-50 bg-slate-100 p-1 px-2 rounded-full cursor-pointer"
                      >
                        ✕
                      </button>
                      <MGroupVoiceAssistant lang={lang} onExecuteCommand={handleVoiceAction} />
                    </div>
                  </div>
                )}
              </div>

            </main>

          </div>
        )

      )}

    </div>
  );
}
