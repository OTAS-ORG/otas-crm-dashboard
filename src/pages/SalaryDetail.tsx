import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { salaryService } from '../services/api';
import { ArrowLeft, Save, Printer, Download, Wallet } from 'lucide-react';

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

const SalaryDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = id === 'new';
  const previewRef = useRef<HTMLDivElement>(null);

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(isNew);

  const [form, setForm] = useState({
    employeeName: '',
    employeeId: '',
    position: '',
    dateOfJoining: '',
    department: '',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    baseSalary: 0,
    allowances: { phone: 0, internet: 0, travel: 0, meal: 0, commission: 0 },
    deductions: { unpaidLeave: 0, latePenalty: 0, advanceSalary: 0 },
    currency: 'MMK' as 'MMK' | 'USD',
    exchangeRate: 0,
    status: 'Draft' as 'Draft' | 'Paid',
    paymentChannel: '',
    paidDate: '',
    notes: '',
  });

  const totalAllowances = Object.values(form.allowances).reduce((a, b) => a + b, 0);
  const totalDeductions = Object.values(form.deductions).reduce((a, b) => a + b, 0);
  const netPay = form.baseSalary + totalAllowances - totalDeductions;

  useEffect(() => {
    if (!isNew && id) {
      setLoading(true);
      salaryService.getSalary(id).then((data) => {
        setForm({
          employeeName: data.employeeName,
          employeeId: data.employeeId || '',
          position: data.position || '',
          dateOfJoining: data.dateOfJoining ? data.dateOfJoining.slice(0, 10) : '',
          department: data.department || '',
          month: data.month,
          year: data.year,
          baseSalary: data.baseSalary,
          allowances: data.allowances,
          deductions: data.deductions,
          currency: data.currency,
          exchangeRate: data.exchangeRate,
          status: data.status,
          paymentChannel: data.paymentChannel || '',
          paidDate: data.paidDate ? data.paidDate.slice(0, 10) : '',
          notes: data.notes || '',
        });
        setIsEditing(false);
        setLoading(false);
      }).catch(() => setLoading(false));
    }
  }, [id]);

  const updateAllowance = (key: string, value: string) => {
    setForm({ ...form, allowances: { ...form.allowances, [key]: parseFloat(value) || 0 } });
  };

  const updateDeduction = (key: string, value: string) => {
    setForm({ ...form, deductions: { ...form.deductions, [key]: parseFloat(value) || 0 } });
  };

  const handleSave = async () => {
    if (!form.employeeName.trim()) return;
    try {
      setSaving(true);
      if (isNew) {
        const created = await salaryService.createSalary(form);
        navigate(`/salaries/${created._id}`, { replace: true });
      } else if (id) {
        await salaryService.updateSalary(id, form);
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Error saving salary:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!previewRef.current) return;
    try {
      const html2canvas = (await import('html2canvas-pro')).default;
      const jsPDF = (await import('jspdf')).default;
      const canvas = await html2canvas(previewRef.current, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = 210;
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Payslip_${form.employeeName}_${MONTHS[form.month - 1]}_${form.year}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
    }
  };

  const handleDownloadImage = async () => {
    if (!previewRef.current) return;
    try {
      const html2canvas = (await import('html2canvas-pro')).default;
      const canvas = await html2canvas(previewRef.current, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
      const link = document.createElement('a');
      link.download = `Payslip_${form.employeeName}_${MONTHS[form.month - 1]}_${form.year}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (error) {
      console.error('Error generating image:', error);
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
            <button onClick={() => setIsEditing(true)} className="px-4 py-2 text-sm font-medium text-primary hover:bg-primary/5 rounded-xl transition-colors">Edit</button>
          )}
          {isEditing && (
            <>
              <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-5 py-2 bg-primary text-white text-sm font-medium rounded-xl hover:bg-primary/90 disabled:opacity-50 transition-colors shadow-sm">
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save'}
              </button>
              {!isNew && <button onClick={() => setIsEditing(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-xl transition-colors">Cancel</button>}
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
              <div className="col-span-2"><FormInput isEditing={isEditing} label="Employee Name" value={form.employeeName} onChange={(e: any) => setForm({ ...form, employeeName: e.target.value })} /></div>
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

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="flex justify-between items-center text-lg font-bold">
              <span className="text-slate-800">Net Pay:</span>
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
                  <button onClick={handleDownloadPDF} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
                    <Download className="w-3.5 h-3.5 cursor-pointer" /> PDF
                  </button>
                  <button onClick={handleDownloadImage} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
                    <Printer className="w-3.5 h-3.5 cursor-pointer" /> Image
                  </button>
                </>
              )}
            </div>
          </div>

          <div ref={previewRef} id="payslip-preview" style={{ fontFamily: "'Poppins', sans-serif", width: '100%', minHeight: '500px', background: '#ffffff', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            {/* Header */}
            <div style={{ textAlign: 'center', paddingTop: '2rem', paddingBottom: '1.5rem', paddingLeft: '2rem', paddingRight: '2rem', background: 'linear-gradient(135deg, #0A0F1C 0%, #1a1f2e 100%)' }}>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#ffffff', letterSpacing: '-0.025em', margin: 0 }}>OTAS <span style={{ color: '#0052FF' }}>Tech Solution</span></h1>
              <p style={{ fontSize: '1.125rem', fontWeight: 600, color: '#ffffff', marginTop: '0.5rem', marginBottom: 0 }}>PAYSLIP</p>
              <p style={{ fontSize: '0.875rem', color: '#94a3b8', marginTop: '0.25rem' }}>{MONTHS[form.month - 1]} {form.year}</p>
            </div>

            {/* Employee Info */}
            <div style={{ paddingLeft: '2rem', paddingRight: '2rem', paddingTop: '1.25rem', paddingBottom: '1.25rem', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.875rem' }}>
                <div><span style={{ color: '#64748b' }}>Employee: </span><span style={{ fontWeight: 500, color: '#1e293b' }}>{form.employeeName || '-'}</span></div>
                <div><span style={{ color: '#64748b' }}>ID: </span><span style={{ fontWeight: 500, color: '#1e293b' }}>{form.employeeId || '-'}</span></div>
                <div><span style={{ color: '#64748b' }}>Position: </span><span style={{ fontWeight: 500, color: '#1e293b' }}>{form.position || '-'}</span></div>
                <div><span style={{ color: '#64748b' }}>Department: </span><span style={{ fontWeight: 500, color: '#1e293b' }}>{form.department || '-'}</span></div>
                <div><span style={{ color: '#64748b' }}>Date of Joining: </span><span style={{ fontWeight: 500, color: '#1e293b' }}>{form.dateOfJoining || '-'}</span></div>
              </div>
            </div>

            {/* Earnings Table */}
            <div style={{ paddingLeft: '2rem', paddingRight: '2rem', paddingTop: '1.25rem', paddingBottom: '1.25rem', borderBottom: '1px solid #e2e8f0' }}>
              <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>Earnings</h3>
              <table style={{ width: '100%', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <th style={{ textAlign: 'left', padding: '0.5rem 0', color: '#64748b', fontWeight: 500 }}>Description</th>
                    <th style={{ textAlign: 'right', padding: '0.5rem 0', color: '#64748b', fontWeight: 500 }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td style={{ padding: '0.5rem 0', color: '#334155' }}>Base Salary</td><td style={{ padding: '0.5rem 0', textAlign: 'right', fontWeight: 500, color: '#1e293b' }}>{toMMK(form.baseSalary, form.currency, form.exchangeRate).toLocaleString()}</td></tr>
                  {Object.entries(form.allowances).map(([key, val]) => val > 0 && (
                    <tr key={key}><td style={{ padding: '0.5rem 0', color: '#334155' }}>{key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}</td>
                      <td style={{ padding: '0.5rem 0', textAlign: 'right', color: '#1e293b' }}>{toMMK(val, form.currency, form.exchangeRate).toLocaleString()}</td></tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ borderTop: '1px solid #e2e8f0', fontWeight: 700, color: '#1e293b' }}>
                    <td style={{ padding: '0.5rem 0' }}>Total Earnings</td>
                    <td style={{ padding: '0.5rem 0', textAlign: 'right' }}>{toMMK(form.baseSalary + totalAllowances, form.currency, form.exchangeRate).toLocaleString()}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Deductions Table */}
            <div style={{ paddingLeft: '2rem', paddingRight: '2rem', paddingTop: '1.25rem', paddingBottom: '1.25rem', borderBottom: '1px solid #e2e8f0' }}>
              <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>Deductions</h3>
              <table style={{ width: '100%', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <th style={{ textAlign: 'left', padding: '0.5rem 0', color: '#64748b', fontWeight: 500 }}>Description</th>
                    <th style={{ textAlign: 'right', padding: '0.5rem 0', color: '#64748b', fontWeight: 500 }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(form.deductions).map(([key, val]) => val > 0 && (
                    <tr key={key}><td style={{ padding: '0.5rem 0', color: '#334155' }}>{key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}</td>
                      <td style={{ padding: '0.5rem 0', textAlign: 'right', color: '#1e293b' }}>{toMMK(val, form.currency, form.exchangeRate).toLocaleString()}</td></tr>
                  ))}
                  {totalDeductions === 0 && <tr><td style={{ padding: '0.5rem 0', color: '#94a3b8', fontStyle: 'italic' }} colSpan={2}>No deductions</td></tr>}
                </tbody>
                <tfoot>
                  <tr style={{ borderTop: '1px solid #e2e8f0', fontWeight: 700, color: '#ef4444' }}>
                    <td style={{ padding: '0.5rem 0' }}>Total Deductions</td>
                    <td style={{ padding: '0.5rem 0', textAlign: 'right' }}>{toMMK(totalDeductions, form.currency, form.exchangeRate).toLocaleString()}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Net Pay */}
            <div style={{ paddingLeft: '2rem', paddingRight: '2rem', paddingTop: '1.5rem', paddingBottom: '1.5rem', background: 'linear-gradient(135deg, #0052FF 0%, #003db8 100%)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '1.125rem', fontWeight: 700, color: '#ffffff' }}>NET PAY</span>
                <span style={{ fontSize: '1.5rem', fontWeight: 700, color: '#ffffff' }}>{toMMK(netPay, form.currency, form.exchangeRate).toLocaleString()} MMK</span>
              </div>
            </div>

            {/* Footer */}
            <div style={{ paddingLeft: '2rem', paddingRight: '2rem', paddingTop: '1rem', paddingBottom: '1rem', fontSize: '0.75rem', color: '#94a3b8', textAlign: 'center', borderTop: '1px solid #f1f5f9' }}>
              {form.paymentChannel && <p style={{ marginBottom: '0.25rem' }}>Payment: {form.paymentChannel}</p>}
              {form.status === 'Paid' && form.paidDate && <p>Paid on: {new Date(form.paidDate).toLocaleDateString()}</p>}
              <p style={{ marginTop: '0.25rem' }}>OTAS Tech Solution — Payslip for {MONTHS[form.month - 1]} {form.year}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalaryDetail;
