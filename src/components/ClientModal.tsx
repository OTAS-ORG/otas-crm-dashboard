import React, { useState, useEffect } from 'react';
import type { Client, AuditLog, ClientStatus } from '../types';
import { clientService } from '../services/api';
import { X, Save, MessageSquare, History, User, Phone, Building2, Calendar, FileText, CheckCircle } from 'lucide-react';

interface ClientModalProps {
  clientId?: string;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

const ClientModal: React.FC<ClientModalProps> = ({ clientId, isOpen, onClose, onSave }) => {
  const [activeTab, setActiveTab] = useState<'details' | 'logs' | 'audit'>('details');
  const [client, setClient] = useState<Partial<Client>>({
    companyName: '',
    contactPerson: '',
    contactInfo: '',
    inquiryDate: new Date().toISOString().split('T')[0],
    sourceChannel: 'Facebook',
    status: 'Inquiry',
    conversationLogs: []
  });
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [newLog, setNewLog] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (clientId && isOpen) {
      fetchClientData();
    } else {
      setClient({
        companyName: '',
        contactPerson: '',
        contactInfo: '',
        inquiryDate: new Date().toISOString().split('T')[0],
        sourceChannel: 'Facebook',
        status: 'Inquiry',
        conversationLogs: []
      });
      setAuditLogs([]);
    }
  }, [clientId, isOpen]);

  const fetchClientData = async () => {
    try {
      setLoading(true);
      const data = await clientService.getClient(clientId!);
      setClient(data.client);
      setAuditLogs(data.auditLogs);
    } catch (error) {
      console.error('Error fetching client data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      if (clientId) {
        await clientService.updateClient(clientId, client);
      } else {
        await clientService.createClient(client);
      }
      onSave();
      onClose();
    } catch (error) {
      console.error('Error saving client:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddLog = async () => {
    if (!newLog.trim() || !clientId) return;
    try {
      await clientService.addLog(clientId, newLog);
      setNewLog('');
      fetchClientData();
    } catch (error) {
      console.error('Error adding log:', error);
    }
  };

  if (!isOpen) return null;

  const statuses: ClientStatus[] = [
    'Inquiry', 'Service Explained', 'Meeting Made', 'Sent Proposal', 
    'Sent Contract', 'Signed', 'Ghosted', 'Follow-up needed'
  ];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              {clientId ? 'Client Details' : 'New Client Inquiry'}
            </h2>
            {clientId && (
              <p className="text-sm text-gray-500 mt-1">
                {client.isPostSale ? 'Post-Sale Active' : 'Pre-Sale Lead'} • {client.companyName}
              </p>
            )}
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* Tabs */}
        {clientId && (
          <div className="flex border-b border-gray-100 px-6">
            <button 
              onClick={() => setActiveTab('details')}
              className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'details' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
              Details
            </button>
            <button 
              onClick={() => setActiveTab('logs')}
              className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'logs' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
              Conversation Logs ({client.conversationLogs?.length || 0})
            </button>
            <button 
              onClick={() => setActiveTab('audit')}
              className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'audit' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
              Audit Trail
            </button>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8">
          {activeTab === 'details' && (
            <form onSubmit={handleSave} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Info */}
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Basic Information</h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                      <Building2 className="w-4 h-4 mr-2" /> Company Name
                    </label>
                    <input
                      required
                      type="text"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all text-slate-700"
                      value={client.companyName}
                      onChange={(e) => setClient({ ...client, companyName: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                        <User className="w-4 h-4 mr-2" /> Contact Person
                      </label>
                      <input
                        required
                        type="text"
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all text-slate-700"
                        value={client.contactPerson}
                        onChange={(e) => setClient({ ...client, contactPerson: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                        Position
                      </label>
                      <input
                        type="text"
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all text-slate-700"
                        value={client.contactPersonPosition}
                        onChange={(e) => setClient({ ...client, contactPersonPosition: e.target.value })}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                      <Phone className="w-4 h-4 mr-2" /> Contact Info (Phone/Email)
                    </label>
                    <input
                      required
                      type="text"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all text-slate-700"
                      value={client.contactInfo}
                      onChange={(e) => setClient({ ...client, contactInfo: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                      <Calendar className="w-4 h-4 mr-2" /> Inquiry Date
                    </label>
                    <input
                      required
                      type="date"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all text-slate-700"
                      value={client.inquiryDate?.split('T')[0]}
                      onChange={(e) => setClient({ ...client, inquiryDate: e.target.value })}
                    />
                  </div>
                </div>

                {/* Sales Context */}
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Sales Context</h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Source Channel</label>
                    <select
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all text-slate-700"
                      value={client.sourceChannel}
                      onChange={(e) => setClient({ ...client, sourceChannel: e.target.value })}
                    >
                      <option>Facebook</option>
                      <option>TikTok</option>
                      <option>Client Reference</option>
                      <option>Social Media Groups</option>
                      <option>Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status / Stage</label>
                    <select
                      className={`w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all text-slate-700 font-bold ${client.status === 'Signed' ? 'text-emerald-600 bg-emerald-50 border-emerald-200' : ''}`}
                      value={client.status}
                      onChange={(e) => setClient({ ...client, status: e.target.value as ClientStatus })}
                    >
                      {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  {client.status === 'Follow-up needed' && (
                    <div className="animate-pulse bg-red-50 p-3 rounded-lg border border-red-100">
                      <label className="block text-sm font-bold text-red-700 mb-1">Next Action Date *</label>
                      <input
                        required
                        type="date"
                        className="w-full px-4 py-2.5 bg-red-50 border border-red-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-red-500/10 focus:border-red-500 transition-all text-red-700"
                        value={client.nextActionDate?.split('T')[0]}
                        onChange={(e) => setClient({ ...client, nextActionDate: e.target.value })}
                      />
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                      <FileText className="w-4 h-4 mr-2" /> Desired Outcome
                    </label>
                    <textarea
                      rows={2}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all text-slate-700"
                      value={client.desiredOutcome}
                      onChange={(e) => setClient({ ...client, desiredOutcome: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Post-Sale Section */}
              {(client.isPostSale || client.status === 'Signed') && (
                <div className="mt-8 pt-8 border-t border-gray-100 bg-blue-50/30 -mx-8 px-8 pb-8">
                  <div className="flex items-center mb-6">
                    <CheckCircle className="w-6 h-6 text-green-600 mr-2" />
                    <h3 className="text-lg font-bold text-gray-800">Post-Sale Project Details</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Project ID *</label>
                        <input
                          required={client.isPostSale}
                          type="text"
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all text-slate-700"
                          value={client.projectId}
                          onChange={(e) => setClient({ ...client, projectId: e.target.value })}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                          <input
                            type="date"
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all text-slate-700"
                            value={client.projectStartDate?.split('T')[0]}
                            onChange={(e) => setClient({ ...client, projectStartDate: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Date</label>
                          <input
                            type="date"
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all text-slate-700"
                            value={client.projectDeliveryDate?.split('T')[0]}
                            onChange={(e) => setClient({ ...client, projectDeliveryDate: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Deliverables Summary</label>
                      <textarea
                        rows={4}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all text-slate-700"
                        value={client.deliverablesSummary}
                        onChange={(e) => setClient({ ...client, deliverablesSummary: e.target.value })}
                        placeholder="Project milestones, handover notes..."
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end pt-6 border-t border-gray-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="mr-4 px-6 py-2 border border-gray-300 rounded-lg text-gray-600 font-semibold hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-sm flex items-center"
                >
                  <Save className="w-5 h-5 mr-2" />
                  {loading ? 'Saving...' : 'Save Client'}
                </button>
              </div>
            </form>
          )}

          {activeTab === 'logs' && (
            <div className="space-y-6">
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                <label className="block text-sm font-bold text-gray-700 mb-2">Add New Log</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all text-slate-700"
                    placeholder="Enter discussion notes or updates..."
                    value={newLog}
                    onChange={(e) => setNewLog(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddLog()}
                  />
                  <button
                    onClick={handleAddLog}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors"
                  >
                    Add
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                {client.conversationLogs?.length ? (
                  client.conversationLogs.slice().reverse().map((log, i) => (
                    <div key={i} className="flex gap-4 p-4 bg-white border border-gray-100 rounded-xl shadow-sm">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                        <MessageSquare className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-gray-800">{log.text}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(log.date).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-gray-500 py-12">No logs recorded yet.</p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'audit' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-800 flex items-center">
                  <History className="w-5 h-5 mr-2 text-blue-600" />
                  Activity History
                </h3>
                <span className="text-xs bg-gray-100 px-2 py-1 rounded-full text-gray-500">
                  Total Events: {auditLogs.length}
                </span>
              </div>
              
              <div className="relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
                {auditLogs.map((log, i) => (
                  <div key={log._id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active pb-8 last:pb-0">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-slate-300 group-[.is-active]:bg-blue-500 text-slate-500 group-[.is-active]:text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                      {log.action === 'CREATE' ? <CheckCircle className="w-5 h-5" /> : <History className="w-5 h-5" />}
                    </div>
                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded border border-slate-200 bg-white shadow">
                      <div className="flex items-center justify-between space-x-2 mb-1">
                        <div className="font-bold text-slate-900">{log.action}</div>
                        <time className="font-medium text-blue-500 text-xs">{new Date(log.timestamp).toLocaleString()}</time>
                      </div>
                      <div className="text-slate-500 text-sm">
                        {log.action === 'STATUS_CHANGE' && (
                          <p>Status changed from <span className="font-bold">{log.details.oldStatus}</span> to <span className="font-bold text-blue-600">{log.details.newStatus}</span></p>
                        )}
                        {log.action === 'CREATE' && <p>New client lead created by Core Team</p>}
                        {log.action === 'LOG_ADDED' && <p>Note added: "{log.details.text}"</p>}
                        {log.action === 'UPDATE' && <p>Client information updated</p>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClientModal;
