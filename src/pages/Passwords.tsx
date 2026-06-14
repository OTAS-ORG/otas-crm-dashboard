import React, { useEffect, useState, useCallback } from 'react';
import { passwordService } from '../services/api';
import { clientService } from '../services/api';
import type { PasswordEntry, PasswordCategory, Client } from '../types';
import { Plus, Search, Eye, EyeOff, Copy, Pencil, Trash2, Lock, ShieldCheck, Globe, Key, Mail, Users, FolderOpen, Database } from 'lucide-react';
import PasswordVaultModal from '../components/PasswordVaultModal';
import UnlockPinModal from '../components/UnlockPinModal';

const CATEGORIES: { value: PasswordCategory | ''; label: string }[] = [
  { value: '', label: 'All Categories' },
  { value: 'hosting', label: 'Hosting' },
  { value: 'email', label: 'Email' },
  { value: 'social', label: 'Social Media' },
  { value: 'admin', label: 'Admin Panel' },
  { value: 'ftp', label: 'FTP / SFTP' },
  { value: 'database', label: 'Database' },
  { value: 'api', label: 'API Key' },
  { value: 'other', label: 'Other' },
];

const Passwords: React.FC = () => {
  const [passwords, setPasswords] = useState<PasswordEntry[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<PasswordCategory | ''>('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState<PasswordEntry | null>(null);
  const [showUnlock, setShowUnlock] = useState(false);
  const [vaultUnlocked, setVaultUnlocked] = useState(false);
  const [pendingEntry, setPendingEntry] = useState<PasswordEntry | null>(null);
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, string>>({});
  const [revealTimers, setRevealTimers] = useState<Record<string, ReturnType<typeof setTimeout>>>({});
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const fetchPasswords = useCallback(async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (search) params.search = search;
      if (categoryFilter) params.category = categoryFilter;
      const data = await passwordService.getPasswords(params);
      setPasswords(data);
    } catch (err) {
      console.error('Failed to fetch passwords', err);
    } finally {
      setLoading(false);
    }
  }, [search, categoryFilter]);

  const fetchClients = useCallback(async () => {
    try {
      const data = await clientService.getClients();
      setClients(data);
    } catch (err) {
      console.error('Failed to fetch clients', err);
    }
  }, []);

  useEffect(() => {
    fetchPasswords();
  }, [fetchPasswords]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  useEffect(() => {
    return () => {
      Object.values(revealTimers).forEach(t => clearTimeout(t));
    };
  }, [revealTimers]);

  const handleViewPassword = async (entry: PasswordEntry) => {
    if (!vaultUnlocked) {
      setPendingEntry(entry);
      setShowUnlock(true);
      return;
    }
    await doReveal(entry);
  };

  const doReveal = async (entry: PasswordEntry) => {
    try {
      const result = await passwordService.decryptPassword(entry._id);
      const id = entry._id;
      setRevealedPasswords(prev => ({ ...prev, [id]: result.password }));
      if (revealTimers[id]) clearTimeout(revealTimers[id]);
      const timer = setTimeout(() => {
        setRevealedPasswords(prev => {
          const next = { ...prev };
          delete next[id];
          return next;
        });
      }, 30000);
      setRevealTimers(prev => ({ ...prev, [id]: timer }));
    } catch (err) {
      console.error('Failed to decrypt password', err);
    }
  };

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
  };

  const handleSave = async (data: any) => {
    try {
      if (editingEntry) {
        await passwordService.updatePassword(editingEntry._id, data);
      } else {
        await passwordService.createPassword(data);
      }
      setShowAddModal(false);
      setEditingEntry(null);
      fetchPasswords();
    } catch (err) {
      console.error('Failed to save password', err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await passwordService.deletePassword(id);
      setDeleteConfirm(null);
      fetchPasswords();
    } catch (err) {
      console.error('Failed to delete password', err);
    }
  };

  const handleUnlockVerified = () => {
    setVaultUnlocked(true);
    setShowUnlock(false);
    if (pendingEntry) {
      doReveal(pendingEntry);
      setPendingEntry(null);
    }
  };

  const revealPassword = (entry: PasswordEntry) => revealedPasswords[entry._id];

  const getClientName = (entry: PasswordEntry) => {
    if (entry.clientId && typeof entry.clientId === 'object') {
      return entry.clientId.companyName;
    }
    return '—';
  };

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'hosting': return <Globe className="w-4 h-4" />;
      case 'email': return <Mail className="w-4 h-4" />;
      case 'social': return <Users className="w-4 h-4" />;
      case 'admin': return <ShieldCheck className="w-4 h-4" />;
      case 'ftp': return <FolderOpen className="w-4 h-4" />;
      case 'database': return <Database className="w-4 h-4" />;
      case 'api': return <Key className="w-4 h-4" />;
      default: return <Key className="w-4 h-4" />;
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Password Vault</h1>
          <p className="text-sm text-slate-500 mt-1">Securely store and manage client credentials</p>
        </div>
        <div className="flex items-center gap-3">
          {!vaultUnlocked ? (
            <button
              onClick={() => setShowUnlock(true)}
              className="inline-flex items-center px-4 py-2.5 border border-slate-300 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition-all text-sm"
            >
              <Lock className="w-4 h-4 mr-2" />
              Unlock Vault
            </button>
          ) : (
            <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-sm font-medium">
              <ShieldCheck className="w-4 h-4" />
              Vault Unlocked
            </div>
          )}
          <button
            onClick={() => { setEditingEntry(null); setShowAddModal(true); }}
            className="inline-flex items-center px-4 py-2.5 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-all text-sm shadow-sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Credential
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, URL, or username..."
            className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value as PasswordCategory | '')}
          className="px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
        >
          {CATEGORIES.map(c => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="text-center py-20 text-slate-400">Loading...</div>
      ) : passwords.length === 0 ? (
        <div className="text-center py-20">
          <Lock className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500 font-medium">No credentials found</p>
          <p className="text-slate-400 text-sm mt-1">Add your first credential to get started</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Client</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Name & Category</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Username</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Password</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">URL</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {passwords.map(entry => {
                  const revealed = revealPassword(entry);
                  return (
                    <tr key={entry._id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <span className="font-medium text-slate-900">{getClientName(entry)}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium flex items-center gap-1">
                            {getCategoryIcon(entry.category)}
                            {entry.category}
                          </span>
                          <span className="text-slate-900 font-medium">{entry.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-600">{entry.username || '-'}</span>
                          {entry.username && (
                            <button
                              onClick={() => handleCopy(entry.username!)}
                              className="text-slate-400 hover:text-indigo-600 transition-colors"
                              title="Copy username"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {revealed ? (
                            <>
                              <span className="font-mono text-sm text-slate-900">{revealed}</span>
                              <button
                                onClick={() => handleCopy(revealed)}
                                className="text-slate-400 hover:text-indigo-600 transition-colors"
                                title="Copy password"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  setRevealedPasswords(prev => {
                                    const next = { ...prev };
                                    delete next[entry._id];
                                    return next;
                                  });
                                }}
                                className="text-slate-400 hover:text-slate-600 transition-colors"
                                title="Hide password"
                              >
                                <EyeOff className="w-3.5 h-3.5" />
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => handleViewPassword(entry)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              {vaultUnlocked ? 'Show' : 'Unlock to View'}
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {entry.url ? (
                          <a href={entry.url} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline text-xs">
                            {entry.url.replace(/^https?:\/\//, '').substring(0, 30)}{entry.url.length > 30 ? '...' : ''}
                          </a>
                        ) : '-'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => { setEditingEntry(entry); setShowAddModal(true); }}
                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                            title="Edit"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          {deleteConfirm === entry._id ? (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleDelete(entry._id)}
                                className="px-2 py-1 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                              >
                                Confirm
                              </button>
                              <button
                                onClick={() => setDeleteConfirm(null)}
                                className="px-2 py-1 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setDeleteConfirm(entry._id)}
                              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <PasswordVaultModal
        isOpen={showAddModal}
        onClose={() => { setShowAddModal(false); setEditingEntry(null); }}
        onSave={handleSave}
        clients={clients}
        editData={editingEntry}
      />

      <UnlockPinModal
        isOpen={showUnlock}
        onClose={() => { setShowUnlock(false); setPendingEntry(null); }}
        onVerified={handleUnlockVerified}
      />
    </div>
  );
};

export default Passwords;


