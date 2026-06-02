#!/usr/bin/env bash
# ============================================================
# Quick Deploy Script - النشر السريع للمبتدئين
# ============================================================
# هذا السكريبت بيعمل كل حاجة بضغطة زرار:
# 1. يتأكد من Firebase CLI
# 2. يبني التطبيق
# 3. ينشره
# ============================================================

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

clear
echo -e "${BLUE}╔════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   🚀 نشر سريع - M Group Cool                  ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════╝${NC}"
echo ""

# التحقق من Firebase CLI
echo -e "${YELLOW}🔍 التحقق من Firebase CLI...${NC}"
if ! command -v firebase &> /dev/null; then
  echo -e "${YELLOW}جاري تثبيت Firebase CLI...${NC}"
  npm install -g firebase-tools 2>&1 | tail -2
fi
echo -e "${GREEN}✓ Firebase CLI موجود${NC}"
echo ""

# التحقق من تسجيل الدخول
echo -e "${YELLOW}🔍 التحقق من تسجيل دخول Firebase...${NC}"
if ! firebase projects:list &>/dev/null; then
  echo -e "${YELLOW}محتاج تسجل دخول Firebase أول${NC}"
  echo -e "${BLUE}سيظهر رابط - افتحه في المتصفح وأكمل التسجيل${NC}"
  firebase login --no-localhost
fi
echo -e "${GREEN}✓ مسجل دخول${NC}"
echo ""

# التحقق من اختيار المشروع
echo -e "${YELLOW}🔍 التحقق من المشروع المختار...${NC}"
current_project=$(firebase use 2>/dev/null | grep -oP '(?<=Active Project: )[^\s]+' || echo "")
if [ -z "$current_project" ]; then
  echo -e "${YELLOW}اختار مشروع Firebase:${NC}"
  firebase use --add
fi
echo -e "${GREEN}✓ المشروع: $(firebase use 2>/dev/null | head -1)${NC}"
echo ""

# التحقق من ملف الإعدادات
echo -e "${YELLOW}🔍 التحقق من ملف الإعدادات...${NC}"
if grep -q "mock_api_key" src/firebase-applet-config.json 2>/dev/null; then
  echo -e "${RED}❌ ملف الإعدادات لازم البيانات الحقيقية!${NC}"
  echo -e "${YELLOW}افتح: src/firebase-applet-config.json${NC}"
  echo -e "${YELLOW}واستبدل البيانات الوهمية ببيانات مشروعك من Firebase Console${NC}"
  echo ""
  echo -e "${BLUE}اضغط Enter لما تخلص...${NC}"
  read
fi
echo -e "${GREEN}✓ الإعدادات جاهزة${NC}"
echo ""

# البناء
echo -e "${YELLOW}🔨 جاري بناء التطبيق...${NC}"
npm run build
echo -e "${GREEN}✓ تم البناء بنجاح${NC}"
echo ""

# النشر
echo -e "${YELLOW}🚀 جاري النشر...${NC}"
firebase deploy --only hosting,firestore:rules,firestore:indexes,storage 2>&1 | tee /tmp/deploy-output.log

# استخراج الرابط
echo ""
hosting_url=$(grep -oP 'Hosting URL: \K[^\s]+' /tmp/deploy-output.log | head -1)

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║         🎉 تم النشر بنجاح! 🎉                  ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}🌐 رابط التطبيق:${NC}"
echo -e "${GREEN}   $hosting_url${NC}"
echo ""
echo -e "${BLUE}📱 افتح الرابط على:${NC}"
echo "   • الكمبيوتر: في المتصفح"
echo "   • الموبايل: Chrome/Safari ثم \"إضافة للشاشة الرئيسية\""
echo ""
echo -e "${BLUE}👤 لو لسه ماعملتش مشرف:${NC}"
echo "   1. روح: https://console.firebase.google.com → Authentication → Add user"
echo "   2. أنشئ مستخدم بـ Email + Password"
echo "   3. روح Firestore Database → Start collection → users"
echo "   4. أضف document بـ ID = uid المستخدم"
echo "   5. أضف حقل: role = super_admin"
echo ""
