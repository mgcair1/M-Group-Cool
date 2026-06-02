/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  Customer,
  Device,
  MaintenanceOrder,
  Contract,
  Invoice,
  Payment,
  Expense,
  Employee,
  AttendanceRecord,
  Supplier,
  Product,
  InventoryMovement,
  NotificationItem,
  CompanySettings,
  UserRole,
  UserProfile
} from './types';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import firebaseConfig from './firebase-applet-config.json';

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const storage = getStorage(app);
export const isMockFirebase = false; // Always use real Firebase config to disable mock/local simulation services
import {
  collection,
  doc,
  setDoc as firestoreSetDoc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  where,
  addDoc,
  deleteDoc as firestoreDeleteDoc,
  updateDoc,
  collectionGroup,
  enableIndexedDbPersistence
} from 'firebase/firestore';
import { offlineStorage, SyncItem } from './indexedDb';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  signInWithPopup,
  GoogleAuthProvider
} from 'firebase/auth';

// --- FIREBASE ERROR HANDLER STRUCTURES (AS MANDATED BY SKILL BIOMARKERS) ---
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// In-Memory state for swift responsiveness and offline-first caching
interface AppState {
  currentUser: UserProfile | null;
  users: UserProfile[];
  customers: Customer[];
  devices: Device[];
  orders: MaintenanceOrder[];
  contracts: Contract[];
  invoices: Invoice[];
  payments: Payment[];
  expenses: Expense[];
  employees: Employee[];
  attendance: AttendanceRecord[];
  suppliers: Supplier[];
  products: Product[];
  movements: InventoryMovement[];
  notifications: NotificationItem[];
  settings: CompanySettings;
}

// Default settings
const DEFAULT_SETTINGS: CompanySettings = {
  companyName: "M Group Cool",
  logoData: "", // Default empty (will use a beautiful icon/image or base64)
  primaryColor: "#2563eb", // blue-600 (Beautiful Elegant Dark branding)
  secondaryColor: "#0f172a", // slate-900
  vatRate: 14,
  attendanceCheckIn: "09:00",
  attendanceCheckOut: "17:00",
  soundName: "notification_sound_1",
  
  // Custom Default Configurations
  language: 'ar',
  themeMode: 'dark',
  customNames: {
    customers_ar: "العملاء والأجهزة",
    customers_en: "Customers & CRM",
    orders_ar: "أوامر التشغيل وتكليف الفنيين",
    orders_en: "Service & Maintenance Orders",
    invoices_ar: "الحسابات والفواتير والتحصيلات",
    invoices_en: "Accounts, Invoices & Collections",
    payroll_ar: "الرواتب والحضور والشركاء",
    payroll_en: "Payroll, Attendance & Partners",
    inventory_ar: "المستودعات والمخازن والموردين",
    inventory_en: "Warehouses, Stocks & Suppliers"
  },
  fieldsConfig: [],
  showHideWidgets: {
    totalSales: true,
    activeOrders: true,
    expiringContracts: true,
    netProfits: true,
    ordersChart: true,
    salesChart: true,
    quickActions: true,
    alerts: true
  },
  customRoles: [
    { id: "R-1", code: "senior_technician", nameAr: "كبير فنيي تركيبات", nameEn: "Senior Installation Technician" },
    { id: "R-2", code: "warehouse_manager", nameAr: "أمين المستودع والمخازن", nameEn: "Warehouse Duty Manager" },
    { id: "R-3", code: "partner_collaborator", nameAr: "مستشار شريك رئيسي", nameEn: "Principal Partner" }
  ],
  auditLogs: [],
  deviceSignatures: {},
  periodicSchedules: [
    { id: "S-1", customerId: "CUS-000001", deviceId: "DEV-001", months: 3, nextDate: "15/08/2026", description: "غسيل الفلتر وتطهير كويل الوحدة الداخلية لضمان كفاءة التبريد" },
    { id: "S-2", customerId: "CUS-000002", deviceId: "DEV-002", months: 6, nextDate: "20/11/2026", description: "شحن ومراجعة نسبة الغاز وضغوط الفريون لجميع الأجهزة" }
  ],
  knowledgeBase: [
    { id: "K-1", titleAr: "التكييف لا يبرد إطلاقا", titleEn: "AC Not Cooling At All", solutionsAr: "1. فحص فريون R410A / R22\n2. تنظيف فلاتر الوحدتين\n3. استبدال كباستور الكمبريسور التالف\n4. التحقق من فولت التغذية للوحدة الخارجية", solutionsEn: "1. Check freon levels\n2. Clean indoor unit filters\n3. Swap failed dual compressor run capacitor\n4. Ensure standard line electrical voltage feed" },
    { id: "K-2", titleAr: "تساقط مياه من الفانرة الداخلية", titleEn: "Water Leaking Indoor Unit", solutionsAr: "1. تسليك خرطوم الصرف بالضغط وتطهير الفوهة\n2. ضبط ميزان الفانة العشوائي على الحائط\n3. إزالة الثلج المتراكم بسبب نقص شحن الفريون", solutionsEn: "1. Blow clear the condensed drain hose\n2. Recalibrate indoor unit panel wall mount level\n3. De-ice cooling coils triggered by low refrigerant volume" },
    { id: "K-3", titleAr: "ظهور صوت اهتزاز صاخب بالخارج", titleEn: "Outside Unit Vibrating Heavily", solutionsAr: "1. ربط مسامير تثبيت الكابولي والحوامل المعدنية\n2. تركيب كاوتشات أقدام مانعة للاهتزاز\n3. فحص مروحة التبريد للتأكد من سلامتها وعدم التكسر", solutionsEn: "1. Tighten steel shelf/support screws\n2. Put down anti-vibration rubber vibration mounts\n3. Certify cooling fan blades geometry has no cracks" }
  ]
};

// Initial realistic Egyptian mock data for instant professional look
const MOCK_EMPLOYEES: Employee[] = [
  {
    id: "EMP-001",
    name: "محمد أشرف",
    jobTitle: "فني تكييف وصيانة رئيسي",
    phone: "01012345678",
    email: "m.ashraf@mgroupcool.com",
    salary: 10000,
    baseSalary: 10000,
    hireDate: "15/01/2024",
    commissionRate: 10,
    partnershipType: "40/60"
  },
  {
    id: "EMP-002",
    name: "أحمد حسن",
    jobTitle: "فني تكييف مساعد",
    phone: "01123456789",
    email: "a.hassan@mgroupcool.com",
    salary: 6000,
    baseSalary: 6000,
    hireDate: "01/03/2024",
    commissionRate: 5,
    partnershipType: "none"
  },
  {
    id: "EMP-003",
    name: "عمرو دياب العسال",
    jobTitle: "محاسب مالي",
    phone: "01234567890",
    email: "amr.fin@mgroupcool.com",
    salary: 8000,
    baseSalary: 8000,
    hireDate: "10/02/2024",
    commissionRate: 0,
    partnershipType: "none"
  }
];

// Mock Customers
const MOCK_CUSTOMERS: Customer[] = [
  {
    id: "CUS-000001",
    name: "المهندس شريف منير",
    phone: "01099887766",
    phone2: "0225432109",
    email: "sherif.m@gmail.com",
    address: "شقة 4، عمارة 12، شارع التسعين الشمالي، التجمع الخامس",
    governorate: "القاهرة",
    region: "التجمع الخامس",
    customerSource: "فيسبوك",
    notes: "عميل VIP، يفضل مواعيد صيانة صباحية",
    rating: 5,
    createdAt: "10/05/2026",
    location: { latitude: 30.0305, longitude: 31.4722, address: "شارع التسعين، التجمع" }
  },
  {
    id: "CUS-000002",
    name: "الأستاذة مها علي",
    phone: "01223344556",
    email: "maha.ali@hotmail.com",
    address: "فيلّا 8، كمبوند الياسمين، الشيخ زايد",
    governorate: "الجيزة",
    region: "الشيخ زايد",
    customerSource: "توصية عميل",
    notes: "تركيب أجهزة إنفرتر موفرة للطاقة",
    rating: 4,
    createdAt: "15/05/2026",
    location: { latitude: 30.0211, longitude: 30.9734, address: "كمبوند الياسمين، الشيخ زايد" }
  },
  {
    id: "CUS-000003",
    name: "مطعم البرنس التجمع",
    phone: "01112223334",
    phone2: "01555667788",
    email: "info@elprince-eg.com",
    address: "مول سيلفر ستار، داون تاون، التجمع الخامس",
    governorate: "القاهرة",
    region: "التجمع الخامس",
    customerSource: "فيسبوك",
    notes: "صيانة دورية كل شهر لأجهزة المطبخ والصالة",
    rating: 5,
    createdAt: "20/05/2026",
    location: { latitude: 30.0223, longitude: 31.4429, address: "داون تاون، التجمع الخامِس" }
  }
];

// Mock Devices
const MOCK_DEVICES: Device[] = [
  {
    id: "DEV-001",
    customerId: "CUS-000001",
    brand: "شارب (Sharp)",
    type: "سبليت (Split)",
    capacity: "2.25 حصان",
    serialNumber: "SH-987654321",
    installationDate: "12/05/2026",
    warranty: "سنتين شامل الصيانة مجاناً"
  },
  {
    id: "DEV-002",
    customerId: "CUS-000002",
    brand: "كاريير (Carrier)",
    type: "كونسيلد (Concealed)",
    capacity: "3 حصان",
    serialNumber: "CR-123450987",
    installationDate: "17/05/2026",
    warranty: "5 سنوات على الضاغط"
  },
  {
    id: "DEV-003",
    customerId: "CUS-000003",
    brand: "إل جي (LG)",
    type: "مركزي (Cassette)",
    capacity: "5 حصان",
    serialNumber: "LG-555444333",
    installationDate: "21/05/2026",
    warranty: "بـدون ضمان - صيانة مباشرة"
  }
];

// Mock Orders
const MOCK_ORDERS: MaintenanceOrder[] = [
  {
    id: "WO-2026-000001",
    customerId: "CUS-000001",
    deviceId: "DEV-001",
    technicianId: "EMP-001",
    assistantId: "EMP-002",
    serviceType: "غسيل وصيانة دورية",
    status: "completed",
    date: "25/05/2026",
    cost: 450,
    collectionAmount: 450,
    expenses: 50,
    notes: "تم غسيل الوحدة الداخلية والخارجية وضبط الفريون"
  },
  {
    id: "WO-2026-000002",
    customerId: "CUS-000002",
    deviceId: "DEV-002",
    technicianId: "EMP-001",
    serviceType: "شحن فريون",
    status: "in_progress",
    date: "29/05/2026",
    cost: 1500,
    collectionAmount: 1000,
    expenses: 400,
    notes: "جاري البحث عن تسريب وشحن فريون R410a"
  },
  {
    id: "WO-2026-000003",
    customerId: "CUS-000003",
    deviceId: "DEV-003",
    technicianId: "EMP-002",
    serviceType: "معاينة وإصلاح",
    status: "new",
    date: "01/06/2026",
    cost: 300,
    collectionAmount: 0,
    expenses: 0,
    notes: "شكوى من ضعف التبريد وضوضاء بالوحدة الخارجية"
  }
];

// Mock Contracts
const MOCK_CONTRACTS: Contract[] = [
  {
    contractNumber: "CON-2026-001",
    customerId: "CUS-000003",
    value: 5000,
    devicesCount: 3,
    visitsCount: 6,
    startDate: "01/06/2026",
    endDate: "31/12/2026"
  }
];

// Mock Invoices
const MOCK_INVOICES: Invoice[] = [
  {
    invoiceNumber: "INV-2026-000001",
    type: "invoice",
    customerId: "CUS-000001",
    vatRate: 14,
    subtotal: 450,
    vatAmount: 63,
    totalAmount: 513,
    items: [
      { description: "خدمة غسيل تكييف شارب 2.25 حصان", quantity: 1, price: 450, total: 450 }
    ],
    date: "25/05/2026",
    status: "paid"
  },
  {
    invoiceNumber: "INV-2026-000002",
    type: "tax_invoice",
    customerId: "CUS-000002",
    vatRate: 14,
    subtotal: 1500,
    vatAmount: 210,
    totalAmount: 1710,
    items: [
      { description: "شحن فريون كلي R410a أصلي مع معالجة تسريب", quantity: 1, price: 1500, total: 1500 }
    ],
    date: "29/05/2026",
    status: "partially_paid"
  }
];

// Mock Payments
const MOCK_PAYMENTS: Payment[] = [
  {
    id: "PAY-001",
    invoiceId: "INV-2026-000001",
    customerId: "CUS-000001",
    amount: 513,
    paymentDate: "25/05/2026",
    paymentType: "نقدي"
  },
  {
    id: "PAY-002",
    invoiceId: "INV-2026-000002",
    customerId: "CUS-000002",
    amount: 1000,
    paymentDate: "29/05/2026",
    paymentType: "فودافون كاش"
  }
];

// Mock Expenses
const MOCK_EXPENSES: Expense[] = [
  {
    id: "EXP-001",
    amount: 1200,
    category: "قطع غيار",
    date: "14/05/2026",
    description: "شراء ريموتات تكييف متعددة وشاحن بطارية للفحص",
    paidTo: "محل السلام لقطع الغيار"
  },
  {
    id: "EXP-002",
    amount: 350,
    category: "انتقالات ووقود",
    date: "16/05/2026",
    description: "بنزين سيارة الصيانة للتجمع والشيخ زايد"
  }
];

// Mock Products
const MOCK_PRODUCTS: Product[] = [
  {
    id: "PRD-001",
    name: "أسطوانة فريون R410a هندي",
    quantity: 5,
    reorderLevel: 2,
    category: "فريون",
    price: 3200,
    cost: 2100,
    sellPrice: 3200,
    buyPrice: 2100,
    sku: "FRN-R410-IND"
  },
  {
    id: "PRD-002",
    name: "كابستور تكييف بمروحة 45/5 ميكرو فاراد",
    quantity: 15,
    reorderLevel: 5,
    category: "قطع غيار كهربائية",
    price: 250,
    cost: 120,
    sellPrice: 250,
    buyPrice: 120,
    sku: "CAP-45-5"
  },
  {
    id: "PRD-003",
    name: "خرطوم صرف مرن 1 بوصة لفافة",
    quantity: 3,
    reorderLevel: 1,
    category: "مستلزمات صيانة",
    price: 180,
    cost: 100,
    sellPrice: 180,
    buyPrice: 100,
    sku: "DR-HOSE-1IN"
  }
];

// Mock Inventory Movements
const MOCK_MOVEMENTS: InventoryMovement[] = [
  {
    id: "MVT-001",
    productId: "PRD-001",
    type: "in",
    quantity: 6,
    date: "10/05/2026",
    notes: "شراء كمية من الوكيل المعتمد"
  },
  {
    id: "MVT-002",
    productId: "PRD-001",
    type: "out",
    quantity: 1,
    date: "29/05/2026",
    notes: "استهلاك فني بأمر WO-2026-000002"
  }
];

// Mock Attendance for May
const MOCK_ATTENDANCE: AttendanceRecord[] = [
  {
    id: "ATT-001",
    employeeId: "EMP-001", // محمد أشرف
    date: "24/05/2026", // الأحد
    checkIn: "08:55",
    checkOut: "19:05",
    workingHours: 10,
    overtimeHours: 0,
    status: "present"
  },
  {
    id: "ATT-002",
    employeeId: "EMP-001", // محمد أشرف
    date: "25/05/2026", // الاثنين
    checkIn: "09:00",
    checkOut: "20:00",
    workingHours: 11,
    overtimeHours: 1,
    status: "present"
  },
  {
    id: "ATT-003",
    employeeId: "EMP-001", // محمد أشرف
    date: "29/05/2026", // الجمعة ! (يومين عمل لمحمد أشرف)
    checkIn: "08:50",
    checkOut: "17:00",
    workingHours: 8,
    overtimeHours: 0,
    status: "present"
  }
];

// Mock Suppliers
const MOCK_SUPPLIERS: Supplier[] = [
  {
    id: "SUP-001",
    name: "البيت الهندسي للتبريد",
    contactPerson: "المهندس أسامة حجازي",
    phone: "01055667788",
    email: "osama@mechanicalhome.com",
    address: "شارع نجيب الريحاني، العتبة، القاهرة"
  }
];

// Mock Notifications
const MOCK_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "NTF-001",
    title: "تم إضافة عميل جديد",
    body: "تم تسجيل العميل المهندس شريف منير بنجاح",
    date: "10/05/2026 11:30",
    type: "new_customer",
    read: false
  },
  {
    id: "NTF-002",
    title: "عقد يقترب من الانتهاء",
    body: "يرجى العلم بأن العقد رقم CON-2026-001 سينتهي قريباً",
    date: "20/05/2026 09:00",
    type: "contract_warning",
    read: false
  },
  {
    id: "NTF-003",
    title: "الكمية قاربت على النفاد والمطالبة بالتموين",
    body: "رصيد 'أسطوانة فريون R410a هندي' وصل للحد الأدنى (3 وحدات)",
    date: "29/05/2026 14:15",
    type: "low_stock",
    read: false
  }
];

class DataService {
  private state: AppState;
  private listeners: (() => void)[] = [];
  private activeSubscriptions: (() => void)[] = [];
  private pendingQueuePaths: Set<string> = new Set();
  private syncStatus: 'online' | 'offline' | 'syncing' | 'synced' = 'online';
  private isProcessingQueue = false;

  constructor() {
    this.state = this.loadFromCache();
    this.loadFromIndexedDB();

    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.setSyncStatus('online');
        this.processSyncQueue();
      });
      window.addEventListener('offline', () => {
        this.setSyncStatus('offline');
      });
      this.syncStatus = navigator.onLine ? 'online' : 'offline';
    }
    this.ensureSuperAdmin();

    // Ensure all extended HVAC fields exist
    const settings = this.state.settings;
    if (!settings.cashRegisters) {
      settings.cashRegisters = [
        { id: 'CR-1', nameAr: 'خزينة الكاش الرئيسية - المعادي', nameEn: 'Main Cash Register - Maadi', balance: 45000 },
        { id: 'CR-2', nameAr: 'عهدة الفنيين والمأموريات', nameEn: 'Technicians Petty Cash', balance: 8500 }
      ];
    }
    if (!settings.bankAccounts) {
      settings.bankAccounts = [
        { id: 'BA-1', nameAr: 'البنك الأهلي المصري - الشركة', nameEn: 'National Bank of Egypt - MGC', accountNumber: '1993005844392211', balance: 185000 },
        { id: 'BA-2', nameAr: 'بنك مصر - التشغيلي', nameEn: 'Banque Misr - Operations', accountNumber: '2440058348922112', balance: 93200 }
      ];
    }
    if (!settings.partnerWithdrawals) {
      settings.partnerWithdrawals = [
        { id: 'PW-1', partner: 'Mohamed Ashraf', amount: 5000, date: '10/05/2026', reason: 'سحب مالي مقدم للربع الأول' },
        { id: 'PW-2', partner: 'Mahmoud', amount: 4000, date: '12/05/2026', reason: 'مصاريف تشغيل سحب شخصي' }
      ];
    }
    if (!settings.partnerSplitRatio) {
      settings.partnerSplitRatio = '50/50';
    }
    if (!settings.recurringExpenses) {
      settings.recurringExpenses = [
        { id: 'RE-1', category: 'rent', amount: 8000, description: 'إيجار مقر الشركة الرئيسي بالمعادي' },
        { id: 'RE-2', category: 'internet', amount: 650, description: 'اشتراك إنترنت فايبر عالي السرعة وباقات الفنيين' },
        { id: 'RE-3', category: 'electricity', amount: 2400, description: 'فاتورة كهرباء كود المقر والورشة' },
        { id: 'RE-4', category: 'salaries', amount: 35000, description: 'رواتب موظفي الدعم والسكرتارية' },
        { id: 'RE-5', category: 'subscriptions', amount: 1500, description: 'اشتراك نظام تخطيط موارد M Group Cool CRM' }
      ];
    }
    if (!settings.supplierLedger) {
      settings.supplierLedger = [
        { supplierId: 'SUP-001', balance: 14500, payments: [{ id: 'SPW-1', amount: 5000, date: '15/05/2026', notes: 'دفعة تحت الحساب كابستور وقواطع شارب' }] },
        { supplierId: 'SUP-002', balance: 8000, payments: [] }
      ];
    }
    if (!settings.approvalRequests) {
      settings.approvalRequests = [
        { id: 'AR-1', type: 'expense', requester: 'م. شريف منير', amount: 1500, description: 'شراء مواسير نحاس جنوب أفريقي إضافية لموقع التجمع', status: 'approved', date: '28/05/2026', approver: 'mgc.air1@gmail.com' },
        { id: 'AR-2', type: 'discount', requester: 'أحمد فوزي (مبيعات)', amount: 600, description: 'خصم خاص لعميل كود فيلا زايد للشراء النقدي 4 أجهزة', status: 'pending', date: '30/05/2026' }
      ];
    }
    if (!settings.assets) {
      settings.assets = [
        { id: 'AST-1', nameAr: 'لاب توب ديل - خدمة العملاء المعادي', nameEn: 'Dell Laptop - Maadi CRM', type: 'laptop', serialNumber: 'CN-0WXG38-7281', status: 'active', owner: 'نوران مصطفى (الدعم)' },
        { id: 'AST-2', nameAr: 'طابعة باركود حرارية زيبرا', nameEn: 'Zebra Barcode Printer', type: 'printer', serialNumber: 'ZBR-938221', status: 'active', owner: 'أمين المخزن' },
        { id: 'AST-3', nameAr: 'ماكينة غسيل ضغط عالي كارتشر ١٢٠ بار', nameEn: 'Karcher High Pressure Washer', type: 'equipment', serialNumber: 'KRC-723811', status: 'active', owner: 'محمد أشرف' }
      ];
    }
    if (!settings.vehicles) {
      settings.vehicles = [
        { id: 'VEH-1', plateNumber: 'أ م ج / ٢٤٤', brand: 'شيفورليه ديمكس ربع نقل صيانة', fuelType: 'سولار (Diesel)', insuranceExpiry: '31/12/2026', licenseExpiry: '15/10/2026', nextMaintenance: '30/06/2026', status: 'نشطة وللعمل' },
        { id: 'VEH-2', plateNumber: 'ب ر س / ٩٣٨', brand: 'سوزوكي فان المعادي', fuelType: 'بنزين ٩٢ (Gasoline)', insuranceExpiry: '15/11/2026', licenseExpiry: '30/08/2027', nextMaintenance: '14/06/2026', status: 'نشطة وللعمل' }
      ];
    }
    if (!settings.custody) {
      settings.custody = [
        { id: 'CST-1', technicianId: 'EMP-001', itemName: 'حقيبة عدة تكييف يدوي هولاند كاملة', type: 'tool', serialNumber: 'HD-9382-A', status: 'assigned', dateAssigned: '01/01/2026', notes: 'عهدة عادية مسلمة لصالح فني التكييف' },
        { id: 'CST-2', technicianId: 'EMP-001', itemName: 'عداد فريون مستورد ديجيتال ومضخة تفريغ', type: 'equipment', serialNumber: 'VP-99321', status: 'assigned', dateAssigned: '15/02/2026', notes: 'مضخة فاكيوم كود صيانة وشحن' }
      ];
    }
    if (!settings.documents) {
      settings.documents = [
        { id: 'DOC-1', type: 'commercial_reg', nameAr: 'السجل التجاري لمجموعة M Group Cool', nameEn: 'MGC Commercial Register', expiryDate: '15/09/2027', status: 'active' },
        { id: 'DOC-2', type: 'tax_doc', nameAr: 'البطاقة الضريبية وشهادة القيمة المضافة', nameEn: 'Tax Card & VAT Certificate', expiryDate: '30/11/2026', status: 'active' },
        { id: 'DOC-3', type: 'license', nameAr: 'رخصة الورشة ومقر الصيانة البيئية بالمعادي', nameEn: 'Maadi Workshop License', expiryDate: '01/08/2026', status: 'warning' }
      ];
    }

    this.initFirebaseSync();
  }

  public logAudit(action: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT', entity: string, entityId: string, details: string) {
    if (!this.state.settings.auditLogs) {
      this.state.settings.auditLogs = [];
    }
    const email = this.state.currentUser?.email || 'System';
    const uid = this.state.currentUser?.uid || 'system_service';
    const dateObj = new Date();
    const timestamp = `${String(dateObj.getDate()).padStart(2, '0')}/${String(dateObj.getMonth() + 1).padStart(2, '0')}/${dateObj.getFullYear()} ${String(dateObj.getHours()).padStart(2, '0')}:${String(dateObj.getMinutes()).padStart(2, '0')}:${String(dateObj.getSeconds()).padStart(2, '0')}`;
    this.state.settings.auditLogs.unshift({
      id: "AUD-" + Math.random().toString(36).substr(2, 9).toUpperCase(),
      userId: uid,
      userEmail: email,
      action,
      entity,
      entityId,
      timestamp,
      details
    });
    this.saveToCache();

    if (!isMockFirebase && auth.currentUser) {
      setDoc(doc(db, 'settings', 'company_settings'), this.state.settings).catch(err => {
        console.error("Firestore sync fail for auditLogs", err);
      });
    }
  }

  // Check if we are using live Firebase or fallback simulation
  public isMock(): boolean {
    return isMockFirebase;
  }

  // Handle Firestore standardized error reporting
  private handleFirestoreError(err: unknown, op: OperationType, path: string | null) {
    handleFirestoreError(err, op, path);
  }

  // Sync state with online Firestore when Firebase session status updates
  private initFirebaseSync() {
    if (isMockFirebase) {
      console.log('Firebase Sync is disabled: Local mock mode active.');
      return;
    }

    // Enable global offline persistence
    enableIndexedDbPersistence(db).catch((err) => {
      console.warn("Firestore indexeddb persistence error or multi-tab locked:", err.code);
    });

    onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        console.log('Firebase user logged in, syncing collections:', firebaseUser.email);
        
        // Sync active user profile document
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        getDoc(userDocRef).then((uDoc) => {
          if (uDoc.exists()) {
            const uData = uDoc.data() as UserProfile;
            this.state.currentUser = uData;
            this.saveToCache();
            this.subscribeToFirestore();
          } else {
            // First time auth login bootstrap
            const isSuper = firebaseUser.email === 'mgc.air1@gmail.com' || this.state.users.length <= 1;
            const newProfile: UserProfile = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || 'unknown@mgroupcool.com',
              name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'مستشار النظام',
              role: isSuper ? UserRole.SUPER_ADMIN : UserRole.TECHNICIAN,
              needsPasswordChange: false
            };
            
            setDoc(userDocRef, newProfile).then(() => {
              this.state.currentUser = newProfile;
              if (!this.state.users.some(u => u.uid === newProfile.uid)) {
                this.state.users.push(newProfile);
              }
              this.saveToCache();
              this.subscribeToFirestore();
            }).catch(err => {
              this.handleFirestoreError(err, OperationType.WRITE, `users/${firebaseUser.uid}`);
            });
          }
        }).catch(err => {
          this.handleFirestoreError(err, OperationType.GET, `users/${firebaseUser.uid}`);
        });

      } else {
        console.log('Firebase user logged out.');
        this.state.currentUser = null;
        this.activeSubscriptions.forEach(unsub => unsub());
        this.activeSubscriptions = [];
        this.saveToCache();
      }
    });
  }

  // Loading state asynchronously from high-performance IndexedDB
  private async loadFromIndexedDB() {
    try {
      const persistedState = await offlineStorage.getState();
      if (persistedState) {
        this.state = persistedState;
        this.ensureSuperAdmin();
        this.emitChange();
      }
      await this.updatePendingQueuePaths();
      this.processSyncQueue();
    } catch (e) {
      console.error('Failed to load state from IndexedDB:', e);
    }
  }

  // Get current offline sync queue
  public async getSyncQueue(): Promise<SyncItem[]> {
    return await offlineStorage.getQueue();
  }

  // Force manual sync queue purge
  public async clearSyncQueue() {
    await offlineStorage.clearQueue();
    await this.updatePendingQueuePaths();
  }

  // Update pending paths registry to secure local writes against snapshot overwrites
  private async updatePendingQueuePaths() {
    const queue = await offlineStorage.getQueue();
    this.pendingQueuePaths = new Set(queue.map(q => q.path));
    this.emitChange();
  }

  public getSyncStatus(): 'online' | 'offline' | 'syncing' | 'synced' {
    if (typeof window !== 'undefined' && !navigator.onLine) {
      return 'offline';
    }
    return this.syncStatus;
  }

  public setSyncStatus(status: 'online' | 'offline' | 'syncing' | 'synced') {
    this.syncStatus = status;
    this.emitChange();
  }

  // Universal queueing system for offline actions
  public async queueOfflineWrite(operation: 'CREATE_OR_UPDATE' | 'DELETE', path: string, payload: any) {
    const timestamp = Date.now();
    let finalPayload = payload;
    if (finalPayload && typeof finalPayload === 'object') {
      finalPayload = { ...finalPayload, updatedAt: timestamp };
    }

    const queueId = `Q-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    await offlineStorage.addToQueue({
      id: queueId,
      operation,
      path,
      payload: finalPayload,
      timestamp
    });

    // Save instant local cache representation
    this.saveToCache();
    await offlineStorage.saveState(this.state);
    await this.updatePendingQueuePaths();

    // Trigger processing
    this.processSyncQueue();
  }

  // In-background synchronizer with Latest Timestamp Conflict Resolution
  public async processSyncQueue() {
    if (this.isProcessingQueue) return;
    if (typeof window !== 'undefined' && !navigator.onLine) {
      this.setSyncStatus('offline');
      return;
    }

    const queue = await offlineStorage.getQueue();
    if (queue.length === 0) {
      this.setSyncStatus('online');
      return;
    }

    this.isProcessingQueue = true;
    this.setSyncStatus('syncing');

    try {
      for (const item of queue) {
        if (typeof window !== 'undefined' && !navigator.onLine) {
          throw new Error('Disconnected during sync');
        }

        await offlineStorage.updateQueueStatus(item.id, 'syncing');

        const docRef = doc(db, item.path);

        if (item.operation === 'CREATE_OR_UPDATE') {
          try {
            const serverSnap = await getDoc(docRef);
            if (serverSnap.exists()) {
              const serverData = serverSnap.data();
              const serverTime = serverData?.updatedAt || 0;
              if (serverTime > item.timestamp) {
                console.log(`Conflict resolved at ${item.path} using latest timestamp strategy. Server wins.`);
                this.updateLocalDocFromSync(item.path, serverData);
                await offlineStorage.deleteFromQueue(item.id);
                continue;
              }
            }
          } catch (e) {
            console.warn('Timestamp check bypassed due to lookup failure:', e);
          }

          await firestoreSetDoc(docRef, item.payload);
        } else if (item.operation === 'DELETE') {
          await firestoreDeleteDoc(docRef);
        }

        await offlineStorage.deleteFromQueue(item.id);
      }

      this.setSyncStatus('synced');
      setTimeout(() => {
        if (this.getSyncStatus() === 'synced') {
          this.setSyncStatus('online');
        }
      }, 3000);

    } catch (err) {
      console.error('Offline Sync Error:', err);
      if (typeof window !== 'undefined' && !navigator.onLine) {
        this.setSyncStatus('offline');
      } else {
        this.setSyncStatus('online');
      }
    } finally {
      this.isProcessingQueue = false;
      await this.updatePendingQueuePaths();
    }
  }

  private updateLocalDocFromSync(path: string, serverData: any) {
    const parts = path.split('/');
    if (parts.length === 2) {
      const [col, id] = parts;
      const stateKeyMap: Record<string, string> = {
        'customers': 'customers',
        'maintenance_orders': 'orders',
        'contracts': 'contracts',
        'invoices': 'invoices',
        'payments': 'payments',
        'expenses': 'expenses',
        'employees': 'employees',
        'suppliers': 'suppliers',
        'products': 'products',
        'inventory_movements': 'movements',
        'notifications': 'notifications',
        'users': 'users'
      };
      
      const key = stateKeyMap[col];
      if (key) {
        const idField = col === 'contracts' ? 'contractNumber' : col === 'invoices' ? 'invoiceNumber' : col === 'users' ? 'uid' : 'id';
        (this.state as any)[key] = ((this.state as any)[key] || []).map((x: any) => x[idField] === id ? { ...x, ...serverData } : x);
      } else if (col === 'settings' && id === 'company_settings') {
        this.state.settings = { ...this.state.settings, ...serverData };
      }
    } else if (parts.length === 4) {
      const [parentCol, parentId, subCol, id] = parts;
      if (parentCol === 'customers' && subCol === 'devices') {
        this.state.devices = this.state.devices.map(d => d.id === id ? { ...d, ...serverData } : d);
      } else if (parentCol === 'employees' && subCol === 'attendance') {
        this.state.attendance = this.state.attendance.map(a => a.id === id ? { ...a, ...serverData } : a);
      }
    }
    this.saveToCache();
  }

  private mergeServerSnapshots(stateKey: string, serverList: any[], idKey: string = 'id'): any[] {
    const currentList = (this.state as any)[stateKey] || [];
    return serverList.map(serverItem => {
      const id = serverItem[idKey];
      let path = '';
      if (stateKey === 'orders') {
        path = `maintenance_orders/${id}`;
      } else if (stateKey === 'movements') {
        path = `inventory_movements/${id}`;
      } else {
        path = `${stateKey === 'contracts' ? 'contracts' : stateKey === 'invoices' ? 'invoices' : stateKey}/${id}`;
      }

      if (this.pendingQueuePaths.has(path)) {
        const localItem = currentList.find((x: any) => x[idKey] === id);
        return localItem || serverItem;
      }
      return serverItem;
    });
  }

  // Real-time Firestore sync listener subscriptions
  private subscribeToFirestore() {
    this.activeSubscriptions.forEach(unsub => unsub());
    this.activeSubscriptions = [];

    if (isMockFirebase || !auth.currentUser) return;

    const collectionsToSync = [
      { name: 'users', stateKey: 'users' },
      { name: 'customers', stateKey: 'customers' },
      { name: 'maintenance_orders', stateKey: 'orders' },
      { name: 'contracts', stateKey: 'contracts' },
      { name: 'invoices', stateKey: 'invoices' },
      { name: 'payments', stateKey: 'payments' },
      { name: 'expenses', stateKey: 'expenses' },
      { name: 'employees', stateKey: 'employees' },
      { name: 'suppliers', stateKey: 'suppliers' },
      { name: 'products', stateKey: 'products' },
      { name: 'inventory_movements', stateKey: 'movements' },
      { name: 'notifications', stateKey: 'notifications' },
    ];

    collectionsToSync.forEach(({ name, stateKey }) => {
      const q = collection(db, name);
      const unsub = onSnapshot(q, (snapshot) => {
        const rawDataList: any[] = [];
        snapshot.forEach((snapDoc) => {
          rawDataList.push({ ...snapDoc.data(), id: snapDoc.id });
        });

        // Filter and merge using pending offline changes
        const dataList = this.mergeServerSnapshots(stateKey, rawDataList);

        if (stateKey === 'invoices') {
          this.state.invoices = dataList.map(item => ({
            ...item,
            invoiceNumber: item.invoiceNumber || item.id
          }));
        } else if (stateKey === 'contracts') {
          this.state.contracts = dataList.map(item => ({
            ...item,
            contractNumber: item.contractNumber || item.id
          }));
        } else {
          (this.state as any)[stateKey] = dataList;
        }

        this.saveToCache();
      }, (err) => {
        this.handleFirestoreError(err, OperationType.LIST, name);
      });
      this.activeSubscriptions.push(unsub);
    });

    // Sync settings document
    const settingsRef = doc(db, 'settings', 'company_settings');
    const unsubSettings = onSnapshot(settingsRef, (docSnap) => {
      if (docSnap.exists()) {
        const path = 'settings/company_settings';
        if (!this.pendingQueuePaths.has(path)) {
          this.state.settings = docSnap.data() as CompanySettings;
          this.saveToCache();
        }
      }
    }, (err) => {
      this.handleFirestoreError(err, OperationType.GET, 'settings/company_settings');
    });
    this.activeSubscriptions.push(unsubSettings);

    // Sync devices collectionGroup
    const unsubDevices = onSnapshot(collectionGroup(db, 'devices'), (snapshot) => {
      const devicesList: Device[] = [];
      snapshot.forEach((snapDoc) => {
        devicesList.push({ ...snapDoc.data(), id: snapDoc.id } as Device);
      });
      
      this.state.devices = devicesList.map(serverItem => {
        const path = `customers/${serverItem.customerId}/devices/${serverItem.id}`;
        if (this.pendingQueuePaths.has(path)) {
          const localItem = this.state.devices.find(d => d.id === serverItem.id);
          return localItem || serverItem;
        }
        return serverItem;
      });
      this.saveToCache();
    }, (err) => {
      this.handleFirestoreError(err, OperationType.LIST, 'devices');
    });
    this.activeSubscriptions.push(unsubDevices);

    // Sync attendance collectionGroup
    const unsubAttendance = onSnapshot(collectionGroup(db, 'attendance'), (snapshot) => {
      const attList: AttendanceRecord[] = [];
      snapshot.forEach((snapDoc) => {
        attList.push({ ...snapDoc.data(), id: snapDoc.id } as AttendanceRecord);
      });
      
      this.state.attendance = attList.map(serverItem => {
        const path = `employees/${serverItem.employeeId}/attendance/${serverItem.id}`;
        if (this.pendingQueuePaths.has(path)) {
          const localItem = this.state.attendance.find(a => a.id === serverItem.id);
          return localItem || serverItem;
        }
        return serverItem;
      });
      this.saveToCache();
    }, (err) => {
      this.handleFirestoreError(err, OperationType.LIST, 'attendance');
    });
    this.activeSubscriptions.push(unsubAttendance);
  }

  // Load from offline persistent cache (localStorage for instant state preservation)
  private loadFromCache(): AppState {
    const cached = localStorage.getItem('mgroupcool_erp_state');
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) {
        console.error('Error parsing local cache, resetting state', e);
      }
    }

    // Default pristine state
    return {
      currentUser: null,
      users: [
        {
          uid: "super_admin_fixed_user_id",
          email: "mgc.air1@gmail.com",
          name: "الإدارة العامة - سوبر أدمن",
          role: UserRole.SUPER_ADMIN,
          needsPasswordChange: true
        }
      ],
      customers: MOCK_CUSTOMERS,
      devices: MOCK_DEVICES,
      orders: MOCK_ORDERS,
      contracts: MOCK_CONTRACTS,
      invoices: MOCK_INVOICES,
      payments: MOCK_PAYMENTS,
      expenses: MOCK_EXPENSES,
      employees: MOCK_EMPLOYEES,
      attendance: MOCK_ATTENDANCE,
      suppliers: MOCK_SUPPLIERS,
      products: MOCK_PRODUCTS,
      movements: MOCK_MOVEMENTS,
      notifications: MOCK_NOTIFICATIONS,
      settings: DEFAULT_SETTINGS
    };
  }

  // Save changes to offline IndexedDB cache Simulation
  private saveToCache() {
    localStorage.setItem('mgroupcool_erp_state', JSON.stringify(this.state));
    this.emitChange();
  }

  // Ensure default super_admin account is always registered
  private ensureSuperAdmin() {
    const hasAdmin = this.state.users.some(u => u.email === "mgc.air1@gmail.com");
    if (!hasAdmin) {
      this.state.users.push({
        uid: "super_admin_fixed_user_id",
        email: "mgc.air1@gmail.com",
        name: "الإدارة العامة - سوبر أدمن",
        role: UserRole.SUPER_ADMIN,
        needsPasswordChange: true
      });
      this.saveToCache();
    }
  }

  // Realtime Sync Subscription emitter
  public subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private emitChange() {
    this.listeners.forEach(l => l());
  }

  // --- AUTHENTICATION MODULE ---
  public getCurrentUser(): UserProfile | null {
    return this.state.currentUser;
  }

  public login(email: string, pass: string): { success: boolean; error?: string; user?: UserProfile } {
    const user = this.state.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (user) {
      // In simulation mode, passwords of mock users are simulated (default 00000000)
      if (pass === "00000000" || pass === "00000000") {
        this.state.currentUser = user;
        this.saveToCache();
        return { success: true, user };
      } else {
        return { success: false, error: "كـلمة المرور غير صحيحة" };
      }
    }
    return { success: false, error: "حساب المستخدم غيـر مسجل بالنظام" };
  }

  public async loginWithGoogle(): Promise<{ success: boolean; error?: string; user?: UserProfile }> {
    if (isMockFirebase) {
      // In simulation mode, Google Login simulates logging in the Super Admin
      const user = this.state.users[0];
      this.state.currentUser = user;
      this.saveToCache();
      return { success: true, user };
    }

    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      const firebaseUser = userCredential.user;
      
      const userDocRef = doc(db, 'users', firebaseUser.uid);
      const uDoc = await getDoc(userDocRef);
      let userProfile: UserProfile;

      if (uDoc.exists()) {
        userProfile = uDoc.data() as UserProfile;
      } else {
        const isSuper = firebaseUser.email === 'mgc.air1@gmail.com' || this.state.users.length <= 1;
        userProfile = {
          uid: firebaseUser.uid,
          email: firebaseUser.email || 'unknown@mgroupcool.com',
          name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'مستشار النظام',
          role: isSuper ? UserRole.SUPER_ADMIN : UserRole.TECHNICIAN,
          needsPasswordChange: false
        };
        await setDoc(userDocRef, userProfile);
      }

      this.state.currentUser = userProfile;
      if (!this.state.users.some(u => u.uid === userProfile.uid)) {
        this.state.users.push(userProfile);
      }
      this.saveToCache();
      return { success: true, user: userProfile };
    } catch (err: any) {
      this.handleFirestoreError(err, OperationType.WRITE, 'google-auth');
      return { success: false, error: err.message || 'فشل تسجيل الدخول بـ Google' };
    }
  }

  public logout() {
    this.state.currentUser = null;
    this.saveToCache();
    if (!isMockFirebase) {
      signOut(auth).catch(err => {
        this.handleFirestoreError(err, OperationType.WRITE, 'logout');
      });
    }
  }

  public changePassword(newPass: string): boolean {
    if (this.state.currentUser) {
      const uIndex = this.state.users.findIndex(u => u.uid === this.state.currentUser?.uid);
      if (uIndex !== -1) {
        this.state.users[uIndex].needsPasswordChange = false;
        this.state.currentUser.needsPasswordChange = false;
        this.saveToCache();
        return true;
      }
    }
    return false;
  }

  // --- CRUD METHODS ---
  
  // Customers CRUD & Auto-counter ('CUS-000001')
  public getCustomers(): Customer[] {
    return this.state.customers;
  }

  public getCustomerById(id: string): Customer | undefined {
    return this.state.customers.find(c => c.id === id);
  }

  public addCustomer(data: Omit<Customer, 'id' | 'createdAt'>): Customer {
    const prefix = "CUS-";
    const nextNum = this.state.customers.length > 0 
      ? Math.max(...this.state.customers.map(c => parseInt(c.id.split('-')[1]) || 0)) + 1
      : 1;
    const paddedId = String(nextNum).padStart(6, '0');
    const id = `${prefix}${paddedId}`;

    const date = new Date();
    const createdAt = `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;

    const newCustomer: Customer = {
      ...data,
      id,
      createdAt,
      rating: data.rating || 5
    };

    this.state.customers = [newCustomer, ...this.state.customers];

    // Audit Log
    this.logAudit('CREATE', 'customer', id, `إضافة عميل جديد: ${newCustomer.name} (الهاتف: ${newCustomer.phone}) في المنطقة: ${newCustomer.region}`);

    // Auto notify
    this.addNotification("عميل جديد مميز", `تمت إضافة العميل ${data.name} للمنطقة ${data.region}`, 'new_customer');

    this.saveToCache();

    if (!isMockFirebase && auth.currentUser) {
      setDoc(doc(db, 'customers', id), newCustomer).catch(err => {
        this.handleFirestoreError(err, OperationType.CREATE, `customers/${id}`);
      });
    }

    return newCustomer;
  }

  public updateCustomer(id: string, data: Partial<Customer>) {
    const oldC = this.state.customers.find(c => c.id === id);
    this.state.customers = this.state.customers.map(c => c.id === id ? { ...c, ...data } : c);
    this.saveToCache();

    if (oldC) {
      const changed = Object.keys(data).filter(k => (oldC as any)[k] !== (data as any)[k]);
      const updated = this.state.customers.find(c => c.id === id);
      this.logDetailedAudit('UPDATE', 'customer', id, oldC, updated, changed);
    }

    if (!isMockFirebase && auth.currentUser) {
      const updated = this.state.customers.find(c => c.id === id);
      if (updated) {
        setDoc(doc(db, 'customers', id), updated).catch(err => {
          this.handleFirestoreError(err, OperationType.UPDATE, `customers/${id}`);
        });
      }
    }
  }

  public deleteCustomer(id: string) {
    const oldC = this.state.customers.find(c => c.id === id);
    const devicesToDelete = this.state.devices.filter(d => d.customerId === id);
    this.state.customers = this.state.customers.filter(c => c.id !== id);
    this.state.devices = this.state.devices.filter(d => d.customerId !== id);
    this.saveToCache();

    if (oldC) {
      this.logDetailedAudit('DELETE', 'customer', id, oldC, null, []);
    }

    if (!isMockFirebase && auth.currentUser) {
      deleteDoc(doc(db, 'customers', id)).catch(err => {
        this.handleFirestoreError(err, OperationType.DELETE, `customers/${id}`);
      });
      devicesToDelete.forEach(d => {
        deleteDoc(doc(db, 'customers', id, 'devices', d.id)).catch(err => {
          this.handleFirestoreError(err, OperationType.DELETE, `customers/${id}/devices/${d.id}`);
        });
      });
    }
  }

  // Devices CRUD
  public getDevices(): Device[] {
    return this.state.devices;
  }

  public getDevicesByCustomer(customerId: string): Device[] {
    return this.state.devices.filter(d => d.customerId === customerId);
  }

  public addDevice(data: Omit<Device, 'id'>): Device {
    const id = "DEV-" + Math.random().toString(36).substr(2, 9).toUpperCase();
    const newDevice = { ...data, id };
    this.state.devices = [newDevice, ...this.state.devices];
    this.saveToCache();

    if (!isMockFirebase && auth.currentUser) {
      setDoc(doc(db, 'customers', data.customerId, 'devices', id), newDevice).catch(err => {
        this.handleFirestoreError(err, OperationType.CREATE, `customers/${data.customerId}/devices/${id}`);
      });
    }

    return newDevice;
  }

  public updateDevice(id: string, data: Partial<Device>) {
    const oldD = this.state.devices.find(d => d.id === id);
    this.state.devices = this.state.devices.map(d => d.id === id ? { ...d, ...data } : d);
    this.saveToCache();

    if (oldD) {
      const changed = Object.keys(data).filter(k => (oldD as any)[k] !== (data as any)[k]);
      const updated = this.state.devices.find(d => d.id === id);
      this.logDetailedAudit('UPDATE', 'device', id, oldD, updated, changed);
    }

    if (!isMockFirebase && auth.currentUser) {
      const updated = this.state.devices.find(d => d.id === id);
      if (updated) {
        setDoc(doc(db, 'customers', updated.customerId, 'devices', id), updated).catch(err => {
          this.handleFirestoreError(err, OperationType.UPDATE, `customers/${updated.customerId}/devices/${id}`);
        });
      }
    }
  }

  public deleteDevice(id: string) {
    const device = this.state.devices.find(d => d.id === id);
    this.state.devices = this.state.devices.filter(d => d.id !== id);
    this.saveToCache();

    if (device) {
      this.logDetailedAudit('DELETE', 'device', id, device, null, []);
    }

    if (!isMockFirebase && auth.currentUser && device) {
      deleteDoc(doc(db, 'customers', device.customerId, 'devices', id)).catch(err => {
        this.handleFirestoreError(err, OperationType.DELETE, `customers/${device.customerId}/devices/${id}`);
      });
    }
  }

  // Work Orders (WO-2025-000001) Auto-counter
  public getOrders(): MaintenanceOrder[] {
    return this.state.orders;
  }

  public addOrder(data: Omit<MaintenanceOrder, 'id' | 'date'>): MaintenanceOrder {
    const dateObj = new Date();
    const dateStr = `${String(dateObj.getDate()).padStart(2, '0')}/${String(dateObj.getMonth() + 1).padStart(2, '0')}/${dateObj.getFullYear()}`;
    const year = dateObj.getFullYear();
    
    const nextNum = this.state.orders.length > 0
      ? Math.max(...this.state.orders.map(o => {
          const parts = o.id.split('-');
          return parts.length === 3 ? parseInt(parts[2]) || 0 : 0;
        })) + 1
      : 1;
    const paddedId = String(nextNum).padStart(6, '0');
    const id = `WO-${year}-${paddedId}`;

    const newOrder: MaintenanceOrder = {
      ...data,
      id,
      date: dateStr
    };

    this.state.orders = [newOrder, ...this.state.orders];

    // Audit Log
    this.logAudit('CREATE', 'order', id, `إنشاء أمر تشغيل جديد ${id} للعميل ${data.customerId} بخصوص خدمة ${data.serviceType}`);

    // Trigger stock subtraction if materials were used
    if (data.serviceType.includes("شحن فريون") || data.serviceType.includes("شامل قطع غيار")) {
      // simulate product usage
      const freon = this.state.products.find(p => p.category === "فريون");
      if (freon && freon.quantity > 0) {
        freon.quantity -= 1;
        this.addInventoryMovement(freon.id, 'out', 1, `استهلاك صيانة تلقائي لأمر التشغيل ${id}`);
      }
    }

    this.addNotification("أمر تشغيل جديد", `تم إسناد أمر تشريح ${id} للفني الخاص بمهمة ${data.serviceType}`, 'new_order');
    this.saveToCache();

    if (!isMockFirebase && auth.currentUser) {
      setDoc(doc(db, 'maintenance_orders', id), newOrder).catch(err => {
        this.handleFirestoreError(err, OperationType.CREATE, `maintenance_orders/${id}`);
      });
    }

    return newOrder;
  }

  public updateOrder(id: string, data: Partial<MaintenanceOrder>) {
    const oldO = this.state.orders.find(o => o.id === id);
    this.state.orders = this.state.orders.map(o => {
      if (o.id === id) {
        const updated = { ...o, ...data };
        if (data.status === 'completed' && o.status !== 'completed' && updated.cost > 0) {
          this.autoGenerateInvoiceForOrder(updated);
        }
        return updated;
      }
      return o;
    });
    this.saveToCache();

    if (oldO) {
      const changed = Object.keys(data).filter(k => (oldO as any)[k] !== (data as any)[k]);
      const updated = this.state.orders.find(o => o.id === id);
      this.logDetailedAudit('UPDATE', 'order', id, oldO, updated, changed);
    }

    if (!isMockFirebase && auth.currentUser) {
      const updated = this.state.orders.find(o => o.id === id);
      if (updated) {
        setDoc(doc(db, 'maintenance_orders', id), updated).catch(err => {
          this.handleFirestoreError(err, OperationType.UPDATE, `maintenance_orders/${id}`);
        });
      }
    }
  }

  public deleteOrder(id: string) {
    const oldO = this.state.orders.find(o => o.id === id);
    this.state.orders = this.state.orders.filter(o => o.id !== id);
    this.saveToCache();

    if (oldO) {
      this.logDetailedAudit('DELETE', 'order', id, oldO, null, []);
    }

    if (!isMockFirebase && auth.currentUser) {
      deleteDoc(doc(db, 'maintenance_orders', id)).catch(err => {
        this.handleFirestoreError(err, OperationType.DELETE, `maintenance_orders/${id}`);
      });
    }
  }

  private autoGenerateInvoiceForOrder(order: MaintenanceOrder) {
    const hasInvoice = this.state.invoices.some(inv => inv.items.some(it => it.description.includes(order.id)));
    if (!hasInvoice) {
      this.addInvoice({
        type: 'invoice',
        customerId: order.customerId,
        vatRate: this.state.settings.vatRate,
        subtotal: order.cost,
        items: [
          { description: `سيرفيس ${order.serviceType} لأمر التشغيل ${order.id}`, quantity: 1, price: order.cost, total: order.cost }
        ],
        status: order.collectionAmount >= order.cost ? 'paid' : (order.collectionAmount > 0 ? 'partially_paid' : 'unpaid')
      });

      if (order.collectionAmount > 0) {
        // Record collection payment too
        this.addPayment({
          invoiceId: `INV-${new Date().getFullYear()}-` + String(this.state.invoices.length + 1).padStart(6, '0'), // Predicted ID
          customerId: order.customerId,
          amount: order.collectionAmount,
          paymentType: 'نقدي',
          notes: `تحصيل مباشر من أمر تشغيل رقم ${order.id}`
        });
      }
    }
  }

  // Maintenance Contracts CRUD
  public getContracts(): Contract[] {
    return this.state.contracts;
  }

  public addContract(data: Omit<Contract, 'contractNumber'>): Contract {
    const nextNum = this.state.contracts.length > 0
      ? Math.max(...this.state.contracts.map(c => {
          const parts = c.contractNumber.split('-');
          return parts.length === 3 ? parseInt(parts[2]) || 0 : 0;
        })) + 1
      : 1;
    const paddedId = String(nextNum).padStart(3, '0');
    const contractNumber = `CON-${new Date().getFullYear()}-${paddedId}`;

    const newContract = { ...data, contractNumber };
    this.state.contracts = [newContract, ...this.state.contracts];
    this.saveToCache();

    if (!isMockFirebase && auth.currentUser) {
      setDoc(doc(db, 'contracts', contractNumber), newContract).catch(err => {
        this.handleFirestoreError(err, OperationType.CREATE, `contracts/${contractNumber}`);
      });
    }

    return newContract;
  }

  public updateContract(number: string, data: Partial<Contract>) {
    const oldC = this.state.contracts.find(c => c.contractNumber === number);
    this.state.contracts = this.state.contracts.map(c => c.contractNumber === number ? { ...c, ...data } : c);
    this.saveToCache();

    if (oldC) {
      const changed = Object.keys(data).filter(k => (oldC as any)[k] !== (data as any)[k]);
      const updated = this.state.contracts.find(c => c.contractNumber === number);
      this.logDetailedAudit('UPDATE', 'contract', number, oldC, updated, changed);
    }

    if (!isMockFirebase && auth.currentUser) {
      const updated = this.state.contracts.find(c => c.contractNumber === number);
      if (updated) {
        setDoc(doc(db, 'contracts', number), updated).catch(err => {
          this.handleFirestoreError(err, OperationType.UPDATE, `contracts/${number}`);
        });
      }
    }
  }

  public deleteContract(number: string) {
    const oldC = this.state.contracts.find(c => c.contractNumber === number);
    this.state.contracts = this.state.contracts.filter(c => c.contractNumber !== number);
    this.saveToCache();

    if (oldC) {
      this.logDetailedAudit('DELETE', 'contract', number, oldC, null, []);
    }

    if (!isMockFirebase && auth.currentUser) {
      deleteDoc(doc(db, 'contracts', number)).catch(err => {
        this.handleFirestoreError(err, OperationType.DELETE, `contracts/${number}`);
      });
    }
  }

  // Invoices (INV-2025-000001) Auto-counter & calculations
  public getInvoices(): Invoice[] {
    return this.state.invoices;
  }

  public addInvoice(data: Omit<Invoice, 'invoiceNumber' | 'vatAmount' | 'totalAmount' | 'date'>): Invoice {
    const dateObj = new Date();
    const dateStr = `${String(dateObj.getDate()).padStart(2, '0')}/${String(dateObj.getMonth() + 1).padStart(2, '0')}/${dateObj.getFullYear()}`;
    const year = dateObj.getFullYear();

    const nextNum = this.state.invoices.length > 0
      ? Math.max(...this.state.invoices.map(i => {
          const parts = i.invoiceNumber.split('-');
          return parts.length === 3 ? parseInt(parts[2]) || 0 : 0;
        })) + 1
      : 1;
    const paddedId = String(nextNum).padStart(6, '0');
    const invoiceNumber = `INV-${year}-${paddedId}`;

    const vatAmt = Math.round((data.subtotal * (data.vatRate / 100)) * 100) / 100;
    const totalAmt = data.subtotal + vatAmt;

    const newInvoice: Invoice = {
      ...data,
      invoiceNumber,
      vatAmount: vatAmt,
      totalAmount: totalAmt,
      date: dateStr
    };

    this.state.invoices = [newInvoice, ...this.state.invoices];
    this.saveToCache();

    if (!isMockFirebase && auth.currentUser) {
      setDoc(doc(db, 'invoices', invoiceNumber), newInvoice).catch(err => {
        this.handleFirestoreError(err, OperationType.CREATE, `invoices/${invoiceNumber}`);
      });
    }

    return newInvoice;
  }

  public updateInvoice(number: string, data: Partial<Invoice>) {
    const oldI = this.state.invoices.find(i => i.invoiceNumber === number);
    this.state.invoices = this.state.invoices.map(i => {
      if (i.invoiceNumber === number) {
        const merged = { ...i, ...data };
        const subtotal = Number(merged.subtotal ?? 0);
        const vatRate = Number(merged.vatRate ?? 0);
        const vatAmt = Math.round((subtotal * (vatRate / 100)) * 100) / 100;
        const total = subtotal + vatAmt;
        return {
          ...merged,
          subtotal,
          vatRate,
          vatAmount: vatAmt,
          totalAmount: total
        };
      }
      return i;
    });
    this.saveToCache();

    if (oldI) {
      const changed = Object.keys(data).filter(k => (oldI as any)[k] !== (data as any)[k]);
      const updated = this.state.invoices.find(i => i.invoiceNumber === number);
      this.logDetailedAudit('UPDATE', 'invoice', number, oldI, updated, changed);
    }

    if (!isMockFirebase && auth.currentUser) {
      const updated = this.state.invoices.find(i => i.invoiceNumber === number);
      if (updated) {
        setDoc(doc(db, 'invoices', number), updated).catch(err => {
          this.handleFirestoreError(err, OperationType.UPDATE, `invoices/${number}`);
        });
      }
    }
  }

  public deleteInvoice(number: string) {
    const oldI = this.state.invoices.find(i => i.invoiceNumber === number);
    this.state.invoices = this.state.invoices.filter(i => i.invoiceNumber !== number);
    this.saveToCache();

    if (oldI) {
      this.logDetailedAudit('DELETE', 'invoice', number, oldI, null, []);
    }

    if (!isMockFirebase && auth.currentUser) {
      deleteDoc(doc(db, 'invoices', number)).catch(err => {
        this.handleFirestoreError(err, OperationType.DELETE, `invoices/${number}`);
      });
    }
  }

  // Payments / Receipts
  public getPayments(): Payment[] {
    return this.state.payments;
  }

  public addPayment(data: Omit<Payment, 'id' | 'paymentDate'>): Payment {
    const id = "PAY-" + Math.random().toString(36).substr(2, 9).toUpperCase();
    const dateObj = new Date();
    const dateStr = `${String(dateObj.getDate()).padStart(2, '0')}/${String(dateObj.getMonth() + 1).padStart(2, '0')}/${dateObj.getFullYear()}`;

    const newPayment: Payment = {
      ...data,
      id,
      paymentDate: dateStr
    };

    this.state.payments = [newPayment, ...this.state.payments];

    // Update invoice paid status
    const invIndex = this.state.invoices.findIndex(inv => inv.invoiceNumber === data.invoiceId);
    let updatedInvoice: Invoice | null = null;
    if (invIndex !== -1) {
      const inv = this.state.invoices[invIndex];
      // calculate total payments for this invoice
      const paymentsForInv = this.state.payments
        .filter(p => p.invoiceId === data.invoiceId)
        .reduce((sum, p) => sum + p.amount, 0);

      let newStatus: 'paid' | 'partially_paid' | 'unpaid' = 'unpaid';
      if (paymentsForInv >= inv.totalAmount) {
        newStatus = 'paid';
      } else if (paymentsForInv > 0) {
        newStatus = 'partially_paid';
      }
      this.state.invoices[invIndex].status = newStatus;
      updatedInvoice = this.state.invoices[invIndex];
    }

    this.addNotification("تحصيل دفعة مالية", `تم تحصيل مبلغ ${data.amount} ج.م لسند ${id}`, 'collection');
    this.saveToCache();

    if (!isMockFirebase && auth.currentUser) {
      setDoc(doc(db, 'payments', id), newPayment).catch(err => {
        this.handleFirestoreError(err, OperationType.CREATE, `payments/${id}`);
      });
      if (updatedInvoice) {
        setDoc(doc(db, 'invoices', updatedInvoice.invoiceNumber), updatedInvoice).catch(err => {
          this.handleFirestoreError(err, OperationType.UPDATE, `invoices/${updatedInvoice!.invoiceNumber}`);
        });
      }
    }

    return newPayment;
  }

  // Expenses CRUD
  public getExpenses(): Expense[] {
    return this.state.expenses;
  }

  public addExpense(data: Omit<Expense, 'id'>): Expense {
    const id = "EXP-" + Math.random().toString(36).substr(2, 9).toUpperCase();
    const newExpense = { ...data, id };
    this.state.expenses = [newExpense, ...this.state.expenses];
    this.saveToCache();

    if (!isMockFirebase && auth.currentUser) {
      setDoc(doc(db, 'expenses', id), newExpense).catch(err => {
        this.handleFirestoreError(err, OperationType.CREATE, `expenses/${id}`);
      });
    }

    return newExpense;
  }

  public deleteExpense(id: string) {
    const oldE = this.state.expenses.find(e => e.id === id);
    this.state.expenses = this.state.expenses.filter(e => e.id !== id);
    this.saveToCache();

    if (oldE) {
      this.logDetailedAudit('DELETE', 'expense', id, oldE, null, []);
    }

    if (!isMockFirebase && auth.currentUser) {
      deleteDoc(doc(db, 'expenses', id)).catch(err => {
        this.handleFirestoreError(err, OperationType.DELETE, `expenses/${id}`);
      });
    }
  }

  // Employees CRUD
  public getEmployees(): Employee[] {
    return this.state.employees;
  }

  public addEmployee(data: Omit<Employee, 'id'>): Employee {
    const prefix = "EMP-";
    const nextNum = this.state.employees.length > 0
      ? Math.max(...this.state.employees.map(e => parseInt(e.id.split('-')[1]) || 0)) + 1
      : 1;
    const id = `${prefix}${String(nextNum).padStart(3, '0')}`;

    const newEmployee = { ...data, id };
    this.state.employees = [...this.state.employees, newEmployee];
    this.saveToCache();

    if (!isMockFirebase && auth.currentUser) {
      setDoc(doc(db, 'employees', id), newEmployee).catch(err => {
        this.handleFirestoreError(err, OperationType.CREATE, `employees/${id}`);
      });
    }

    return newEmployee;
  }

  public updateEmployee(id: string, data: Partial<Employee>) {
    const oldE = this.state.employees.find(e => e.id === id);
    this.state.employees = this.state.employees.map(e => e.id === id ? { ...e, ...data } : e);
    this.saveToCache();

    if (oldE) {
      const changed = Object.keys(data).filter(k => (oldE as any)[k] !== (data as any)[k]);
      const updated = this.state.employees.find(e => e.id === id);
      this.logDetailedAudit('UPDATE', 'employee', id, oldE, updated, changed);
    }

    if (!isMockFirebase && auth.currentUser) {
      const updated = this.state.employees.find(e => e.id === id);
      if (updated) {
        setDoc(doc(db, 'employees', id), updated).catch(err => {
          this.handleFirestoreError(err, OperationType.UPDATE, `employees/${id}`);
        });
      }
    }
  }

  public deleteEmployee(id: string) {
    const oldE = this.state.employees.find(e => e.id === id);
    this.state.employees = this.state.employees.filter(e => e.id !== id);
    this.saveToCache();

    if (oldE) {
      this.logDetailedAudit('DELETE', 'employee', id, oldE, null, []);
    }

    if (!isMockFirebase && auth.currentUser) {
      deleteDoc(doc(db, 'employees', id)).catch(err => {
        this.handleFirestoreError(err, OperationType.DELETE, `employees/${id}`);
      });
    }
  }

  // Attendance CRUD
  public getAttendance(): AttendanceRecord[] {
    return this.state.attendance;
  }

  public getAttendanceByEmployee(empId: string): AttendanceRecord[] {
    return this.state.attendance.filter(a => a.employeeId === empId);
  }

  public addAttendance(data: Omit<AttendanceRecord, 'id'>): AttendanceRecord {
    const record: AttendanceRecord & { employeeId: string; status: any; checkIn?: string; checkOut?: string } = data as any;
    this.markAttendance(record.employeeId, record.status, record.checkIn, record.checkOut);
    const latest = this.state.attendance[this.state.attendance.length - 1];
    return latest;
  }

  public markAttendance(employeeId: string, status: 'present' | 'absent' | 'vacation' | 'holiday', checkIn?: string, checkOut?: string) {
    const dateObj = new Date();
    const dateStr = `${String(dateObj.getDate()).padStart(2, '0')}/${String(dateObj.getMonth() + 1).padStart(2, '0')}/${dateObj.getFullYear()}`;

    // check if record already exists for today
    const existingIndex = this.state.attendance.findIndex(a => a.employeeId === employeeId && a.date === dateStr);

    let workingHours = 0;
    let overtimeHours = 0;

    if (status === 'present' && checkIn && checkOut) {
      // Calculate working hours
      const [inH, inM] = checkIn.split(':').map(Number);
      const [outH, outM] = checkOut.split(':').map(Number);
      const diffMs = (outH * 60 + outM) - (inH * 60 + inM);
      workingHours = Math.max(0, parseFloat((diffMs / 60).toFixed(2)));

      // Overtime default is hours past 9 hours (since default workday is 9 AM to 7 PM which is 10 hours containing 1 hour lunch, so say 9 hours actual work)
      // For Mohamed Ashraf (محمد أشرف), normal work hours is 9am to 7pm (10 hours total). Overtime starts after 10 hours.
      const maxNormalHours = employeeId === 'EMP-001' ? 10 : 9;
      overtimeHours = Math.max(0, parseFloat((workingHours - maxNormalHours).toFixed(2)));
    }

    const record: AttendanceRecord = {
      id: "ATT-" + Math.random().toString(36).substr(2, 9).toUpperCase(),
      employeeId,
      date: dateStr,
      checkIn,
      checkOut,
      workingHours,
      overtimeHours,
      status
    };

    let recordToSave = record;
    if (existingIndex !== -1) {
      this.state.attendance[existingIndex] = { ...this.state.attendance[existingIndex], ...record };
      recordToSave = this.state.attendance[existingIndex];
    } else {
      this.state.attendance = [...this.state.attendance, record];
    }

    this.saveToCache();

    if (!isMockFirebase && auth.currentUser) {
      setDoc(doc(db, 'employees', employeeId, 'attendance', recordToSave.id), recordToSave).catch(err => {
        this.handleFirestoreError(err, OperationType.CREATE, `employees/${employeeId}/attendance/${recordToSave.id}`);
      });
    }
  }

  // Partnerships & Payroll Calculation for Mohamed Ashraf (محمد أشرف) & others
  public calculateEmployeePayroll(empId: string, startMonthYear: string): {
    baseSalary: number;
    daysPresent: number;
    daysAbsent: number;
    overtimePay: number;
    commissionsPay: number;
    partnershipProfitShare: number;
    totalEarnings: number;
    finalNetDue: number;
  } {
    const emp = this.state.employees.find(e => e.id === empId);
    if (!emp) {
      return { baseSalary: 0, daysPresent: 0, daysAbsent: 0, overtimePay: 0, commissionsPay: 0, partnershipProfitShare: 0, totalEarnings: 0, finalNetDue: 0 };
    }

    // Filter attendance records
    const records = this.state.attendance.filter(r => r.employeeId === empId);
    let daysPresent = 0;
    let daysAbsent = 0;
    let overtimeHours = 0;

    records.forEach(r => {
      // Logic for Friday: count as double workday for Mohamed Ashraf
      const isFriday = this.checkIfFriday(r.date);
      if (r.status === 'present') {
        if (isFriday && emp.id === 'EMP-001') {
          daysPresent += 2; // Friday counts as 2 working days
        } else {
          daysPresent += 1;
        }
        overtimeHours += r.overtimeHours || 0;
      } else if (r.status === 'absent') {
        daysAbsent += 1;
      }
    });

    // Calculate overtime pay. Rate: 50 EGP per overtime hour, or say based on salary
    const hourlyRate = (emp.salary / 30) / 8; // standard formula
    const overtimePay = Math.round(overtimeHours * hourlyRate * 1.5); // 1.5x overtime rate

    // Calculate commissions (on completed orders where he was the technician)
    let commissionsPay = 0;
    if (emp.commissionRate && emp.commissionRate > 0) {
      const techOrders = this.state.orders.filter(o => o.technicianId === empId && o.status === 'completed');
      commissionsPay = techOrders.reduce((sum, o) => sum + (o.cost * ((emp.commissionRate || 0) / 100)), 0);
    }

    // Calculate Partnership Profits Share
    // صافي الربح = التحصيل - الخامات - المصروفات.
    // لا تخصم عمولات الفنيين من الأرباح.
    let partnershipProfitShare = 0;
    if (emp.partnershipType && emp.partnershipType !== 'none') {
      // Calculate total collections this month
      const totalCollections = this.state.payments.reduce((sum, p) => sum + p.amount, 0);
      
      // Calculate total cost of materials / product costs & expenses
      const totalProductCosts = this.state.movements
        .filter(m => m.type === 'out')
        .reduce((sum, m) => {
          const prod = this.state.products.find(p => p.id === m.productId);
          return sum + (prod ? prod.cost * m.quantity : 0);
        }, 0);
      
      const totalExpenses = this.state.expenses.reduce((sum, e) => sum + e.amount, 0);
      const totalOrderExpenses = this.state.orders.reduce((sum, o) => sum + (o.expenses || 0), 0);

      const netProfit = Math.max(0, totalCollections - (totalProductCosts + totalExpenses + totalOrderExpenses));

      const ratio = emp.partnershipType === '30/70' ? 0.30 
                  : emp.partnershipType === '40/60' ? 0.40 
                  : emp.partnershipType === '50/50' ? 0.50 
                  : 0;
      partnershipProfitShare = Math.round(netProfit * ratio);
    }

    const baseSalary = emp.salary;
    const finalNetDue = baseSalary + overtimePay + commissionsPay + partnershipProfitShare;

    return {
      baseSalary,
      daysPresent,
      daysAbsent,
      overtimePay,
      commissionsPay,
      partnershipProfitShare,
      totalEarnings: finalNetDue,
      finalNetDue
    };
  }

  private checkIfFriday(dateStr: string): boolean {
    // DD/MM/YYYY
    const [d, m, y] = dateStr.split('/').map(Number);
    const date = new Date(y, m - 1, d);
    return date.getDay() === 5; // Sunday is 0, Friday is 5
  }

  // Suppliers CRUD
  public getSuppliers(): Supplier[] {
    return this.state.suppliers;
  }

  public addSupplier(data: Omit<Supplier, 'id'>): Supplier {
    const prefix = "SUP-";
    const nextNum = this.state.suppliers.length > 0
      ? Math.max(...this.state.suppliers.map(s => parseInt(s.id.split('-')[1]) || 0)) + 1
      : 1;
    const id = `${prefix}${String(nextNum).padStart(3, '0')}`;

    const newSupplier = { ...data, id };
    this.state.suppliers = [...this.state.suppliers, newSupplier];
    this.saveToCache();

    if (!isMockFirebase && auth.currentUser) {
      setDoc(doc(db, 'suppliers', id), newSupplier).catch(err => {
        this.handleFirestoreError(err, OperationType.CREATE, `suppliers/${id}`);
      });
    }

    return newSupplier;
  }

  public updateSupplier(id: string, data: Partial<Supplier>) {
    const oldS = this.state.suppliers.find(s => s.id === id);
    this.state.suppliers = this.state.suppliers.map(s => s.id === id ? { ...s, ...data } : s);
    this.saveToCache();

    if (oldS) {
      const changed = Object.keys(data).filter(k => (oldS as any)[k] !== (data as any)[k]);
      const updated = this.state.suppliers.find(s => s.id === id);
      this.logDetailedAudit('UPDATE', 'supplier', id, oldS, updated, changed);
    }

    if (!isMockFirebase && auth.currentUser) {
      const updated = this.state.suppliers.find(s => s.id === id);
      if (updated) {
        setDoc(doc(db, 'suppliers', id), updated).catch(err => {
          this.handleFirestoreError(err, OperationType.UPDATE, `suppliers/${id}`);
        });
      }
    }
  }

  public deleteSupplier(id: string) {
    const oldS = this.state.suppliers.find(s => s.id === id);
    this.state.suppliers = this.state.suppliers.filter(s => s.id !== id);
    this.saveToCache();

    if (oldS) {
      this.logDetailedAudit('DELETE', 'supplier', id, oldS, null, []);
    }

    if (!isMockFirebase && auth.currentUser) {
      deleteDoc(doc(db, 'suppliers', id)).catch(err => {
        this.handleFirestoreError(err, OperationType.DELETE, `suppliers/${id}`);
      });
    }
  }

  // Inventory & Product Management
  public getProducts(): Product[] {
    return this.state.products;
  }

  public addProduct(data: Omit<Product, 'id'>): Product {
    const prefix = "PRD-";
    const nextNum = this.state.products.length > 0
      ? Math.max(...this.state.products.map(p => parseInt(p.id.split('-')[1]) || 0)) + 1
      : 1;
    const id = `${prefix}${String(nextNum).padStart(3, '0')}`;

    const newProduct = { ...data, id };
    this.state.products = [...this.state.products, newProduct];
    this.saveToCache();

    if (!isMockFirebase && auth.currentUser) {
      setDoc(doc(db, 'products', id), newProduct).catch(err => {
        this.handleFirestoreError(err, OperationType.CREATE, `products/${id}`);
      });
    }

    return newProduct;
  }

  public updateProduct(id: string, data: Partial<Product>) {
    const oldP = this.state.products.find(p => p.id === id);
    this.state.products = this.state.products.map(p => {
      if (p.id === id) {
        const updated = { ...p, ...data };
        // Trigger notification if quantity <= reorderLevel
        if (updated.quantity <= updated.reorderLevel) {
          this.addNotification("نقص في المخزون", `لقد وصل رصيد الصنف '${updated.name}' للحد الحرج (${updated.quantity} وحدات)`, "low_stock");
        }
        return updated;
      }
      return p;
    });
    this.saveToCache();

    if (oldP) {
      const changed = Object.keys(data).filter(k => (oldP as any)[k] !== (data as any)[k]);
      const updated = this.state.products.find(p => p.id === id);
      this.logDetailedAudit('UPDATE', 'product', id, oldP, updated, changed);
    }

    if (!isMockFirebase && auth.currentUser) {
      const updated = this.state.products.find(p => p.id === id);
      if (updated) {
        setDoc(doc(db, 'products', id), updated).catch(err => {
          this.handleFirestoreError(err, OperationType.UPDATE, `products/${id}`);
        });
      }
    }
  }

  public deleteProduct(id: string) {
    const oldP = this.state.products.find(p => p.id === id);
    this.state.products = this.state.products.filter(p => p.id !== id);
    this.saveToCache();

    if (oldP) {
      this.logDetailedAudit('DELETE', 'product', id, oldP, null, []);
    }

    if (!isMockFirebase && auth.currentUser) {
      deleteDoc(doc(db, 'products', id)).catch(err => {
        this.handleFirestoreError(err, OperationType.DELETE, `products/${id}`);
      });
    }
  }

  public getInventoryMovements(): InventoryMovement[] {
    return this.state.movements;
  }

  public addInventoryMovement(productId: string, type: 'in' | 'out', quantity: number, notes?: string) {
    const id = "MVT-" + Math.random().toString(36).substr(2, 9).toUpperCase();
    const dateObj = new Date();
    const dateStr = `${String(dateObj.getDate()).padStart(2, '0')}/${String(dateObj.getMonth() + 1).padStart(2, '0')}/${dateObj.getFullYear()}`;

    const movement: InventoryMovement = {
      id,
      productId,
      type,
      quantity,
      date: dateStr,
      notes
    };

    this.state.movements = [movement, ...this.state.movements];
    
    // adjust product inventory
    const prodIndex = this.state.products.findIndex(p => p.id === productId);
    if (prodIndex !== -1) {
      const currentQty = this.state.products[prodIndex].quantity;
      const newQty = type === 'in' ? currentQty + quantity : Math.max(0, currentQty - quantity);
      this.updateProduct(productId, { quantity: newQty });
    }

    this.saveToCache();

    if (!isMockFirebase && auth.currentUser) {
      setDoc(doc(db, 'inventory_movements', id), movement).catch(err => {
        this.handleFirestoreError(err, OperationType.CREATE, `inventory_movements/${id}`);
      });
    }
  }

  // Notifications
  public getNotifications(): NotificationItem[] {
    return this.state.notifications;
  }

  public addNotification(title: string, body: string, type: NotificationItem['type']) {
    const id = "NTF-" + Math.random().toString(36).substr(2, 9).toUpperCase();
    const d = new Date();
    const dateStr = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

    const newItem: NotificationItem = {
      id,
      title,
      body,
      date: dateStr,
      type,
      read: false
    };

    // Play a friendly beep notification sound if settings are enabled
    try {
      if (typeof window !== 'undefined') {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5 note
        gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.15);
      }
    } catch (e) {
      // Sound fails if user gesture not made, that's completely normal and safe
    }

    this.state.notifications = [newItem, ...this.state.notifications];
    this.saveToCache();

    if (!isMockFirebase && auth.currentUser) {
      setDoc(doc(db, 'notifications', id), newItem).catch(err => {
        this.handleFirestoreError(err, OperationType.CREATE, `notifications/${id}`);
      });
    }
  }

  public markNotificationRead(id: string) {
    this.state.notifications = this.state.notifications.map(n => n.id === id ? { ...n, read: true } : n);
    this.saveToCache();

    if (!isMockFirebase && auth.currentUser) {
      const updated = this.state.notifications.find(n => n.id === id);
      if (updated) {
        setDoc(doc(db, 'notifications', id), updated).catch(err => {
          this.handleFirestoreError(err, OperationType.UPDATE, `notifications/${id}`);
        });
      }
    }
  }

  public clearAllNotifications() {
    const toDelete = [...this.state.notifications];
    this.state.notifications = [];
    this.saveToCache();

    if (!isMockFirebase && auth.currentUser) {
      toDelete.forEach(n => {
        deleteDoc(doc(db, 'notifications', n.id)).catch(err => {
          this.handleFirestoreError(err, OperationType.DELETE, `notifications/${n.id}`);
        });
      });
    }
  }

  // Settings
  public getSettings(): CompanySettings {
    return this.state.settings;
  }

  public updateSettings(data: Partial<CompanySettings>) {
    this.state.settings = { ...this.state.settings, ...data };
    this.saveToCache();

    if (!isMockFirebase && auth.currentUser) {
      setDoc(doc(db, 'settings', 'company_settings'), this.state.settings).catch(err => {
        this.handleFirestoreError(err, OperationType.UPDATE, 'settings/company_settings');
      });
    }
  }

  // --- DETAILED AUDIT LOGGING & SECURITY BIOMARKERS ---
  public logDetailedAudit(
    action: 'CREATE' | 'UPDATE' | 'DELETE',
    recordType: string,
    recordId: string,
    oldValue: any,
    newValue: any,
    changedFields: string[]
  ) {
    const user = this.state.currentUser;
    const userName = user?.name || 'مستشار النظام';
    const userRole = user?.role || 'super_admin';
    const email = user?.email || 'mgc.air1@gmail.com';
    const uid = user?.uid || 'super_admin_fixed_user_id';

    const dateObj = new Date();
    const timestamp = `${String(dateObj.getDate()).padStart(2, '0')}/${String(dateObj.getMonth() + 1).padStart(2, '0')}/${dateObj.getFullYear()} ${String(dateObj.getHours()).padStart(2, '0')}:${String(dateObj.getMinutes()).padStart(2, '0')}:${String(dateObj.getSeconds()).padStart(2, '0')}`;

    let detailsStr = '';
    if (action === 'UPDATE') {
      detailsStr = `تعديل سجل (${recordType}) ذو الرقم ${recordId} | تم بواسطة: ${userName} (${userRole}) | الحقول المعدلة: [${changedFields.join(', ')}] | القيم القديمة: ${JSON.stringify(oldValue)} | القيم الجديدة: ${JSON.stringify(newValue)}`;
    } else if (action === 'DELETE') {
      detailsStr = `حذف سجل (${recordType}) ذو الرقم ${recordId} نهائياً | تم بواسطة: ${userName} (${userRole}) | البيانات المحذوفة كاملة: ${JSON.stringify(oldValue)}`;
    } else {
      detailsStr = `إنشاء سجل (${recordType}) جديد ذو الرقم ${recordId} | تم بواسطة: ${userName} (${userRole}) | البيانات المدخلة كاملة: ${JSON.stringify(newValue)}`;
    }

    if (!this.state.settings.auditLogs) {
      this.state.settings.auditLogs = [];
    }

    this.state.settings.auditLogs.unshift({
      id: "AUD-" + Math.random().toString(36).substr(2, 9).toUpperCase(),
      userId: uid,
      userEmail: `${userName} (${userRole})`,
      action,
      entity: recordType,
      entityId: recordId,
      timestamp,
      details: detailsStr
    });

    this.saveToCache();

    if (!isMockFirebase && auth.currentUser) {
      setDoc(doc(db, 'settings', 'company_settings'), this.state.settings).catch(err => {
        console.error("Firestore sync fail for auditLogs", err);
      });
    }
  }

  // --- EXTRA CRUD INTERFACES ---
  
  // User Accounts
  public getUsers(): UserProfile[] {
    return this.state.users;
  }

  public addUser(user: Omit<UserProfile, 'uid'> & { uid?: string }): UserProfile {
    const uid = user.uid || "USR-" + Math.random().toString(36).substr(2, 9).toUpperCase();
    const newUser: UserProfile = {
      ...user,
      uid,
      needsPasswordChange: false
    };
    this.state.users = [newUser, ...this.state.users.filter(u => u.uid !== uid)];
    this.saveToCache();
    this.logDetailedAudit('CREATE', 'user', uid, null, newUser, []);

    if (!isMockFirebase && auth.currentUser) {
      setDoc(doc(db, 'users', uid), newUser).catch(err => {
        this.handleFirestoreError(err, OperationType.CREATE, `users/${uid}`);
      });
    }
    return newUser;
  }

  public updateUser(uid: string, data: Partial<UserProfile>) {
    const oldU = this.state.users.find(u => u.uid === uid);
    this.state.users = this.state.users.map(u => u.uid === uid ? { ...u, ...data } : u);
    this.saveToCache();
    
    if (oldU) {
      const changed = Object.keys(data).filter(k => (oldU as any)[k] !== (data as any)[k]);
      const updated = this.state.users.find(u => u.uid === uid);
      this.logDetailedAudit('UPDATE', 'user', uid, oldU, updated, changed);
    }

    if (!isMockFirebase && auth.currentUser) {
      const updated = this.state.users.find(u => u.uid === uid);
      if (updated) {
        setDoc(doc(db, 'users', uid), updated).catch(err => {
          this.handleFirestoreError(err, OperationType.UPDATE, `users/${uid}`);
        });
      }
    }
  }

  public deleteUser(uid: string) {
    const oldU = this.state.users.find(u => u.uid === uid);
    if (oldU?.email === 'mgc.air1@gmail.com' || oldU?.role === UserRole.SUPER_ADMIN) {
      throw new Error('حماية حساب المشرف العام: لا يمكن حذف حساب السوبر أدمن الأساسي للنظام!');
    }
    this.state.users = this.state.users.filter(u => u.uid !== uid);
    this.saveToCache();

    if (oldU) {
      this.logDetailedAudit('DELETE', 'user', uid, oldU, null, []);
    }

    if (!isMockFirebase && auth.currentUser) {
      deleteDoc(doc(db, 'users', uid)).catch(err => {
        this.handleFirestoreError(err, OperationType.DELETE, `users/${uid}`);
      });
    }
  }

  // Payments Update & Delete
  public updatePayment(id: string, data: Partial<Payment>) {
    const oldP = this.state.payments.find(p => p.id === id);
    this.state.payments = this.state.payments.map(p => p.id === id ? { ...p, ...data } : p);
    this.saveToCache();

    if (oldP) {
      const changed = Object.keys(data).filter(k => (oldP as any)[k] !== (data as any)[k]);
      const updated = this.state.payments.find(p => p.id === id);
      this.logDetailedAudit('UPDATE', 'payment', id, oldP, updated, changed);

      // Recalculate invoice status if invoiceId is involved
      const invoiceId = data.invoiceId || oldP.invoiceId;
      const invIndex = this.state.invoices.findIndex(inv => inv.invoiceNumber === invoiceId);
      if (invIndex !== -1) {
        const inv = this.state.invoices[invIndex];
        const paymentsForInv = this.state.payments
          .filter(p => p.invoiceId === invoiceId)
          .reduce((sum, p) => sum + p.amount, 0);

        let newStatus: 'paid' | 'partially_paid' | 'unpaid' = 'unpaid';
        if (paymentsForInv >= inv.totalAmount) {
          newStatus = 'paid';
        } else if (paymentsForInv > 0) {
          newStatus = 'partially_paid';
        }
        this.state.invoices[invIndex].status = newStatus;
        if (!isMockFirebase && auth.currentUser) {
          setDoc(doc(db, 'invoices', inv.invoiceNumber), this.state.invoices[invIndex]).catch(err => {
            this.handleFirestoreError(err, OperationType.UPDATE, `invoices/${inv.invoiceNumber}`);
          });
        }
      }
    }

    if (!isMockFirebase && auth.currentUser) {
      const updated = this.state.payments.find(p => p.id === id);
      if (updated) {
        setDoc(doc(db, 'payments', id), updated).catch(err => {
          this.handleFirestoreError(err, OperationType.UPDATE, `payments/${id}`);
        });
      }
    }
  }

  public deletePayment(id: string) {
    const oldP = this.state.payments.find(p => p.id === id);
    this.state.payments = this.state.payments.filter(p => p.id !== id);
    this.saveToCache();

    if (oldP) {
      this.logDetailedAudit('DELETE', 'payment', id, oldP, null, []);

      // Recalculate invoice status
      const invIndex = this.state.invoices.findIndex(inv => inv.invoiceNumber === oldP.invoiceId);
      if (invIndex !== -1) {
        const inv = this.state.invoices[invIndex];
        const paymentsForInv = this.state.payments
          .filter(p => p.invoiceId === oldP.invoiceId)
          .reduce((sum, p) => sum + p.amount, 0);

        let newStatus: 'paid' | 'partially_paid' | 'unpaid' = 'unpaid';
        if (paymentsForInv >= inv.totalAmount) {
          newStatus = 'paid';
        } else if (paymentsForInv > 0) {
          newStatus = 'partially_paid';
        }
        this.state.invoices[invIndex].status = newStatus;
        if (!isMockFirebase && auth.currentUser) {
          setDoc(doc(db, 'invoices', inv.invoiceNumber), this.state.invoices[invIndex]).catch(err => {
            this.handleFirestoreError(err, OperationType.UPDATE, `invoices/${inv.invoiceNumber}`);
          });
        }
      }
    }

    if (!isMockFirebase && auth.currentUser) {
      deleteDoc(doc(db, 'payments', id)).catch(err => {
        this.handleFirestoreError(err, OperationType.DELETE, `payments/${id}`);
      });
    }
  }

  // Expenses Update Link
  public updateExpense(id: string, data: Partial<Expense>) {
    const oldE = this.state.expenses.find(e => e.id === id);
    this.state.expenses = this.state.expenses.map(e => e.id === id ? { ...e, ...data } : e);
    this.saveToCache();

    if (oldE) {
      const changed = Object.keys(data).filter(k => (oldE as any)[k] !== (data as any)[k]);
      const updated = this.state.expenses.find(e => e.id === id);
      this.logDetailedAudit('UPDATE', 'expense', id, oldE, updated, changed);
    }

    if (!isMockFirebase && auth.currentUser) {
      const updated = this.state.expenses.find(e => e.id === id);
      if (updated) {
        setDoc(doc(db, 'expenses', id), updated).catch(err => {
          this.handleFirestoreError(err, OperationType.UPDATE, `expenses/${id}`);
        });
      }
    }
  }

  // Attendance Update & Delete
  public updateAttendance(id: string, data: Partial<AttendanceRecord>) {
    const oldA = this.state.attendance.find(a => a.id === id);
    this.state.attendance = this.state.attendance.map(a => a.id === id ? { ...a, ...data } : a);
    this.saveToCache();

    if (oldA) {
      const changed = Object.keys(data).filter(k => (oldA as any)[k] !== (data as any)[k]);
      const updated = this.state.attendance.find(a => a.id === id);
      this.logDetailedAudit('UPDATE', 'attendance', id, oldA, updated, changed);
    }

    if (!isMockFirebase && auth.currentUser) {
      const updated = this.state.attendance.find(a => a.id === id);
      if (updated) {
        setDoc(doc(db, 'employees', updated.employeeId, 'attendance', id), updated).catch(err => {
          this.handleFirestoreError(err, OperationType.UPDATE, `employees/${updated.employeeId}/attendance/${id}`);
        });
      }
    }
  }

  public deleteAttendance(id: string) {
    const oldA = this.state.attendance.find(a => a.id === id);
    this.state.attendance = this.state.attendance.filter(a => a.id !== id);
    this.saveToCache();

    if (oldA) {
      this.logDetailedAudit('DELETE', 'attendance', id, oldA, null, []);
    }

    if (!isMockFirebase && auth.currentUser && oldA) {
      deleteDoc(doc(db, 'employees', oldA.employeeId, 'attendance', id)).catch(err => {
        this.handleFirestoreError(err, OperationType.DELETE, `employees/${oldA.employeeId}/attendance/${id}`);
      });
    }
  }

  // Firebase Storage File Uploader
  public async uploadFile(file: File | Blob, folder: string, fileName: string): Promise<string> {
    if (isMockFirebase) {
      return `https://mockstorage.mgroupcool.com/${folder}/${fileName}`;
    }
    try {
      const storageRef = ref(storage, `${folder}/${fileName}`);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadUrl = await getDownloadURL(snapshot.ref);
      return downloadUrl;
    } catch (err) {
      console.error("Firebase Storage Upload Failed:", err);
      throw err;
    }
  }

  // Export JSON & Import JSON Backup System
  public exportBackup(): string {
    return JSON.stringify(this.state, null, 2);
  }

  public importBackup(jsonString: string): boolean {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed && typeof parsed === 'object' && Array.isArray(parsed.customers) && Array.isArray(parsed.employees)) {
        this.state = {
          ...this.state,
          ...parsed,
          currentUser: this.state.currentUser // preserve active login session
        };
        this.saveToCache();
        return true;
      }
    } catch (e) {
      console.error('Failed to import ERP backup JSON', e);
    }
    return false;
  }
}

export const dataService = new DataService();

export function setDoc(docRef: any, data: any) {
  return dataService.queueOfflineWrite('CREATE_OR_UPDATE', docRef.path, data);
}

export function deleteDoc(docRef: any) {
  return dataService.queueOfflineWrite('DELETE', docRef.path, null);
}
