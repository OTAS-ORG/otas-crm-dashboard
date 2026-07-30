import React, { useEffect, useState } from "react";
import { analyticsService } from "../services/api";
import type { DashboardAnalytics } from "../types";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  FileText,
  Receipt,
  Building2,
  Briefcase,
  LifeBuoy,
} from "lucide-react";

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
const PIPELINE_ORDER = [
  "Inquiry",
  "Service Explained",
  "Meeting Made",
  "Sent Proposal",
  "Sent Contract",
  "Signed",
  "In-Development",
  "Delivered",
];
const PIPELINE_COLORS: Record<string, string> = {
  Inquiry: "bg-slate-400",
  "Service Explained": "bg-blue-400",
  "Meeting Made": "bg-indigo-400",
  "Sent Proposal": "bg-violet-400",
  "Sent Contract": "bg-purple-400",
  Signed: "bg-emerald-400",
  "In-Development": "bg-amber-400",
  Delivered: "bg-green-500",
};
const TYPE_LABELS: Record<string, string> = {
  customize_project: "Customize Project",
  service_fee: "Server/Domain/Maintenance Fee",
};
const TYPE_COLORS: Record<string, string> = {
  customize_project: "bg-indigo-500",
  service_fee: "bg-amber-500",
};
const TICKET_STATUS_COLORS: Record<string, string> = {
  Open: "bg-blue-500",
  "In Progress": "bg-amber-500",
  Pending: "bg-slate-400",
  Resolved: "bg-emerald-500",
};

type TabId =
  | "overview"
  | "revenue"
  | "expenses"
  | "payroll"
  | "tickets"
  | "clients";

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  {
    id: "overview",
    label: "Overview",
    icon: <BarChart3 className="w-4 h-4" />,
  },
  { id: "revenue", label: "Revenue", icon: <TrendingUp className="w-4 h-4" /> },
  {
    id: "expenses",
    label: "Expenses",
    icon: <TrendingDown className="w-4 h-4" />,
  },
  { id: "payroll", label: "Payroll", icon: <Briefcase className="w-4 h-4" /> },
  { id: "tickets", label: "Tickets", icon: <LifeBuoy className="w-4 h-4" /> },
  { id: "clients", label: "Clients", icon: <Users className="w-4 h-4" /> },
];

const Bar: React.FC<{
  value: number;
  max: number;
  color: string;
  label?: string;
  amount?: string;
  sub?: string;
}> = ({ value, max, color, label, amount, sub }) => (
  <div className="group">
    <div className="flex items-center justify-between text-sm mb-1">
      <span className="text-slate-600 font-medium">{label}</span>
      <span className="font-semibold text-slate-800 whitespace-nowrap ml-2 text-xs">
        {amount}
      </span>
    </div>
    <div className="w-full h-2.5 bg-gradient-to-r from-slate-100 to-slate-200 rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-700 ease-out ${color}`}
        style={{ width: `${max > 0 ? (value / max) * 100 : 0}%` }}
      />
    </div>
    {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
  </div>
);

const MonthlyChart: React.FC<{
  data: { name: string; total: number }[];
  max: number;
  color: string;
}> = ({ data, max, color }) => (
  <div className="flex items-end gap-2 h-44">
    {data.map((m) => (
      <div key={m.name} className="flex-1 flex flex-col items-center gap-1 group">
        <div className="w-full flex items-end relative" style={{ height: "120px" }}>
          {m.total > 0 && (
            <div
              className={`w-full rounded-t-sm min-h-[2px] transition-all duration-500 ease-out ${color} group-hover:opacity-80`}
              style={{
                height: `${(m.total / max) * 100}%`,
                background: color.includes('emerald')
                  ? 'linear-gradient(to top, #059669, #34d399)'
                  : color.includes('red')
                    ? 'linear-gradient(to top, #dc2626, #f87171)'
                    : color.includes('teal')
                      ? 'linear-gradient(to top, #0d9488, #2dd4bf)'
                      : undefined,
              }}
              title={`${m.total.toLocaleString()} MMK`}
            />
          )}
          {/* Tooltip on hover */}
          <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] font-medium px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-lg z-10">
            {m.total.toLocaleString()} MMK
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-800 rotate-45"></div>
          </div>
        </div>
        <span className="text-[10px] text-slate-400 group-hover:text-slate-600 transition-colors">{m.name}</span>
      </div>
    ))}
  </div>
);

const Analytics: React.FC = () => {
  const [data, setData] = useState<DashboardAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [activeTab, setActiveTab] = useState<TabId>("overview");

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        const result = await analyticsService.getDashboard(selectedYear);
        setData(result);
      } catch (error) {
        console.error("Error fetching analytics:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, [selectedYear]);

  const getMonthly = (items: { _id: { month: number }; total: number }[]) => {
    const byMonth: Record<number, number> = {};
    items.forEach((m) => {
      byMonth[m._id.month] = m.total;
    });
    return MONTHS.map((name, i) => ({ name, total: byMonth[i + 1] || 0 }));
  };

  const revenueMonthly = getMonthly(data?.revenue.byMonth || []);
  const expenseMonthly = getMonthly(data?.expenses.byMonth || []);
  const payrollMonthly = getMonthly(
    (data?.payroll.byMonth || []).map((m) => ({
      _id: m._id,
      total: m.totalNetPay,
    })),
  );
  const maxRevenue = Math.max(...revenueMonthly.map((m) => m.total), 1);
  const maxExpense = Math.max(...expenseMonthly.map((m) => m.total), 1);
  const maxPayroll = Math.max(...payrollMonthly.map((m) => m.total), 1);

  const totalRevenue = data?.totalRevenueMMK || 0;
  const totalExpense = data?.totalExpenseMMK || 0;
  const totalPayroll = data?.payroll.summary?.totalNetPay || 0;
  const prevRevenue = data?.prevYearRevenueMMK || 0;
  const prevExpense = data?.prevYearExpenseMMK || 0;
  const revenueChange =
    prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 : 0;
  const expenseChange =
    prevExpense > 0 ? ((totalExpense - prevExpense) / prevExpense) * 100 : 0;
  const pipelineMax = Math.max(
    ...(data?.clients.pipeline.map((p) => p.count) || [1]),
  );
  const totalType =
    data?.revenue.byType.reduce((sum, t) => sum + t.total, 0) || 1;

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
      <div className="flex flex-row justify-between items-center mb-6 bg-white p-5 md:px-6 md:py-5 rounded-2xl shadow-sm border border-slate-200/60 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-indigo-500/10 via-primary/10 to-emerald-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-violet-500/5 to-blue-500/5 rounded-full blur-2xl -ml-10 -mb-10 pointer-events-none"></div>
        <div className="relative z-10 mb-4 sm:mb-0">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-800 via-primary to-indigo-600 bg-clip-text text-transparent tracking-tight">
            Analytics
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Financial overview and client pipeline
          </p>
        </div>
        <div className="relative z-10 flex items-center gap-2 bg-slate-50/80 backdrop-blur-sm rounded-xl p-1 border border-slate-200/40">
          <button
            onClick={() => setSelectedYear(selectedYear - 1)}
            className="p-2 text-slate-400 hover:text-primary hover:bg-white rounded-lg transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-semibold text-slate-700 min-w-[60px] text-center select-none">
            {selectedYear}
          </span>
          <button
            onClick={() => setSelectedYear(selectedYear + 1)}
            className="p-2 text-slate-400 hover:text-primary hover:bg-white rounded-lg transition-all"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-white p-1.5 rounded-2xl shadow-sm border border-slate-200/60 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium rounded-xl transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? "bg-gradient-to-r from-primary to-indigo-500 text-white shadow-sm shadow-primary/20"
                : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
            }`}
          >
            <span className={activeTab === tab.id ? "text-white" : "text-slate-400"}>
              {tab.icon}
            </span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div>
        {/* ===== OVERVIEW ===== */}
        {activeTab === "overview" && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-sm shadow-emerald-200">
                    <TrendingUp className="w-5 h-5 text-white" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-slate-500">Total Revenue</p>
                    <p className="text-lg font-bold text-slate-800 truncate">
                      {totalRevenue.toLocaleString()} MMK
                    </p>
                    {prevRevenue > 0 && (
                      <span
                        className={`inline-flex items-center gap-0.5 text-[11px] font-semibold px-1.5 py-0.5 rounded-md mt-1 ${
                          revenueChange >= 0
                            ? "text-emerald-700 bg-emerald-50 border border-emerald-200"
                            : "text-red-600 bg-red-50 border border-red-200"
                        }`}
                      >
                        {revenueChange >= 0 ? "↑" : "↓"}{" "}
                        {Math.abs(revenueChange).toFixed(1)}%
                        <span className="opacity-60 font-normal ml-0.5">vs {selectedYear - 1}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center shadow-sm shadow-red-200">
                    <TrendingDown className="w-5 h-5 text-white" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-slate-500">Total Expenses</p>
                    <p className="text-lg font-bold text-slate-800 truncate">
                      {totalExpense.toLocaleString()} MMK
                    </p>
                    {prevExpense > 0 && (
                      <span
                        className={`inline-flex items-center gap-0.5 text-[11px] font-semibold px-1.5 py-0.5 rounded-md mt-1 ${
                          expenseChange <= 0
                            ? "text-emerald-700 bg-emerald-50 border border-emerald-200"
                            : "text-red-600 bg-red-50 border border-red-200"
                        }`}
                      >
                        {expenseChange >= 0 ? "↑" : "↓"}{" "}
                        {Math.abs(expenseChange).toFixed(1)}%
                        <span className="opacity-60 font-normal ml-0.5">vs {selectedYear - 1}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center shadow-sm shadow-teal-200">
                    <Briefcase className="w-5 h-5 text-white" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-slate-500">Total Payroll</p>
                    <p className="text-lg font-bold text-slate-800 truncate">
                      {totalPayroll.toLocaleString()} MMK
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center shadow-sm shadow-blue-200">
                    <DollarSign className="w-5 h-5 text-white" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-slate-500">Net Profit</p>
                    <p className="text-lg font-bold text-slate-800 truncate">
                      {(totalRevenue - totalExpense - totalPayroll).toLocaleString()} MMK
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-400 to-purple-600 flex items-center justify-center shadow-sm shadow-violet-200">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-slate-500">Total Clients</p>
                    <p className="text-lg font-bold text-slate-800">
                      {data?.clients.total || 0}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-5 relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-400 to-emerald-600"></div>
                <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-500" /> Monthly
                  Revenue
                </h3>
                <MonthlyChart
                  data={revenueMonthly}
                  max={maxRevenue}
                  color="bg-emerald-500"
                />
              </div>
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-5 relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-red-400 to-red-600"></div>
                <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
                  <TrendingDown className="w-4 h-4 text-red-500" /> Monthly
                  Expenses
                </h3>
                <MonthlyChart
                  data={expenseMonthly}
                  max={maxExpense}
                  color="bg-red-500"
                />
              </div>
            </div>
          </>
        )}

        {/* ===== REVENUE ===== */}
        {activeTab === "revenue" && (
          <>
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-5 mb-4 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-400 to-emerald-600"></div>
              <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-500" /> Monthly
                Revenue ({selectedYear})
              </h3>
              <MonthlyChart
                data={revenueMonthly}
                max={maxRevenue}
                color="bg-emerald-500"
              />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-5 relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-indigo-400 to-indigo-600"></div>
                <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-indigo-500" /> Revenue by
                  Type
                </h3>
                <div className="space-y-4">
                  {data?.revenue.byType.map((t) => (
                    <Bar
                      key={t._id}
                      value={t.total}
                      max={totalType}
                      color={TYPE_COLORS[t._id] || "bg-slate-400"}
                      label={TYPE_LABELS[t._id] || t._id}
                      amount={`${t.total.toLocaleString()} MMK (${((t.total / totalType) * 100).toFixed(1)}%)`}
                      sub={`${t.count} invoices`}
                    />
                  ))}
                  {data?.revenue.byType.length === 0 && (
                    <div className="text-sm text-slate-400 text-center py-6 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                      <p>No revenue data</p>
                    </div>
                  )}
                </div>
              </div>
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-5 relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary to-blue-600"></div>
                <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" /> Invoice Status
                </h3>
                <div className="space-y-3">
                  {data?.invoices.statusCounts.map((s) => {
                    const colors: Record<string, string> = {
                      Draft: "bg-slate-400",
                      Sent: "bg-blue-500",
                      Paid: "bg-emerald-500",
                      Cancelled: "bg-red-400",
                    };
                    const total =
                      data.invoices.statusCounts.reduce(
                        (sum, x) => sum + x.count,
                        0,
                      ) || 1;
                    return (
                      <Bar
                        key={s._id}
                        value={s.count}
                        max={total}
                        color={colors[s._id] || "bg-slate-300"}
                        label={s._id}
                        amount={`${s.count}`}
                      />
                    );
                  })}
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                    Payment Status
                  </h4>
                  <div className="flex gap-3">
                    {data?.invoices.paymentStatusCounts.map((ps) => (
                      <div
                        key={ps._id}
                        className="flex-1 text-center p-2 rounded-xl bg-slate-50"
                      >
                        <p className="text-lg font-bold text-slate-800">
                          {ps.count}
                        </p>
                        <p className="text-[10px] text-slate-500">{ps._id}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ===== EXPENSES ===== */}
        {activeTab === "expenses" && (
          <>
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-5 mb-4 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-red-400 to-red-600"></div>
              <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-red-500" /> Monthly
                Expenses ({selectedYear})
              </h3>
              <MonthlyChart
                data={expenseMonthly}
                max={maxExpense}
                color="bg-red-500"
              />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-5 relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-amber-400 to-amber-600"></div>
                <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-amber-500" /> Top Expense
                  Categories
                </h3>
                <div className="space-y-3">
                  {data?.expenses.categoryBreakdown.slice(0, 8).map((c) => {
                    const maxCat =
                      data.expenses.categoryBreakdown[0]?.total || 1;
                    return (
                      <Bar
                        key={c._id}
                        value={c.total}
                        max={maxCat}
                        color="bg-amber-400"
                        label={c._id}
                        amount={`${c.total.toLocaleString()} MMK`}
                        sub={`${c.count} expenses`}
                      />
                    );
                  })}
                  {data?.expenses.categoryBreakdown.length === 0 && (
                    <div className="text-sm text-slate-400 text-center py-6 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                      <p>No expenses yet</p>
                    </div>
                  )}
                </div>
              </div>
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-5 relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-400 to-cyan-600"></div>
                <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-cyan-500" /> Expenses by
                  Department
                </h3>
                <div className="space-y-3">
                  {data?.expenses.byDepartment.map((d) => {
                    const maxDept = data.expenses.byDepartment[0]?.total || 1;
                    return (
                      <Bar
                        key={d._id}
                        value={d.total}
                        max={maxDept}
                        color="bg-cyan-500"
                        label={d._id}
                        amount={`${d.total.toLocaleString()} MMK`}
                        sub={`${d.count} expenses`}
                      />
                    );
                  })}
                  {data?.expenses.byDepartment.length === 0 && (
                    <div className="text-sm text-slate-400 text-center py-6 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                      <p>No department expenses yet</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        {/* ===== PAYROLL ===== */}
        {activeTab === "payroll" && (
          <>
            {data?.payroll.summary && data.payroll.summary.count > 0 ? (
              <>
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-5 mb-4 relative overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-teal-400 to-teal-600"></div>
                  <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-teal-500" /> Monthly
                    Payroll ({selectedYear})
                  </h3>
                  <MonthlyChart
                    data={payrollMonthly}
                    max={maxPayroll}
                    color="bg-teal-500"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                  {[
                    {
                      label: "Total Payroll",
                      value: data.payroll.summary.totalNetPay,
                      color: "bg-teal-50",
                      iconColor: "text-teal-500",
                    },
                    {
                      label: "Base Salary",
                      value: data.payroll.summary.totalBaseSalary,
                      color: "bg-slate-50",
                      iconColor: "text-slate-500",
                    },
                    {
                      label: "Allowances",
                      value: data.payroll.summary.totalAllowances,
                      color: "bg-emerald-50",
                      iconColor: "text-emerald-500",
                    },
                    {
                      label: "Deductions",
                      value: data.payroll.summary.totalDeductions,
                      color: "bg-red-50",
                      iconColor: "text-red-500",
                    },
                    {
                      label: "Entries",
                      value: data.payroll.summary.count,
                      color: "bg-violet-50",
                      iconColor: "text-violet-500",
                      isCount: true,
                    },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-5"
                    >
                      <p className="text-xs text-slate-500 mb-1">
                        {item.label}
                      </p>
                      <p className={`text-lg font-bold ${item.iconColor}`}>
                        {item.isCount
                          ? item.value
                          : `${item.value.toLocaleString()} MMK`}
                      </p>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="bg-white/50 backdrop-blur-sm rounded-2xl shadow-sm border border-slate-200/40 p-10 text-center">
                <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                  <Briefcase className="w-8 h-8 text-slate-300" />
                </div>
                <p className="text-slate-500 font-medium">
                  No payroll data for {selectedYear}
                </p>
                <p className="text-xs text-slate-400 mt-1">Payroll records will appear here once added</p>
              </div>
            )}
          </>
        )}

        {/* ===== TICKETS ===== */}
        {activeTab === "tickets" && (
          <>
            {data?.tickets && data.tickets.total > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-5 relative overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-orange-400 to-orange-600"></div>
                  <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
                    <LifeBuoy className="w-4 h-4 text-orange-500" /> Tickets by
                    Status
                  </h3>
                  <div className="space-y-3">
                    {data.tickets.byStatus.map((s) => (
                      <Bar
                        key={s._id}
                        value={s.count}
                        max={data.tickets.total}
                        color={TICKET_STATUS_COLORS[s._id] || "bg-slate-300"}
                        label={s._id}
                        amount={`${s.count}`}
                      />
                    ))}
                  </div>
                </div>
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-5 relative overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-orange-400 to-orange-600"></div>
                  <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-orange-500" /> Tickets by
                    Department
                  </h3>
                  <div className="space-y-3">
                    {data.tickets.byDepartment.map((d) => {
                      const maxDept = data.tickets.byDepartment[0]?.count || 1;
                      return (
                        <Bar
                          key={d._id}
                          value={d.count}
                          max={maxDept}
                          color="bg-orange-400"
                          label={d._id}
                          amount={`${d.count}`}
                        />
                      );
                    })}
                  </div>
                </div>
                <div className="bg-gradient-to-br from-orange-500/5 to-orange-600/10 rounded-2xl shadow-sm border border-orange-200/40 p-5 flex flex-col items-center justify-center">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center mb-3 shadow-sm shadow-orange-200">
                    <LifeBuoy className="w-7 h-7 text-white" />
                  </div>
                  <p className="text-3xl font-bold text-slate-800">
                    {data.tickets.total}
                  </p>
                  <p className="text-sm text-slate-500">Total Tickets</p>
                </div>
              </div>
            ) : (
              <div className="bg-white/50 backdrop-blur-sm rounded-2xl shadow-sm border border-slate-200/40 p-10 text-center">
                <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                  <LifeBuoy className="w-8 h-8 text-slate-300" />
                </div>
                <p className="text-slate-500 font-medium">No tickets yet</p>
                <p className="text-xs text-slate-400 mt-1">Tickets will appear here once created</p>
              </div>
            )}
          </>
        )}

        {/* ===== CLIENTS ===== */}
        {activeTab === "clients" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-5 relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-violet-400 to-purple-600"></div>
                <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
                  <Users className="w-4 h-4 text-violet-500" /> Client Pipeline
              </h3>
              <div className="space-y-3">
                {PIPELINE_ORDER.map((status) => {
                  const count =
                    data?.clients.pipeline.find((p) => p._id === status)
                      ?.count || 0;
                  return (
                    <Bar
                      key={status}
                      value={count}
                      max={pipelineMax}
                      color={PIPELINE_COLORS[status] || "bg-slate-300"}
                      label={status}
                      amount={`${count}`}
                    />
                  );
                })}
              </div>
              {(data?.clients.pipeline.filter(
                (p) => !PIPELINE_ORDER.includes(p._id),
              ).length ?? 0 > 0) ? (
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    Dead-end
                  </h4>
                  <div className="flex gap-3">
                    {data?.clients.pipeline
                      .filter((p) => !PIPELINE_ORDER.includes(p._id))
                      .map((p) => (
                        <div
                          key={p._id}
                          className="flex items-center gap-2 text-sm"
                        >
                          <span className="text-slate-500">{p._id}:</span>
                          <span className="font-medium text-slate-700">
                            {p.count}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              ) : null}
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-5 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-400 to-blue-600"></div>
              <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-blue-500" /> Lead Sources
              </h3>
              <div className="space-y-3">
                {data?.clients.sourceChannels.slice(0, 8).map((sc) => {
                  const maxSource = data.clients.sourceChannels[0]?.count || 1;
                  return (
                    <Bar
                      key={sc._id}
                      value={sc.count}
                      max={maxSource}
                      color="bg-blue-400"
                      label={sc._id}
                      amount={`${sc.count}`}
                    />
                  );
                })}
                {data?.clients.sourceChannels.length === 0 && (
                  <div className="text-sm text-slate-400 text-center py-6 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                    <p>No clients yet</p>
                  </div>
                )}
              </div>
              <div className="mt-5 pt-4 border-t border-slate-100">
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                  Top Clients by Revenue
                </h4>
                <div className="space-y-2">
                  {data?.clients.topByRevenue.map((c, i) => (
                    <div
                      key={c._id}
                      className="flex items-center justify-between text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
                          {i + 1}
                        </span>
                        <span className="text-slate-700 truncate">{c._id}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-medium text-slate-800">
                          {c.totalRevenue.toLocaleString()} MMK
                        </span>
                        <span className="text-xs text-slate-400 ml-1">
                          ({c.invoiceCount} inv)
                        </span>
                      </div>
                    </div>
                  ))}
                  {data?.clients.topByRevenue.length === 0 && (
                    <div className="text-sm text-slate-400 text-center py-6 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                      <p>No revenue data</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Analytics;
