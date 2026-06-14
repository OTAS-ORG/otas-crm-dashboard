import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { invoiceService } from '../services/api';
import type { Invoice } from '../types';
import { FileText, Plus, Search, Filter } from 'lucide-react';

const Invoices: React.FC = () => {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (searchQuery) params.search = searchQuery;
      if (statusFilter) params.status = statusFilter;
      const data = await invoiceService.getInvoices(params);
      setInvoices(data);
    } catch (error) {
      console.error('Error fetching invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [searchQuery, statusFilter]);

  const getStatusColor = (status: string, type: 'status' | 'payment' | 'payout') => {
    if (type === 'status') {
      switch (status) {
        case 'Draft': return 'bg-slate-100 text-slate-700 border border-slate-200';
        case 'Sent': return 'bg-blue-100 text-blue-700 border border-blue-200';
        case 'Paid': return 'bg-emerald-100 text-emerald-700 border border-emerald-200';
        case 'Cancelled': return 'bg-red-100 text-red-700 border border-red-200';
        default: return 'bg-slate-100 text-slate-700';
      }
    }
    if (type === 'payment') {
      return status === 'Received'
        ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
        : 'bg-amber-100 text-amber-700 border border-amber-200';
    }
    return status === 'Paid'
      ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
      : 'bg-amber-100 text-amber-700 border border-amber-200';
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 bg-white p-5 md:px-6 md:py-5 rounded-2xl shadow-sm border border-slate-200/60 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
        <div className="relative z-10 mb-4 sm:mb-0">
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Invoices</h2>
          <p className="text-sm text-slate-500 mt-1 font-medium">Manage and track client invoices and payments.</p>
        </div>
        <button
          onClick={() => navigate('/invoices/new')}
          className="relative z-10 flex items-center justify-center px-5 py-2.5 bg-indigo-600 text-white text-sm rounded-xl hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-600/30 hover:-translate-y-0.5 transition-all duration-300 font-semibold"
        >
          <Plus className="w-5 h-5 mr-2" />
          New Invoice
        </button>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by invoice number or company name..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <select
            className="pl-10 pr-8 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm appearance-none"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Status</option>
            <option value="Draft">Draft</option>
            <option value="Sent">Sent</option>
            <option value="Paid">Paid</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Invoice Table */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      ) : invoices.length > 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="text-left px-5 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Invoice #</th>
                  <th className="text-left px-5 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Client</th>
                  <th className="text-left px-5 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Amount</th>
                  <th className="text-left px-5 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                  <th className="text-left px-5 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Payment</th>
                  <th className="text-left px-5 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {invoices.map((inv) => (
                  <tr
                    key={inv._id}
                    onClick={() => navigate(`/invoices/${inv._id}`)}
                    className="hover:bg-indigo-50/30 transition-colors cursor-pointer"
                  >
                    <td className="px-5 py-4">
                      <span className="text-sm font-bold text-indigo-600">{inv.invoiceNumber}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-sm font-semibold text-slate-800">{inv.companyName}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-sm font-bold text-slate-800">{inv.grandTotal?.toLocaleString()} MMK</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`text-[11px] font-bold px-3 py-1 rounded-full ${getStatusColor(inv.status, 'status')}`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`text-[11px] font-bold px-3 py-1 rounded-full ${getStatusColor(inv.paymentStatus, 'payment')}`}>
                        {inv.paymentStatus}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-sm text-slate-500 font-medium">
                        {new Date(inv.date).toLocaleDateString()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white/50 backdrop-blur-sm rounded-3xl border border-dashed border-slate-300 p-16 text-center flex flex-col items-center justify-center">
          <div className="w-20 h-20 bg-white rounded-full shadow-sm flex items-center justify-center mb-6">
            <FileText className="w-10 h-10 text-slate-300" />
          </div>
          <h3 className="text-xl font-bold text-slate-700 mb-2">No invoices yet</h3>
          <p className="text-slate-500 max-w-sm mb-6">Create your first invoice to start tracking payments.</p>
          <button
            onClick={() => navigate('/invoices/new')}
            className="flex items-center px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-medium shadow-sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Invoice
          </button>
        </div>
      )}
    </div>
  );
};

export default Invoices;
