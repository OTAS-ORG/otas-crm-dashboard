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

export interface AuditLog {
  _id: string;
  clientId: string;
  user: string;
  action: string;
  details: any;
  timestamp: string;
}
