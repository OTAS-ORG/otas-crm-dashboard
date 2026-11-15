import React, { createContext, useState, useContext, useEffect } from 'react';

export type Role = 'ceo_bd' | 'finance_admin' | 'sales' | 'marketing_head' | 'content_creator' | 'pd_head' | 'developer' | 'uiux' | 'dqa_head' | 'dqa';
export interface SessionUser { _id: string; username: string; fullName: string; roles: Role[]; mustChangePassword: boolean; token: string }
const validRoles = new Set<Role>(['ceo_bd', 'finance_admin', 'sales', 'marketing_head', 'content_creator', 'pd_head', 'developer', 'uiux', 'dqa_head', 'dqa']);
export const sanitizeSession = (input: unknown): SessionUser | null => {
  if (!input || typeof input !== 'object') return null;
  const value = input as Record<string, unknown>;
  if (typeof value._id !== 'string' || !value._id || typeof value.username !== 'string' || !value.username ||
      typeof value.token !== 'string' || !value.token || !Array.isArray(value.roles) ||
      !value.roles.every((role) => validRoles.has(role as Role)) || typeof value.mustChangePassword !== 'boolean') return null;
  return { _id: value._id, username: value.username, fullName: typeof value.fullName === 'string' ? value.fullName : '',
    roles: value.roles as Role[], mustChangePassword: value.mustChangePassword, token: value.token };
};
interface AuthContextType { user: SessionUser | null; login: (user: SessionUser) => void; logout: () => void; loading: boolean }
const AuthContext = createContext<AuthContextType | undefined>(undefined);
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    try {
      const raw = localStorage.getItem('otas_user');
      const session = raw ? sanitizeSession(JSON.parse(raw)) : null;
      if (session) { setUser(session); localStorage.setItem('otas_user', JSON.stringify(session)); }
      else localStorage.removeItem('otas_user');
    } catch { localStorage.removeItem('otas_user'); }
    setLoading(false);
  }, []);
  const login = (input: SessionUser) => {
    const session = sanitizeSession(input);
    if (!session) throw new Error('Invalid session');
    setUser(session); localStorage.setItem('otas_user', JSON.stringify(session));
  };
  const logout = () => { setUser(null); localStorage.removeItem('otas_user'); };
  return <AuthContext.Provider value={{ user, login, logout, loading }}>{children}</AuthContext.Provider>;
};
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
