import React, { useState, useEffect } from 'react';
import { X, Eye, EyeOff } from 'lucide-react';
import type { Client, PasswordEntry, PasswordCategory } from '../types';

interface PasswordVaultModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  clients: Client[];
  editData?: PasswordEntry | null;
}

const CATEGORIES: { value: PasswordCategory; label: string }[] = [
  { value: 'hosting', label: 'Hosting' },
  { value: 'email', label: 'Email' },
  { value: 'social', label: 'Social Media' },
  { value: 'admin', label: 'Admin Panel' },
  { value: 'ftp', label: 'FTP / SFTP' },
  { value: 'database', label: 'Database' },
  { value: 'api', label: 'API Key' },
  { value: 'other', label: 'Other' },
];

const PasswordVaultModal: React.FC<PasswordVaultModalProps> = ({ isOpen, onClose, onSave, clients, editData }) => {
  const [clientId, setClientId] = useState('');
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [category, setCategory] = useState<PasswordCategory>('other');
  const [notes, setNotes] = useState('');
  const [clientSearch, setClientSearch] = useState('');
  const [showClientDropdown, setShowClientDropdown] = useState(false);

  const isEditing = !!editData;

  useEffect(() => {
    if (isOpen) {
      if (editData) {
        setClientId(editData.clientId ? (typeof editData.clientId === 'string' ? editData.clientId : editData.clientId._id) : '');
        setName(editData.name);
        setUrl(editData.url || '');
        setUsername(editData.username || '');
        setPassword('');
        setCategory(editData.category);
        setNotes(editData.notes || '');
        const client = clients.find(c => c._id === (editData.clientId ? (typeof editData.clientId === 'string' ? editData.clientId : editData.clientId._id) : ''));
        if (client) setClientSearch(client.companyName);
      } else {
        setClientId('');
        setName('');
        setUrl('');
        setUsername('');
        setPassword('');
        setCategory('other');
        setNotes('');
        setClientSearch('');
      }
    }
  }, [isOpen, editData, clients]);

  if (!isOpen) return null;

  const filteredClients = clients.filter(c =>
    c.companyName.toLowerCase().includes(clientSearch.toLowerCase())
  );

  const handleSelectClient = (c: Client) => {
    setClientId(c._id);
    setClientSearch(c.companyName);
    setShowClientDropdown(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data: any = { name, url, username, category, notes };
    if (clientId) data.clientId = clientId;
    if (!isEditing) {
      data.password = password;
    } else {
      if (password) data.password = password;
    }
    onSave(data);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h3 className="text-lg font-bold text-slate-900">{isEditing ? 'Edit Credential' : 'Add Credential'}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {!isEditing ? (
            <div className="relative">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Client <span className="font-normal normal-case text-slate-400">(optional)</span></label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={clientSearch}
                  onChange={(e) => { setClientSearch(e.target.value); setShowClientDropdown(true); setClientId(''); }}
                  onFocus={() => setShowClientDropdown(true)}
                  placeholder="Search client to link..."
                  className="flex-1 px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                />
                {clientId && (
                  <button
                    type="button"
                    onClick={() => { setClientId(''); setClientSearch(''); }}
                    className="px-3 py-2.5 text-xs font-medium text-red-600 hover:bg-red-50 rounded-xl border border-red-200 transition-colors"
                  >
                    Clear
                  </button>
                )}
              </div>
              {showClientDropdown && clientSearch && (
                <div className="absolute z-10 top-full mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                  {filteredClients.length > 0 ? filteredClients.map(c => (
                    <button
                      key={c._id}
                      type="button"
                      onClick={() => handleSelectClient(c)}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
                    >
                      <span className="font-medium">{c.companyName}</span>
                      <span className="text-slate-400 ml-2">{c.contactPerson}</span>
                    </button>
                  )) : (
                    <div className="px-3 py-2 text-sm text-slate-400">No clients found</div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Client</label>
              <p className="text-sm font-medium text-slate-900 py-2.5 px-3 bg-slate-50 rounded-xl border border-slate-200">
                {editData?.clientId && typeof editData.clientId === 'object' ? editData.clientId.companyName : '—'}
              </p>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Hosting cPanel"
              className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as PasswordCategory)}
                className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              >
                {CATEGORIES.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">URL</label>
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://..."
                className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="username@example.com"
              className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              Password {!isEditing && '*'}
              {isEditing && <span className="text-slate-400 font-normal normal-case ml-1">(leave blank to keep current)</span>}
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={isEditing ? 'Leave blank to keep current' : 'Enter password'}
                className="w-full px-3 py-2.5 pr-10 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                required={!isEditing}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Optional notes..."
              className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-slate-300 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition-all text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-all text-sm"
            >
              {isEditing ? 'Save Changes' : 'Add Credential'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PasswordVaultModal;
