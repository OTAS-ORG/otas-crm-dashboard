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

export interface Invoice {
  _id: string;
  invoiceNumber: string;
  clientId: string;
  companyName: string;
  contactPerson?: string;
  contactInfo?: string;
  projectId?: string;
  items: InvoiceItem[];
  amount: number;
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
