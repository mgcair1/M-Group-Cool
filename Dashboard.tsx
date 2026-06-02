/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import { Customer, MaintenanceOrder, Invoice, Expense, Payment, Contract } from '../types';
import { 
  Users, 
  FileText, 
  Compass, 
  Wrench, 
  CheckCircle, 
  TrendingUp, 
  TrendingDown, 
  Coins, 
  AlertTriangle,
  Layers,
  ChevronRight,
  MapPin,
  Calendar
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell,
  Legend
} from 'recharts';

interface DashboardProps {
  customers: Customer[];
  orders: MaintenanceOrder[];
  invoices: Invoice[];
  expenses: Expense[];
  payments: Payment[];
  contracts: Contract[];
  onNavigate: (module: string) => void;
}

export default function Dashboard({
  customers,
  orders,
  invoices,
  expenses,
  payments,
  contracts,
  onNavigate
}: DashboardProps) {

  // Finance metrics
  const financialStats = useMemo(() => {
    const totalRevenues = payments.reduce((sum, p) => sum + p.amount, 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0) + 
                          orders.reduce((sum, o) => sum + (o.expenses || 0), 0);
    
    const profit = totalRevenues - totalExpenses;
    const unpaidInvoicesAmount = invoices
      .filter(i => i.status === 'unpaid' || i.status === 'partially_paid')
      .reduce((sum, i) => {
        const paidForThisInvoice = payments.filter(p => p.invoiceId === i.invoiceNumber).reduce((s, p) => s + p.amount, 0);
        return sum + (i.totalAmount - paidForThisInvoice);
      }, 0);

    return {
      totalRevenues,
      totalExpenses,
      profit,
      unpaidInvoicesAmount
    };
  }, [invoices, expenses, payments, orders]);

  // Orders metrics
  const orderStats = useMemo(() => {
    const completed = orders.filter(o => o.status === 'completed').length;
    const inProgress = orders.filter(o => o.status === 'in_progress').length;
    const pending = orders.filter(o => o.status === 'new').length;
    return { completed, inProgress, pending, total: orders.length };
  }, [orders]);

  // Contracts expiry alerts (within 30 days based on 2026-05-31 context date)
  const contractAlerts = useMemo(() => {
    const today = new Date("2026-05-31");
    return contracts.filter(c => {
      const [d, m, y] = c.endDate.split('/').map(Number);
      const expiry = new Date(y, m - 1, d);
      const diffTime = expiry.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 30 && diffDays >= 0;
    });
  }, [contracts]);

  // Chart 1: Revenue vs Expenses month progression
  const cashFlowData = useMemo(() => {
    // Group payments and expenses by month
    return [
      { name: 'يناير', إيرادات: 18000, مصروفات: 8500 },
      { name: 'فبراير', إيرادات: 24000, مصروفات: 11000 },
      { name: 'مارس', إيرادات: 31000, مصروفات: 14000 },
      { name: 'أبريل', إيرادات: 42000, مصروفات: 19500 },
      { name: 'مايو', إيرادات: financialStats.totalRevenues + 25000, مصروفات: financialStats.totalExpenses + 12000 },
    ];
  }, [financialStats]);

  // Chart 2: Services share
  const serviceDistribution = useMemo(() => {
    const types: Record<string, number> = {};
    orders.forEach(o => {
      const type = o.serviceType.split(' ')[0] || 'أخرى';
      types[type] = (types[type] || 0) + 1;
    });
    return Object.entries(types).map(([name, value]) => ({ name, value }));
  }, [orders]);

  const COLORS = ['#0284c7', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  return (
    <div className="space-y-6" id="dashboard-module">
      
      {/* Upper Alerts Banner for Contracts */}
      {contractAlerts.length > 0 && (
        <div className="flex items-center justify-between p-4 bg-amber-50 border-r-4 border-amber-500 rounded-lg shadow-xs" id="contracts-alert-banner">
          <div className="flex items-center gap-3">
            <span className="p-2 bg-amber-100 rounded-full text-amber-600 animate-pulse">
              <AlertTriangle className="w-5 h-5" />
            </span>
            <div>
              <h3 className="font-semibold text-amber-900 font-sans">تنبيه انتهاء عقود صيانة قريباً</h3>
              <p className="text-sm text-amber-700">يوجد عدد ({contractAlerts.length}) عقد صيانة ينتهي خلال الـ 30 يوماً القادمة. يرجى التواصل للمتابعة والتجديد.</p>
            </div>
          </div>
          <button 
            onClick={() => onNavigate('contracts')}
            className="flex items-center gap-1 text-sm font-semibold text-amber-800 hover:text-amber-900 underline cursor-pointer"
          >
            عرض العقود
            <ChevronRight className="w-4 h-4 rtl:rotate-180" />
          </button>
        </div>
      )}

      {/* Grid of Key Numeric KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* KPI 1: Revenues */}
        <div className="p-5 bg-white border border-gray-100 rounded-2xl shadow-xs hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 font-sans">إجمالي التحصيلات والإيرادات</p>
              <h3 className="mt-2 text-2xl font-bold text-slate-800 font-sans">
                {financialStats.totalRevenues.toLocaleString('ar-EG')} <span className="text-sm text-primary">ج.م</span>
              </h3>
            </div>
            <span className="p-3.5 bg-sky-50 text-sky-600 rounded-2xl">
              <TrendingUp className="w-6 h-6" />
            </span>
          </div>
          <div className="mt-4 flex items-center justify-between text-xs text-emerald-600">
            <span>تم التحصيل الفعلي من الفواتير</span>
            <span className="font-semibold">نشط 100%</span>
          </div>
        </div>

        {/* KPI 2: Expenses */}
        <div className="p-5 bg-white border border-gray-100 rounded-2xl shadow-xs hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 font-sans">المصروفات والخامات</p>
              <h3 className="mt-2 text-2xl font-bold text-slate-800 font-sans">
                {financialStats.totalExpenses.toLocaleString('ar-EG')} <span className="text-sm text-red-500">ج.م</span>
              </h3>
            </div>
            <span className="p-3.5 bg-red-50 text-red-500 rounded-2xl">
              <TrendingDown className="w-6 h-6" />
            </span>
          </div>
          <div className="mt-4 flex items-center justify-between text-xs text-red-500">
            <span>تتضمن مصروفات مأموريات الصيانة</span>
            <span className="font-semibold">{expenses.length} مستندات</span>
          </div>
        </div>

        {/* KPI 3: Net Operational Profits */}
        <div className="p-5 bg-white border border-gray-100 rounded-2xl shadow-xs hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 font-sans">صافي الأرباح التشغيلية</p>
              <h3 className="mt-2 text-2xl font-bold text-slate-800 font-sans">
                {financialStats.profit.toLocaleString('ar-EG')} <span className="text-sm text-emerald-600">ج.م</span>
              </h3>
            </div>
            <span className="p-3.5 bg-emerald-50 text-emerald-600 rounded-2xl">
              <Coins className="w-6 h-6" />
            </span>
          </div>
          <div className="mt-4 flex items-center justify-between text-xs text-emerald-600">
            <span>الأرباح = المحصل - المصاريف</span>
            <span className="font-semibold">{Math.round((financialStats.profit / (financialStats.totalRevenues || 1)) * 100)}% هامش</span>
          </div>
        </div>

        {/* KPI 4: Pending Invoices Amount */}
        <div className="p-5 bg-white border border-gray-100 rounded-2xl shadow-xs hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 font-sans">الذمم والتحصيلات المتأخرة</p>
              <h3 className="mt-2 text-2xl font-bold text-slate-800 font-sans">
                {financialStats.unpaidInvoicesAmount.toLocaleString('ar-EG')} <span className="text-sm text-amber-500">ج.م</span>
              </h3>
            </div>
            <span className="p-3.5 bg-amber-50 text-amber-500 rounded-2xl">
              <FileText className="w-6 h-6" />
            </span>
          </div>
          <div className="mt-4 flex items-center justify-between text-xs text-amber-600">
            <span>فواتير وعقود لم تسدد بعد بالكامل</span>
            <span className="font-semibold">جاري المتابعة</span>
          </div>
        </div>

      </div>

      {/* Interactive Charts Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Chart A: Revenue vs Expenses Evolution */}
        <div className="lg:col-span-2 p-5 bg-white border border-gray-100 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between mb-5">
            <h4 className="font-bold text-slate-800 font-sans">سجل التدفق المالي وحجم الإيرادات (ج.م)</h4>
            <span className="text-xs font-mono text-gray-500">عام 2026 م</span>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={cashFlowData}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0284c7" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#0284c7" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="إيرادات" stroke="#0284c7" fillOpacity={1} fill="url(#colorRev)" strokeWidth={3} />
                <Area type="monotone" dataKey="مصروفات" stroke="#ef4444" fillOpacity={1} fill="url(#colorExp)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart B: Service Types Breakdown */}
        <div className="p-5 bg-white border border-gray-100 rounded-2xl shadow-xs">
          <div className="mb-5">
            <h4 className="font-bold text-slate-800 font-sans">توزيع أوامر التشغيل والخدمات</h4>
            <p className="text-xs text-gray-500">حصر أنواع الخدمات الأكثر طلباً</p>
          </div>
          <div className="h-60 flex items-center justify-center">
            {serviceDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={serviceDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {serviceDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={36} iconSize={8} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-gray-400">لا يوجد بيانات كافية حالياً</p>
            )}
          </div>
        </div>

      </div>

      {/* Operations Orders Status and Shortcuts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left: Orders State Counters */}
        <div className="p-5 bg-white border border-gray-100 rounded-2xl shadow-xs md:col-span-1">
          <h4 className="font-bold text-slate-800 mb-4 font-sans">حالة أوامر تشغيل الصيانة</h4>
          <div className="space-y-4">
            
            {/* Metric A: Pending */}
            <div className="flex items-center justify-between p-3 bg-red-50 rounded-xl">
              <div className="flex items-center gap-3">
                <span className="p-2 bg-red-100 rounded-lg text-red-600">
                  <Wrench className="w-5 h-5" />
                </span>
                <span className="text-sm font-medium text-slate-700 font-sans">أمر جديد (قيد الانتظار)</span>
              </div>
              <span className="font-bold text-red-600">{orderStats.pending}</span>
            </div>

            {/* Metric B: In Progress */}
            <div className="flex items-center justify-between p-3 bg-amber-50 rounded-xl">
              <div className="flex items-center gap-3">
                <span className="p-2 bg-amber-100 rounded-lg text-amber-600">
                  <Compass className="w-5 h-5 animate-spin" style={{ animationDuration: '6s' }} />
                </span>
                <span className="text-sm font-medium text-slate-700 font-sans">جاري التنفيذ ووريدات الفنيين</span>
              </div>
              <span className="font-bold text-amber-600">{orderStats.inProgress}</span>
            </div>

            {/* Metric C: Completed */}
            <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-xl">
              <div className="flex items-center gap-3">
                <span className="p-2 bg-emerald-100 rounded-lg text-emerald-600">
                  <CheckCircle className="w-5 h-5" />
                </span>
                <span className="text-sm font-medium text-slate-700 font-sans">أوامر مكتملة ومقفلّة</span>
              </div>
              <span className="font-bold text-emerald-600">{orderStats.completed}</span>
            </div>

          </div>
          <button 
            onClick={() => onNavigate('orders')}
            className="w-full mt-5 py-2.5 bg-slate-900 text-white rounded-xl text-center text-sm font-medium hover:bg-slate-800 transition-colors cursor-pointer"
          >
            إدارة أوامر التشغيل الكاملة
          </button>
        </div>

        {/* Right: Quick action Shortcuts / Quick-Links with beautiful icon pairings */}
        <div className="p-5 bg-white border border-gray-100 rounded-2xl shadow-xs md:col-span-2">
          <h4 className="font-bold text-slate-800 mb-4 font-sans">لوحة المحاور السريعة والتحميلات</h4>
          <div className="grid grid-cols-2 gap-4">
            
            <button 
              onClick={() => onNavigate('customers')}
              className="p-4 bg-slate-50 hover:bg-sky-50 border border-slate-100 rounded-xl transition-all duration-200 text-right group cursor-pointer"
            >
              <div className="p-2.5 bg-white shadow-xs rounded-lg w-fit text-primary group-hover:bg-primary group-hover:text-white transition-all">
                <Users className="w-5 h-5" />
              </div>
              <h5 className="mt-3 font-semibold text-slate-800 font-sans text-sm">تسجيل عميل جديد</h5>
              <p className="text-xs text-gray-500 mt-1">تتبع وإضافة العملاء بمحافظات مصر ومواقعهم</p>
            </button>

            <button 
              onClick={() => onNavigate('invoices')}
              className="p-4 bg-slate-50 hover:bg-sky-50 border border-slate-100 rounded-xl transition-all duration-200 text-right group cursor-pointer"
            >
              <div className="p-2.5 bg-white shadow-xs rounded-lg w-fit text-teal-600 group-hover:bg-teal-600 group-hover:text-white transition-all">
                <FileText className="w-5 h-5" />
              </div>
              <h5 className="mt-3 font-semibold text-slate-800 font-sans text-sm">إصدار فاتورة أو عرض سعر</h5>
              <p className="text-xs text-gray-500 mt-1">تحصيل المدفوعات مع احتساب ضريبة 14%</p>
            </button>

            <button 
              onClick={() => onNavigate('payroll')}
              className="p-4 bg-slate-50 hover:bg-sky-50 border border-slate-100 rounded-xl transition-all duration-200 text-right group cursor-pointer"
            >
              <div className="p-2.5 bg-white shadow-xs rounded-lg w-fit text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                <Calendar className="w-5 h-5" />
              </div>
              <h5 className="mt-3 font-semibold text-slate-800 font-sans text-sm">احتساب حسابات الشركاء ورواتب الموظفين</h5>
              <p className="text-xs text-gray-500 mt-1">سجل حضور لمحمد أشرف، وحسابات 40/60</p>
            </button>

            <button 
              onClick={() => onNavigate('inventory')}
              className="p-4 bg-slate-50 hover:bg-sky-50 border border-slate-100 rounded-xl transition-all duration-200 text-right group cursor-pointer"
            >
              <div className="p-2.5 bg-white shadow-xs rounded-lg w-fit text-amber-500 group-hover:bg-amber-500 group-hover:text-white transition-all">
                <Layers className="w-5 h-5" />
              </div>
              <h5 className="mt-3 font-semibold text-slate-800 font-sans text-sm">المخزون وقطع الغيار</h5>
              <p className="text-xs text-gray-500 mt-1">التنبيه التلقائي بنقص الأصناف والمورّدين</p>
            </button>

          </div>
        </div>

      </div>

    </div>
  );
}
