/**
 * سكريبت Backup تلقائي لـ Firestore
 * يصدّر كل البيانات إلى ملف JSON محلي مع timestamp
 *
 * الاستخدام: npm run backup
 */
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as fs from 'fs';
import * as path from 'path';

const SERVICE_ACCOUNT_PATH = process.env.FIREBASE_SERVICE_ACCOUNT || './firebase-service-account.json';

if (!fs.existsSync(SERVICE_ACCOUNT_PATH)) {
  console.error('❌ ملف service account مش موجود!');
  console.error('');
  console.error('عشان تنزله:');
  console.error('  1) افتح: https://console.firebase.google.com/project/_/settings/serviceaccounts/adminsdk');
  console.error('  2) اضغط "Generate new private key"');
  console.error('  3) احفظ الملف باسم: firebase-service-account.json');
  console.error('  4) شغّل: npm run backup');
  console.error('');
  console.error('⚠️  مهم: ضيف الملف ده في .gitignore وما تشاركوش مع حد!');
  process.exit(1);
}

if (getApps().length === 0) {
  initializeApp({
    credential: cert(SERVICE_ACCOUNT_PATH),
  });
}

const db = getFirestore();

async function backupCollection(name: string): Promise<any[]> {
  const snapshot = await db.collection(name).get();
  const docs: any[] = [];
  snapshot.forEach(doc => {
    docs.push({ _id: doc.id, ...doc.data() });
  });
  return docs;
}

async function main() {
  console.log('🔄 جاري عمل نسخة احتياطية لقاعدة البيانات...\n');

  const collections = [
    'users',
    'customers',
    'maintenance_orders',
    'contracts',
    'invoices',
    'payments',
    'expenses',
    'employees',
    'suppliers',
    'products',
    'inventory_movements',
    'notifications',
    'settings',
  ];

  const backup: Record<string, any[]> = {};

  for (const col of collections) {
    process.stdout.write(`  → ${col}... `);
    try {
      backup[col] = await backupCollection(col);
      console.log(`✓ (${backup[col].length} مستند)`);
    } catch (e: any) {
      console.log(`✗ خطأ: ${e.message}`);
      backup[col] = [];
    }
  }

  // Sub-collections
  process.stdout.write(`  → customers/*/devices (sub-collection)... `);
  try {
    const devicesSnapshot = await db.collectionGroup('devices').get();
    const devices: any[] = [];
    devicesSnapshot.forEach(doc => {
      devices.push({ _id: doc.id, _path: doc.ref.path, ...doc.data() });
    });
    backup['devices'] = devices;
    console.log(`✓ (${devices.length} مستند)`);
  } catch (e: any) {
    console.log(`✗ خطأ: ${e.message}`);
  }

  process.stdout.write(`  → employees/*/attendance (sub-collection)... `);
  try {
    const attSnapshot = await db.collectionGroup('attendance').get();
    const attendance: any[] = [];
    attSnapshot.forEach(doc => {
      attendance.push({ _id: doc.id, _path: doc.ref.path, ...doc.data() });
    });
    backup['attendance'] = attendance;
    console.log(`✓ (${attendance.length} مستند)`);
  } catch (e: any) {
    console.log(`✗ خطأ: ${e.message}`);
  }

  // حفظ النسخة الاحتياطية
  const backupsDir = path.join(process.cwd(), 'backups');
  if (!fs.existsSync(backupsDir)) {
    fs.mkdirSync(backupsDir, { recursive: true });
  }

  const ts = new Date().toISOString().replace(/[:.]/g, '-').split('.')[0];
  const filename = `backup-${ts}.json`;
  const filepath = path.join(backupsDir, filename);

  fs.writeFileSync(filepath, JSON.stringify(backup, null, 2), 'utf-8');

  const sizeKB = (fs.statSync(filepath).size / 1024).toFixed(1);
  console.log('');
  console.log(`✅ تم حفظ النسخة الاحتياطية بنجاح!`);
  console.log(`   📁 الملف: ${filepath}`);
  console.log(`   📊 الحجم: ${sizeKB} KB`);
  console.log('');

  // إحصائيات
  const totalDocs = Object.values(backup).reduce((sum, arr) => sum + arr.length, 0);
  console.log(`📈 إجمالي المستندات: ${totalDocs}`);

  // الاحتفاظ بآخر 30 نسخة فقط
  const allBackups = fs.readdirSync(backupsDir)
    .filter(f => f.startsWith('backup-') && f.endsWith('.json'))
    .sort()
    .reverse();
  if (allBackups.length > 30) {
    const toDelete = allBackups.slice(30);
    toDelete.forEach(f => {
      fs.unlinkSync(path.join(backupsDir, f));
      console.log(`   🗑️  تم حذف نسخة قديمة: ${f}`);
    });
  }

  console.log('');
  console.log(`💡 نصيحة: ضع هذا السكريبت في cron job يومياً`);
  console.log(`   مثال: 0 2 * * * cd /path/to/project && npm run backup`);
}

main().catch(e => {
  console.error('❌ فشل النسخ الاحتياطي:', e);
  process.exit(1);
});
