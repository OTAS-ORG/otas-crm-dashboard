import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { salaryService } from "../services/api";
import type { Salary, SalarySummary } from "../types";
import { Plus, Search, Wallet, ChevronLeft, ChevronRight } from "lucide-react";

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

const toMMK = (amount: number, currency?: string, exchangeRate?: number) => {
  if (currency === "USD" && exchangeRate) return amount * exchangeRate;
  return amount;
};

const Salaries: React.FC = () => {
  const navigate = useNavigate();
  const [salaries, setSalaries] = useState<Salary[]>([]);
  const [summary, setSummary] = useState<SalarySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [monthFilter, setMonthFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showDeleteModal, setShowDeleteModal] = useState<Salary | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const params: any = { page: currentPage, limit: 20 };
      if (searchQuery) params.search = searchQuery;
      if (statusFilter) params.status = statusFilter;
      if (departmentFilter) params.department = departmentFilter;
      if (monthFilter) params.month = parseInt(monthFilter);

      const [salaryData, summaryData] = await Promise.all([
        salaryService.getSalaries(params),
        salaryService.getSummary(selectedYear),
      ]);
      setSalaries(salaryData.salaries);
      setTotalPages(salaryData.pages);
      setSummary(summaryData);
    } catch (error) {
      console.error("Error fetching salaries:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [
    searchQuery,
    statusFilter,
    departmentFilter,
    monthFilter,
    currentPage,
    selectedYear,
  ]);

  const handleDelete = async () => {
    if (!showDeleteModal) return;
    try {
      await salaryService.deleteSalary(showDeleteModal._id);
      setShowDeleteModal(null);
      fetchData();
    } catch (error) {
      console.error("Error deleting salary:", error);
    }
  };

  const allDepts = [
    ...new Set(salaries.map((s) => s.department).filter(Boolean)),
  ] as string[];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-primary/10">
            <Wallet className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Payroll</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Manage employee salaries and payslips
            </p>
          </div>
        </div>
        <button
          onClick={() => navigate("/salaries/new")}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white text-sm font-medium rounded-xl hover:bg-primary/90 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden md:block">New Salary</span>
        </button>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Total Payroll
            </p>
            <p className="text-xl font-bold text-slate-800 mt-1">
              {summary.totals.totalNetPay.toLocaleString()} MMK
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              {summary.totals.count} employees
            </p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Total Base Salary
            </p>
            <p className="text-xl font-bold text-slate-800 mt-1">
              {summary.totals.totalBaseSalary.toLocaleString()} MMK
            </p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Total Allowances
            </p>
            <p className="text-xl font-bold text-emerald-600 mt-1">
              +{summary.totals.totalAllowances.toLocaleString()} MMK
            </p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Total Deductions
            </p>
            <p className="text-xl font-bold text-red-500 mt-1">
              -{summary.totals.totalDeductions.toLocaleString()} MMK
            </p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search employee..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setCurrentPage(1);
          }}
          className="px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
        >
          <option value="">All Status</option>
          <option value="Draft">Draft</option>
          <option value="Paid">Paid</option>
        </select>
        <select
          value={departmentFilter}
          onChange={(e) => {
            setDepartmentFilter(e.target.value);
            setCurrentPage(1);
          }}
          className="px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
        >
          <option value="">All Departments</option>
          {allDepts.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
        <select
          value={monthFilter}
          onChange={(e) => {
            setMonthFilter(e.target.value);
            setCurrentPage(1);
          }}
          className="px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
        >
          <option value="">All Months</option>
          {MONTHS.map((m, i) => (
            <option key={i} value={i + 1}>
              {m}
            </option>
          ))}
        </select>
        <select
          value={selectedYear}
          onChange={(e) => {
            setSelectedYear(parseInt(e.target.value));
            setCurrentPage(1);
          }}
          className="px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
        >
          {[2024, 2025, 2026, 2027].map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : salaries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <Wallet className="w-12 h-12 mb-3" />
              <p className="text-sm font-medium">No salary records found</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="text-left px-5 py-3 font-medium text-slate-500 text-xs uppercase tracking-wider">
                    Employee
                  </th>
                  <th className="text-left px-5 py-3 font-medium text-slate-500 text-xs uppercase tracking-wider">
                    Period
                  </th>
                  <th className="text-right px-5 py-3 font-medium text-slate-500 text-xs uppercase tracking-wider">
                    Base Salary
                  </th>
                  <th className="text-right px-5 py-3 font-medium text-slate-500 text-xs uppercase tracking-wider">
                    Allowances
                  </th>
                  <th className="text-right px-5 py-3 font-medium text-slate-500 text-xs uppercase tracking-wider">
                    Deductions
                  </th>
                  <th className="text-right px-5 py-3 font-medium text-slate-500 text-xs uppercase tracking-wider">
                    Net Pay
                  </th>
                  <th className="text-left px-5 py-3 font-medium text-slate-500 text-xs uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-center px-5 py-3 font-medium text-slate-500 text-xs uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {salaries.map((salary) => (
                  <tr
                    key={salary._id}
                    className="border-b border-slate-50 hover:bg-slate-50/50 cursor-pointer transition-colors"
                    onClick={() => navigate(`/salaries/${salary._id}`)}
                  >
                    <td className="px-5 py-3.5">
                      <div>
                        <p className="font-medium text-slate-800">
                          {salary.employeeName}
                        </p>
                        <p className="text-xs text-slate-400">
                          {salary.position || salary.department}
                        </p>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-slate-600 whitespace-nowrap">
                      {MONTHS[salary.month - 1]} {salary.year}
                    </td>
                    <td className="px-5 py-3.5 text-right font-medium text-slate-800 whitespace-nowrap">
                      {toMMK(
                        salary.baseSalary,
                        salary.currency,
                        salary.exchangeRate,
                      ).toLocaleString()}
                    </td>
                    <td className="px-5 py-3.5 text-right text-emerald-600 font-medium whitespace-nowrap">
                      +
                      {toMMK(
                        salary.totalAllowances,
                        salary.currency,
                        salary.exchangeRate,
                      ).toLocaleString()}
                    </td>
                    <td className="px-5 py-3.5 text-right text-red-500 font-medium whitespace-nowrap">
                      -
                      {toMMK(
                        salary.totalDeductions,
                        salary.currency,
                        salary.exchangeRate,
                      ).toLocaleString()}
                    </td>
                    <td className="px-5 py-3.5 text-right font-bold text-slate-800 whitespace-nowrap">
                      {toMMK(
                        salary.netPay,
                        salary.currency,
                        salary.exchangeRate,
                      ).toLocaleString()}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                          salary.status === "Paid"
                            ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                            : "bg-amber-100 text-amber-700 border-amber-200"
                        }`}
                      >
                        {salary.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowDeleteModal(salary);
                        }}
                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        {/* Pagination */}
        {totalPages > 1 && !loading && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100">
            <p className="text-sm text-slate-500">
              Page {currentPage} of {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg disabled:opacity-40 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
                className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg disabled:opacity-40 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Modal */}
      {showDeleteModal && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center"
          onClick={() => setShowDeleteModal(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-sm mx-4 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-slate-800 mb-2">
              Delete Salary Record
            </h3>
            <p className="text-sm text-slate-500 mb-6">
              Are you sure you want to delete the salary record for{" "}
              <strong>{showDeleteModal.employeeName}</strong> (
              {MONTHS[showDeleteModal.month - 1]} {showDeleteModal.year})?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteModal(null)}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-xl transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Salaries;
