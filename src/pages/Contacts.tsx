import React, { useEffect, useState } from 'react';
import { MessageSquare, Search, ChevronLeft, ChevronRight, Trash2, Eye, X, Loader2, Mail } from 'lucide-react';
import { contactService } from '../services/api';
import type { Contact, ContactStatus } from '../types';

const STATUS_OPTIONS: ContactStatus[] = ['New', 'Read', 'Replied', 'Archived'];

const STATUS_COLORS: Record<ContactStatus, string> = {
  New: 'bg-blue-50 text-blue-700 border-blue-200',
  Read: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Replied: 'bg-violet-50 text-violet-700 border-violet-200',
  Archived: 'bg-slate-100 text-slate-500 border-slate-200',
};

const SERVICE_TYPES = ['POS System', 'AI Agent', 'ERP System', 'E-Commerce', 'Software Development', 'Website Development', 'Other'];

const Contacts: React.FC = () => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [serviceFilter, setServiceFilter] = useState('');
  const [selected, setSelected] = useState<Contact | null>(null);
  const [editNotes, setEditNotes] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchContacts = async () => {
    try {
      setLoading(true);
      const data = await contactService.getContacts({
        status: statusFilter || undefined,
        serviceType: serviceFilter || undefined,
        search: search || undefined,
        page,
        limit: 15,
      });
      setContacts(data.contacts);
      setTotal(data.total);
      setPages(data.pages);
    } catch (error) {
      console.error('Error fetching contacts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, [page, statusFilter, serviceFilter]);

  useEffect(() => {
    const t = setTimeout(() => { setPage(1); fetchContacts(); }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const handleStatusChange = async (id: string, status: ContactStatus) => {
    try {
      await contactService.updateContact(id, { status });
      setContacts((prev) => prev.map((c) => c._id === id ? { ...c, status } : c));
      if (selected?._id === id) setSelected((prev) => prev ? { ...prev, status } : null);
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleSaveNotes = async () => {
    if (!selected) return;
    try {
      await contactService.updateContact(selected._id, { notes: editNotes });
      setContacts((prev) => prev.map((c) => c._id === selected._id ? { ...c, notes: editNotes } : c));
      setSelected((prev) => prev ? { ...prev, notes: editNotes } : null);
    } catch (error) {
      console.error('Error saving notes:', error);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      setDeleting(true);
      await contactService.deleteContact(deleteId);
      setContacts((prev) => prev.filter((c) => c._id !== deleteId));
      setDeleteId(null);
      if (selected?._id === deleteId) setSelected(null);
    } catch (error) {
      console.error('Error deleting contact:', error);
    } finally {
      setDeleting(false);
    }
  };

  const openDetail = async (contact: Contact) => {
    try {
      const data = await contactService.getContact(contact._id);
      setSelected(data);
      setEditNotes(data.notes || '');
      if (contact.status === 'New') handleStatusChange(contact._id, 'Read');
    } catch (error) {
      console.error('Error fetching contact:', error);
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 bg-white p-5 md:px-6 md:py-5 rounded-2xl shadow-sm border border-slate-200/60">
        <div className="flex items-center gap-3 mb-4 sm:mb-0">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Mail className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">Contacts</h2>
            <p className="text-sm text-slate-500">{total} total submissions</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, phone, details..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white"
        >
          <option value="">All Status</option>
          {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select
          value={serviceFilter}
          onChange={(e) => { setServiceFilter(e.target.value); setPage(1); }}
          className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white"
        >
          <option value="">All Services</option>
          {SERVICE_TYPES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
          </div>
        ) : contacts.length === 0 ? (
          <div className="text-center py-12">
            <Mail className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">No contacts found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Name</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Phone</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Service</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {contacts.map((c) => (
                  <tr key={c._id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors cursor-pointer" onClick={() => openDetail(c)}>
                    <td className="px-5 py-3.5">
                      <p className="text-sm font-medium text-slate-800">{c.name}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="text-sm text-slate-600">{c.phone || '-'}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600">{c.serviceType}</span>
                    </td>
                    <td className="px-5 py-3.5" onClick={(e) => e.stopPropagation()}>
                      <select
                        value={c.status}
                        onChange={(e) => handleStatusChange(c._id, e.target.value as ContactStatus)}
                        className={`text-xs px-2.5 py-1 rounded-lg border font-medium cursor-pointer focus:outline-none ${STATUS_COLORS[c.status]}`}
                      >
                        {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="text-xs text-slate-500">{new Date(c.createdAt).toLocaleDateString()}</p>
                    </td>
                    <td className="px-5 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openDetail(c)} className="p-1.5 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button onClick={() => setDeleteId(c._id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100">
            <p className="text-xs text-slate-500">Page {page} of {pages}</p>
            <div className="flex gap-1">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button onClick={() => setPage((p) => Math.min(pages, p + 1))} disabled={page === pages} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selected && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[80vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                  <MessageSquare className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-800">{selected.name}</h3>
                  <p className="text-xs text-slate-400">{selected.phone}</p>
                </div>
              </div>
              <button onClick={() => setSelected(null)} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-4 overflow-y-auto max-h-[60vh]">
              <div>
                <p className="text-xs font-medium text-slate-500 mb-1">Service Type</p>
                <span className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600">{selected.serviceType}</span>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 mb-1">Details</p>
                <p className="text-sm text-slate-700 whitespace-pre-wrap">{selected.details}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 mb-1">Status</p>
                <select
                  value={selected.status}
                  onChange={(e) => handleStatusChange(selected._id, e.target.value as ContactStatus)}
                  className={`text-xs px-2.5 py-1 rounded-lg border font-medium cursor-pointer focus:outline-none ${STATUS_COLORS[selected.status]}`}
                >
                  {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 mb-1">Admin Notes</p>
                <textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  rows={3}
                  placeholder="Add notes..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                />
                <button onClick={handleSaveNotes} className="mt-2 text-xs px-3 py-1.5 bg-primary text-white rounded-lg hover:bg-primary-600 transition-colors">
                  Save Notes
                </button>
              </div>
              <div className="pt-2 border-t border-slate-100">
                <p className="text-xs text-slate-400">Submitted: {new Date(selected.createdAt).toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteId && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setDeleteId(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6" onClick={(e) => e.stopPropagation()}>
            <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-red-500" />
            </div>
            <h3 className="text-lg font-semibold text-slate-800 text-center mb-2">Delete Contact</h3>
            <p className="text-sm text-slate-500 text-center mb-5">Are you sure you want to delete this contact? This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">
                Cancel
              </button>
              <button onClick={handleDelete} disabled={deleting} className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-1">
                {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Contacts;
