import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { leaveService, userManagementService } from '../services/api';
import type { Leave, LeaveType, LeaveSession, LeaveCategory, LeaveStatus, UserInfo } from '../types';
import {
  CalendarOff,
  CalendarCheck,
  Plus,
  Trash2,
  Edit3,
  X,
  Loader2,
  Calendar,
  AlertCircle,
  TrendingDown,
  Clock,
} from 'lucide-react';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const Leaves: React.FC = () => {
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState<number>(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(currentDate.getFullYear());
  const [selectedUserFilter, setSelectedUserFilter] = useState<string>('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('');

  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingLeave, setEditingLeave] = useState<Leave | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Delete Confirm Modal
  const [deletingLeave, setDeletingLeave] = useState<Leave | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Form State
  const [formData, setFormData] = useState<{
    userId: string;
    employeeName: string;
    date: string;
    leaveType: LeaveType;
    halfDaySession: LeaveSession;
    category: LeaveCategory;
    status: LeaveStatus;
    deductionAmount: number;
    reason: string;
  }>({
    userId: '',
    employeeName: '',
    date: new Date().toISOString().slice(0, 10),
    leaveType: 'Full',
    halfDaySession: null,
    category: 'Unpaid',
    status: 'Approved',
    deductionAmount: 0,
    reason: '',
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [leavesData, usersData] = await Promise.all([
        leaveService.getLeaves({
          month: selectedMonth,
          year: selectedYear,
          userId: selectedUserFilter || undefined,
          status: selectedStatusFilter || undefined,
        }),
        userManagementService.getUsers().catch(() => [] as UserInfo[]),
      ]);
      setLeaves(leavesData || []);
      setUsers(usersData || []);
    } catch (err: any) {
      console.error('Error fetching leaves:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedMonth, selectedYear, selectedUserFilter, selectedStatusFilter]);

  // Calculate default deduction based on employee and leave settings
  const calculateDefaultDeduction = (
    userId: string,
    leaveType: LeaveType,
    category: LeaveCategory
  ): number => {
    if (category !== 'Unpaid') return 0;
    const user = users.find((u) => u._id === userId);
    if (!user) return 0;

    if (leaveType === 'Half') {
      if (user.halfDayDeduction && user.halfDayDeduction > 0) return user.halfDayDeduction;
      if (user.fullDayDeduction && user.fullDayDeduction > 0) return Math.round(user.fullDayDeduction / 2);
      if (user.baseSalary && user.baseSalary > 0) return Math.round((user.baseSalary / 30) / 2);
      return 0;
    } else {
      if (user.fullDayDeduction && user.fullDayDeduction > 0) return user.fullDayDeduction;
      if (user.baseSalary && user.baseSalary > 0) return Math.round(user.baseSalary / 30);
      return 0;
    }
  };

  const handleOpenCreateModal = () => {
    setEditingLeave(null);
    setErrorMsg('');
    const defaultUser = users[0];
    const initialUserId = defaultUser?._id || '';
    const initialName = defaultUser?.username || '';
    const initialDeduction = defaultUser ? calculateDefaultDeduction(initialUserId, 'Full', 'Unpaid') : 0;

    setFormData({
      userId: initialUserId,
      employeeName: initialName,
      date: new Date().toISOString().slice(0, 10),
      leaveType: 'Full',
      halfDaySession: null,
      category: 'Unpaid',
      status: 'Approved',
      deductionAmount: initialDeduction,
      reason: '',
    });
    setShowModal(true);
  };

  const handleOpenEditModal = (leave: Leave) => {
    setEditingLeave(leave);
    setErrorMsg('');
    const uId = typeof leave.userId === 'object' ? leave.userId._id : leave.userId;
    setFormData({
      userId: uId,
      employeeName: leave.employeeName,
      date: leave.date ? leave.date.slice(0, 10) : new Date().toISOString().slice(0, 10),
      leaveType: leave.leaveType,
      halfDaySession: leave.halfDaySession || (leave.leaveType === 'Half' ? 'Morning' : null),
      category: leave.category,
      status: leave.status,
      deductionAmount: leave.deductionAmount,
      reason: leave.reason || '',
    });
    setShowModal(true);
  };

  const handleUserChange = (uId: string) => {
    const selected = users.find((u) => u._id === uId);
    const empName = selected ? selected.username : '';
    const autoDeduction = calculateDefaultDeduction(uId, formData.leaveType, formData.category);
    setFormData((prev) => ({
      ...prev,
      userId: uId,
      employeeName: empName,
      deductionAmount: autoDeduction,
    }));
  };

  const handleLeaveTypeChange = (type: LeaveType) => {
    const autoDeduction = calculateDefaultDeduction(formData.userId, type, formData.category);
    setFormData((prev) => ({
      ...prev,
      leaveType: type,
      halfDaySession: type === 'Half' ? (prev.halfDaySession || 'Morning') : null,
      deductionAmount: autoDeduction,
    }));
  };

  const handleCategoryChange = (cat: LeaveCategory) => {
    const autoDeduction = calculateDefaultDeduction(formData.userId, formData.leaveType, cat);
    setFormData((prev) => ({
      ...prev,
      category: cat,
      deductionAmount: autoDeduction,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.userId) {
      setErrorMsg('Please select an employee');
      return;
    }
    if (!formData.date) {
      setErrorMsg('Please select a date');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg('');

      if (editingLeave) {
        await leaveService.updateLeave(editingLeave._id, {
          userId: formData.userId,
          employeeName: formData.employeeName,
          date: formData.date,
          leaveType: formData.leaveType,
          halfDaySession: formData.halfDaySession,
          category: formData.category,
          status: formData.status,
          deductionAmount: Number(formData.deductionAmount) || 0,
          reason: formData.reason,
        });
      } else {
        await leaveService.createLeave({
          userId: formData.userId,
          employeeName: formData.employeeName,
          date: formData.date,
          leaveType: formData.leaveType,
          halfDaySession: formData.halfDaySession,
          category: formData.category,
          status: formData.status,
          deductionAmount: Number(formData.deductionAmount) || 0,
          reason: formData.reason,
        });
      }

      setShowModal(false);
      setEditingLeave(null);
      fetchData();
    } catch (err: any) {
      console.error('Error saving leave:', err);
      setErrorMsg(err?.response?.data?.message || 'Failed to save leave record');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingLeave) return;
    try {
      setDeleting(true);
      await leaveService.deleteLeave(deletingLeave._id);
      setDeletingLeave(null);
      fetchData();
    } catch (err: any) {
      console.error('Error deleting leave:', err);
    } finally {
      setDeleting(false);
    }
  };

  // KPIs
  const totalApprovedLeaves = leaves.filter((l) => l.status === 'Approved');
  const fullDaysCount = totalApprovedLeaves.filter((l) => l.leaveType === 'Full').length;
  const halfDaysCount = totalApprovedLeaves.filter((l) => l.leaveType === 'Half').length;
  const totalEquivalentDays = fullDaysCount + halfDaysCount * 0.5;
  const totalDeductions = totalApprovedLeaves.reduce((sum, l) => sum + (Number(l.deductionAmount) || 0), 0);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-800 via-indigo-600 to-blue-600 bg-clip-text text-transparent tracking-tight">
            Leave & Absence Tracking
          </h2>
          <p className="text-sm text-slate-500 mt-1 font-medium">
            Record employee leaves and automatically sync salary deductions with Payroll
          </p>
        </div>
        <button
          onClick={handleOpenCreateModal}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary to-indigo-600 text-white text-sm font-semibold rounded-xl hover:shadow-lg hover:shadow-primary/30 hover:-translate-y-0.5 transition-all duration-300 cursor-pointer"
        >
          <Plus className="w-5 h-5" />
          Record Leave
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Total Leaves
              </p>
              <h3 className="text-2xl font-extrabold text-slate-800 mt-1">
                {totalEquivalentDays} <span className="text-sm font-medium text-slate-500">days</span>
              </h3>
            </div>
            <div className="w-11 h-11 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <CalendarOff className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-2">
            Approved leaves for {MONTH_NAMES[selectedMonth - 1]} {selectedYear}
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Full-Day Leaves
              </p>
              <h3 className="text-2xl font-extrabold text-slate-800 mt-1">
                {fullDaysCount} <span className="text-sm font-medium text-slate-500">days</span>
              </h3>
            </div>
            <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
              <CalendarCheck className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-2">Full-day absences recorded</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Half-Day Leaves
              </p>
              <h3 className="text-2xl font-extrabold text-slate-800 mt-1">
                {halfDaysCount} <span className="text-sm font-medium text-slate-500">sessions</span>
              </h3>
            </div>
            <div className="w-11 h-11 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-2">Morning / Afternoon half-day sessions</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Salary Deductions
              </p>
              <h3 className="text-2xl font-extrabold text-rose-600 mt-1">
                {totalDeductions.toLocaleString()} <span className="text-xs font-medium text-slate-500">MMK</span>
              </h3>
            </div>
            <div className="w-11 h-11 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
              <TrendingDown className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-2">Auto-applied in Payroll deductions</p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Month Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">Month:</span>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="px-3 py-1.5 text-xs font-medium border border-slate-200 rounded-xl bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            >
              {MONTH_NAMES.map((name, idx) => (
                <option key={name} value={idx + 1}>
                  {name}
                </option>
              ))}
            </select>
          </div>

          {/* Year Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">Year:</span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="px-3 py-1.5 text-xs font-medium border border-slate-200 rounded-xl bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            >
              {[2024, 2025, 2026, 2027].map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          {/* User Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">Employee:</span>
            <select
              value={selectedUserFilter}
              onChange={(e) => setSelectedUserFilter(e.target.value)}
              className="px-3 py-1.5 text-xs font-medium border border-slate-200 rounded-xl bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            >
              <option value="">All Employees</option>
              {users.map((u) => (
                <option key={u._id} value={u._id}>
                  {u.username} {u.employeeId ? `(${u.employeeId})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">Status:</span>
            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className="px-3 py-1.5 text-xs font-medium border border-slate-200 rounded-xl bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            >
              <option value="">All Statuses</option>
              <option value="Approved">Approved</option>
              <option value="Pending">Pending</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Showing <strong className="text-slate-800">{leaves.length}</strong> records
        </div>
      </div>

      {/* Leaves Records Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary mb-3" />
            <p className="text-sm text-slate-500">Loading leave records...</p>
          </div>
        ) : leaves.length === 0 ? (
          <div className="p-12 text-center">
            <CalendarOff className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h4 className="text-base font-semibold text-slate-700">No leave records found</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              There are no leave records for the selected period. Click "Record Leave" above to add a new record.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="px-5 py-3.5">Date</th>
                  <th className="px-5 py-3.5">Employee</th>
                  <th className="px-5 py-3.5">Type & Session</th>
                  <th className="px-5 py-3.5">Category</th>
                  <th className="px-5 py-3.5">Deduction</th>
                  <th className="px-5 py-3.5">Reason</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {leaves.map((leave) => {
                  const empUser = typeof leave.userId === 'object' ? (leave.userId as UserInfo) : null;
                  const dateStr = leave.date ? new Date(leave.date).toISOString().slice(0, 10) : '-';

                  return (
                    <tr key={leave._id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-5 py-3.5 font-medium text-slate-700 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-slate-400" />
                          <span>{dateStr}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs uppercase">
                            {leave.employeeName?.slice(0, 2) || 'EM'}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-800">{leave.employeeName}</div>
                            {empUser?.position && (
                              <div className="text-xs text-slate-400">{empUser.position}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        {leave.leaveType === 'Half' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                            <Clock className="w-3 h-3" />
                            Half Day ({leave.halfDaySession || 'Session'})
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                            <CalendarCheck className="w-3 h-3" />
                            Full Day
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-md text-xs font-medium ${
                            leave.category === 'Unpaid'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : leave.category === 'Medical'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}
                        >
                          {leave.category}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        {leave.deductionAmount > 0 ? (
                          <span className="font-bold text-rose-600">
                            -{leave.deductionAmount.toLocaleString()} MMK
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">0 MMK (Paid)</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-xs text-slate-600 max-w-xs truncate">
                        {leave.reason || '-'}
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            leave.status === 'Approved'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : leave.status === 'Pending'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {leave.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEditModal(leave)}
                            className="p-1.5 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors cursor-pointer"
                            title="Edit"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeletingLeave(leave)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Record / Edit Leave Modal (Solid White, No-Glass, createPortal) */}
      {showModal && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 backdrop-blur-sm overflow-y-auto"
          style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)' }}
        >
          <div
            role="dialog"
            aria-modal="true"
            className="no-glass modal-box bg-white rounded-2xl shadow-2xl w-full max-w-lg my-auto max-h-[90vh] flex flex-col overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150"
            style={{ backgroundColor: '#ffffff', opacity: 1, backdropFilter: 'none', WebkitBackdropFilter: 'none' }}
          >
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
              <div>
                <h3 className="text-lg font-bold text-slate-800">
                  {editingLeave ? 'Edit Leave Record' : 'Record Leave / Absence'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Employee leave details and payroll deduction settings
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="p-6 space-y-4 overflow-y-auto flex-1">
                {errorMsg && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {/* Employee Select */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Employee <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.userId}
                    onChange={(e) => handleUserChange(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white text-slate-800"
                    required
                  >
                    <option value="" disabled>Select Employee</option>
                    {users.map((u) => (
                      <option key={u._id} value={u._id}>
                        {u.username} {u.employeeId ? `(${u.employeeId})` : ''} - {u.position || 'Employee'}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Date */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Date of Absence / Leave <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white text-slate-800"
                    required
                  />
                </div>

                {/* Leave Type (Full / Half) */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Leave Duration Type
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => handleLeaveTypeChange('Full')}
                      className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all cursor-pointer ${
                        formData.leaveType === 'Full'
                          ? 'border-primary bg-primary/10 text-primary shadow-sm'
                          : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <CalendarCheck className="w-4 h-4" />
                      Full Day
                    </button>
                    <button
                      type="button"
                      onClick={() => handleLeaveTypeChange('Half')}
                      className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all cursor-pointer ${
                        formData.leaveType === 'Half'
                          ? 'border-amber-500 bg-amber-50 text-amber-700 shadow-sm'
                          : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <Clock className="w-4 h-4" />
                      Half Day
                    </button>
                  </div>
                </div>

                {/* If Half Day, Session */}
                {formData.leaveType === 'Half' && (
                  <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 space-y-2">
                    <label className="block text-xs font-semibold text-amber-900">
                      Half-Day Session
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, halfDaySession: 'Morning' })}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                          formData.halfDaySession === 'Morning'
                            ? 'bg-amber-600 text-white border-amber-600'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        Morning
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, halfDaySession: 'Afternoon' })}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                          formData.halfDaySession === 'Afternoon'
                            ? 'bg-amber-600 text-white border-amber-600'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        Afternoon
                      </button>
                    </div>
                  </div>
                )}

                {/* Category & Status */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Leave Category
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => handleCategoryChange(e.target.value as LeaveCategory)}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white text-slate-800"
                    >
                      <option value="Unpaid">Unpaid Leave</option>
                      <option value="Casual">Casual Leave</option>
                      <option value="Medical">Medical Leave</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as LeaveStatus })}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white text-slate-800"
                    >
                      <option value="Approved">Approved</option>
                      <option value="Pending">Pending</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                  </div>
                </div>

                {/* Deduction Amount */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700">
                      Salary Deduction Amount (MMK)
                    </label>
                    {formData.category === 'Unpaid' && (
                      <span className="text-[11px] text-primary font-medium">Auto Policy Calculated</span>
                    )}
                  </div>
                  <input
                    type="number"
                    value={formData.deductionAmount || ''}
                    onChange={(e) => setFormData({ ...formData, deductionAmount: parseFloat(e.target.value) || 0 })}
                    placeholder="0"
                    className="w-full px-3 py-2 text-sm font-semibold border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white text-slate-800"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    {formData.category === 'Unpaid'
                      ? 'Calculated from user leave deduction policy or Base Salary / 30. You can manually adjust if needed.'
                      : 'Paid leaves do not incur salary deduction (0 MMK).'}
                  </p>
                </div>

                {/* Reason */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Reason / Notes
                  </label>
                  <textarea
                    rows={2}
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    placeholder="Brief description or reason for absence..."
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white text-slate-800"
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-end gap-2 bg-slate-50 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-primary rounded-xl hover:bg-primary/90 disabled:opacity-50 transition-colors shadow-sm cursor-pointer"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Record'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Delete Confirmation Modal (Solid White, No-Glass, createPortal) */}
      {deletingLeave && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 backdrop-blur-sm overflow-y-auto"
          style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)' }}
        >
          <div
            role="dialog"
            aria-modal="true"
            className="no-glass modal-box bg-white rounded-2xl shadow-2xl w-full max-w-sm my-auto overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150"
            style={{ backgroundColor: '#ffffff', opacity: 1, backdropFilter: 'none', WebkitBackdropFilter: 'none' }}
          >
            <div className="p-6 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-800">
                Delete Leave Record?
              </h3>
              <p className="text-xs text-slate-500">
                Are you sure you want to delete the leave record for <strong>{deletingLeave.employeeName}</strong> on{' '}
                {new Date(deletingLeave.date).toISOString().slice(0, 10)}? This action cannot be undone.
              </p>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-2 bg-slate-50">
              <button
                type="button"
                onClick={() => setDeletingLeave(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
              >
                {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                Delete
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default Leaves;
