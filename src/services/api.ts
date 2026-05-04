import axios from 'axios';
import type { Client, AuditLog, Submission } from '../types';

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
