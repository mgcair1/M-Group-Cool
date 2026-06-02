/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  MANAGER = 'manager',
  ACCOUNTANT = 'accountant',
  TECHNICIAN = 'technician',
  ASSISTANT = 'assistant',
  SALES = 'sales',
  VIEWER = 'viewer',
}

export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  phone?: string;
  role: UserRole;
  needsPasswordChange?: boolean;
}

export interface Customer {
  id: string; // CUS-xxxxxx
  name: string;
  phone: string;
  phone2?: string;
  email?: string;
  address: string;
  governorate: string;
  region: string;
  customerSource: string;
  notes?: string;
  rating: number; // 1 to 5
  createdAt: string; // DD/MM/YYYY
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
}

export interface Device {
  id: string;
  customerId: string;
  brand: string;
  type: string; // سبليت، مركزي، إلخ
  capacity: string; // 1.5 حصان، إلخ
  serialNumber?: string;
  installationDate?: string;
  warranty?: string;
  model?: string;
  notes?: string;
}

export interface MaintenanceOrder {
  id: string; // WO-YYYY-xxxxxx
  customerId: string;
  deviceId: string;
  technicianId: string;
  assistantId?: string;
  serviceType: string; // تركيب، فك، نقِل، غسيل، شحن فريون، صيانة، معاينة
  status: 'new' | 'in_progress' | 'completed' | 'cancelled';
  priority?: 'low' | 'medium' | 'high';
  date: string; // DD/MM/YYYY
  cost: number;
  collectionAmount: number;
  expenses: number;
  photoBefore?: string; // Base64 or URL
  photoAfter?: string; // Base64 or URL
  notes?: string;
}

export interface Contract {
  contractNumber: string;
  customerId: string;
  value: number;
  devicesCount: number;
  visitsCount: number;
  startDate: string; // DD/MM/YYYY
  endDate: string; // DD/MM/YYYY
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  price?: number;
  total: number;
  unitPrice?: number;
}

export interface Invoice {
  invoiceNumber: string; // INV-YYYY-xxxxxx
  type?: 'quote' | 'invoice' | 'tax_invoice';
  customerId: string;
  vatRate?: number; // e.g. 14 (for 14%)
  subtotal: number;
  vatAmount?: number;
  totalAmount: number;
  items: InvoiceItem[];
  date: string; // DD/MM/YYYY
  status: 'draft' | 'paid' | 'partially_paid' | 'unpaid';
  invoiceType?: string;
  id?: string;
  notes?: string;
  vat?: number;
  discount?: number;
}

export interface Payment {
  id: string;
  invoiceId: string;
  customerId: string;
  amount: number;
  paymentDate: string; // DD/MM/YYYY
  paymentType: string; // نقدي، فيزا، فودافون كاش، شيك
  notes?: string;
}

export interface Expense {
  id: string;
  amount: number;
  category: string; // إداري، قطع غيار، وقود، إيجار، إلخ
  date: string; // DD/MM/YYYY
  description: string;
  paidTo?: string;
}

export interface Employee {
  id: string;
  name: string;
  jobTitle: string;
  phone: string;
  email?: string;
  salary?: number; // راتب أساسي
  hireDate?: string; // DD/MM/YYYY
  commissionRate?: number; // نسبة العمولة بالـ %
  partnershipType?: 'none' | '30/70' | '40/60' | '50/50';
  baseSalary?: number;
  role?: string;
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  date: string; // DD/MM/YYYY
  checkIn?: string; // HH:MM
  checkOut?: string; // HH:MM
  workingHours?: number;
  overtimeHours?: number;
  status: 'present' | 'absent' | 'vacation' | 'holiday' | 'excused';
  isFridayOvertime?: boolean;
}

export interface Supplier {
  id: string;
  name?: string;
  contactPerson?: string;
  phone: string;
  email?: string;
  address?: string;
  notes?: string;
  companyName?: string;
  contactName?: string;
  categories?: string | string[];
}

export interface Product {
  id: string;
  name: string;
  quantity: number;
  reorderLevel: number;
  category: string;
  price?: number;
  cost?: number;
  sku?: string;
  sellPrice?: number;
  buyPrice?: number;
}

export interface InventoryMovement {
  id: string;
  productId: string;
  type: 'in' | 'out';
  quantity: number;
  date: string; // DD/MM/YYYY
  notes?: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  date: string; // DD/MM/YYYY HH:MM
  type: 'new_customer' | 'new_order' | 'collection' | 'contract_warning' | 'low_stock' | 'system';
  read: boolean;
}

export interface CompanySettings {
  companyName: string;
  logoData?: string; // Base64 encoding
  primaryColor: string;
  secondaryColor: string;
  vatRate: number; // 14%
  attendanceCheckIn: string; // 09:00
  attendanceCheckOut: string; // 19:00
  soundName: string;
  address?: string;
  phones?: string;
  email?: string;
  taxNumber?: string;
  invoiceTerms?: string;
  
  // Custom Dynamic Features Fields
  language?: 'ar' | 'en';
  themeMode?: 'light' | 'dark' | 'auto';
  logoLogin?: string; // Base64 or URL
  logoAppIcon?: string; // Base64 or URL
  bgLogin?: string; // Base64 or URL
  bgDashboard?: string; // Base64 or URL
  bgApp?: string; // Base64 or URL
  bgPrint?: string; // Base64 or URL
  
  customNames?: Record<string, string>; // e.g. "customers" -> "المشترين"
  fieldsConfig?: {
    id: string;
    model: 'customer' | 'device' | 'order' | 'product';
    labelAr: string;
    labelEn: string;
    type: 'text' | 'number' | 'date';
    required: boolean;
    hidden?: boolean;
    order: number;
  }[];
  showHideWidgets?: Record<string, boolean>; // e.g. "revenueCard" -> true / false
  customRoles?: {
    id: string;
    nameAr: string;
    nameEn: string;
    code: string;
  }[];
  auditLogs?: {
    id: string;
    userId: string;
    userEmail: string;
    action: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT';
    entity: string;
    entityId: string;
    timestamp: string; // DD/MM/YYYY HH:MM:SS
    details: string;
  }[];
  deviceSignatures?: Record<string, { clientSig?: string; techSig?: string; clientName?: string; techName?: string; signedDate?: string }>; // map of orderId -> signatures
  knowledgeBase?: {
    id: string;
    titleAr: string;
    titleEn: string;
    solutionsAr: string;
    solutionsEn: string;
  }[];
  periodicSchedules?: {
    id: string;
    customerId: string;
    deviceId: string;
    months: number;
    nextDate: string;
    description: string;
    completed?: boolean;
  }[];
  // Extended ERP & CRM Financial/Asset Support
  cashRegisters?: { id: string; nameAr: string; nameEn: string; balance: number }[];
  bankAccounts?: { id: string; nameAr: string; nameEn: string; accountNumber: string; balance: number }[];
  partnerWithdrawals?: { id: string; partner: 'Mohamed Ashraf' | 'Mahmoud'; amount: number; date: string; reason: string }[];
  partnerSplitRatio?: '50/50' | '40/60' | '30/70';
  recurringExpenses?: { id: string; category: 'rent' | 'internet' | 'electricity' | 'salaries' | 'subscriptions'; amount: number; description: string; lastGeneratedMonth?: string }[];
  supplierLedger?: { supplierId: string; balance: number; payments: { id: string; amount: number; date: string; notes?: string }[] }[];
  supplierLedgerPayments?: any[];
  approvalRequests?: { id: string; type: 'expense' | 'discount' | 'purchase' | 'withdrawal'; requester: string; amount: number; description: string; status: 'pending' | 'approved' | 'rejected'; date: string; approver?: string }[];
  assets?: any[];
  vehicles?: any[];
  custody?: { id: string; technicianId: string; itemName: string; type: 'tool' | 'equipment' | 'spare_part'; serialNumber?: string; status: 'assigned' | 'returned'; dateAssigned: string; notes?: string }[];
  documents?: { id: string; type: 'commercial_reg' | 'tax_doc' | 'contract' | 'license' | 'employee_doc' | 'technical'; nameAr: string; nameEn: string; expiryDate: string; fileBase64?: string; status: 'active' | 'warning' | 'expired' }[];
}

export interface SystemBackup {
  id: string;
  date: string;
  description: string;
  data: string; // JSON Stringified everything
}
