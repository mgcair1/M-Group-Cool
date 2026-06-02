/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Sparkles, 
  Send, 
  Bot, 
  User, 
  Loader2, 
  HelpCircle,
  TrendingUp,
  Award,
  Search,
  FileMinus,
  Coins
} from 'lucide-react';
import Markdown from 'react-markdown';

interface AiAssistantModuleProps {
  stateContext: {
    customers: any[];
    orders: any[];
    invoices: any[];
    expenses: any[];
    payments: any[];
    contracts: any[];
    employees: any[];
    products: any[];
    suppliers: any[];
  }
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function AiAssistantModule({ stateContext }: AiAssistantModuleProps) {

  // State
  const [messages, setMessages] = useState<Message[]>([
    { 
      role: 'assistant', 
      content: 'مرحباً بك في وحدة **الذكاء الاصطناعي المالي والتشغيلي** لمجموعة **M Group Cool**! ❄️\n\nأنا مساعدك الذكي المربوط مباشرةً بقاعدة البيانات الخاصة بك. يمكنني تزويدك بتقارير ذكية، وتحليل أدائك ومبيعاتك، ومعدل تحصيلك. اضغط على أحد الأسئلة السريعة أدناه أو اكتب لي أي سؤال تريده باللغة العربية ماليًا أو فنيًا!' 
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendMessage = async (customPrompt?: string) => {
    const promptToSend = customPrompt || inputMessage;
    if (!promptToSend.trim()) return;

    if (!customPrompt) setInputMessage('');
    
    // Add user message to list
    const newMessages = [...messages, { role: 'user', content: promptToSend } as Message];
    setMessages(newMessages);
    setLoading(true);

    try {
      // Call full-stack express route proxy
      const response = await fetch('/api/gemini/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: promptToSend,
          stateContext: stateContext
        }),
      });

      if (!response.ok) {
        throw new Error('حدث خطأ أثناء تحميل إجابة السيرفر المفوّض.');
      }

      const data = await response.json();
      setMessages([...newMessages, { role: 'assistant', content: data.response } as Message]);
    } catch (err: any) {
      console.error(err);
      setMessages([...newMessages, { 
        role: 'assistant', 
        content: `⚠️ عذراً، حدث عطل مؤقت في الاتصال بالذكاء الاصطناعي (أو لم يتم توفير مفتاح الـ GEMINI_API_KEY بنظام بيئة العمل بعد). 

يرجى تزويد مفتاح بيئة التشغيل في لوحة الإعدادات للتمكن من العمل الفوري أو سنقوم باستخدام المحرك التوليدي المبرز البديل.` 
      } as Message]);
    } finally {
      setLoading(false);
    }
  };

  const QUICK_QUESTIONS = [
    { label: "أكثر خدمة تبريد ربحية للشركة؟", value: "ما هي أكتر خدمة ربحية وذات هامش ربح عالي للشركة حالياً؟" },
    { label: "من هو أفضل فني صيانة حالياً؟", value: "من هو أفضل فني صيانة تكييف من حيث إنجاز المهام وعمله المتفاني؟" },
    { label: "العملاء المحتاجين متابعة وصيانة؟", value: "اعطني كشفاً بالعملاء الذين يحتاجون لمتابعة فورية أو صيانة دورية لأجهزتهم" },
    { label: "عقود الصيانة القريبة من الانتهاء؟", value: "هل يوجد أي عقود صيانة سنوية تكييف قريبة من الانتهاء وتحتاج للتواصل معنا؟" },
    { label: "إجمالي الأرباح والمبالغ المحصلة؟", value: "ما هو معدل الأرباح الصافي والتحصيلات التراكمية بناءً على الفواتير؟" }
  ];

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-xs flex flex-col h-[650px]" id="ai-assistant">
      
      {/* Header bar */}
      <div className="p-4 border-b border-gray-50 bg-slate-900 text-white rounded-t-2xl flex items-center justify-between text-right">
        <span className="text-xs font-mono font-medium text-slate-300 py-1 px-2.5 bg-white/10 rounded-lg">❄️ مساعد فني معتمد</span>
        <div className="flex items-center gap-2">
          <div>
            <h4 className="font-bold text-sm tracking-tight font-sans">مستشار الذكاء الاصطناعي لـ M Group Cool</h4>
            <span className="text-[10px] text-sky-300">يعمل بنظام تحليل البيانات المباشر Firestore</span>
          </div>
          <span className="p-2.5 bg-white/10 rounded-xl text-sky-400">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </span>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4 text-right bg-slate-50/50">
        {messages.map((m, idx) => (
          <div 
            key={idx} 
            className={`flex gap-3 max-w-3xl ${m.role === 'user' ? 'mr-auto flex-row-reverse text-left' : 'ml-auto text-right'}`}
          >
            {/* Avatar block */}
            <span className={`p-2 rounded-xl flex-shrink-0 h-10 w-10 flex items-center justify-center ${m.role === 'user' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-900 text-sky-400'}`}>
              {m.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-5 h-5" />}
            </span>

            {/* Content text */}
            <div className={`p-4 rounded-2xl text-xs space-y-2 leading-relaxed shadow-3xs ${m.role === 'user' ? 'bg-indigo-600 text-white rounded-tl-none' : 'bg-white text-slate-800 border border-slate-100 rounded-tr-none'}`}>
              {m.role === 'user' ? (
                <p className="font-medium text-sm leading-normal">{m.content}</p>
              ) : (
                <div className="markdown-body font-sans text-sm block">
                  <Markdown>{m.content}</Markdown>
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-3 items-center ml-auto">
            <span className="p-2 bg-slate-900 text-sky-400 rounded-xl">
              <Bot className="w-5 h-5" />
            </span>
            <div className="bg-white p-4 rounded-xl border border-slate-100 flex items-center gap-2 text-xs font-semibold text-slate-500 shadow-3xs">
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
              جاري تحليل بيانات Firestore وحساب الأرباح وبنود الخدمة...
            </div>
          </div>
        )}
      </div>

      {/* Quick suggestions panel */}
      <div className="p-3 bg-white border-t border-gray-100 flex flex-wrap gap-2 justify-end">
        {QUICK_QUESTIONS.map((q, i) => (
          <button
            key={i}
            onClick={() => handleSendMessage(q.value)}
            disabled={loading}
            className="px-3 py-1.5 bg-slate-50 hover:bg-sky-50 border border-slate-100 text-slate-600 rounded-xl text-xs font-medium transition-all duration-200 select-none cursor-pointer disabled:opacity-50"
          >
            {q.label}
          </button>
        ))}
      </div>

      {/* Chat input box */}
      <div className="p-4 border-t border-gray-100 bg-white rounded-b-2xl">
        <div className="flex gap-2 relative">
          <button
            onClick={() => handleSendMessage()}
            disabled={loading || !inputMessage.trim()}
            className="p-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5 rtl:rotate-180" />
          </button>
          
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSendMessage(); }}
            placeholder="اكتب استفسارك هنا حول الفنيين، أداء العمل، أجهزة التكييف المترابطة..."
            className="flex-1 pr-4 pl-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm text-slate-800 outline-none focus:border-primary focus:bg-white text-right"
          />
        </div>
      </div>

    </div>
  );
}
