import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, Sparkles, CornerDownLeft, Play, AlertCircle, CheckCircle } from 'lucide-react';
import { TRANSLATIONS } from '../translations';

interface VoiceAssistantProps {
  lang: 'ar' | 'en';
  onExecuteCommand: (command: string, actionData: { action: 'NAVIGATE'; module: string; subAction?: string; filter?: string }) => void;
}

export default function MGroupVoiceAssistant({ lang, onExecuteCommand }: VoiceAssistantProps) {
  const [isListening, setIsListening] = useState(false);
  const [speechText, setSpeechText] = useState('');
  const [isSupported, setIsSupported] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [successCommand, setSuccessCommand] = useState('');
  const recognitionRef = useRef<any>(null);

  const t = TRANSLATIONS[lang];

  const COMMAND_GUIDES_AR = [
    { text: 'إضافة عميل جديد', desc: 'يفتح نموذج تسجيل عميل جديد فوراً' },
    { text: 'إنشاء فاتورة', desc: 'يفتح شاشة إعداد فاتورة تكييف جديدة' },
    { text: 'مهام اليوم', desc: 'يعرض أوامر التشغيل والزيارات الميدانية لليوم' },
    { text: 'الربح الشهري', desc: 'ينتقل للوحة الأرباح وشراكات الفنيين' },
    { text: 'فتح سجل عميل', desc: 'يعرض تفاصيل أول ملف عميل في قاعدة البيانات بمصر' },
    { text: 'أمر صيانة جديد', desc: 'يفتح مباشر نموذج إضافة أمر صيانة وغسيل' }
  ];

  const COMMAND_GUIDES_EN = [
    { text: 'Add new customer', desc: 'Opens the client registration folder' },
    { text: 'Create invoice', desc: 'Initiates a blank HVAC billing invoice receipt' },
    { text: 'Show today\'s jobs', desc: 'Displays ongoing field dispatch visits for today' },
    { text: 'Show monthly profit', desc: 'Takes you to the financial net yields & partner splits' },
    { text: 'Open customer record', desc: 'Retrieves the details ledger of the active client' },
    { text: 'Create maintenance order', desc: 'Launches a new workorder for preventive washes' }
  ];

  const activeGuides = lang === 'ar' ? COMMAND_GUIDES_AR : COMMAND_GUIDES_EN;

  useEffect(() => {
    // Check speech recognition support in window
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    // Set appropriate language context
    recognition.lang = lang === 'ar' ? 'ar-EG' : 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
      setErrorMessage('');
      setSuccessCommand('');
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error', event);
      if (event.error === 'not-allowed') {
        setErrorMessage(
          lang === 'ar' 
            ? 'ميكروفون محجوب بالمتصفح، يرجى السماح بتشغيل الصوت أو النقر لمحاكاة الصوت السريع.' 
            : 'Microphone permission blocked. Please enable it, or click any simulation button.'
        );
      } else {
        setErrorMessage(lang === 'ar' ? 'لم أفهم الصوت جيداً، يرجى المحاولة ثانية.' : 'Speech error, please try again.');
      }
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onresult = (event: any) => {
      const resultText = event.results[0][0].transcript;
      setSpeechText(resultText);
      processCommandText(resultText);
    };

    recognitionRef.current = recognition;
  }, [lang]);

  const toggleMic = () => {
    if (!isSupported) {
      setErrorMessage(
        lang === 'ar' 
          ? 'دعم الميكروفون مقيد في نظام الكتل هذا، استخدم الأزرار السريعة للمحاكاة الفورية.' 
          : 'Speech API constrained in sandbox frame, please use clickable simulation below.'
      );
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      setSpeechText('');
      setErrorMessage('');
      setSuccessCommand('');
      try {
        recognitionRef.current?.start();
      } catch (err) {
        console.warn(err);
        setIsListening(false);
      }
    }
  };

  const processCommandText = (text: string) => {
    const cleanText = text.toLowerCase().trim();
    
    // Arabic Matches
    if (
      cleanText.includes('عميل جديد') || 
      cleanText.includes('إضافة عميل') || 
      cleanText.includes('جديد عميل') || 
      cleanText.includes('اضافه عميل')
    ) {
      handleMatch('إضافة عميل جديد', { action: 'NAVIGATE', module: 'crm', subAction: 'add_customer' });
    } 
    else if (
      cleanText.includes('فاتورة') || 
      cleanText.includes('فاتوره') || 
      cleanText.includes('إنشاء فاتورة') || 
      cleanText.includes('انشاء فاتوره')
    ) {
      handleMatch('إنشاء فاتورة تكييف', { action: 'NAVIGATE', module: 'invoices', subAction: 'create_invoice' });
    }
    else if (
      cleanText.includes('الأعمال') || 
      cleanText.includes('شغل اليوم') || 
      cleanText.includes('مهام اليوم') || 
      cleanText.includes('امور اليوم') ||
      cleanText.includes('وظائف اليوم') ||
      cleanText.includes('اليوم')
    ) {
      handleMatch('عرض جدول الفنيين لمهمات اليوم', { action: 'NAVIGATE', module: 'orders', filter: 'today' });
    }
    else if (
      cleanText.includes('الربح') || 
      cleanText.includes('أرباح') || 
      cleanText.includes('ارباح') || 
      cleanText.includes('شراكة')
    ) {
      handleMatch('الربح وجدول الأرباح والشركاء', { action: 'NAVIGATE', module: 'payroll', subAction: 'profits' });
    }
    else if (
      cleanText.includes('سجل عميل') || 
      cleanText.includes('ملف العميل') || 
      cleanText.includes('افتح عميل')
    ) {
      handleMatch('سحب أول سجل عميل تكييف', { action: 'NAVIGATE', module: 'crm', subAction: 'open_first_customer' });
    }
    else if (
      cleanText.includes('أمر صيانة') || 
      cleanText.includes('امر صيانه') || 
      cleanText.includes('عطل جديد')
    ) {
      handleMatch('أمر صيانة وتكليف فني جديد', { action: 'NAVIGATE', module: 'orders', subAction: 'create_order' });
    }
    
    // English Matches
    else if (
      cleanText.includes('customer') || 
      cleanText.includes('client') || 
      cleanText.includes('add new')
    ) {
      handleMatch('Add new customer', { action: 'NAVIGATE', module: 'crm', subAction: 'add_customer' });
    }
    else if (
      cleanText.includes('invoice') || 
      cleanText.includes('billing') || 
      cleanText.includes('bill')
    ) {
      handleMatch('Create invoice', { action: 'NAVIGATE', module: 'invoices', subAction: 'create_invoice' });
    }
    else if (
      cleanText.includes('today') || 
      cleanText.includes('job') || 
      cleanText.includes('jobs') || 
      cleanText.includes('visit')
    ) {
      handleMatch('Show today\'s jobs', { action: 'NAVIGATE', module: 'orders', filter: 'today' });
    }
    else if (
      cleanText.includes('profit') || 
      cleanText.includes('revenue') || 
      cleanText.includes('money')
    ) {
      handleMatch('Show monthly profit', { action: 'NAVIGATE', module: 'payroll', subAction: 'profits' });
    }
    else if (
      cleanText.includes('record') || 
      cleanText.includes('profile') || 
      cleanText.includes('file')
    ) {
      handleMatch('Open customer record', { action: 'NAVIGATE', module: 'crm', subAction: 'open_first_customer' });
    }
    else if (
      cleanText.includes('maintenance') || 
      cleanText.includes('order') || 
      cleanText.includes('work order')
    ) {
      handleMatch('Create maintenance order', { action: 'NAVIGATE', module: 'orders', subAction: 'create_order' });
    }
    else {
      // General feedback if no direct action mapped
      setErrorMessage(
        lang === 'ar' 
          ? `صوت مقروء: "${text}" | عذراً، لم أجد إيعازاً مطابقاً في الأوامر المعتمدة لمجموعة كول.` 
          : `Speech: "${text}" | Unrecognized prompt. Please check available dockets below.`
      );
    }
  };

  const handleMatch = (matchedCommand: string, actionData: any) => {
    setSuccessCommand(matchedCommand);
    triggerBeepSuccess();
    // Execute action in App.tsx
    onExecuteCommand(matchedCommand, actionData);
  };

  const triggerBeepSuccess = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.1);
      
      // small delay second beep
      setTimeout(() => {
        const osc2 = audioCtx.createOscillator();
        const gain2 = audioCtx.createGain();
        osc2.connect(gain2);
        gain2.connect(audioCtx.destination);
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(1200, audioCtx.currentTime);
        gain2.gain.setValueAtTime(0.15, audioCtx.currentTime);
        osc2.start();
        osc2.stop(audioCtx.currentTime + 0.15);
      }, 120);
    } catch (e) {
      console.warn(e);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-3xl shadow-xl space-y-6 text-right">
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-extrabold text-[10px] rounded-full uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5 animate-pulse" />
          {lang === 'ar' ? 'فوري وبدون تلمس' : 'No-Touch Quick Commands'}
        </span>
        <h3 className="text-base font-black text-slate-800 dark:text-slate-100 font-sans">
          {lang === 'ar' ? 'مساعد M Group الصوتي الذكي 🗣️' : 'M Group Smart Voice Assistant 🗣️'}
        </h3>
      </div>

      <div className="flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800 text-center space-y-4">
        {/* Animated Mic Button */}
        <button
          onClick={toggleMic}
          className={`relative p-5 rounded-full text-white cursor-pointer transition-all duration-300 ${
            isListening 
              ? 'bg-red-500 scale-110 shadow-lg shadow-red-500/25 animate-pulse' 
              : 'bg-indigo-600 hover:bg-indigo-750 hover:scale-105 shadow-md shadow-indigo-600/20'
          }`}
        >
          {isListening ? <Mic className="w-8 h-8" /> : <MicOff className="w-8 h-8" />}
          {isListening && (
            <span className="absolute inset-0 rounded-full border-4 border-red-400 animate-ping opacity-60"></span>
          )}
        </button>

        <div className="space-y-1">
          <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
            {isListening 
              ? (lang === 'ar' ? 'جاري الاستماع لصوتك الآن...' : 'Listening to your command now...') 
              : (lang === 'ar' ? 'انقر على الميكروفون لبدء إملاء الأوامر' : 'Click microphone to dictate command')}
          </p>
          <p className="text-[10px] text-gray-400">
            {lang === 'ar' 
              ? 'يمكنك التحدث باللغتين العربية أو الإنجليزية لتوجيه النظام!' 
              : 'Dictate any supported action in Arabic or English language!'}
          </p>
        </div>

        {/* Waves Animation */}
        {isListening && (
          <div className="flex gap-1 justify-center items-center py-2 h-6">
            <span className="w-1 bg-red-400 h-3 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></span>
            <span className="w-1 bg-gradient-to-t from-red-400 to-indigo-500 h-5 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></span>
            <span className="w-1 bg-indigo-500 h-6 rounded-full animate-bounce" style={{ animationDelay: '0.5s' }}></span>
            <span className="w-1 bg-gradient-to-b from-indigo-500 to-sky-400 h-4 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
            <span className="w-1 bg-sky-400 h-2 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
          </div>
        )}

        {/* Realtime interpretation */}
        {speechText && (
          <div className="p-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl w-full">
            <span className="text-[10px] text-slate-400 font-bold block mb-1">
              {lang === 'ar' ? 'الترجمة الصوتية المقروءة' : 'Recognized Transcription'}
            </span>
            <p className="text-xs italic text-indigo-600 dark:text-sky-400 font-extrabold">"{speechText}"</p>
          </div>
        )}

        {/* Success Alert */}
        {successCommand && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-500 text-emerald-800 dark:text-emerald-400 rounded-xl w-full flex items-center justify-center gap-2">
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
            <span className="text-xs font-black">
              {lang === 'ar' ? `تم التنفيذ المباشر: ${successCommand} ✅` : `Executed Match: ${successCommand} ✅`}
            </span>
          </div>
        )}

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-500 text-rose-800 dark:text-rose-400 rounded-xl w-full flex items-center justify-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span className="text-xs font-bold leading-normal">{errorMessage}</span>
          </div>
        )}
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-slate-400">{lang === 'ar' ? 'انقر لتشغيل المحاكاة الفورية' : 'Click to run simulated command'}</span>
          <h4 className="text-xs font-bold text-slate-600 dark:text-slate-300">
            {lang === 'ar' ? 'مستند قائمة الأوامر الصوتية المدعومة ومحاكاتها' : 'List of Supported Vocal Command Prompts'}
          </h4>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {activeGuides.map((item, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setSpeechText(item.text);
                processCommandText(item.text);
              }}
              className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:border-indigo-500 transition-all text-right group cursor-pointer"
            >
              <span className="p-1 px-[6px] bg-slate-100 dark:bg-slate-800 dark:group-hover:bg-indigo-950 rounded-lg text-slate-500 dark:text-slate-400 group-hover:text-indigo-600">
                <Play className="w-3 h-3" />
              </span>
              <div className="flex-1 mr-3 rtl:mr-3 ltr:ml-3">
                <p className="text-xs font-extrabold text-indigo-600 dark:text-sky-400">{item.text}</p>
                <p className="text-[10px] text-slate-400">{item.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
