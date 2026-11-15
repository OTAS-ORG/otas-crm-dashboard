import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

export default function ChangePassword() {
  const { user, login, logout, loading } = useAuth();
  const navigate = useNavigate();
  const [currentPassword, setCurrent] = useState('');
  const [newPassword, setNew] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setError('');
    if (newPassword !== confirm) { setError('Password အသစ်နှစ်ခု မတူပါ။'); return; }
    setBusy(true);
    try {
      const url = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const response = await axios.post(`${url}/auth/change-password`, { currentPassword, newPassword }, { headers: { Authorization: `Bearer ${user.token}` } });
      login(response.data.data); navigate('/', { replace: true });
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && ['USER_DISABLED', 'TOKEN_REVOKED', 'NOT_AUTHORIZED'].includes(err.response?.data?.code)) { logout(); navigate('/login', { replace: true }); }
      else setError('Password ပြောင်းမရပါ။ လက်ရှိ password နှင့် အသစ်ကို စစ်ပေးပါ။');
    } finally { setBusy(false); }
  };
  return <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4"><form onSubmit={submit} className="w-full max-w-md bg-white p-6 rounded-2xl shadow space-y-4">
    <h1 className="text-xl font-bold">Password ပြောင်းရန်</h1>
    <label className="block">လက်ရှိ password<input required type="password" autoComplete="current-password" value={currentPassword} onChange={e => setCurrent(e.target.value)} className="block w-full border rounded p-2" /></label>
    <label className="block">Password အသစ်<input required type="password" autoComplete="new-password" value={newPassword} onChange={e => setNew(e.target.value)} className="block w-full border rounded p-2" /></label>
    <label className="block">Password အသစ် ပြန်ရိုက်ပါ<input required type="password" autoComplete="new-password" value={confirm} onChange={e => setConfirm(e.target.value)} className="block w-full border rounded p-2" /></label>
    {error && <p role="alert" className="text-red-700">{error}</p>}
    <button disabled={busy} className="bg-blue-700 text-white rounded px-4 py-2">{busy ? 'သိမ်းနေသည်…' : 'Password ပြောင်းမည်'}</button>
    <button type="button" onClick={logout} className="ml-3 text-slate-600">ထွက်မည်</button>
  </form></div>;
}
