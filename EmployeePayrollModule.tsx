/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Employee, AttendanceRecord } from '../types';
import { 
  Users, 
  Plus, 
  Calendar, 
  CheckCircle, 
  XSquare, 
  TrendingUp,
  Percent,
  Coins,
  DollarSign,
  Briefcase,
  Layers,
  Sparkles
} from 'lucide-react';

interface EmployeePayrollModuleProps {
  employees: Employee[];
  attendance: AttendanceRecord[];
  onAddEmployee: (data: Omit<Employee, 'id'>) => Employee;
  onAddAttendance: (data: Omit<AttendanceRecord, 'id'>) => AttendanceRecord;
  totalCompanyProfits: number; // passed down from database stats
}

export default function EmployeePayrollModule({
  employees,
  attendance,
  onAddEmployee,
  onAddAttendance,
  totalCompanyProfits
}: EmployeePayrollModuleProps) {

  // State
  const [activeTab, setActiveTab] = useState<'employees' | 'attendance' | 'partnership'>('employees');
  
  // New Employee state variables
  const [name, setName] = useState('');
  const [jobTitle, setJobTitle] = useState('فني تكييف أول');
  const [phone, setPhone] = useState('');
  const [baseSalary, setBaseSalary] = useState<number>(10000);
  const [commissionRate, setCommissionRate] = useState<number>(10); // 10%
  const [role, setRole] = useState<'admin' | 'technician' | 'assistant'>('technician');

  // Attendance builder state
  const [attendanceDate, setAttendanceDate] = useState('31/05/2026');
  const [selectedEmpId, setSelectedEmpId] = useState('');
  const [attendanceStatus, setAttendanceStatus] = useState<'present' | 'absent' | 'excused'>('present');
  const [checkIn, setCheckIn] = useState('09:00');
  const [checkOut, setCheckOut] = useState('19:00');
  const [isFridayOvertime, setIsFridayOvertime] = useState(false);

  // Partnership settings
  const [partnerRatio, setPartnerRatio] = useState<number>(40); // default 40/60 distribution

  const handleSaveEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) {
      alert("يرجى ملء اسم الموظف ورقم هاتفه الخلوي!");
      return;
    }

    onAddEmployee({
      name,
      jobTitle,
      phone,
      baseSalary,
      commissionRate,
      role
    });

    // Reset Form
    setName('');
    setPhone('');
    setBaseSalary(10000);
    setCommissionRate(10);
    alert("تم تسجيل المشتعل بنجاح ونقله إلى كشف الرواتب التلقائي!");
  };

  const handleSaveAttendance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmpId) {
      alert("برجاء تحديد الموظف لصياغة الحضور!");
      return;
    }

    onAddAttendance({
      employeeId: selectedEmpId,
      date: attendanceDate,
      status: attendanceStatus,
      checkIn: attendanceStatus === 'present' ? checkIn : undefined,
      checkOut: attendanceStatus === 'present' ? checkOut : undefined,
      isFridayOvertime
    });

    alert("تم تسجيل الدفعة اليومية لسجل الحضور بنجاح!");
  };

  // Automated custom payroll calculation for each employee
  const payrollList = useMemo(() => {
    return (employees || []).map(emp => {
      // Calculate employee-specific attendance
      const records = (attendance || []).filter(r => r.employeeId === emp.id);
      const presentDays = records.filter(r => r.status === 'present').length;
      const absentDays = records.filter(r => r.status === 'absent').length;
      
      // Friday counts as 2 days bonus
      const fridayBonusCount = records.filter(r => r.status === 'present' && r.isFridayOvertime).length;
      
      const effectiveDays = presentDays + fridayBonusCount; // Friday counts double

      // Standardize 26 working days in Egypt payroll
      // Fallback to `salary` field for legacy / mock data that doesn't use baseSalary
      const salary = Number(emp.baseSalary ?? emp.salary ?? 0);
      const dayRate = salary > 0 ? salary / 26 : 0;
      const computedBase = Math.round(dayRate * effectiveDays);

      // Bonuses and penalties simulation
      const bonusPay = fridayBonusCount * Math.round(dayRate * 2); // 2x rate for Friday working hours
      const deductionPay = absentDays * Math.round(dayRate);

      const netSalary = Math.max(0, salary + bonusPay - deductionPay);

      return {
        ...emp,
        // Normalized fields so the UI never sees undefined
        baseSalary: salary,
        commissionRate: Number(emp.commissionRate ?? 0),
        presentDays,
        absentDays,
        fridayBonusCount,
        effectiveDays,
        bonusPay,
        deductionPay,
        netSalary
      };
    });
  }, [employees, attendance]);

  // Partnership share totals
  const partnershipShare = useMemo(() => {
    const profits = Number(totalCompanyProfits || 0);
    const mainPartnerShare = Math.round(profits * (partnerRatio / 100));
    const secondaryPartnerShare = profits - mainPartnerShare;
    return {
      mainPartner: mainPartnerShare,
      secondaryPartner: secondaryPartnerShare
    };
  }, [totalCompanyProfits, partnerRatio]);

  return (
    <div className="space-y-6" id="payroll-module">
      
      {/* Top tabs */}
      <div className="flex border-b border-gray-100 bg-white p-2 rounded-2xl shadow-xs gap-2">
        <button
          onClick={() => setActiveTab('employees')}
          className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors cursor-pointer ${activeTab === 'employees' ? 'bg-sky-50 text-sky-700' : 'text-gray-600 hover:bg-gray-50'}`}
        >
          شؤون الموظفين والرواتب التشغيلية
        </button>
        <button
          onClick={() => setActiveTab('attendance')}
          className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors cursor-pointer ${activeTab === 'attendance' ? 'bg-sky-50 text-sky-700' : 'text-gray-600 hover:bg-gray-50'}`}
        >
          حصر الحضور وانصراف الفنيين
        </button>
        <button
          onClick={() => setActiveTab('partnership')}
          className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors cursor-pointer ${activeTab === 'partnership' ? 'bg-sky-50 text-sky-700' : 'text-gray-600 hover:bg-gray-50'}`}
        >
          توزيع أرباح الشركاء 40/60
        </button>
      </div>

      {activeTab === 'employees' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-right">
          
          {/* Left panel: Employee List & Salaries */}
          <div className="lg:col-span-2 space-y-5">
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-4">
              <div>
                <h4 className="font-bold text-slate-800 text-lg">كشف رواتب وحوافز موظفي M Group Cool</h4>
                <p className="text-xs text-gray-400 mt-1">يحتسب تلقائياً الخصومات، أيام الحضور، وساعات الإضافي الخاصة بأيام الجمعة بمقدار الضعف</p>
              </div>

              <div className="space-y-4">
                {payrollList.map(emp => (
                  <div key={emp.id} className="p-4 bg-slate-50 border border-slate-100 rounded-xl relative overflow-hidden">
                    
                    {/* Specific highlighting for Mohamed Ashraf */}
                    {emp.id === 'EMP-001' && (
                      <span className="absolute left-0 top-0 bg-sky-500 text-white text-[10px] font-bold px-3 py-1 font-sans rounded-br-lg animate-pulse block">
                        الفني المتميز والنظام المندمج
                      </span>
                    )}

                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div className="flex gap-3 items-center">
                        <span className="p-2.5 bg-white text-slate-700 rounded-lg shadow-2xs font-mono font-bold text-xs">
                          {emp.id}
                        </span>
                        <div>
                          <h5 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                            {emp.name}
                            <span className="text-xs font-medium text-sky-600 px-1.5 py-0.2 bg-sky-50 rounded">
                              {emp.jobTitle}
                            </span>
                          </h5>
                          <span className="font-mono text-xs text-gray-400">هاتف: {emp.phone}</span>
                        </div>
                      </div>

                      {/* Calculations view */}
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                        <div>الراتب الأساسي: <strong className="text-slate-800">{(emp.baseSalary ?? 0).toLocaleString('ar-EG')} ج.م</strong></div>
                        <div>العمولة المقررة: <strong className="text-slate-800">{(emp.commissionRate ?? 0)}%</strong></div>
                        <div>حضور: <strong className="text-emerald-600">{emp.presentDays} أيام</strong></div>
                        {emp.fridayBonusCount > 0 && (
                          <div className="text-blue-600 font-bold">إضافي الجمعة: +{emp.fridayBonusCount} (مضاعف)</div>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-200/55 flex items-center justify-between">
                      <div className="flex gap-4 text-xs text-slate-600">
                        {emp.bonusPay > 0 && <span>حوافز إضافية: <strong className="text-emerald-600">+{emp.bonusPay} ج.م</strong></span>}
                        {emp.deductionPay > 0 && <span>خصم غيابات: <strong className="text-red-500">-{emp.deductionPay} ج.م</strong></span>}
                      </div>

                      <div className="text-sm">
                        صافي مستحق القبض: <strong className="text-slate-900 border-b border-primary pb-0.5">{emp.netSalary.toLocaleString('ar-EG')} ج.م</strong>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right panel: Add Employee Form */}
          <div className="lg:col-span-1">
            <form onSubmit={handleSaveEmployee} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-4">
              <h4 className="font-bold text-slate-800 text-base">تسجيل موظف أو فني جديد</h4>
              
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">الاسم الكامل</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="محمد أشرف صبحي"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">المسمى الوظيفي</label>
                <select
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg text-xs cursor-pointer"
                >
                  <option>فني تكييف أول</option>
                  <option>فني تكييف مساعد</option>
                  <option>موظف خدمة عملاء وسكرتارية</option>
                  <option>مشرف صيانة ومبيعات</option>
                  <option>مهندس كهرباء تيار خفيف</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">الهاتف المحمول</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="010XXXXXXXX"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg text-xs font-mono text-left"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">الراتب الأساسي (ج.م)</label>
                <input
                  type="number"
                  value={baseSalary}
                  onChange={(e) => setBaseSalary(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg text-xs font-mono text-left"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">نسبة عمولة المبيعات/الأوردر (%)</label>
                <input
                  type="number"
                  value={commissionRate}
                  onChange={(e) => setCommissionRate(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg text-xs font-mono text-left"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">صلاحية النظام الافتراضية</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg text-xs cursor-pointer"
                >
                  <option value="technician">فني صيانة (موبايل ابلكيشن)</option>
                  <option value="assistant">مساعد تكييف</option>
                  <option value="admin">مدير مشرف (لوحة تحكم كاملة)</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl transition-colors cursor-pointer"
              >
                حفظ بيانات الموظف المضافة
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Daily Attendance ledger */}
      {activeTab === 'attendance' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-right">
          
          {/* Attendance logger */}
          <div className="lg:col-span-1">
            <form onSubmit={handleSaveAttendance} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-4">
              <h4 className="font-bold text-slate-800 text-base">تسجيل حضور وانصراف يومي</h4>
              
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">تاريخ اليوم المسجل</label>
                <input
                  type="text"
                  value={attendanceDate}
                  onChange={(e) => setAttendanceDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg text-xs font-mono text-left"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">اختر فني الصيانة / المساعد <span className="text-red-500">*</span></label>
                <select
                  required
                  value={selectedEmpId}
                  onChange={(e) => setSelectedEmpId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg text-xs text-right cursor-pointer"
                >
                  <option value="">-- اختر الموظف لوضع الحضور --</option>
                  {employees.map(e => (
                    <option key={e.id} value={e.id}>{e.name} ({e.jobTitle})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">حالة الانضباط اليومي</label>
                <select
                  value={attendanceStatus}
                  onChange={(e) => setAttendanceStatus(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg text-xs text-right cursor-pointer"
                >
                  <option value="present">حاضر ومنتظم في العمل</option>
                  <option value="absent">غائب بدون عذر رسمي</option>
                  <option value="excused">إجازة رسمية / مأمورية مبررة</option>
                </select>
              </div>

              {attendanceStatus === 'present' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">ساعة الحضور (كود مصر)</label>
                      <input
                        type="text"
                        value={checkIn}
                        onChange={(e) => setCheckIn(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg text-xs font-mono text-center"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">ساعة المغادرة (كود مصر)</label>
                      <input
                        type="text"
                        value={checkOut}
                        onChange={(e) => setCheckOut(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg text-xs font-mono text-center"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <input
                      type="checkbox"
                      id="isFriday"
                      checked={isFridayOvertime}
                      onChange={(e) => setIsFridayOvertime(e.target.checked)}
                      className="w-4 h-4 cursor-pointer"
                    />
                    <label id="label-for-friday" htmlFor="isFriday" className="text-xs font-semibold text-sky-700 cursor-pointer">
                      هل هذا الحضور في يوم جمعة؟ (مكافأة مضاعفة 200%)
                    </label>
                  </div>
                </>
              )}

              <button
                type="submit"
                className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl transition-colors cursor-pointer"
              >
                تحديث وحفظ كشف اليوم
              </button>
            </form>
          </div>

          {/* Attendance ledger history */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
              <h4 className="font-bold text-slate-800 text-base mb-4">أحدث سجل حضور مسجّل مؤخراً</h4>
              
              <div className="overflow-x-auto text-right">
                <table className="w-full text-xs text-slate-700 divide-y divide-slate-100">
                  <thead className="bg-slate-50 text-slate-500 font-sans">
                    <tr>
                      <th className="px-4 py-3 text-right">اسم الفني</th>
                      <th className="px-4 py-3 text-center">التاريخ</th>
                      <th className="px-4 py-3 text-center">الحالة اليومية</th>
                      <th className="px-4 py-3 text-center">الحضور والمنصرف</th>
                      <th className="px-4 py-3 text-left">إضافي يوم الجمعة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {attendance.map((att, idx) => {
                      const emp = employees.find(e => e.id === att.employeeId);
                      return (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="px-4 py-3 font-semibold">{emp?.name || "موظف مجهول"}</td>
                          <td className="px-4 py-3 text-center font-mono">{att.date}</td>
                          <td className="px-4 py-3 text-center">
                            {att.status === 'present' ? (
                              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 font-bold rounded">موجود</span>
                            ) : (
                              <span className="px-2 py-0.5 bg-red-50 text-red-700 font-bold rounded">غائب</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center font-mono text-gray-500">
                            {att.status === 'present' ? `${att.checkIn} - ${att.checkOut}` : '✕'}
                          </td>
                          <td className="px-4 py-3 text-left">
                            {att.isFridayOvertime ? (
                              <span className="text-xs bg-sky-50 text-sky-700 px-2 py-0.5 rounded font-bold">محتسب مضاعف</span>
                            ) : (
                              <span className="text-gray-400 font-mono">-</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PARTNERSHIP metrics */}
      {activeTab === 'partnership' && (
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs space-y-6 text-right" id="partnership-calc">
          <div className="flex items-center gap-2 justify-end">
            <h3 className="font-bold text-slate-800 text-lg">لوحة توزيع الشراكة وصافي عوائد المقاولات للشركاء</h3>
            <span className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </span>
          </div>
          
          <p className="text-xs text-gray-500">
            طريقة احتساب ديناميكية فورية لأرباح وعوائد الشركاء بالتراضي بناءً على صافي أرباح الشركة التي تمت في مأموريات الصيانة والصيانة الدورية للتكييفات.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
            
            {/* Setting controller */}
            <div className="p-5 bg-slate-50 border border-slate-100 rounded-2xl space-y-4">
              <h4 className="font-bold text-slate-800 text-sm">إعداد نسبة توزيع الأرباح</h4>
              
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-500">اختر نسبة الشريك الأساسي (%)</label>
                <div className="flex gap-2">
                  <button 
                    type="button" 
                    onClick={() => setPartnerRatio(30)}
                    className={`flex-1 py-1 px-3.5 text-xs font-bold rounded-lg cursor-pointer ${partnerRatio === 30 ? 'bg-primary text-white' : 'bg-white border text-slate-600'}`}
                  >
                    30 / 70
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setPartnerRatio(40)}
                    className={`flex-1 py-1 px-3.5 text-xs font-bold rounded-lg cursor-pointer ${partnerRatio === 40 ? 'bg-primary text-white' : 'bg-white border text-slate-600'}`}
                  >
                    40 / 60
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setPartnerRatio(50)}
                    className={`flex-1 py-1 px-3.5 text-xs font-bold rounded-lg cursor-pointer ${partnerRatio === 50 ? 'bg-primary text-white' : 'bg-white border text-slate-600'}`}
                  >
                    50 / 50
                  </button>
                </div>
              </div>

              <div className="text-[11px] leading-relaxed text-gray-400">
                الحساب التلقائي للشركة قائم على توزيع <strong>٤٠٪ للشريك الممول و ٦٠٪ للشريك التشغيلي والمسؤول الفني</strong> للتوافق مع شروط مقاولات الفنيين المعتمدة في الإقليم المصري.
              </div>
            </div>

            {/* Total Profits Counter */}
            <div className="p-5 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-500">إجمالي الأرباح المشتركة التراكمية</span>
                <h3 className="text-3xl font-bold font-sans text-emerald-600 mt-2">
                  {totalCompanyProfits.toLocaleString('ar-EG')} <span className="text-xs">ج.م</span>
                </h3>
              </div>
              <span className="text-[10px] text-zinc-400">
                تحسب من حاصل إيرادات الفواتير المكتملة ناقص الخامات والمصروفات المسجلة.
              </span>
            </div>

            {/* Result Visual Share Breakdown */}
            <div className="p-5 bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl space-y-4">
              <h4 className="font-bold text-sm tracking-tight text-indigo-300">نصيب الشركاء المصفي للتوزيع الفوري</h4>
              
              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center bg-white/5 p-2 rounded">
                  <span>الشريك الأول الممول ({partnerRatio}%):</span>
                  <strong className="text-emerald-400 font-mono font-bold">{partnershipShare.mainPartner.toLocaleString('ar-EG')} ج.م</strong>
                </div>
                <div className="flex justify-between items-center bg-white/5 p-2 rounded">
                  <span>الشريك الثاني التنفيذي ({100 - partnerRatio}%):</span>
                  <strong className="text-emerald-400 font-mono font-bold">{partnershipShare.secondaryPartner.toLocaleString('ar-EG')} ج.م</strong>
                </div>
              </div>

              <span className="text-[9px] text-slate-400 block pt-1">
                يجري التحديث وتصفية الحسابات في الوقت الحقيقي وبمجرد تأكيد واستلام السداد المالي لأي فاتورة معتمدة على الإطلاق!
              </span>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
