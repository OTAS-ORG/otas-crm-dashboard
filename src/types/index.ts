export interface ConversationLog {
  _id?: string;
  text: string;
  date: string;
}

export type ClientStatus =
  | "Inquiry"
  | "Service Explained"
  | "Meeting Made"
  | "Sent Proposal"
  | "Sent Contract"
  | "Signed"
  | "Ghosted"
  | "Follow-up needed"
  | "In-Development"
  | "Delivered";

export interface Client {
  _id: string;
  companyName: string;
  industry?: string;
  backgroundNote?: string;
  contactPerson: string;
  contactInfo: string;
  inquiryDate: string;
  sourceChannel: string;
  currentProblems?: string;
  desiredOutcome?: string;
  servicesExplained?: string;
  conversationLogs: ConversationLog[];
  status: ClientStatus;
  isPostSale: boolean;
  nextActionDate?: string;
  contactPersonPosition?: string;

  // Post-Sale
  projectId?: string;
  projectStartDate?: string;
  projectDeliveryDate?: string;
  deliverablesSummary?: string;

  // Purchased Services
  purchasedServices?: { type: string; name?: string; status?: string }[];

  createdAt: string;
  updatedAt: string;
}

export interface EmailPair {
  email: string;
  password: string;
}

export interface Submission {
  _id?: string;
  clientId: string;
  formType: string;
  submittedBy: {
    name: string;
    position: string;
  };
  formData: any;
  status: "Pending" | "Verified" | "Rejected";
  createdAt: string;
  updatedAt: string;
}

export interface ClientDashboardData {
  profile: Client;
  submissions: Submission[];
}

export interface InvoiceItem {
  _id?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  paymentTerm?: string;
  startDate?: string;
  endDate?: string;
}

export interface PaymentDetail {
  channel: string;
  amount: number;
  senderName?: string;
  receiverName?: string;
  dateTime: string;
  note?: string;
}

export type InvoiceStatus = 'Draft' | 'Sent' | 'Paid' | 'Cancelled';
export type InvoiceType = 'customize_project' | 'service_fee';
export type ServiceFeeType = 'server' | 'domain' | 'maintenance';

export interface Invoice {
  _id: string;
  invoiceNumber: string;
  type: InvoiceType;
  serviceType?: ServiceFeeType;
  clientId: string;
  companyName: string;
  contactPerson?: string;
  contactInfo?: string;
  projectId?: string;
  items: InvoiceItem[];
  amount: number;
  currency: 'MMK' | 'USD';
  exchangeRate: number;
  platformFeeRate: number;
  platformFee: number;
  additionalCharges: { name: string; amount: number }[];
  grandTotal: number;
  date: string;
  dueDate?: string;
  serviceStartDate?: string;
  serviceEndDate?: string;
  status: InvoiceStatus;
  paymentStatus: 'Pending' | 'Received';
  payoutStatus: 'Pending' | 'Paid';
  paymentMethod: string;
  paymentDetails?: PaymentDetail;
  payoutDetails?: PaymentDetail;
  isLocked: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  _id: string;
  clientId: string;
  user: string;
  action: string;
  details: any;
  timestamp: string;
}

export type PasswordCategory = 'hosting' | 'email' | 'social' | 'admin' | 'ftp' | 'database' | 'api' | 'other';

export type ServiceType = 'pos' | 'ai_agent' | 'erp' | 'ecommerce' | 'software' | string;

export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'number' | 'textarea' | 'file' | 'checkbox' | 'dropdown' | 'repeater';
  required?: boolean;
  placeholder?: string;
  options?: string[];
  accept?: string;
  maxSize?: number;
  conditions?: { dependsOn: string; value: string };
  fields?: FormField[];
}

export interface FormSection {
  title: string;
  description?: string;
  fields: FormField[];
}

export interface OnboardingFormConfig {
  _id: string;
  serviceType: string;
  serviceName: string;
  sections: FormSection[];
  sortOrder?: number;
  createdAt: string;
  updatedAt: string;
}

export interface OnboardingToken {
  _id: string;
  token: string;
  clientId: { _id: string; companyName: string; contactPerson?: string } | string;
  expiresAt: string;
  formData: Record<string, any>;
  isCompleted: boolean;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OnboardingFormData {
  client: { companyName: string; contactPerson: string; contactInfo?: string; email?: string };
  services: string[];
  formConfigs: OnboardingFormConfig[];
  savedFormData: Record<string, any>;
  expiresAt: string;
}

export interface FormConfigExport {
  serviceType: string;
  serviceName: string;
  sections: FormSection[];
  exportedAt: string;
  version: string;
}

export interface PasswordEntry {
  _id: string;
  clientId: { _id: string; companyName: string; contactPerson?: string } | string | null;
  name: string;
  url?: string;
  username?: string;
  encryptedPassword: string;
  iv: string;
  authTag: string;
  category: PasswordCategory;
  notes?: string;
  createdBy?: { _id: string; username: string };
  createdAt: string;
  updatedAt: string;
}

export interface Expense {
  _id: string;
  date: string;
  description: string;
  amount: number;
  currency: 'MMK' | 'USD';
  exchangeRate: number;
  category: string;
  paymentMethod?: string;
  clientId?: { _id: string; companyName: string } | string;
  notes?: string;
  createdBy?: { _id: string; username: string };
  createdAt: string;
  updatedAt: string;
}

export interface ExpenseCategory {
  _id: string;
  name: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExpenseSummary {
  year: number;
  totalExpensesMMK: number;
  monthlyData: { _id: { month: number }; total: number; count: number }[];
  categoryBreakdown: { _id: string; total: number; count: number }[];
}

export interface DashboardAnalytics {
  year: number;
  totalRevenueMMK: number;
  totalExpenseMMK: number;
  revenue: {
    byMonth: { _id: { month: number }; total: number; count: number }[];
    byType: { _id: string; total: number; count: number }[];
  };
  expenses: {
    byMonth: { _id: { month: number }; total: number; count: number }[];
    categoryBreakdown: { _id: string; total: number; count: number }[];
  };
  invoices: {
    statusCounts: { _id: string; count: number }[];
    paymentStatusCounts: { _id: string; count: number }[];
  };
  clients: {
    total: number;
    pipeline: { _id: string; count: number }[];
    sourceChannels: { _id: string; count: number }[];
    topByRevenue: { _id: string; totalRevenue: number; invoiceCount: number }[];
  };
}
