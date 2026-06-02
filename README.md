# ❄️ M Group Cool ERP & CRM (M-Group-Cool-ERP)

نظام متكامل لإدارة موارد المؤسسة (ERP) وإدارة علاقات العملاء (CRM) مصمم خصيصاً لشركة **M Group Cool** لخدمات التكييف والتبريد في جمهورية مصر العربية. يجمع النظام بين الكفاءة العالية في العمليات الفنية والتحكم والرقابة المالية الصارمة مع استخدام الذكاء الاصطناعي كشريك مالي وتقني متفوق.

An enterprise-grade, full-stack ERP & CRM application designed specifically for **M Group Cool**, Egypt's leading HVAC and maintenance services company. This suite combines rigorous financial controls, technicians workflows, real-time metrics, bilingual AI assistant capabilities, and deep telemetry charts under an eye-safe dark theme.

---

## 🚀 المميزات الرئيسية (Core Features)

### 📅 1. إدارة الحسابات والشركاء (Finance & Multi-Vault Ledger)
- **إدارة الخزائن الموزعة**: دفاتر حسابات مفصلة للخزينة الرئيسية، وخزينة مخرن الدعم الفني، والحساب البنكي الرئيسي (البنك الأهلي المصري).
- **مسحوبات وتوزيع أرباح الشركاء**: حسابات دقيقة للمهندس **محمد أشرف** والمهندس **محمود** مع نسب شراكة ديناميكية مرنة (50/50, 40/60, 30/70).
- **التدفق النقدي الفوري**: مراقبة المقبوضات والمصروفات والأرصدة اليومية والشهرية مع رسومات بيانية ذكية.

### 🧾 2. عروض الأسعار والتحويل بنقرة واحدة (Quotation Engine)
- **منشئ عروض الأسعار الفنية**: تصميم وتتبع عروض الأسعار للعملاء بحالاتها المختلفة (معلق، مقبول، مرفوض).
- **التحويل التلقائي المتكامل**: نقرة واحدة كافية لتحويل عرض المقبول لـ:
  - **فاتورة مبيعات ممتازة** (بند حسابي مستقل).
  - **أمر تركيب فوري** للطاقم الفني وتحديد المواعيد.
  - **أمر صيانة دورية وغسيل** لتفادي المشاكل مستقبلاً.

### 🛡️ 3. التحكم بالضمانات والروابط (Warranty Matrix)
- **الضمان الثنائي**: التمييز الصارم والمتابعة الزمنية الدقيقة لضمان الشركة (**M Group Cool**) مقابل ضمان المصنع الرئيسي (شارب، كاريير، إلخ).
- **مؤشر انتهاء الضمان**: علامات وإشعارات ذكية تنبه باقتراب انتهاء فترات الحماية لتسويق باقات التجديد.

### 🚚 4. الأصول وحركة العُهَد والسيارات (Asset & Fleet Custody)
- **أصول الورش والدعم الفني**: جرد دقيق لمعدات الشركة الثمينة (طلمبات الفاكيوم، بوردات كابل الضغط، تيجان النحاس) وربطها بعهدة الفني المسؤول.
- **إدارة المركبات وسيارات الحركة**: جدول تتبع رخص المركبات وتواريخ انتهاء التأمين وصيانة الأسطول مع رادارات تنبيهية تمنع انقطاع النقل والتركيب.

### 📊 5. حسابات الموردين والصرف المستنداتي (Suppliers Ledger)
- **دفتر حسابات الموردين المترابط**: تتبع فواتير التوريد، الدفعات، والأرصدة الدائنة والمدينة لكل مورد (موزعي النحاس، قطع الغيار، ومصنعي الأجهزة).
- **الصرف المتكامل**: عند تسجيل دفعة للمورد، يتم ترحيل الخصم آلياً من الخزنة المحددة لضمان تطابق الأوراق والمستندات.

### 🤖 6. المساعد الصوتي والتحليل الذكي بالذكاء الاصطناعي (Bilingual AI Hub)
- **محلل البيانات الذكي**: يستدعي النموذج المتطور `gemini-3.5-flash` لقراءة سياق الشركة وتحليل "الخدمة الأكثر ربحية"، "الفنيين الأكثر كفاءة ومبيعات"، و"عقود الصيانة القريبة من الانتهاء".
- **المساعد الصوتي الثنائي**: دعم كامل للأوامر الصوتية باللغتين العربية والانجليزية لبناء تجربة تصفح وعمل غاية في السلاسة والسرعة.

---

## 🛠️ التقنيات المستخدمة (Tech Stack)

- **Front-End Framework**: React 19 + TypeScript 5
- **Build Engine**: Vite + Esbuild (Bundling backend compilation safely inside CommonJS with zero-startup conflicts)
- **Styling**: Tailwind CSS v4 (Beautiful high-contrast cosmic interface)
- **Database & Auth**: Firebase Firestore & Firebase Authentication (Dynamic offline-first caching)
- **Artificial Intelligence**: SDK `@google/genai` with model `gemini-3.5-flash` (Proxy API call architecture for enhanced key hiding)
- **Animations**: `motion` for beautiful state transitions.
- **Charts & Data Visuals**: `recharts` for tracking financial and operational telemetry.
- **Icons**: Icons imported exclusively from `lucide-react`.

---

## ⚙️ طريقة التشغيل والتركيب (Local Development Setup)

### 1. تثبيت الحزم (Install Dependencies)
```bash
npm install
```

### 2. إعداد مفاتيح البيئة (Environment Setup)
قم بإنشاء ملف `.env` في المجلد الرئيسي للبرنامج واملأ البيانات اعتماداً على `.env.example`:
```env
GEMINI_API_KEY=your_gemini_api_key_here
```

### 3. تشغيل الخادم في بيئة التطوير (Run Local Dev Server)
يعمل التطبيق كبرنامج كامل (Full-stack Server + Client) على المنفذ `3000`:
```bash
npm run dev
```
افتح الرابط التالي في المتصفح: `http://localhost:3000`

---

## 🛡️ النشر والترقية (Production Deployment Workflow)

### 1. البناء والتحزيم المترابط (Build Project)
لبناء ملفات الواجهة والباك-إند المجمعة في ملف مستقل داخل `dist`:
```bash
npm run build
```

### 2. التشغيل والبدء في السيرفر السحابي (Production Start)
```bash
npm start
```

### 3. متطلبات النشر على السيرفرات السحابية (Cloud Run & Vercel Keys)
يتطلب تشغيل الخادم على سحابة Google Cloud Run أو المنصات الشبيهة تمرير المتغيرات البيئية التالية في لوحة تحكم الخادم لتقديم الدعم الكامل للذكاء الاصطناعي وقاعدة البيانات الحية:
- `GEMINI_API_KEY`: مفتاح الذكاء الاصطناعي Gemini للتحليلات.

---

🔒 **M Group Cool ERP - تم البناء بكل فخر للمحافظة على أجواء غرفكم رطبة وذكية.**
🔒 **M Group Cool ERP - Engineered proudly to keep your air cool and your operations smarter.**
