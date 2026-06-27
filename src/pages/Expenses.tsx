import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { expenseService } from '../services/api';
import type { Expense, ExpenseSummary, ExpenseCategory } from '../types';
import { Plus, Search, TrendingDown, Tag, Receipt, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const Expenses: React.FC = () => {
  const navigate = useNavigate();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [summary, setSummary] = useState<ExpenseSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showDeleteModal, setShowDeleteModal] = useState<Expense | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const params: any = { page: currentPage, limit: 20 };
      if (searchQuery) params.search = searchQuery;
      if (categoryFilter) params.category = categoryFilter;
      if (dateFrom) params.dateFrom = dateFrom;
      if (dateTo) params.dateTo = dateTo;

      const [expenseData, categoryData, summaryData] = await Promise.all([
        expenseService.getExpenses(params),
        expenseService.getCategories(),
        expenseService.getSummary(selectedYear),
      ]);
      setExpenses(expenseData.expenses);
      setTotalPages(expenseData.pages);
      setCategories(categoryData);
      setSummary(summaryData);
    } catch (error) {
      console.error('Error fetching expenses:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [searchQuery, categoryFilter, dateFrom, dateTo, currentPage, selectedYear]);

  const handleDelete = async () => {
    if (!showDeleteModal) return;
    try {
      await expenseService.deleteExpense(showDeleteModal._id);
      setShowDeleteModal(null);
      fetchData();
    } catch (error) {
      console.error('Error deleting expense:', error);
    }
  };

  const toMMK = (amount: number, currency?: string, exchangeRate?: number) => {
    if (currency === 'USD') return Math.round(amount * (exchangeRate || 0));
    return amount;
  };

  const monthlyTotals = (() => {
    if (!summary) return [];
    const byMonth: Record<number, number> = {};
    summary.monthlyData.forEach((m) => { byMonth[m._id.month] = m.total; });
    return MONTHS.map((name, i) => ({ name, total: byMonth[i + 1] || 0 }));
  })();

  const maxMonthly = Math.max(...monthlyTotals.map((m) => m.total), 1);

  const categoryTotals = (() => {
    if (!summary) return [];
    return summary.categoryBreakdown.map((c) => ({ category: c._id, total: c.total, count: c.count }));
  })();

  const totalExpenses = summary?.totalExpensesMMK || 0;

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 bg-white p-5 md:px-6 md:py-5 rounded-2xl shadow-sm border border-slate-200/60 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
        <div className="relative z-10 mb-4 sm:mb-0">
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Expenses</h2>
          <p className="text-sm text-slate-500 mt-1">Track and manage business expenses</p>
        </div>
        <button
          onClick={() => navigate('/expenses/new')}
          className="relative z-10 flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-lg shadow-primary/25"
        >
          <Plus className="w-4 h-4" />
          New Expense
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
              <TrendingDown className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Total Expenses ({selectedYear})</p>
              <p className="text-xl font-bold text-slate-800">{totalExpenses.toLocaleString()} MMK</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setSelectedYear(selectedYear - 1)} className="text-slate-400 hover:text-slate-600 p-1">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-medium text-slate-600">{selectedYear}</span>
            <button onClick={() => setSelectedYear(selectedYear + 1)} className="text-slate-400 hover:text-slate-600 p-1">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
              <Tag className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Top Categories</p>
            </div>
          </div>
          <div className="space-y-2">
            {categoryTotals.slice(0, 3).map((c) => (
              <div key={c.category} className="flex items-center justify-between text-sm">
                <span className="text-slate-600 truncate">{c.category}</span>
                <span className="font-medium text-slate-800">{c.total.toLocaleString()} MMK</span>
              </div>
            ))}
            {categoryTotals.length === 0 && (
              <p className="text-sm text-slate-400">No expenses yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Monthly Bar Chart */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-5 mb-6">
        <h3 className="text-sm font-semibold text-slate-700 mb-4">Monthly Expenses ({selectedYear})</h3>
        <div className="flex items-end gap-2 h-40">
          {monthlyTotals.map((m) => (
            <div key={m.name} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full flex items-end" style={{ height: '120px' }}>
                {m.total > 0 && (
                  <div
                    className="w-full bg-primary/80 rounded-t-sm min-h-[2px]"
                    style={{ height: `${(m.total / maxMonthly) * 100}%` }}
                    title={`${m.total.toLocaleString()} MMK`}
                  />
                )}
              </div>
              <span className="text-[10px] text-slate-500">{m.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-4 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search expenses..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => { setCategoryFilter(e.target.value); setCurrentPage(1); }}
            className="px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c._id} value={c.name}>{c.name}</option>
            ))}
          </select>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => { setDateFrom(e.target.value); setCurrentPage(1); }}
            className="px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
          <input
            type="date"
            value={dateTo}
            onChange={(e) => { setDateTo(e.target.value); setCurrentPage(1); }}
            className="px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>
      </div>

      {/* Expense Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-slate-500 mt-3 text-sm">Loading expenses...</p>
          </div>
        ) : expenses.length === 0 ? (
          <div className="p-12 text-center">
            <Receipt className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">No expenses found</p>
            <p className="text-sm text-slate-400 mt-1">Create your first expense to get started</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50">
                    <th className="text-left px-5 py-3 font-medium text-slate-500">Date</th>
                    <th className="text-left px-5 py-3 font-medium text-slate-500">Description</th>
                    <th className="text-left px-5 py-3 font-medium text-slate-500">Category</th>
                    <th className="text-right px-5 py-3 font-medium text-slate-500">Amount</th>
                    <th className="text-left px-5 py-3 font-medium text-slate-500">Payment</th>
                    <th className="text-center px-5 py-3 font-medium text-slate-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map((expense) => (
                    <tr
                      key={expense._id}
                      className="border-b border-slate-50 hover:bg-slate-50/50 cursor-pointer transition-colors"
                      onClick={() => navigate(`/expenses/${expense._id}`)}
                    >
                      <td className="px-5 py-3.5 text-slate-600 whitespace-nowrap">
                        {new Date(expense.date).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-3.5 font-medium text-slate-800 max-w-[250px] truncate">
                        {expense.description}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                          {expense.category}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right font-semibold text-slate-800 whitespace-nowrap">
                        {toMMK(expense.amount, expense.currency, expense.exchangeRate).toLocaleString()} MMK
                      </td>
                      <td className="px-5 py-3.5 text-slate-500 whitespace-nowrap">
                        {expense.paymentMethod || '-'}
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <button
                          onClick={(e) => { e.stopPropagation(); setShowDeleteModal(expense); }}
                          className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100">
                <p className="text-sm text-slate-500">Page {currentPage} of {totalPages}</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg disabled:opacity-50 hover:bg-slate-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg disabled:opacity-50 hover:bg-slate-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-2">Delete Expense</h3>
            <p className="text-slate-600 mb-6">
              Are you sure you want to delete <strong>{showDeleteModal.description}</strong>? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteModal(null)}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
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

export default Expenses;
