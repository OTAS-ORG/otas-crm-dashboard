import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { expenseService, clientService } from '../services/api';
import type { Expense, ExpenseCategory, ExpenseDepartment, Client } from '../types';
import { ArrowLeft, Save, Trash2, Calendar, Tag, DollarSign, FileText, MessageSquare } from 'lucide-react';

const ExpenseDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isNew = id === 'new';

  const [expense, setExpense] = useState<Expense | null>(null);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [departments, setDepartments] = useState<ExpenseDepartment[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(isNew);
  const [categoryInput, setCategoryInput] = useState('');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [departmentInput, setDepartmentInput] = useState('');
  const [showDepartmentDropdown, setShowDepartmentDropdown] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const categoryRef = useRef<HTMLDivElement>(null);
  const departmentRef = useRef<HTMLDivElement>(null);

  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    description: '',
    amount: '',
    currency: 'MMK' as 'MMK' | 'USD',
    exchangeRate: '',
    category: '',
    department: '',
    status: 'Pending',
    paymentMethod: '',
    clientId: '',
    notes: '',
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [categoryData, clientData, departmentData] = await Promise.all([
          expenseService.getCategories(),
          clientService.getClients(),
          expenseService.getDepartments(),
        ]);
        setCategories(categoryData);
        setClients(clientData);
        setDepartments(departmentData);

        if (!isNew && id) {
          const data = await expenseService.getExpense(id);
          setExpense(data);
          setForm({
            date: new Date(data.date).toISOString().split('T')[0],
            description: data.description,
            amount: data.amount.toString(),
            currency: data.currency,
            exchangeRate: data.exchangeRate?.toString() || '',
            category: data.category,
            department: data.department || '',
            status: data.status || 'Pending',
            paymentMethod: data.paymentMethod || '',
            clientId: typeof data.clientId === 'object' ? data.clientId._id : (data.clientId || ''),
            notes: data.notes || '',
          });
          setCategoryInput(data.category);
          setDepartmentInput(data.department || '');
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, isNew]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (categoryRef.current && !categoryRef.current.contains(e.target as Node)) {
        setShowCategoryDropdown(false);
      }
      if (departmentRef.current && !departmentRef.current.contains(e.target as Node)) {
        setShowDepartmentDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredCategories = categories.filter((c) =>
    c.name.toLowerCase().includes(categoryInput.toLowerCase())
  );

  const handleCategorySelect = (name: string) => {
    setCategoryInput(name);
    setForm({ ...form, category: name });
    setShowCategoryDropdown(false);
  };

  const handleCategoryInputChange = (value: string) => {
    setCategoryInput(value);
    setForm({ ...form, category: value });
    setShowCategoryDropdown(true);
  };

  const filteredDepartments = departments.filter((d) =>
    d.name.toLowerCase().includes(departmentInput.toLowerCase())
  );

  const handleDepartmentSelect = (name: string) => {
    setDepartmentInput(name);
    setForm({ ...form, department: name });
    setShowDepartmentDropdown(false);
  };

  const handleDepartmentInputChange = (value: string) => {
    setDepartmentInput(value);
    setForm({ ...form, department: value });
    setShowDepartmentDropdown(true);
  };

  const handleSave = async () => {
    if (!form.description || !form.amount || !form.category) {
      alert('Description, amount, and category are required');
      return;
    }
    try {
      setSaving(true);
      const payload: any = {
        date: form.date,
        description: form.description,
        amount: parseFloat(form.amount),
        currency: form.currency,
        exchangeRate: form.exchangeRate ? parseFloat(form.exchangeRate) : 0,
        category: form.category,
        department: form.department || undefined,
        status: form.status,
        paymentMethod: form.paymentMethod || undefined,
        clientId: form.clientId || undefined,
        notes: form.notes || undefined,
      };

      if (isNew) {
        const created = await expenseService.createExpense(payload);
        navigate(`/expenses/${created._id}`, { replace: true });
        setIsEditing(false);
        setExpense(created);
      } else if (id) {
        const updated = await expenseService.updateExpense(id, payload);
        setExpense(updated);
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Error saving expense:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    try {
      await expenseService.deleteExpense(id);
      navigate('/expenses');
    } catch (error) {
      console.error('Error deleting expense:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/expenses')}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
              {isNew ? 'New Expense' : isEditing ? 'Edit Expense' : 'Expense Details'}
            </h2>
            {!isNew && expense && (
              <p className="text-sm text-slate-500 mt-0.5">
                Created {new Date(expense.createdAt).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          {!isNew && !isEditing && (
            <>
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 text-sm font-medium text-primary bg-primary/10 hover:bg-primary/20 rounded-xl transition-colors"
              >
                Edit
              </button>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </>
          )}
          {isEditing && (
            <>
              <button
                onClick={() => { if (isNew) navigate('/expenses'); else { setIsEditing(false); } }}
                className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-xl transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6 space-y-5">
        {/* Date */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-1.5">
            <Calendar className="w-4 h-4 text-slate-400" />
            Date
          </label>
          <input
            type="date"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
            disabled={!isEditing}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:bg-slate-50 disabled:text-slate-500"
          />
        </div>

        {/* Description */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-1.5">
            <FileText className="w-4 h-4 text-slate-400" />
            Description *
          </label>
          <input
            type="text"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            disabled={!isEditing}
            placeholder="What was this expense for?"
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:bg-slate-50 disabled:text-slate-500"
          />
        </div>

        {/* Amount + Currency */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-1.5">
              <DollarSign className="w-4 h-4 text-slate-400" />
              Amount *
            </label>
            <input
              type="number"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              disabled={!isEditing}
              placeholder="0"
              min="0"
              step="0.01"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:bg-slate-50 disabled:text-slate-500"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 mb-1.5 block">Currency</label>
            <select
              value={form.currency}
              onChange={(e) => setForm({ ...form, currency: e.target.value as 'MMK' | 'USD' })}
              disabled={!isEditing}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:bg-slate-50 disabled:text-slate-500"
            >
              <option value="MMK">MMK</option>
              <option value="USD">USD</option>
            </select>
          </div>
        </div>

        {/* Exchange Rate (only for USD) */}
        {form.currency === 'USD' && (
          <div>
            <label className="text-sm font-medium text-slate-700 mb-1.5 block">Exchange Rate (1 USD = ? MMK)</label>
            <input
              type="number"
              value={form.exchangeRate}
              onChange={(e) => setForm({ ...form, exchangeRate: e.target.value })}
              disabled={!isEditing}
              placeholder="e.g. 3000"
              min="0"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:bg-slate-50 disabled:text-slate-500"
            />
          </div>
        )}

        {/* Category (Smart Dropdown) */}
        <div ref={categoryRef} className="relative">
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-1.5">
            <Tag className="w-4 h-4 text-slate-400" />
            Category *
          </label>
          <input
            type="text"
            value={categoryInput}
            onChange={(e) => handleCategoryInputChange(e.target.value)}
            onFocus={() => isEditing && setShowCategoryDropdown(true)}
            disabled={!isEditing}
            placeholder="Type or select a category..."
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:bg-slate-50 disabled:text-slate-500"
          />
          {showCategoryDropdown && isEditing && (
            <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
              {filteredCategories.length > 0 && (
                <div>
                  {filteredCategories.map((c) => (
                    <button
                      key={c._id}
                      onClick={() => handleCategorySelect(c.name)}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 transition-colors"
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              )}
              {categoryInput && !categories.some((c) => c.name.toLowerCase() === categoryInput.toLowerCase()) && (
                <div className="border-t border-slate-100 px-3 py-2 text-sm text-primary font-medium">
                  Press Enter to create "{categoryInput}"
                </div>
              )}
              {filteredCategories.length === 0 && !categoryInput && (
                <div className="px-3 py-2 text-sm text-slate-400">No categories yet. Type to create one.</div>
              )}
            </div>
          )}
        </div>

        {/* Department (Smart Dropdown) */}
        <div ref={departmentRef} className="relative">
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-1.5">
            <Tag className="w-4 h-4 text-slate-400" />
            Department
          </label>
          <input
            type="text"
            value={departmentInput}
            onChange={(e) => handleDepartmentInputChange(e.target.value)}
            onFocus={() => isEditing && setShowDepartmentDropdown(true)}
            disabled={!isEditing}
            placeholder="Type or select a department..."
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:bg-slate-50 disabled:text-slate-500"
          />
          {showDepartmentDropdown && isEditing && (
            <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
              {filteredDepartments.length > 0 && (
                <div>
                  {filteredDepartments.map((d) => (
                    <button
                      key={d._id}
                      onClick={() => handleDepartmentSelect(d.name)}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 transition-colors"
                    >
                      {d.name}
                    </button>
                  ))}
                </div>
              )}
              {departmentInput && !departments.some((d) => d.name.toLowerCase() === departmentInput.toLowerCase()) && (
                <div className="border-t border-slate-100 px-3 py-2 text-sm text-primary font-medium">
                  Press Enter to create "{departmentInput}"
                </div>
              )}
              {filteredDepartments.length === 0 && !departmentInput && (
                <div className="px-3 py-2 text-sm text-slate-400">No departments yet. Type to create one.</div>
              )}
            </div>
          )}
        </div>

        {/* Status */}
        <div>
          <label className="text-sm font-medium text-slate-700 mb-1.5 block">Status</label>
          <select
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
            disabled={!isEditing}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:bg-slate-50 disabled:text-slate-500"
          >
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>

        {/* Payment Method */}
        <div>
          <label className="text-sm font-medium text-slate-700 mb-1.5 block">Payment Method</label>
          <select
            value={form.paymentMethod}
            onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
            disabled={!isEditing}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:bg-slate-50 disabled:text-slate-500"
          >
            <option value="">Select payment method</option>
            <option value="Cash">Cash</option>
            <option value="KBZPay">KBZPay</option>
            <option value="WavePay">WavePay</option>
            <option value="AYAPay">AYAPay</option>
            <option value="KBZ Bank Transfer">KBZ Bank Transfer</option>
            <option value="AYA Bank Transfer">AYA Bank Transfer</option>
            <option value="Other">Other</option>
          </select>
        </div>

        {/* Client */}
        <div>
          <label className="text-sm font-medium text-slate-700 mb-1.5 block">Related Client</label>
          <select
            value={form.clientId}
            onChange={(e) => setForm({ ...form, clientId: e.target.value })}
            disabled={!isEditing}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:bg-slate-50 disabled:text-slate-500"
          >
            <option value="">No client</option>
            {clients.map((c) => (
              <option key={c._id} value={c._id}>{c.companyName}</option>
            ))}
          </select>
        </div>

        {/* Notes */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-1.5">
            <MessageSquare className="w-4 h-4 text-slate-400" />
            Notes
          </label>
          <textarea
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            disabled={!isEditing}
            placeholder="Additional notes..."
            rows={3}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:bg-slate-50 disabled:text-slate-500 resize-none"
          />
        </div>

        {/* Read-only info */}
        {!isNew && expense && (
          <div className="pt-4 border-t border-slate-100 grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-slate-500">Created by</span>
              <p className="font-medium text-slate-700">{typeof expense.createdBy === 'object' ? expense.createdBy.username : 'System'}</p>
            </div>
            <div>
              <span className="text-slate-500">Last updated</span>
              <p className="font-medium text-slate-700">{new Date(expense.updatedAt).toLocaleString()}</p>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-2">Delete Expense</h3>
            <p className="text-slate-600 mb-6">
              Are you sure you want to delete <strong>{expense?.description}</strong>? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
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

export default ExpenseDetail;
