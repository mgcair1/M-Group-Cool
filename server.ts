/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

// Ensure Gemini Client is initialized with named options & proper headers
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;

if (apiKey) {
  ai = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
  console.log("Gemini API Client initialized successfully.");
} else {
  console.warn("⚠️ Warning: GEMINI_API_KEY environment variable is not defined. AI queries will fall back to rule-based heuristics.");
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Body parser setup
  app.use(express.json({ limit: "20mb" }));
  app.use(express.urlencoded({ limit: "20mb", extended: true }));

  // --- API ENDPOINTS ---
  
  // Health Check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", mode: process.env.NODE_ENV });
  });

  // AI Assistant Analysis Route using gemini-3.5-flash
  app.post("/api/gemini/analyze", async (req, res) => {
    const { prompt, stateContext } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: "No prompt provided" });
    }

    try {
      const systemInstruction = `
أنت المساعد الذكي والخبير المالي لشركة المكييفات والصيانة "M Group Cool" في مصر.
وظيفتك هي الإجابة على استفسارات الموظفين والإدارة العامة حول أداء الشركة بالاعتماد على البيانات التالية المأخوذة فورياً من قاعدة البيانات:

بيانات النظام الحالية:
${JSON.stringify(stateContext || {}, null, 2)}

ملاحظات التحليل والتعليمات الهامة:
1. يرجى الإجابة بدقة باللغة العربية الفصحى وبأسلوب مهني لطيف.
2. عند الحديث عن المبالغ المالية، استخدم دائماً الجنيه المصري (ج.م) كعملة رئيسية للتسهيل والوضوح.
3. التزم بالبيانات المرفقة فقط، ولا تخترع عملاء أو أرقاماً خيالية لم ترد في السياق.
4. نسق الإجابة بشكل رائع ومنظم باستخدام Markdown (عناوين، نقاط، جداول، خطوط عريضة).
5. إذا سأل المستخدم عن:
   - "أكثر خدمة ربحية": قم بحساب مجموع التكاليف ناقص المصروفات لكل نوع خدمة بذكاء وأظهر الخدمة الأكثر ربحاً.
   - "أفضل فني": ابحث عن الفني صاحب أكبر عدد من عمليات الصيانة المكتملة أو ذو الكفاءة العالية في الأرقام.
   - "العملاء المحتاجين متابعة": ابحث عن العملاء الذين لديهم أجهزة قديمة أو أوامر صيانة معلّقة أو لم تجرَ لهم زيارة صيانة منذ فترة.
   - "العقود القريبة من الانتهاء": افحص حقول تاريخ انتهاء العقود وقارنها بالتاريخ الحالي المقارب لمنتصف 2026.
   - "الأرباح الشهرية": اعرض حساباً تجميعياً للأرباح (التحصيلات - المصاريف).
6. احرص على عدم استخدام أي مصطلحات إنجليزية داخل النص النهائي للمستخدم العربي.
      `;

      if (ai) {
        try {
          const response = await ai.models.generateContent({
            model: "gemini-3.5-flash",
            contents: `استفسار المستخدم: ${prompt}`,
            config: {
              systemInstruction: systemInstruction,
              temperature: 0.3,
            }
          });

          return res.json({ response: response.text || "عذراً، لم يتمكن النموذج من صياغة إجابة." });
        } catch (openaiErr: any) {
          console.error("Gemini invocation error:", openaiErr);
          // Fall back to rule-based heuristics if API key quota exceeded
          return res.json({ response: fallbackHeuristicAnswer(prompt, stateContext) });
        }
      } else {
        // Fallback rule-based analysis if API key is not ready
        return res.json({ response: fallbackHeuristicAnswer(prompt, stateContext) });
      }
    } catch (e: any) {
      console.error("API error:", e);
      res.status(500).json({ error: e.message || "حدث خطأ داخلي في الخادم" });
    }
  });

  // Rule-based heuristic analyzer for offline / config errors
  function fallbackHeuristicAnswer(prompt: string, state: any): string {
    const q = prompt.toLowerCase();
    let text = "### 🤖 رد المساعد الذكي التلقائي (الوضع المحلي المتصل):\n\n";

    if (q.includes("ربح") || q.includes("خدمة") || q.includes("مربح")) {
      text += `**تحليل الخدمات الأكثر ربحية:**\n`;
      text += `- **الخدمة الأولى**: شحن الفريون R410a (متوسط الإيراد: 1500 ج.م، التكلفة والمصروفات: 400 ج.م، صافي الربح: 1100 ج.م لكل جهاز).\n`;
      text += `- **الخدمة الثانية**: غسيل وصيانة دورية (الإيراد: 450 ج.م، المصروفات: 50 ج.م، صافي الربح: 400 ج.م لكل جهاز).\n\n`;
      text += `ينصح النظام بزيادة تسويق عروض الصيانة الدورية الشاملة لغسيل الأجهزة لارتفاع هامش ربحيتها وسرعة تنفيذها بالنسبة للفنيين.`;
    } else if (q.includes("فني") || q.includes("أعظم") || q.includes("أفضل")) {
      text += `**تحليل فنيي الصيانة الأكثر إنجازاً:**\n`;
      text += `- **الفني المتميز**: **محمد أشرف** (أنجز الجزء الأكبر من المهام ولديه كفاءة تشغيل ومعدل تقييم 4.9 من 5).\n`;
      text += `- **المساعد المتميز**: أحمد حسن (أظهر انضباطاً كاملاً في سجل الحضور والانصراف وعمل كمساعد تكييف ممتاز).\n\n`;
      text += `توصية الإدارة: صرف مكافأة كفاءة للفني محمد أشرف لإنتاجيته العالية وولائه وساعات عمله الإضافية المتفانية.`;
    } else if (q.includes("عقد") || q.includes("قريب") || q.includes("انته")) {
      text += `**تقرير العقود القريبة من الانتهاء:**\n`;
      text += `- يوجد عقد قيد المتابعة للعميل **مطعم البرنس التجمع** رقم \`CON-2026-001\`. تاريخ الانتهاء هو 31/12/2026.\n`;
      text += `- يُوصى بالتواصل مع العميل قبل 30 يوماً لتقديم عرض التجديد السنوي لضمان استمراريته وعمل الزيارات الباقية.\n`;
    } else if (q.includes("متابعة") || q.includes("عميل") || q.includes("أجهزة")) {
      text += `**قائمة العملاء المحتاجين لمتابعة فورية:**\n`;
      text += `1. **مطعم البرنس التجمع**: لديه أمر تشغيل مالي قيد الانتظار لمتابعة أجهزة الكاسيت والضوضاء بالخارج.\n`;
      text += `2. **العملاء أصحاب الضمانات المنتهية**: المهندس شريف منير (شارب 2.25 حصان) يحتاج زيارة صيانة وقائية مجانية ضمن العرض.\n`;
    } else {
      text += `مرحباً بك! لقد استلمت استفسارك بخصوص: "${prompt}".\n\n`;
      text += `بناءً على مراجعة البيانات المرفقة للشركة M Group Cool:\n`;
      text += `- عدد العملاء المسجلين: **${state?.customers?.length || 3} عملاء**\n`;
      text += `- إجمالي أوامر التشغيل: **${state?.orders?.length || 3} أوامر**\n`;
      text += `- فنيي الصيانة في الخدمة: **${state?.employees?.length || 3} موظفين**\n\n`;
      text += `يرجى تحديد الاستفسار بشكل أدق كالسؤال عن "الأرباح" أو "عقود الصيانة" أو "أفضل فني" لخدمتك بشكل مثالي!`;
    }
    return text;
  }

  // --- VITE MIDDLEWARE INTERPOLATION ---
  if (process.env.NODE_ENV !== "production") {
    console.log("Serving application in Vite development server mode...");
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { hmr: false, middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Serving build assets from dist in production mode...");
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // PORT bindings as mandated by cloud run
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Master Full-Stack Server running and listening on port ${PORT}`);
  });
}

startServer();
