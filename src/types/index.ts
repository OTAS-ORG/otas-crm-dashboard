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
  department?: string;
  paymentMethod?: string;
  clientId?: { _id: string; companyName: string } | string;
  notes?: string;
  status?: 'Pending' | 'Approved' | 'Rejected';
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

export interface ExpenseDepartment {
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
  prevYearRevenueMMK: number;
  prevYearExpenseMMK: number;
  revenue: {
    byMonth: { _id: { month: number }; total: number; count: number }[];
    byType: { _id: string; total: number; count: number }[];
  };
  expenses: {
    byMonth: { _id: { month: number }; total: number; count: number }[];
    categoryBreakdown: { _id: string; total: number; count: number }[];
    byDepartment: { _id: string; total: number; count: number }[];
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
  payroll: {
    summary: { totalNetPay: number; totalBaseSalary: number; totalAllowances: number; totalDeductions: number; count: number };
    byMonth: { _id: { month: number }; totalNetPay: number; totalBaseSalary: number; totalAllowances: number; totalDeductions: number; count: number }[];
  };
  tickets: {
    total: number;
    byStatus: { _id: string; count: number }[];
    byDepartment: { _id: string; count: number }[];
  };
}

export interface Department {
  _id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export type TicketStatus = 'Open' | 'In Progress' | 'Pending' | 'Resolved';
export type TicketPriority = 'Low' | 'Medium' | 'High';

export interface Ticket {
  _id: string;
  title: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  department_id?: { _id: string; name: string } | string;
  assigned_to?: { _id: string; username: string } | string;
  created_by: { _id: string; username: string } | string;
  createdAt: string;
  updatedAt: string;
}

export interface TicketComment {
  _id: string;
  ticket_id: string;
  user_id: { _id: string; username: string };
  message: string;
  createdAt: string;
}

export interface TicketHistory {
  _id: string;
  ticket_id: string;
  user_id: { _id: string; username: string };
  action_performed: string;
  createdAt: string;
}

export interface TicketDetailData {
  ticket: Ticket;
  comments: TicketComment[];
  history: TicketHistory[];
}

export interface UserInfo {
  _id: string;
  username: string;
  role: string;
  departments?: { _id: string; name: string }[] | string[];
  telegramChatId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SalaryAllowances {
  phone: number;
  internet: number;
  travel: number;
  meal: number;
  commission: number;
}

export interface SalaryDeductions {
  unpaidLeave: number;
  latePenalty: number;
  advanceSalary: number;
}

export interface Salary {
  _id: string;
  employeeName: string;
  employeeId?: string;
  position?: string;
  dateOfJoining?: string;
  department?: string;
  month: number;
  year: number;
  baseSalary: number;
  allowances: SalaryAllowances;
  deductions: SalaryDeductions;
  totalAllowances: number;
  totalDeductions: number;
  netPay: number;
  currency: 'MMK' | 'USD';
  exchangeRate: number;
  status: 'Draft' | 'Paid';
  paymentChannel?: string;
  paidDate?: string;
  notes?: string;
  createdBy?: { _id: string; username: string };
  createdAt: string;
  updatedAt: string;
}

export interface SalarySummary {
  year: number;
  monthlyData: { _id: { month: number }; count: number; totalBaseSalary: number; totalAllowances: number; totalDeductions: number; totalNetPay: number }[];
  totals: { count: number; totalBaseSalary: number; totalAllowances: number; totalDeductions: number; totalNetPay: number };
}

export type SDLCStatus = 'backlog' | 'todo' | 'in-progress' | 'code-review' | 'qa-testing' | 'done';
export type TaskPriority = 'urgent' | 'high' | 'normal' | 'low';

export interface Project {
  _id: string;
  name: string;
  description?: string;
  projectKey: string;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  _id: string;
  title: string;
  description?: string;
  status: SDLCStatus;
  priority: TaskPriority;
  due_date?: string;
  estimatedHours?: number;
  actualHours?: number;
  assignedTo?: { _id: string; username: string } | string;
  qaAssignedTo?: { _id: string; username: string } | string;
  projectId: string;
  createdAt: string;
  updatedAt: string;
}

export interface TaskComment {
  _id: string;
  task_id: string;
  user_id: { _id: string; username: string };
  message: string;
  createdAt: string;
}

export interface AIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AIChatResponse {
  content: string;
  model: string;
  usage: { promptTokens: number; completionTokens: number };
}

export interface AIGenerateResponse {
  content: string;
  type: string;
  model: string;
  usage: { promptTokens: number; completionTokens: number };
}

export interface AIInsights {
  summary: string;
  strengths: string[];
  risks: string[];
  nextSteps: string[];
  recommendations: { action: string; priority: 'high' | 'medium' | 'low' }[];
  model?: string;
}

export interface AISuggestion {
  departmentId: string;
  departmentName: string;
  assignedTo: string;
  assignedToName: string;
  priority: string;
  estimatedTime: string;
  reasoning: string;
  model?: string;
}

export interface AIModel {
  id: string;
  name: string;
  contextLength: number;
  isFree: boolean;
}
