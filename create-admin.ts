/**
 * سكريبت إنشاء أول مشرف (Super Admin) في النظام
 *
 * الاستخدام:
 *   npm run create-admin
 *   ثم اتبع التعليمات
 *
 * يتطلب: ملف firebase-service-account.json (انظر scripts/backup-firestore.ts)
 */
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import * as fs from 'fs';
import * as readline from 'readline';

const SERVICE_ACCOUNT_PATH = process.env.FIREBASE_SERVICE_ACCOUNT || './firebase-service-account.json';

if (!fs.existsSync(SERVICE_ACCOUNT_PATH)) {
  console.error('❌ ملف service account مش موجود!');
  console.error('   نزّله من Firebase Console وحطه في: ' + SERVICE_ACCOUNT_PATH);
  process.exit(1);
}

if (getApps().length === 0) {
  initializeApp({ credential: cert(SERVICE_ACCOUNT_PATH) });
}

const auth = getAuth();
const db = getFirestore();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function ask(question: string): Promise<string> {
  return new Promise(resolve => rl.question(question, ans => resolve(ans.trim())));
}

async function main() {
  console.log('');
  console.log('╔════════════════════════════════════════════════╗');
  console.log('║  إنشاء حساب المشرف العام (Super Admin)        ║');
  console.log('╚════════════════════════════════════════════════╝');
  console.log('');

  const email = await ask('البريد الإلكتروني: ');
  const password = await ask('كلمة المرور (8 أحرف على الأقل): ');
  const name = await ask('الاسم الكامل: ');
  const phone = await ask('رقم الهاتف (اختياري): ');

  if (!email || !password || !name) {
    console.error('❌ كل البيانات الأساسية مطلوبة');
    rl.close();
    process.exit(1);
  }

  if (password.length < 8) {
    console.error('❌ كلمة المرور لازم تكون 8 أحرف على الأقل');
    rl.close();
    process.exit(1);
  }

  console.log('');
  console.log('🔄 جاري إنشاء المستخدم...');

  let userRecord;
  try {
    // تحقق إذا كان المستخدم موجود
    try {
      userRecord = await auth.getUserByEmail(email);
      console.log(`⚠️  المستخدم موجود فعلاً (uid: ${userRecord.uid})`);
      const update = await ask('تحديث صلاحياته لـ super_admin؟ (y/n): ');
      if (update.toLowerCase() !== 'y') {
        console.log('تم الإلغاء.');
        rl.close();
        return;
      }
    } catch {
      // المستخدم مش موجود، أنشئه
      userRecord = await auth.createUser({
        email,
        password,
        displayName: name,
        emailVerified: true,
      });
      console.log(`✓ تم إنشاء حساب Authentication (uid: ${userRecord.uid})`);
    }

    // إنشاء/تحديث وثيقة المستخدم في Firestore
    const userDoc = {
      uid: userRecord.uid,
      email,
      name,
      phone: phone || '',
      role: 'super_admin',
      needsPasswordChange: false,
      createdAt: new Date().toISOString(),
    };

    await db.collection('users').doc(userRecord.uid).set(userDoc, { merge: true });
    console.log(`✓ تم حفظ بيانات المستخدم في Firestore`);

    console.log('');
    console.log('╔════════════════════════════════════════════════╗');
    console.log('║         ✅ تم إنشاء المشرف بنجاح! ✅          ║');
    console.log('╚════════════════════════════════════════════════╝');
    console.log('');
    console.log('بيانات الدخول:');
    console.log(`   📧 البريد: ${email}`);
    console.log(`   🔑 كلمة المرور: ${password}`);
    console.log(`   👤 الاسم: ${name}`);
    console.log(`   🛡️  الصلاحية: super_admin`);
    console.log('');
    console.log('افتح التطبيق وسجّل دخول بهذه البيانات.');
    console.log('');

  } catch (e: any) {
    console.error('❌ خطأ:', e.message);
    rl.close();
    process.exit(1);
  }

  rl.close();
}

main().catch(e => { console.error(e); process.exit(1); });
