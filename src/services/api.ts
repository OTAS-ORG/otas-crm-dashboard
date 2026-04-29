import axios from 'axios';
import type { Client, AuditLog } from '../types';

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
  }
};
