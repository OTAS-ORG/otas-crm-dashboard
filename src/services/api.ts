import axios from 'axios';
import type { Client, AuditLog, Submission, Invoice, PasswordEntry, PasswordCategory } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface ApiResponse<T> {
  success: boolean;
  message: string;
  statusCode: number;
  data: T;
}

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  const storedUser = localStorage.getItem('otas_user');
  if (storedUser) {
    const { token } = JSON.parse(storedUser);
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const clientService = {
  getClients: async (params?: { search?: string; status?: string; isPostSale?: boolean }) => {
    const response = await api.get<ApiResponse<Client[]>>('/clients', { params });
    return response.data.data;
  },
  
  getClient: async (id: string) => {
    const response = await api.get<ApiResponse<{ client: Client; auditLogs: AuditLog[] }>>(`/clients/${id}`);
    return response.data.data;
  },
  
  createClient: async (data: Partial<Client>) => {
    const response = await api.post<ApiResponse<Client>>('/clients', data);
    return response.data.data;
  },
  
  updateClient: async (id: string, data: Partial<Client>) => {
    const response = await api.put<ApiResponse<Client>>(`/clients/${id}`, data);
    return response.data.data;
  },
  
  addLog: async (id: string, text: string) => {
    const response = await api.post<ApiResponse<Client>>(`/clients/${id}/logs`, { text });
    return response.data.data;
  },
  
  deleteClient: async (id: string) => {
    const response = await api.delete<ApiResponse<null>>(`/clients/${id}`);
    return response.data;
  },
  
  getClientDashboardData: async (id: string) => {
    const response = await api.get<ApiResponse<{ profile: Client; submissions: Submission[] }>>(`/clients/${id}/data`);
    return response.data.data;
  },
  
  submitForm: async (data: Partial<Submission>) => {
    const response = await api.post<ApiResponse<Submission>>('/client-form/submit', data);
    return response.data.data;
  },
  
  uploadFiles: async (files: File[]) => {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    const response = await api.post<ApiResponse<{ urls: string[] }>>('/client-form/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data.data.urls;
  },

  // Invoice Methods
  getInvoices: async (params?: { search?: string; status?: string }) => {
    const response = await api.get<ApiResponse<Invoice[]>>('/invoices', { params });
    return response.data.data;
  },

  getInvoice: async (id: string) => {
    const response = await api.get<ApiResponse<Invoice>>(`/invoices/${id}`);
    return response.data.data;
  },

  createInvoice: async (data: Partial<Invoice>) => {
    const response = await api.post<ApiResponse<Invoice>>('/invoices', data);
    return response.data.data;
  },

  updateInvoice: async (id: string, data: Partial<Invoice>) => {
    const response = await api.put<ApiResponse<Invoice>>(`/invoices/${id}`, data);
    return response.data.data;
  },

  updateInvoiceStatus: async (id: string, data: { status?: string; paymentStatus?: string; payoutStatus?: string }) => {
    const response = await api.patch<ApiResponse<Invoice>>(`/invoices/${id}/status`, data);
    return response.data.data;
  },

  confirmPayment: async (id: string, data: { channel: string; amount: number; senderName?: string; dateTime: string; note?: string }) => {
    const response = await api.post<ApiResponse<Invoice>>(`/invoices/${id}/payment`, data);
    return response.data.data;
  },

  confirmPayout: async (id: string, data: { channel: string; amount: number; receiverName?: string; dateTime: string; note?: string }) => {
    const response = await api.post<ApiResponse<Invoice>>(`/invoices/${id}/payout`, data);
    return response.data.data;
  },

  lockInvoice: async (id: string) => {
    const response = await api.post<ApiResponse<Invoice>>(`/invoices/${id}/lock`);
    return response.data.data;
  },

  unlockInvoice: async (id: string) => {
    const response = await api.post<ApiResponse<Invoice>>(`/invoices/${id}/unlock`);
    return response.data.data;
  },

  // Public Methods (No Auth)
  getPublicClientInfo: async (id: string) => {
    const response = await axios.get(`${API_URL}/public/client-info/${id}`);
    return response.data.data;
  },

  submitPublicForm: async (data: any) => {
    const response = await axios.post(`${API_URL}/public/submit`, data);
    return response.data.data;
  },

  uploadPublicFiles: async (files: File[]) => {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    const response = await axios.post(`${API_URL}/public/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data.data.urls;
  }
};

export const passwordService = {
  getPasswords: async (params?: { clientId?: string; search?: string; category?: PasswordCategory }) => {
    const response = await api.get<ApiResponse<PasswordEntry[]>>('/passwords', { params });
    return response.data.data;
  },
  getPassword: async (id: string) => {
    const response = await api.get<ApiResponse<PasswordEntry>>(`/passwords/${id}`);
    return response.data.data;
  },
  createPassword: async (data: { clientId?: string; name: string; url?: string; username?: string; password: string; category?: PasswordCategory; notes?: string }) => {
    const response = await api.post<ApiResponse<PasswordEntry>>('/passwords', data);
    return response.data.data;
  },
  updatePassword: async (id: string, data: { name?: string; url?: string; username?: string; password?: string; category?: PasswordCategory; notes?: string }) => {
    const response = await api.put<ApiResponse<PasswordEntry>>(`/passwords/${id}`, data);
    return response.data.data;
  },
  deletePassword: async (id: string) => {
    const response = await api.delete<ApiResponse<null>>(`/passwords/${id}`);
    return response.data;
  },
  decryptPassword: async (id: string) => {
    const response = await api.post<ApiResponse<{ password: string }>>(`/passwords/${id}/decrypt`);
    return response.data.data;
  },
  setVaultPin: async (pin: string, currentPassword: string) => {
    const response = await api.post<ApiResponse<null>>('/auth/set-vault-pin', { pin, currentPassword });
    return response.data;
  },
  verifyVaultPin: async (pin: string) => {
    const response = await api.post<ApiResponse<null>>('/auth/verify-vault-pin', { pin });
    return response.data;
  },
};

export const invoiceService = {
  getInvoices: clientService.getInvoices,
  getInvoice: clientService.getInvoice,
  createInvoice: clientService.createInvoice,
  updateInvoice: clientService.updateInvoice,
  updateInvoiceStatus: clientService.updateInvoiceStatus,
  confirmPayment: clientService.confirmPayment,
  confirmPayout: clientService.confirmPayout,
  lockInvoice: clientService.lockInvoice,
  unlockInvoice: clientService.unlockInvoice,
};
