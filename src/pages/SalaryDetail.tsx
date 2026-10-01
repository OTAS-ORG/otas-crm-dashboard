import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { salaryService, userManagementService, leaveService } from '../services/api';
import type { UserInfo, Expense, AttachedExpense, LeaveSummary } from '../types';
import { ArrowLeft, Save, Printer, Download, Wallet, Receipt, CheckSquare, Square, Pencil, CalendarOff, Clock } from 'lucide-react';
import logo from '../assets/otas.png';

const PAYMENT_CHANNELS = ['', 'K Pay', 'Wave Pay', 'AYA Pay', 'KBZ Bank Transfer', 'AYA Bank Transfer'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const toMMK = (amount: number, currency?: string, exchangeRate?: number) => {
  if (currency === 'USD' && exchangeRate) return amount * exchangeRate;
  return amount;
};

const FormInput = ({ label, value, onChange, type = 'text', disabled: fieldDisabled, options, isEditing }: any) => (
  <div>
    <label className="block text-xs font-medium text-slate-500 mb-1">{label}</label>
    {options ? (
      <select
        value={value}
        onChange={onChange}
        disabled={fieldDisabled ?? !isEditing}
        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:bg-slate-50 disabled:text-slate-500"
      >
        {options.map((o: any) => <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>)}
      </select>
    ) : (
      <input
        type={type}
        value={value}
        onChange={onChange}
        disabled={fieldDisabled ?? !isEditing}
        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:bg-slate-50 disabled:text-slate-500"
      />
    )}
  </div>
);

const normalizeAllowances = (a?: any) => ({
  phone: Number(a?.phone) || 0,
  internet: Number(a?.internet) || 0,
  travel: Number(a?.travel) || 0,
  meal: Number(a?.meal) || 0,
  commission: Number(a?.commission) || 0,
  bonus: Number(a?.bonus) || 0,
  other: Number(a?.other) || 0,
});

const normalizeDeductions = (d?: any) => ({
  unpaidLeave: Number(d?.unpaidLeave) || 0,
  latePenalty: Number(d?.latePenalty) || 0,
  advanceSalary: Number(d?.advanceSalary) || 0,
});

const SalaryDetail: React.FC = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const isNew = id === 'new';
  const autoEdit = searchParams.get('edit') === 'true';
  const previewRef = useRef<HTMLDivElement>(null);

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(isNew || autoEdit);
  const [exportingPDF, setExportingPDF] = useState(false);
  const [exportingImage, setExportingImage] = useState(false);

  const [users, setUsers] = useState<UserInfo[]>([]);
  const [unreimbursedExpenses, setUnreimbursedExpenses] = useState<Expense[]>([]);
  const [loadingExpenses, setLoadingExpenses] = useState(false);
  const [leaveSummary, setLeaveSummary] = useState<LeaveSummary | null>(null);
  const [loadingLeaveSummary, setLoadingLeaveSummary] = useState(false);

  const [form, setForm] = useState({
    employeeName: '',
    employeeId: '',
    position: '',
    dateOfJoining: '',
    department: '',
    userId: '',
    attachedExpenses: [] as AttachedExpense[],
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    baseSalary: 0,
    allowances: normalizeAllowances(),
    deductions: normalizeDeductions(),
    currency: 'MMK' as 'MMK' | 'USD',
    exchangeRate: 0,
    status: 'Draft' as 'Draft' | 'Paid',
    paymentChannel: '',
    paidDate: '',
    notes: '',
  });

  const totalAllowances = Object.values(form.allowances).reduce((a, b) => a + b, 0);
  const totalDeductions = Object.values(form.deductions).reduce((a, b) => a + b, 0);
  const totalReimbursed = (form.attachedExpenses || []).reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const netPay = form.baseSalary + totalAllowances + totalReimbursed - totalDeductions;

  // Load all users on mount
  useEffect(() => {
    userManagementService.getUsers().then((res) => {
      setUsers(res || []);
    }).catch((err) => {
      console.error('Error fetching users:', err);
    });
  }, []);

  // Load existing salary
  const fetchSalary = async () => {
    if (!isNew && id) {
      setLoading(true);
      try {
        const data = await salaryService.getSalary(id);
        setForm({
          employeeName: data.employeeName,
          employeeId: data.employeeId || '',
          position: data.position || '',
          dateOfJoining: data.dateOfJoining ? data.dateOfJoining.slice(0, 10) : '',
          department: data.department || '',
          userId: typeof data.userId === 'object' ? (data.userId as any)?._id : (data.userId || ''),
          attachedExpenses: data.attachedExpenses || [],
          month: data.month,
          year: data.year,
          baseSalary: data.baseSalary,
          allowances: normalizeAllowances(data.allowances),
          deductions: normalizeDeductions(data.deductions),
          currency: data.currency,
          exchangeRate: data.exchangeRate,
          status: data.status,
          paymentChannel: data.paymentChannel || '',
          paidDate: data.paidDate ? data.paidDate.slice(0, 10) : '',
          notes: data.notes || '',
        });
        if (autoEdit) {
          setIsEditing(true);
        }
      } catch (err) {
        console.error('Error fetching salary:', err);
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchSalary();
  }, [id, autoEdit]);

  // Load unreimbursed expenses when userId changes
  useEffect(() => {
    if (form.userId) {
      setLoadingExpenses(true);
      salaryService.getUnreimbursedExpenses(form.userId)
        .then((expList) => {
          setUnreimbursedExpenses(expList || []);
        })
        .catch((err) => {
          console.error('Error fetching unreimbursed expenses:', err);
          setUnreimbursedExpenses([]);
        })
        .finally(() => setLoadingExpenses(false));
    } else {
      setUnreimbursedExpenses([]);
    }
  }, [form.userId]);

  // Load leave summary and auto-populate unpaidLeave deduction when user/month/year changes
  useEffect(() => {
    if (form.userId && form.month && form.year) {
      setLoadingLeaveSummary(true);
      leaveService.getLeaveSummary(form.userId, form.month, form.year)
        .then((summary) => {
          setLeaveSummary(summary);
          if (summary && isEditing) {
            setForm((prev) => ({
              ...prev,
              deductions: {
                ...prev.deductions,
                unpaidLeave: summary.totalDeduction || 0,
              },
            }));
          }
        })
        .catch((err) => {
          console.error('Error fetching leave summary:', err);
          setLeaveSummary(null);
        })
        .finally(() => setLoadingLeaveSummary(false));
    } else {
      setLeaveSummary(null);
    }
  }, [form.userId, form.month, form.year]);

  // Combined list of expenses for the user (already attached + unreimbursed pending/approved)
  const allAvailableExpenses = useMemo(() => {
    const list: {
      _id: string;
      description: string;
      amount: number;
      category: string;
      date: string;
      status?: string;
    }[] = [];
    const seenIds = new Set<string>();

    (form.attachedExpenses || []).forEach((att) => {
      const expId = typeof att.expenseId === 'object' ? (att.expenseId as any)?._id : att.expenseId;
      if (expId && !seenIds.has(expId)) {
        seenIds.add(expId);
        list.push({
          _id: expId,
          description: att.description,
          amount: att.amount,
          category: att.category,
          date: att.date || '',
          status: (typeof att.expenseId === 'object' ? (att.expenseId as any)?.status : undefined) || 'Approved',
        });
      }
    });

    unreimbursedExpenses.forEach((exp) => {
      if (!seenIds.has(exp._id)) {
        seenIds.add(exp._id);
        list.push({
          _id: exp._id,
          description: exp.description,
          amount: exp.amount,
          category: exp.category,
          date: exp.date,
          status: exp.status,
        });
      }
    });

    return list;
  }, [form.attachedExpenses, unreimbursedExpenses]);

  const isExpenseSelected = (expenseId: string) => {
    return (form.attachedExpenses || []).some((e) => {
      const id = typeof e.expenseId === 'object' ? (e.expenseId as any)?._id : e.expenseId;
      return id === expenseId;
    });
  };

  const toggleExpense = (exp: { _id: string; description: string; amount: number; category: string; date?: string }) => {
    if (!isEditing) return;
    const isSelected = isExpenseSelected(exp._id);
    if (isSelected) {
      setForm({
        ...form,
        attachedExpenses: form.attachedExpenses.filter((e) => {
          const id = typeof e.expenseId === 'object' ? (e.expenseId as any)?._id : e.expenseId;
          return id !== exp._id;
        }),
      });
    } else {
      const newAttached: AttachedExpense = {
        expenseId: exp._id,
        description: exp.description,
        amount: exp.amount,
        category: exp.category,
        date: exp.date,
      };
      setForm({
        ...form,
        attachedExpenses: [...form.attachedExpenses, newAttached],
      });
    }
  };

  const selectAllExpenses = () => {
    if (!isEditing) return;
    const newAttached: AttachedExpense[] = allAvailableExpenses.map((exp) => ({
      expenseId: exp._id,
      description: exp.description,
      amount: exp.amount,
      category: exp.category,
      date: exp.date,
    }));
    setForm({ ...form, attachedExpenses: newAttached });
  };

  const deselectAllExpenses = () => {
    if (!isEditing) return;
    setForm({ ...form, attachedExpenses: [] });
  };

  const handleUserChange = (selectedUserId: string) => {
    const selectedUser = users.find(u => u._id === selectedUserId);
    if (!selectedUser) {
      setForm(prev => ({
        ...prev,
        userId: '',
        attachedExpenses: [],
      }));
      return;
    }

    const deptName = selectedUser.department || (selectedUser.departments && selectedUser.departments.length > 0
      ? (typeof selectedUser.departments[0] === 'object' ? (selectedUser.departments[0] as any).name : selectedUser.departments[0])
      : '');

    setForm(prev => ({
      ...prev,
      userId: selectedUserId,
      employeeName: selectedUser.username || prev.employeeName,
      employeeId: selectedUser.employeeId || prev.employeeId,
      position: selectedUser.position || prev.position,
      dateOfJoining: selectedUser.dateOfJoining ? selectedUser.dateOfJoining.slice(0, 10) : prev.dateOfJoining,
      department: deptName || prev.department,
      baseSalary: selectedUser.baseSalary ? selectedUser.baseSalary : prev.baseSalary,
      attachedExpenses: [],
    }));
  };

  const updateAllowance = (key: string, value: string) => {
    setForm({ ...form, allowances: { ...form.allowances, [key]: parseFloat(value) || 0 } });
  };

  const updateDeduction = (key: string, value: string) => {
    setForm({ ...form, deductions: { ...form.deductions, [key]: parseFloat(value) || 0 } });
  };

  const handleSave = async () => {
    const finalEmployeeName = form.employeeName.trim() || users.find(u => u._id === form.userId)?.username || '';
    if (!finalEmployeeName) return;
    try {
      setSaving(true);
      const payload = { ...form, employeeName: finalEmployeeName };
      if (isNew) {
        const created = await salaryService.createSalary(payload);
        navigate(`/salaries/${created._id}`, { replace: true });
      } else if (id) {
        const updated = await salaryService.updateSalary(id, payload);
        if (updated) {
          setForm({
            employeeName: updated.employeeName,
            employeeId: updated.employeeId || '',
            position: updated.position || '',
            dateOfJoining: updated.dateOfJoining ? updated.dateOfJoining.slice(0, 10) : '',
            department: updated.department || '',
            userId: typeof updated.userId === 'object' ? (updated.userId as any)?._id : (updated.userId || ''),
            attachedExpenses: updated.attachedExpenses || [],
            month: updated.month,
            year: updated.year,
            baseSalary: updated.baseSalary,
            allowances: normalizeAllowances(updated.allowances),
            deductions: normalizeDeductions(updated.deductions),
            currency: updated.currency,
            exchangeRate: updated.exchangeRate,
            status: updated.status,
            paymentChannel: updated.paymentChannel || '',
            paidDate: updated.paidDate ? updated.paidDate.slice(0, 10) : '',
            notes: updated.notes || '',
          });
        }
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Error saving salary:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!previewRef.current || exportingPDF) return;
    try {
      setExportingPDF(true);
      // Brief timeout to let React update DOM and browser paint the loading state
      await new Promise((r) => setTimeout(r, 100));

      const html2canvas = (await import('html2canvas-pro')).default;
      const jsPDF = (await import('jspdf')).default;

      const element = previewRef.current;
      const originalWidth = element.style.width;
      const originalMaxWidth = element.style.maxWidth;
      element.style.width = '520px';
      element.style.maxWidth = 'none';

      const canvas = await html2canvas(element, { scale: 3, useCORS: true, backgroundColor: '#ffffff' });

      element.style.width = originalWidth;
      element.style.maxWidth = originalMaxWidth;

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a5'
      });
      // A5 size is 148mm x 210mm
      pdf.addImage(imgData, 'PNG', 0, 0, 148, 210);
      pdf.save(`Payslip_${form.employeeName}_${MONTHS[form.month - 1]}_${form.year}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setExportingPDF(false);
    }
  };

  const handleDownloadImage = async () => {
    if (!previewRef.current || exportingImage) return;
    try {
      setExportingImage(true);
      // Brief timeout to let React update DOM and browser paint the loading state
      await new Promise((r) => setTimeout(r, 100));

      const html2canvas = (await import('html2canvas-pro')).default;

      const element = previewRef.current;
      const originalWidth = element.style.width;
      const originalMaxWidth = element.style.maxWidth;
      element.style.width = '520px';
      element.style.maxWidth = 'none';

      const canvas = await html2canvas(element, { scale: 3, useCORS: true, backgroundColor: '#ffffff' });

      element.style.width = originalWidth;
      element.style.maxWidth = originalMaxWidth;

      const link = document.createElement('a');
      link.download = `Payslip_${form.employeeName}_${MONTHS[form.month - 1]}_${form.year}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (error) {
      console.error('Error generating image:', error);
    } finally {
      setExportingImage(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/salaries')} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="p-2.5 rounded-2xl bg-primary/10">
            <Wallet className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">
              {isNew ? 'New Salary Record' : (isEditing ? 'Edit Salary' : form.employeeName)}
            </h1>
            {!isNew && <p className="text-sm text-slate-500">{MONTHS[form.month - 1]} {form.year}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!isNew && !isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-primary bg-primary/10 hover:bg-primary/20 rounded-xl transition-colors shadow-sm cursor-pointer"
            >
              <Pencil className="w-4 h-4" />
              Edit Payroll
            </button>
          )}
          {isEditing && (
            <>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2 bg-primary text-white text-sm font-medium rounded-xl hover:bg-primary/90 disabled:opacity-50 transition-colors shadow-sm cursor-pointer"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save'}
              </button>
              {!isNew && (
                <button
                  onClick={() => {
                    fetchSalary();
                    setIsEditing(false);
                  }}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              )}
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h2 className="font-semibold text-slate-800 mb-4">Employee Details</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Employee (User Account) *
                </label>
                <select
                  value={form.userId}
                  onChange={(e) => handleUserChange(e.target.value)}
                  disabled={!isEditing}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:bg-slate-50 disabled:text-slate-500 font-medium"
                >
                  <option value="">-- Select Employee --</option>
                  {!form.userId && form.employeeName && (
                    <option value="">{form.employeeName} (Unlinked)</option>
                  )}
                  {users.map((u) => (
                    <option key={u._id} value={u._id}>
                      {u.username} {u.employeeId ? `[${u.employeeId}]` : ''} {u.position ? `- ${u.position}` : `(${u.role})`}
                    </option>
                  ))}
                </select>
              </div>
              <FormInput isEditing={isEditing} label="Employee ID" value={form.employeeId} onChange={(e: any) => setForm({ ...form, employeeId: e.target.value })} />
              <FormInput isEditing={isEditing} label="Position" value={form.position} onChange={(e: any) => setForm({ ...form, position: e.target.value })} />
              <FormInput isEditing={isEditing} label="Date of Joining" type="date" value={form.dateOfJoining} onChange={(e: any) => setForm({ ...form, dateOfJoining: e.target.value })} />
              <FormInput isEditing={isEditing} label="Department" value={form.department} onChange={(e: any) => setForm({ ...form, department: e.target.value })} />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h2 className="font-semibold text-slate-800 mb-4">Period & Salary</h2>
            <div className="grid grid-cols-3 gap-4">
              <FormInput isEditing={isEditing} label="Month" value={form.month} onChange={(e: any) => setForm({ ...form, month: parseInt(e.target.value) })}
                options={MONTHS.map((m, i) => ({ value: i + 1, label: m }))} />
              <FormInput isEditing={isEditing} label="Year" value={form.year} onChange={(e: any) => setForm({ ...form, year: parseInt(e.target.value) })} type="number" />
              <FormInput isEditing={isEditing} label="Base Salary" value={form.baseSalary} onChange={(e: any) => setForm({ ...form, baseSalary: parseFloat(e.target.value) || 0 })} type="number" />
              <FormInput isEditing={isEditing} label="Currency" value={form.currency} onChange={(e: any) => setForm({ ...form, currency: e.target.value })}
                options={[{ value: 'MMK', label: 'MMK' }, { value: 'USD', label: 'USD' }]} />
              {form.currency === 'USD' && (
                <FormInput isEditing={isEditing} label="Exchange Rate" value={form.exchangeRate} onChange={(e: any) => setForm({ ...form, exchangeRate: parseFloat(e.target.value) || 0 })} type="number" />
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h2 className="font-semibold text-slate-800 mb-4">Allowances</h2>
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(form.allowances).map(([key, val]) => (
                <FormInput isEditing={isEditing} key={key} label={key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}
                  value={val} onChange={(e: any) => updateAllowance(key, e.target.value)} type="number" />
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between text-sm">
              <span className="font-medium text-slate-600">Total Allowances:</span>
              <span className="font-bold text-emerald-600">+{toMMK(totalAllowances, form.currency, form.exchangeRate).toLocaleString()}</span>
            </div>
          </div>

          {/* Expense Reimbursements (စရိတ် ပြန်အမ်းငွေများ) */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
                  <Receipt className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="font-semibold text-slate-800">Expense Reimbursements</h2>
                  <p className="text-xs text-slate-500">ဝန်ထမ်းစိုက်ထုတ်ထားသော ကုန်ကျစရိတ် ပြန်အမ်းငွေများ</p>
                </div>
              </div>

              {form.userId && allAvailableExpenses.length > 0 && isEditing && (
                <div className="flex items-center gap-2 text-xs">
                  <button
                    type="button"
                    onClick={selectAllExpenses}
                    className="text-primary hover:underline font-medium cursor-pointer"
                  >
                    Select All
                  </button>
                  <span className="text-slate-300">|</span>
                  <button
                    type="button"
                    onClick={deselectAllExpenses}
                    className="text-slate-500 hover:text-slate-700 font-medium cursor-pointer"
                  >
                    Clear
                  </button>
                </div>
              )}
            </div>

            {!form.userId ? (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 text-center">
                <p className="text-xs text-slate-500">
                  ဝန်ထမ်း၏ ကုန်ကျစရိတ်တောင်းခံလွှာများကို ချိတ်ဆက်ရန် အထက်ရှိ <strong>CRM User Account</strong> ကို ရွေးချယ်ပေးပါ။
                </p>
              </div>
            ) : loadingExpenses ? (
              <div className="p-4 text-center text-xs text-slate-400">
                Loading user expenses...
              </div>
            ) : allAvailableExpenses.length === 0 ? (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 text-center">
                <p className="text-xs text-slate-500">
                  ဤ User အတွက် လစာထဲ မထည့်ရသေးသော Pending / Approved expense မရှိသေးပါ။
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="max-h-56 overflow-y-auto space-y-2 pr-1 divide-y divide-slate-100">
                  {allAvailableExpenses.map((exp) => {
                    const isSelected = isExpenseSelected(exp._id);
                    return (
                      <div
                        key={exp._id}
                        onClick={() => toggleExpense(exp)}
                        className={`pt-2 first:pt-0 flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                          isSelected
                            ? 'bg-blue-50/60 border-blue-200 text-slate-800'
                            : 'bg-white border-slate-100 hover:border-slate-200 text-slate-600'
                        } ${isEditing ? 'cursor-pointer' : 'cursor-default'}`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <button
                            type="button"
                            disabled={!isEditing}
                            className={`p-0.5 rounded transition-colors ${
                              isSelected ? 'text-primary' : 'text-slate-300 hover:text-slate-400'
                            }`}
                          >
                            {isSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                          </button>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-slate-800 truncate">{exp.description}</p>
                            <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-400">
                              <span>{exp.date ? new Date(exp.date).toLocaleDateString() : '-'}</span>
                              <span>•</span>
                              <span className="px-1.5 py-0.2 bg-slate-100 rounded text-slate-600">{exp.category}</span>
                              <span className={`px-1.5 py-0.2 rounded font-medium ${
                                exp.status === 'Approved' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                              }`}>
                                {exp.status || 'Approved'}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right shrink-0 font-bold text-xs text-slate-800">
                          +{Number(exp.amount).toLocaleString()} MMK
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-3 pt-3 border-t border-slate-100 flex justify-between items-center text-sm">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <span>Selected:</span>
                    <strong className="text-slate-700">{form.attachedExpenses.length}</strong>
                    <span>items</span>
                  </div>
                  <span className="font-bold text-blue-600">
                    +{totalReimbursed.toLocaleString()} MMK
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Leave & Absence Records */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-rose-50 text-rose-600">
                  <CalendarOff className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="font-semibold text-slate-800">Leave & Absence Records</h2>
                  <p className="text-xs text-slate-500">
                    Approved leave records for {MONTHS[form.month - 1]} {form.year}
                  </p>
                </div>
              </div>

              {leaveSummary && leaveSummary.leaves.length > 0 && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                  <Clock className="w-3 h-3" />
                  Auto-Applied to Unpaid Leave
                </span>
              )}
            </div>

            {!form.userId ? (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 text-center">
                <p className="text-xs text-slate-500">
                  Select a <strong>CRM User Account</strong> above to load leave records and calculate deductions.
                </p>
              </div>
            ) : loadingLeaveSummary ? (
              <div className="p-4 text-center text-xs text-slate-400">
                Checking leave records for {MONTHS[form.month - 1]} {form.year}...
              </div>
            ) : !leaveSummary || leaveSummary.leaves.length === 0 ? (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 text-center">
                <p className="text-xs text-slate-500">
                  No approved leave records found for this employee in {MONTHS[form.month - 1]} {form.year}. (Unpaid Leave: 0 MMK)
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Summary Pills */}
                <div className="grid grid-cols-3 gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                  <div>
                    <div className="text-[11px] font-semibold text-slate-500 uppercase">Total Leaves</div>
                    <div className="text-base font-extrabold text-slate-800 mt-0.5">
                      {leaveSummary.totalLeavesCount} <span className="text-xs font-normal text-slate-500">days</span>
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] font-semibold text-slate-500 uppercase">Breakdown</div>
                    <div className="text-xs font-medium text-slate-600 mt-1">
                      Full: <strong>{leaveSummary.fullDaysCount}</strong> | Half: <strong>{leaveSummary.halfDaysCount}</strong>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[11px] font-semibold text-slate-500 uppercase">Total Deduction</div>
                    <div className="text-base font-extrabold text-rose-600 mt-0.5">
                      -{leaveSummary.totalDeduction.toLocaleString()} <span className="text-xs font-normal text-slate-500">MMK</span>
                    </div>
                  </div>
                </div>

                {/* Leaves list */}
                <div className="max-h-48 overflow-y-auto space-y-2 pr-1 divide-y divide-slate-100">
                  {leaveSummary.leaves.map((l) => (
                    <div key={l._id} className="pt-2 first:pt-0 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-700">
                          {new Date(l.date).toISOString().slice(0, 10)}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full font-medium ${
                          l.leaveType === 'Half'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-blue-50 text-blue-700 border border-blue-200'
                        }`}>
                          {l.leaveType === 'Half' ? `Half (${l.halfDaySession || 'Day'})` : 'Full Day'}
                        </span>
                        <span className="text-slate-400">·</span>
                        <span className="text-slate-500 truncate max-w-[200px]">{l.reason || l.category}</span>
                      </div>
                      <div className="font-bold text-rose-600">
                        {l.deductionAmount > 0 ? `-${Number(l.deductionAmount).toLocaleString()} MMK` : '0 MMK'}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="text-[11px] text-slate-500 bg-rose-50/50 border border-rose-100 p-2.5 rounded-xl">
                  💡 Total leave deduction of <strong>{leaveSummary.totalDeduction.toLocaleString()} MMK</strong> for this month has been automatically populated into the <strong>Unpaid Leave</strong> deduction field below.
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h2 className="font-semibold text-slate-800 mb-4">Deductions</h2>
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(form.deductions).map(([key, val]) => (
                <FormInput isEditing={isEditing} key={key} label={key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}
                  value={val} onChange={(e: any) => updateDeduction(key, e.target.value)} type="number" />
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between text-sm">
              <span className="font-medium text-slate-600">Total Deductions:</span>
              <span className="font-bold text-red-500">-{toMMK(totalDeductions, form.currency, form.exchangeRate).toLocaleString()}</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h2 className="font-semibold text-slate-800 mb-4">Status & Payment</h2>
            <div className="grid grid-cols-2 gap-4">
              <FormInput isEditing={isEditing} label="Status" value={form.status} onChange={(e: any) => setForm({ ...form, status: e.target.value })}
                options={['Draft', 'Paid']} />
              <FormInput isEditing={isEditing} label="Payment Channel" value={form.paymentChannel} onChange={(e: any) => setForm({ ...form, paymentChannel: e.target.value })}
                options={PAYMENT_CHANNELS} />
              {form.status === 'Paid' && (
                <FormInput isEditing={isEditing} label="Paid Date" type="date" value={form.paidDate} onChange={(e: any) => setForm({ ...form, paidDate: e.target.value })} />
              )}
            </div>
            <div className="mt-4">
              <label className="block text-xs font-medium text-slate-500 mb-1">Notes</label>
              <textarea value={form.notes} onChange={(e: any) => setForm({ ...form, notes: e.target.value })}
                rows={3} disabled={!isEditing}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:bg-slate-50 disabled:text-slate-500 resize-none" />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-2">
            <div className="flex justify-between items-center text-xs text-slate-500">
              <span>Salary Cost (Base + Allowances - Deductions):</span>
              <span className="font-medium text-slate-700">
                {toMMK(form.baseSalary + totalAllowances - totalDeductions, form.currency, form.exchangeRate).toLocaleString()} MMK
              </span>
            </div>
            {totalReimbursed > 0 && (
              <div className="flex justify-between items-center text-xs text-blue-600">
                <span>+ Expense Reimbursement:</span>
                <span className="font-medium">+{totalReimbursed.toLocaleString()} MMK</span>
              </div>
            )}
            <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-lg font-bold">
              <span className="text-slate-800">Net Pay (Take-Home):</span>
              <span className="text-primary">{toMMK(netPay, form.currency, form.exchangeRate).toLocaleString()} MMK</span>
            </div>
          </div>
        </div>

        {/* Payslip Preview */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-slate-800">Payslip Preview</h2>
            <div className="flex items-center gap-2">
              {!isNew && (
                <>
                  <button
                    onClick={handleDownloadPDF}
                    disabled={exportingPDF || exportingImage}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-50"
                  >
                    <Download className="w-3.5 h-3.5" />
                    {exportingPDF ? 'Exporting...' : 'PDF'}
                  </button>
                  <button
                    onClick={handleDownloadImage}
                    disabled={exportingPDF || exportingImage}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-50"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    {exportingImage ? 'Exporting...' : 'Image'}
                  </button>
                </>
              )}
            </div>
          </div>

          <div ref={previewRef} id="payslip-preview" className="print-surface" style={{ fontFamily: "'Inter', 'Poppins', sans-serif", width: '100%', maxWidth: '520px', minHeight: '735px', margin: '0 auto', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
            {/* Header */}
            <div style={{ padding: '14px 32px 20px', borderBottom: '3px solid #3b82f6', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                <img src={logo} alt="OTAS Logo" style={{ width: '80px', height: '80px', objectFit: 'contain' }} />
                <div>
                  <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1e293b', letterSpacing: '-0.025em', margin: 0 }}>
                    OTAS <span style={{ color: '#3b82f6' }}>Tech Solutions</span>
                  </h1>
                  <p style={{ fontSize: '0.7rem', color: '#64748b', margin: '4px 0 0', maxWidth: '240px', lineHeight: '1.4' }}>
                    No(503), Building (1), 7 Mile Condo, Parami Road, Mayangone Township, Yangon
                  </p>
                </div>
              </div>
              <div style={{ textAlign: 'right', marginTop: '10px' }}>
                <p style={{ fontSize: '1rem', fontWeight: 600, color: '#3b82f6', margin: 0, letterSpacing: '2px', textTransform: 'uppercase' }}>Payslip</p>
                <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '4px', marginBottom: 0 }}>{MONTHS[form.month - 1]} {form.year}</p>
              </div>
            </div>

            {/* Employee Info */}
            <div style={{ padding: '20px 32px', borderBottom: '1px solid #e2e8f0' }}>
              <h3 style={{ fontSize: '0.75rem', fontWeight: 600, color: '#3b82f6', textTransform: 'uppercase', letterSpacing: '1px', marginTop: 0, marginBottom: '12px' }}>Employee Details</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 24px', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', padding: '4px 0', borderBottom: '1px solid #f1f5f9' }}>
                  <span style={{ color: '#64748b', fontSize: '0.75rem' }}>Employee Name</span>
                  <span style={{ fontWeight: 600, color: '#1e293b' }}>{form.employeeName || '-'}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', padding: '4px 0', borderBottom: '1px solid #f1f5f9' }}>
                  <span style={{ color: '#64748b', fontSize: '0.75rem' }}>Employee ID</span>
                  <span style={{ fontWeight: 600, color: '#1e293b' }}>{form.employeeId || '-'}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', padding: '4px 0', borderBottom: '1px solid #f1f5f9' }}>
                  <span style={{ color: '#64748b', fontSize: '0.75rem' }}>Position</span>
                  <span style={{ fontWeight: 500, color: '#334155' }}>{form.position || '-'}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', padding: '4px 0', borderBottom: '1px solid #f1f5f9' }}>
                  <span style={{ color: '#64748b', fontSize: '0.75rem' }}>Department</span>
                  <span style={{ fontWeight: 500, color: '#334155' }}>{form.department || '-'}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', padding: '4px 0' }}>
                  <span style={{ color: '#64748b', fontSize: '0.75rem' }}>Date of Joining</span>
                  <span style={{ fontWeight: 500, color: '#334155' }}>{form.dateOfJoining || '-'}</span>
                </div>
              </div>
            </div>

            {/* Earnings Section */}
            <div style={{ padding: '20px 32px 16px', borderBottom: '1px solid #e2e8f0' }}>
              <h3 style={{ fontSize: '0.75rem', fontWeight: 600, color: '#059669', textTransform: 'uppercase', letterSpacing: '1px', marginTop: 0, marginBottom: '12px' }}>Earnings</h3>
              <table style={{ width: '100%', fontSize: '0.85rem', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                    <th style={{ textAlign: 'left', padding: '8px 0', color: '#64748b', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Description</th>
                    <th style={{ textAlign: 'right', padding: '8px 0', color: '#64748b', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Amount (MMK)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '10px 0', color: '#334155' }}>Base Salary</td>
                    <td style={{ padding: '10px 0', textAlign: 'right', fontWeight: 500, color: '#1e293b' }}>{toMMK(form.baseSalary, form.currency, form.exchangeRate).toLocaleString()}</td>
                  </tr>
                  {Object.entries(form.allowances).map(([key, val]) => val > 0 && (
                    <tr key={key} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '10px 0', color: '#475569' }}>{key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}</td>
                      <td style={{ padding: '10px 0', textAlign: 'right', color: '#334155' }}>{toMMK(val, form.currency, form.exchangeRate).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0 0', marginTop: '4px', borderTop: '2px solid #059669', fontWeight: 700, color: '#059669', fontSize: '0.9rem' }}>
                <span>Total Earnings</span>
                <span>{toMMK(form.baseSalary + totalAllowances, form.currency, form.exchangeRate).toLocaleString()} MMK</span>
              </div>
            </div>

            {/* Deductions Section */}
            <div style={{ padding: '16px 32px 16px', borderBottom: '1px solid #e2e8f0' }}>
              <h3 style={{ fontSize: '0.75rem', fontWeight: 600, color: '#dc2626', textTransform: 'uppercase', letterSpacing: '1px', marginTop: 0, marginBottom: '12px' }}>Deductions</h3>
              {totalDeductions > 0 ? (
                <>
                  <table style={{ width: '100%', fontSize: '0.85rem', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                        <th style={{ textAlign: 'left', padding: '8px 0', color: '#64748b', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Description</th>
                        <th style={{ textAlign: 'right', padding: '8px 0', color: '#64748b', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Amount (MMK)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(form.deductions).map(([key, val]) => val > 0 && (
                        <tr key={key} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '10px 0', color: '#475569' }}>{key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}</td>
                          <td style={{ padding: '10px 0', textAlign: 'right', color: '#334155' }}>{toMMK(val, form.currency, form.exchangeRate).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0 0', marginTop: '4px', borderTop: '2px solid #dc2626', fontWeight: 700, color: '#dc2626', fontSize: '0.9rem' }}>
                    <span>Total Deductions</span>
                    <span>{toMMK(totalDeductions, form.currency, form.exchangeRate).toLocaleString()} MMK</span>
                  </div>
                </>
              ) : (
                <p style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '0.85rem', textAlign: 'center', padding: '16px 0' }}>No deductions</p>
              )}
            </div>

            {/* Expense Reimbursements Section */}
            {totalReimbursed > 0 && (
              <div style={{ padding: '16px 32px 16px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
                <h3 style={{ fontSize: '0.75rem', fontWeight: 600, color: '#2563eb', textTransform: 'uppercase', letterSpacing: '1px', marginTop: 0, marginBottom: '12px' }}>
                  Expense Reimbursements (စရိတ် ပြန်အမ်းငွေ)
                </h3>
                <table style={{ width: '100%', fontSize: '0.85rem', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                      <th style={{ textAlign: 'left', padding: '8px 0', color: '#64748b', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Description</th>
                      <th style={{ textAlign: 'right', padding: '8px 0', color: '#64748b', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Amount (MMK)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {form.attachedExpenses.map((exp, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '8px 0', color: '#475569' }}>
                          <span>{exp.description}</span>
                          <span style={{ fontSize: '0.7rem', color: '#94a3b8', marginLeft: '6px' }}>({exp.category})</span>
                        </td>
                        <td style={{ padding: '8px 0', textAlign: 'right', color: '#334155' }}>
                          +{Number(exp.amount).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0 0', marginTop: '4px', borderTop: '2px solid #2563eb', fontWeight: 700, color: '#2563eb', fontSize: '0.9rem' }}>
                  <span>Total Reimbursements</span>
                  <span>+{totalReimbursed.toLocaleString()} MMK</span>
                </div>
              </div>
            )}

            {/* Net Pay */}
            <div style={{ padding: '20px 32px', background: '#eff6ff', borderBottom: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontSize: '1.125rem', fontWeight: 700, color: '#1e293b' }}>Net Pay (Take-Home)</span>
                  {totalReimbursed > 0 && (
                    <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', marginTop: '2px' }}>
                      Salary: {toMMK(form.baseSalary + totalAllowances - totalDeductions, form.currency, form.exchangeRate).toLocaleString()} + Reimbursement: {totalReimbursed.toLocaleString()}
                    </span>
                  )}
                </div>
                <span style={{ fontSize: '1.25rem', fontWeight: 700, color: '#3b82f6' }}>{toMMK(netPay, form.currency, form.exchangeRate).toLocaleString()} MMK</span>
              </div>
            </div>

            {/* Footer */}
            <div style={{ padding: '16px 32px', fontSize: '0.75rem', color: '#94a3b8', textAlign: 'center', background: '#f8fafc' }}>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', marginBottom: '4px' }}>
                {form.paymentChannel && <span>Payment: <span style={{ fontWeight: 500, color: '#64748b' }}>{form.paymentChannel}</span></span>}
                {form.status === 'Paid' && form.paidDate && <span>Paid on: <span style={{ fontWeight: 500, color: '#64748b' }}>{new Date(form.paidDate).toLocaleDateString()}</span></span>}
              </div>
              <p style={{ margin: '4px 0 0' }}>OTAS Tech Solution — Payslip for {MONTHS[form.month - 1]} {form.year}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalaryDetail;
