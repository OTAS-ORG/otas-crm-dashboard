import React, { useEffect, useState } from 'react';
import { analyticsService } from '../services/api';
import type { DashboardAnalytics } from '../types';
import { BarChart3, TrendingUp, TrendingDown, Users, ChevronLeft, ChevronRight, DollarSign, FileText, Receipt } from 'lucide-react';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const PIPELINE_ORDER = ['Inquiry', 'Service Explained', 'Meeting Made', 'Sent Proposal', 'Sent Contract', 'Signed', 'In-Development', 'Delivered'];

const PIPELINE_COLORS: Record<string, string> = {
  Inquiry: 'bg-slate-400',
  'Service Explained': 'bg-blue-400',
  'Meeting Made': 'bg-indigo-400',
  'Sent Proposal': 'bg-violet-400',
  'Sent Contract': 'bg-purple-400',
  Signed: 'bg-emerald-400',
  'In-Development': 'bg-amber-400',
  Delivered: 'bg-green-500',
};

const Analytics: React.FC = () => {
  const [data, setData] = useState<DashboardAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        const result = await analyticsService.getDashboard(selectedYear);
        setData(result);
      } catch (error) {
        console.error('Error fetching analytics:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, [selectedYear]);

  const getRevenueByMonth = () => {
    if (!data) return [];
    const byMonth: Record<number, number> = {};
    data.revenue.byMonth.forEach((m) => { byMonth[m._id.month] = m.total; });
    return MONTHS.map((name, i) => ({ name, total: byMonth[i + 1] || 0 }));
  };

  const getExpenseByMonth = () => {
    if (!data) return [];
    const byMonth: Record<number, number> = {};
    data.expenses.byMonth.forEach((m) => { byMonth[m._id.month] = m.total; });
    return MONTHS.map((name, i) => ({ name, total: byMonth[i + 1] || 0 }));
  };

  const revenueMonthly = getRevenueByMonth();
  const expenseMonthly = getExpenseByMonth();
  const maxRevenue = Math.max(...revenueMonthly.map((m) => m.total), 1);
  const maxExpense = Math.max(...expenseMonthly.map((m) => m.total), 1);

  const totalRevenue = data?.totalRevenueMMK || 0;
  const totalExpense = data?.totalExpenseMMK || 0;

  const pipelineMax = Math.max(...(data?.clients.pipeline.map((p) => p.count) || [1]));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 bg-white p-5 md:px-6 md:py-5 rounded-2xl shadow-sm border border-slate-200/60 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
        <div className="relative z-10 mb-4 sm:mb-0">
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Analytics</h2>
          <p className="text-sm text-slate-500 mt-1">Financial overview and client pipeline</p>
        </div>
        <div className="relative z-10 flex items-center gap-2">
          <button onClick={() => setSelectedYear(selectedYear - 1)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-semibold text-slate-700 min-w-[60px] text-center">{selectedYear}</span>
          <button onClick={() => setSelectedYear(selectedYear + 1)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Total Revenue</p>
              <p className="text-lg font-bold text-slate-800">{totalRevenue.toLocaleString()} MMK</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
              <TrendingDown className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Total Expenses</p>
              <p className="text-lg font-bold text-slate-800">{totalExpense.toLocaleString()} MMK</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Net Profit</p>
              <p className="text-lg font-bold text-slate-800">{(totalRevenue - totalExpense).toLocaleString()} MMK</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center">
              <Users className="w-5 h-5 text-violet-500" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Total Clients</p>
              <p className="text-lg font-bold text-slate-800">{data?.clients.total || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Revenue Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200/60 p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-500" />
            Monthly Revenue ({selectedYear})
          </h3>
          <div className="flex items-end gap-2 h-44">
            {revenueMonthly.map((m) => (
              <div key={m.name} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex items-end" style={{ height: '120px' }}>
                  {m.total > 0 && (
                    <div
                      className="w-full bg-emerald-500 rounded-t-sm min-h-[2px]"
                      style={{ height: `${(m.total / maxRevenue) * 100}%` }}
                      title={`${m.total.toLocaleString()} MMK`}
                    />
                  )}
                </div>
                <span className="text-[10px] text-slate-500">{m.name}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" />
            Invoice Status
          </h3>
          <div className="space-y-3">
            {data?.invoices.statusCounts.map((s) => {
              const colors: Record<string, string> = {
                Draft: 'bg-slate-400',
                Sent: 'bg-blue-500',
                Paid: 'bg-emerald-500',
                Cancelled: 'bg-red-400',
              };
              const total = data.invoices.statusCounts.reduce((sum, x) => sum + x.count, 0) || 1;
              return (
                <div key={s._id}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-slate-600">{s._id}</span>
                    <span className="font-medium text-slate-800">{s.count}</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${colors[s._id] || 'bg-slate-300'}`}
                      style={{ width: `${(s.count / total) * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}
            {data?.invoices.statusCounts.length === 0 && (
              <p className="text-sm text-slate-400">No invoices yet</p>
            )}
          </div>

          <div className="mt-5 pt-4 border-t border-slate-100">
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Payment Status</h4>
            <div className="flex gap-3">
              {data?.invoices.paymentStatusCounts.map((ps) => (
                <div key={ps._id} className="flex-1 text-center p-2 rounded-xl bg-slate-50">
                  <p className="text-lg font-bold text-slate-800">{ps.count}</p>
                  <p className="text-[10px] text-slate-500">{ps._id}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Expense Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200/60 p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
            <TrendingDown className="w-4 h-4 text-red-500" />
            Monthly Expenses ({selectedYear})
          </h3>
          <div className="flex items-end gap-2 h-44">
            {expenseMonthly.map((m) => (
              <div key={m.name} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex items-end" style={{ height: '120px' }}>
                  {m.total > 0 && (
                    <div
                      className="w-full bg-red-500 rounded-t-sm min-h-[2px]"
                      style={{ height: `${(m.total / maxExpense) * 100}%` }}
                      title={`${m.total.toLocaleString()} MMK`}
                    />
                  )}
                </div>
                <span className="text-[10px] text-slate-500">{m.name}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
            <Receipt className="w-4 h-4 text-amber-500" />
            Top Expense Categories
          </h3>
          <div className="space-y-3">
            {data?.expenses.categoryBreakdown.slice(0, 6).map((c) => {
              const maxCat = data.expenses.categoryBreakdown[0]?.total || 1;
              return (
                <div key={c._id}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-slate-600 truncate">{c._id}</span>
                    <span className="font-medium text-slate-800 whitespace-nowrap ml-2">{c.total.toLocaleString()} MMK</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-amber-400"
                      style={{ width: `${(c.total / maxCat) * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}
            {data?.expenses.categoryBreakdown.length === 0 && (
              <p className="text-sm text-slate-400">No expenses yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Client Pipeline */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
            <Users className="w-4 h-4 text-violet-500" />
            Client Pipeline
          </h3>
          <div className="space-y-3">
            {PIPELINE_ORDER.map((status) => {
              const count = data?.clients.pipeline.find((p) => p._id === status)?.count || 0;
              return (
                <div key={status}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-slate-600">{status}</span>
                    <span className="font-medium text-slate-800">{count}</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${PIPELINE_COLORS[status] || 'bg-slate-300'}`}
                      style={{ width: `${pipelineMax > 0 ? (count / pipelineMax) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          {data?.clients.pipeline.filter((p) => !PIPELINE_ORDER.includes(p._id)).length ?? 0 > 0 ? (
            <div className="mt-4 pt-3 border-t border-slate-100">
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Dead-end</h4>
              <div className="flex gap-3">
                {data?.clients.pipeline.filter((p) => !PIPELINE_ORDER.includes(p._id)).map((p) => (
                  <div key={p._id} className="flex items-center gap-2 text-sm">
                    <span className="text-slate-500">{p._id}:</span>
                    <span className="font-medium text-slate-700">{p.count}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-blue-500" />
            Lead Sources
          </h3>
          <div className="space-y-3">
            {data?.clients.sourceChannels.slice(0, 8).map((sc) => {
              const maxSource = data.clients.sourceChannels[0]?.count || 1;
              return (
                <div key={sc._id}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-slate-600">{sc._id}</span>
                    <span className="font-medium text-slate-800">{sc.count}</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-blue-400"
                      style={{ width: `${(sc.count / maxSource) * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}
            {data?.clients.sourceChannels.length === 0 && (
              <p className="text-sm text-slate-400">No clients yet</p>
            )}
          </div>

          <div className="mt-5 pt-4 border-t border-slate-100">
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Top Clients by Revenue</h4>
            <div className="space-y-2">
              {data?.clients.topByRevenue.map((c, i) => (
                <div key={c._id} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">{i + 1}</span>
                    <span className="text-slate-700 truncate">{c._id}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-medium text-slate-800">{c.totalRevenue.toLocaleString()} MMK</span>
                    <span className="text-xs text-slate-400 ml-1">({c.invoiceCount} inv)</span>
                  </div>
                </div>
              ))}
              {data?.clients.topByRevenue.length === 0 && (
                <p className="text-sm text-slate-400">No revenue data</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
