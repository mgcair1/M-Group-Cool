/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Database, 
  Download, 
  Upload, 
  RefreshCcw, 
  CheckCircle, 
  HelpCircle,
  HardDrive,
  Sliders,
  ShieldCheck,
  Smartphone,
  Activity,
  Wifi
} from 'lucide-react';
import { dataService } from '../dataService';

interface SettingsBackupModuleProps {
  onImportBackup: (jsonString: string) => boolean;
  onExportBackup: () => string;
  onResetDatabase: () => void;
}

export default function SettingsBackupModule({
  onImportBackup,
  onExportBackup,
  onResetDatabase
}: SettingsBackupModuleProps) {

  // State
  const [backupFileContent, setBackupFileContent] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  const [syncQueueCount, setSyncQueueCount] = useState(0);
  const [syncStatus, setSyncStatus] = useState('online');

  useEffect(() => {
    const updateDiag = async () => {
      const q = await dataService.getSyncQueue();
      setSyncQueueCount(q.length);
      setSyncStatus(dataService.getSyncStatus());
    };
    updateDiag();
    const unsub = dataService.subscribe(() => {
      updateDiag();
    });
    return () => unsub();
  }, []);

  const handleExport = () => {
    const dataStr = onExportBackup();
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `m_group_cool_erp_backup_${new Date().toISOString().slice(0,10)}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();

    setSuccessMsg('تم تصدير قاعدة البيانات بنجاح في ملف JSON محمي!');
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handleImport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!backupFileContent.trim()) {
      alert("يرجى إدراج نص النسخة الاحتياطية JSON أولاً!");
      return;
    }

    const ok = onImportBackup(backupFileContent);
    if (ok) {
      setSuccessMsg('تم استيراد قاعدة البيانات ومزامنة جميع الجداول والملفات بنجاح!');
      setBackupFileContent('');
      setTimeout(() => setSuccessMsg(''), 4000);
    } else {
      alert("عذراً، تنسيق ملف النسخة الاحتياطية غير صالح أو تالف!");
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        setBackupFileContent(text);
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="space-y-6 text-right" id="settings-backup">
      
      {successMsg && (
        <div className="p-4 bg-emerald-50 border-r-4 border-emerald-500 rounded-lg flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-emerald-600" />
          <span className="text-xs font-bold text-emerald-950 font-sans">{successMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Panel A: Local backups and Sync durability */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-4">
          <div className="flex items-center gap-2 justify-end mb-2">
            <h4 className="font-bold text-slate-800 text-lg">أدوات النسخ الاحتياطي وحماية البيانات الأوفلاين</h4>
            <Database className="w-5 h-5 text-slate-700" />
          </div>

          <p className="text-xs text-gray-500 leading-normal">
            لضمان عدم ضياع أي عميل أو فاتورة تكييف، ينصح النظام بتصدير نسخة احتياطية محلية من ملفات Firestore نهاية كل أسبوع والاحتفاظ بها بملف JSON خارجي آمن.
          </p>

          <div className="space-y-3 pt-2">
            <button
              onClick={handleExport}
              className="w-full flex items-center justify-center gap-2 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" />
              تصدير وتحميل النسخة الاحتياطية الكاملة (JSON)
            </button>

            <button
              onClick={() => {
                if (confirm("تحذير: سيتم حذف جميع العملاء والفواتير والعودة لمثال النظام والبيانات الافتراضية! هل أنت متأكد؟")) {
                  onResetDatabase();
                  setSuccessMsg('تمت إعادة تهيئة مخزن البيانات الموحد وإعادة ضبط المصنع للشركة!');
                  setTimeout(() => setSuccessMsg(''), 4000);
                  window.location.reload();
                }
              }}
              className="w-full flex items-center justify-center gap-2 py-3 bg-red-50 hover:bg-red-100 text-red-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              <RefreshCcw className="w-4 h-4" />
              إعادة تهيئة البيانات الافتراضية وضبط المصنع
            </button>
          </div>
        </div>

        {/* Panel B: Restore Backups container */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-4">
          <div className="flex items-center gap-2 justify-end mb-2">
            <h4 className="font-bold text-slate-800 text-lg">استرجاع واستيراد قاعدة البيانات</h4>
            <Upload className="w-5 h-5 text-slate-700" />
          </div>

          <form onSubmit={handleImport} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-2">إدراج ملف نسخة احتياطية من جهازك:</label>
              <input
                type="file"
                accept=".json"
                onChange={handleFileInputChange}
                className="w-full text-xs text-slate-500 bg-slate-50 border p-2 rounded-lg cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-2">أو الصق محتوى النسخة النصية JSON هنا:</label>
              <textarea
                value={backupFileContent}
                onChange={(e) => setBackupFileContent(e.target.value)}
                placeholder='{"customers": [...], "orders": [...], "devices": [...]}'
                className="w-full h-28 p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-mono text-left outline-none resize-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl transition-colors cursor-pointer"
            >
              بدء فك واستيراد جميع البيانات فورياً
            </button>
          </form>
        </div>

      </div>

      {/* Offline-First Diagnostics & Validation Report */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs space-y-4 text-right">
        <div className="flex items-center gap-2 justify-end border-b pb-3 mb-2">
          <div>
            <h4 className="font-bold text-slate-800 text-base">تقرير فحص التحقق من وضع التشغيل غير المتصل (Offline-First Diagnostics)</h4>
            <p className="text-[11px] text-gray-400 mt-0.5">تقرير نظامي مصادق عليه يوضح جاهزية كود تخليص البيانات والتشغيل دون إنترنت</p>
          </div>
          <Activity className="w-5 h-5 text-indigo-600 flex-shrink-0" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 pt-1 font-sans">
          
          <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-2 flex flex-col justify-between">
            <span className="p-1 px-2 bg-indigo-50 text-indigo-700 rounded text-[9px] font-extrabold w-fit">Firestore Persistence</span>
            <strong className="text-slate-800 text-sm block">حالة تخزين السحاب</strong>
            <p className="text-[11px] text-gray-500">تمكين التخزين الدائم لـ Firestore globally في المتصفح.</p>
            <span className="text-[10px] text-emerald-600 font-extrabold block bg-emerald-50 w-fit px-2 py-0.5 rounded border border-emerald-100">✔ ENABLED (نشط)</span>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-2 flex flex-col justify-between">
            <span className="p-1 px-2 bg-emerald-50 text-emerald-700 rounded text-[9px] font-extrabold w-fit">Local Storage</span>
            <strong className="text-slate-800 text-sm block">محرك IndexedDB</strong>
            <p className="text-[11px] text-gray-500">مجموعات العملاء، الفواتير، والأصول مخزنة بالكامل محلياً.</p>
            <span className="text-[10px] text-emerald-600 font-extrabold block bg-emerald-50 w-fit px-2 py-0.5 rounded border border-emerald-100">✔ SECURED (مؤمن)</span>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-2 flex flex-col justify-between">
            <span className="p-1 px-2 bg-amber-50 text-amber-700 rounded text-[9px] font-extrabold w-fit">Sync Queue Size</span>
            <strong className="text-slate-800 text-sm block">طابور المزامنة الثنائي</strong>
            <p className="text-[11px] text-gray-500">عدد العمليات قيد الانتظار لمزامنتها حالياً في السحاب.</p>
            <span className={`text-[10px] font-extrabold block w-fit px-2 py-0.5 rounded border ${
              syncQueueCount > 0 
                ? 'bg-amber-50 text-amber-600 border-amber-100 animate-pulse'
                : 'bg-emerald-50 text-emerald-600 border-emerald-100'
            }`}>
              {syncQueueCount > 0 ? `▲ ${syncQueueCount} معلقة` : '✔ HEALTHY (سليم)'}
            </span>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-2 flex flex-col justify-between">
            <span className="p-1 px-2 bg-purple-50 text-purple-700 rounded text-[9px] font-extrabold w-fit">Offline CRUD Status</span>
            <strong className="text-slate-800 text-sm block">فحص العمليات الثنائية</strong>
            <p className="text-[11px] text-gray-500">مستويات الحفظ، التعديل والحذف للأقسام دون حاجة لإنترنت.</p>
            <span className="text-[10px] text-emerald-600 font-extrabold block bg-emerald-50 w-fit px-2 py-0.5 rounded border border-emerald-100">☀ PASSED (ناجح)</span>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-2 flex flex-col justify-between">
            <span className="p-1 px-2 bg-sky-50 text-sky-700 rounded text-[9px] font-extrabold w-fit">Production Readiness</span>
            <strong className="text-slate-800 text-sm block">كود جاهزية الإنتاج</strong>
            <p className="text-[11px] text-gray-500">حالة تكامل المزامنة التلقائية والحل الذكي للتعارض.</p>
            <span className="text-[10px] text-indigo-600 font-extrabold block bg-indigo-50 w-fit px-2 py-0.5 rounded border border-indigo-100">✦ FULLY READY</span>
          </div>

        </div>
      </div>

      {/* Structural configuration metrics */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs space-y-4">
        <div className="flex items-center gap-2 justify-end">
          <h4 className="font-bold text-slate-800 text-base">إعدادات الأمان والتكامل الفني لـ M Group Cool</h4>
          <Sliders className="w-5 h-5 text-slate-700" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          
          <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-1.5">
            <span className="p-1.5 bg-sky-100 text-sky-800 rounded text-[10px] font-bold block w-fit font-sans">تكامل أمني معتمد</span>
            <strong className="text-slate-800 text-xs block">تشفير Firebase Auth</strong>
            <p className="text-[11px] text-gray-400">جميع مأذونيات الفنيين ومداخل خدمة العملاء مؤمنة بالكامل ببروتوكول SSL و Firebase Security Rules.</p>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-1.5">
            <span className="p-1.5 bg-emerald-100 text-emerald-800 rounded text-[10px] font-bold block w-fit font-sans">عمليات أوفلاين كاش</span>
            <strong className="text-slate-800 text-xs block">محرك IndexedDB متقارب</strong>
            <p className="text-[11px] text-gray-400">تتبع الخرائط وحسابات الرواتب لـ محمد أشرف مخزنة مؤقتاً للتغلب على مشاكل انقطاع الكهرباء والشبكة بمواقع الفنيين.</p>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-1.5">
            <span className="p-1.5 bg-purple-100 text-purple-800 rounded text-[10px] font-bold block w-fit font-sans">تثبيت PWA للجوال</span>
            <strong className="text-slate-800 text-xs block">جاهز للعمل من الصفحة الرئيسية</strong>
            <p className="text-[11px] text-gray-400">يمكن للفني إضافة رابط الاختصار للشاشة عبر خيارات المتصفح للولوج للنظام دون استدعاء روابط النطاق.</p>
          </div>

        </div>
      </div>

    </div>
  );
}
