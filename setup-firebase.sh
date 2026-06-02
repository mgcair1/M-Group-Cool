#!/usr/bin/env bash
# ============================================================
# سكريبت إعداد Firebase التلقائي لمشروع M Group Cool
# ============================================================
set -e

# الألوان
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   إعداد Firebase لمشروع M Group Cool ERP & CRM            ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# ============================================================
# الخطوة 1: التحقق من Firebase CLI
# ============================================================
echo -e "${YELLOW}[1/6] التحقق من Firebase CLI...${NC}"
if ! command -v firebase &> /dev/null; then
  echo -e "${YELLOW}Firebase CLI غير مثبت. هل تريد تثبيته الآن؟ (y/n)${NC}"
  read -r install_cli
  if [ "$install_cli" = "y" ] || [ "$install_cli" = "Y" ]; then
    npm install -g firebase-tools
    echo -e "${GREEN}✓ تم تثبيت Firebase CLI بنجاح${NC}"
  else
    echo -e "${RED}يجب تثبيت Firebase CLI أولاً. شغّل: npm install -g firebase-tools${NC}"
    exit 1
  fi
else
  echo -e "${GREEN}✓ Firebase CLI مثبت ($(firebase --version | head -1))${NC}"
fi
echo ""

# ============================================================
# الخطوة 2: تسجيل الدخول في Firebase
# ============================================================
echo -e "${YELLOW}[2/6] تسجيل الدخول في Firebase...${NC}"
echo -e "${BLUE}سيفتح المتصفح لتسجيل الدخول بحساب Google الخاص بك${NC}"
firebase login --no-localhost || firebase login
echo -e "${GREEN}✓ تم تسجيل الدخول${NC}"
echo ""

# ============================================================
# الخطوة 3: إنشاء أو اختيار مشروع Firebase
# ============================================================
echo -e "${YELLOW}[3/6] اختيار مشروع Firebase...${NC}"
echo ""
echo "اختياراتك:"
echo "  1) إنشاء مشروع جديد"
echo "  2) استخدام مشروع موجود"
echo ""
read -p "اختر (1 أو 2): " project_choice

if [ "$project_choice" = "1" ]; then
  read -p "أدخل اسم المشروع (مثال: m-group-cool-prod): " project_id
  read -p "أدخل اسم العرض (مثال: M Group Cool Production): " display_name
  echo -e "${BLUE}جاري إنشاء المشروع...${NC}"
  firebase projects:create "$project_id" --display-name "$display_name"
  echo -e "${GREEN}✓ تم إنشاء المشروع: $project_id${NC}"
else
  echo -e "${BLUE}قائمة مشاريعك:${NC}"
  firebase projects:list
  read -p "أدخل project ID اللي عاوز تستخدمه: " project_id
fi

# حفظ المشروع كافتراضي
firebase use "$project_id" --add
echo -e "${GREEN}✓ تم اختيار المشروع: $project_id${NC}"
echo ""

# ============================================================
# الخطوة 4: استخراج إعدادات Web App
# ============================================================
echo -e "${YELLOW}[4/6] الحصول على إعدادات Web App...${NC}"
echo ""
echo -e "${BLUE}لازم تعمل Web App في Firebase Console:${NC}"
echo "  1) افتح: https://console.firebase.google.com/project/$project_id/settings/general"
echo "  2) في قسم 'Your apps' اضغط على أيقونة </> (Web)"
echo "  3) سمّيه: 'M Group Cool Web App'"
echo "  4) لا تختار Firebase Hosting (هنعمله بعدين)"
echo "  5) انسخ الـ config object"
echo ""
echo -e "${YELLOW}اضغط Enter لما تخلّص...${NC}"
read

# طلب الـ config من المستخدم
echo ""
echo -e "${BLUE}الصق قيم الـ config (سطر بسطر):${NC}"
read -p "apiKey: " api_key
read -p "authDomain: " auth_domain
read -p "projectId: " firestore_project_id
read -p "storageBucket: " storage_bucket
read -p "messagingSenderId: " sender_id
read -p "appId: " app_id

# كتابة الـ config
cat > src/firebase-applet-config.json <<EOF
{
  "apiKey": "$api_key",
  "authDomain": "$auth_domain",
  "projectId": "$firestore_project_id",
  "storageBucket": "$storage_bucket",
  "messagingSenderId": "$sender_id",
  "appId": "$app_id",
  "firestoreDatabaseId": "(default)"
}
EOF
echo -e "${GREEN}✓ تم حفظ إعدادات Firebase${NC}"
echo ""

# ============================================================
# الخطوة 5: تفعيل الخدمات
# ============================================================
echo -e "${YELLOW}[5/6] تفعيل الخدمات في Firebase...${NC}"
echo ""
echo -e "${BLUE}لازم تفعّل الخدمات التالية من Firebase Console:${NC}"
echo ""
echo "  📋 Authentication:"
echo "     https://console.firebase.google.com/project/$project_id/authentication/providers"
echo "     - فعّل Email/Password"
echo "     - فعّل Google (اختياري)"
echo ""
echo "  📋 Firestore Database:"
echo "     https://console.firebase.google.com/project/$project_id/firestore"
echo "     - اضغط 'Create database'"
echo "     - اختر 'Start in production mode'"
echo "     - اختر المنطقة الأقرب (مثل eur3 أو nam5)"
echo ""
echo "  📋 Storage:"
echo "     https://console.firebase.google.com/project/$project_id/storage"
echo "     - اضغط 'Get started'"
echo "     - اختر 'Start in production mode'"
echo ""
echo -e "${YELLOW}اضغط Enter لما تخلّص تفعيل كل الخدمات...${NC}"
read

# ============================================================
# الخطوة 6: نشر القواعد والـ Hosting
# ============================================================
echo -e "${YELLOW}[6/6] بناء ونشر التطبيق...${NC}"
echo ""
echo -e "${BLUE}جاري بناء التطبيق...${NC}"
npm run build

echo -e "${BLUE}جاري نشر قواعد Firestore...${NC}"
firebase deploy --only firestore:rules,firestore:indexes

echo -e "${BLUE}جاري نشر قواعد Storage...${NC}"
firebase deploy --only storage

echo -e "${BLUE}جاري نشر التطبيق...${NC}"
firebase deploy --only hosting

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║              🎉 تم النشر بنجاح! 🎉                         ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}روابط التطبيق:${NC}"
echo "  🌐 https://${project_id}.web.app"
echo "  🌐 https://${project_id}.firebaseapp.com"
echo ""
echo -e "${YELLOW}الخطوة التالية:${NC}"
echo "  1) افتح: https://console.firebase.google.com/project/$project_id/authentication/users"
echo "  2) اضغط 'Add user'"
echo "  3) أنشئ حساب المشرف الأول:"
echo "     - البريد: mgc.air1@gmail.com (أو غيره)"
echo "     - كلمة المرور: اختار كلمة قوية"
echo "  4) افتح التطبيق وسجّل دخول بنفس البيانات"
echo ""
echo -e "${GREEN}للنشر مرة ثانية بعد أي تعديل، شغّل:${NC}"
echo "  npm run deploy"
echo ""
