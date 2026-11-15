import { useCallback, useEffect, useState } from 'react';
import { roleManagementService } from '../services/api';

type Staff = { _id: string; username: string; fullName: string; roles: string[]; active: boolean };
const ROLES = ['ceo_bd', 'finance_admin', 'sales', 'marketing_head', 'content_creator', 'pd_head', 'developer', 'uiux', 'dqa_head', 'dqa'];

export default function UserManagement() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [editing, setEditing] = useState<Staff | null>(null);
  const [secret, setSecret] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const load = useCallback(async () => {
    try { setStaff(await roleManagementService.list()); }
    catch { setError('ဝန်ထမ်းစာရင်း ရယူမရပါ။'); }
  }, []);
  useEffect(() => { void load(); }, [load]);
  const toggle = (role: string) => setSelected(current => current.includes(role) ? current.filter(item => item !== role) : [...current, role]);
  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setError(''); setSecret('');
    if (!selected.length) { setError('Role အနည်းဆုံးတစ်ခု ရွေးပါ။'); return; }
    setBusy(true);
    try {
      if (editing) await roleManagementService.roles(editing._id, selected);
      else { const result = await roleManagementService.create({ username, fullName, roles: selected }); setSecret(result.temporaryPassword); }
      setEditing(null); setUsername(''); setFullName(''); setSelected([]); await load();
    } catch { setError('သိမ်းဆည်းမရပါ။ အချက်အလက်နှင့် ခွင့်ပြုချက်ကို စစ်ပါ။'); }
    finally { setBusy(false); }
  };
  const perform = async (user: Staff, action: 'disable' | 'enable' | 'reset-password') => {
    setError(''); setSecret(''); setBusy(true);
    try { const result = await roleManagementService.action(user._id, action); if (result.temporaryPassword) setSecret(result.temporaryPassword); await load(); }
    catch { setError('လုပ်ဆောင်ချက် မအောင်မြင်ပါ။'); } finally { setBusy(false); }
  };
  return <div className="max-w-5xl mx-auto space-y-6"><h1 className="text-2xl font-bold">ဝန်ထမ်းအကောင့်များ</h1>
    {error && <p role="alert" className="text-red-700">{error}</p>}
    {secret && <div role="status" className="p-4 bg-amber-50 border rounded"><p>ယာယီ password — ယခုတစ်ကြိမ်သာ ပြသပါမည်။ လုံခြုံစွာ ပေးပို့ပါ။</p><code className="break-all">{secret}</code><button className="ml-3 underline" type="button" onClick={() => void navigator.clipboard.writeText(secret)}>ကူးယူ</button><button className="ml-3 underline" type="button" onClick={() => setSecret('')}>ပိတ်မည်</button></div>}
    <form onSubmit={submit} className="bg-white rounded-xl border p-4 space-y-3"><h2 className="font-semibold">{editing ? `${editing.username} — Role ပြင်ရန်` : 'အကောင့်အသစ်'}</h2>
      {!editing && <div className="grid sm:grid-cols-2 gap-3"><label>Username<input required value={username} onChange={e => setUsername(e.target.value)} className="block border rounded p-2 w-full" /></label><label>အမည်<input value={fullName} onChange={e => setFullName(e.target.value)} className="block border rounded p-2 w-full" /></label></div>}
      <fieldset><legend>Role များ</legend><div className="grid grid-cols-2 sm:grid-cols-3 gap-2">{ROLES.map(role => <label key={role}><input type="checkbox" checked={selected.includes(role)} onChange={() => toggle(role)} /> {role}</label>)}</div></fieldset>
      {selected.some(role => ['ceo_bd', 'finance_admin', 'sales'].includes(role)) && <p className="text-amber-800">ရွေးထားသော role တွင် ငွေကြေးအချက်အလက် ကြည့်ခွင့် ပါနိုင်သည်။</p>}
      <button disabled={busy} className="bg-blue-700 text-white rounded px-4 py-2">သိမ်းမည်</button> {editing && <button type="button" onClick={() => { setEditing(null); setSelected([]); }}>မလုပ်တော့ပါ</button>}
    </form>
    <div className="space-y-3">{staff.map(user => <div key={user._id} className={`bg-white border rounded-xl p-4 ${user.active ? '' : 'opacity-50'}`}><div className="font-semibold">{user.fullName || user.username} ({user.username})</div><p>{user.roles.join(', ') || 'Role မရှိ'} · {user.active ? 'အသုံးပြုနိုင်' : 'ပိတ်ထား'}</p><div className="flex flex-wrap gap-3 mt-2"><button disabled={busy} onClick={() => { setEditing(user); setSelected(user.roles); setSecret(''); }} className="underline">Role ပြင်</button><button disabled={busy} onClick={() => void perform(user, user.active ? 'disable' : 'enable')} className="underline">{user.active ? 'ပိတ်မည်' : 'ပြန်ဖွင့်မည်'}</button><button disabled={busy} onClick={() => void perform(user, 'reset-password')} className="underline">Password အသစ်ထုတ်</button></div></div>)}</div>
  </div>;
}
