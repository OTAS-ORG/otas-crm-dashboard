import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Clock, XCircle, ChevronDown, ChevronUp, Loader2, FileText, ExternalLink } from 'lucide-react';
import { onboardingService } from '../services/api';
import type { Submission } from '../types';

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  Pending: { label: 'Pending', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200', icon: <Clock className="w-4 h-4" /> },
  Verified: { label: 'Verified', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200', icon: <CheckCircle className="w-4 h-4" /> },
  Rejected: { label: 'Rejected', color: 'text-red-700', bg: 'bg-red-50 border-red-200', icon: <XCircle className="w-4 h-4" /> },
};

const Submissions: React.FC = () => {
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    loadSubmissions();
  }, [statusFilter, page]);

  const loadSubmissions = async () => {
    setLoading(true);
    try {
      const result = await onboardingService.getSubmissions({
        status: statusFilter || undefined,
        page,
        limit: 15,
      });
      setSubmissions(result.submissions);
      setTotal(result.total);
      setTotalPages(result.totalPages);
    } catch (err) {
      console.error('Failed to load submissions', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const updated = await onboardingService.updateSubmissionStatus(id, newStatus);
      setSubmissions(prev => prev.map(s => s._id === id ? updated : s));
    } catch (err) {
      console.error('Failed to update status', err);
    }
  };

  const clientName = (sub: Submission) => {
    const c = sub.clientId as any;
    if (typeof c === 'object' && c !== null) return c.companyName || 'Unknown';
    return c || 'Unknown';
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-black text-slate-900">Onboarding Submissions</h1>
              <p className="text-xs text-slate-500">{total} total submission{total !== 1 ? 's' : ''}</p>
            </div>
          </div>

          <div className="flex gap-2">
            {['', 'Pending', 'Verified', 'Rejected'].map(s => (
              <button
                key={s}
                onClick={() => { setStatusFilter(s); setPage(1); }}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  statusFilter === s
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {s || 'All'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
          </div>
        ) : submissions.length === 0 ? (
          <div className="text-center py-20">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 font-medium">No submissions found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {submissions.map(sub => {
              const expanded = expandedId === sub._id;
              const status = STATUS_CONFIG[sub.status] || STATUS_CONFIG.Pending;

              return (
                <div key={sub._id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
                  <div
                    className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-slate-50 transition-colors"
                    onClick={() => navigate(`/admin/submissions/${sub._id}`)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <p className="font-bold text-slate-900 text-sm truncate">{clientName(sub)}</p>
                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold ${status.bg} ${status.color}`}>
                          {status.icon}
                          {status.label}
                        </div>
                      </div>
                      <div className="flex items-center gap-4 mt-1">
                        <p className="text-xs text-slate-400">{sub.submittedBy?.name}</p>
                        <p className="text-xs text-slate-400">{new Date(sub.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <select
                        value={sub.status}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => handleStatusChange(sub._id!, e.target.value)}
                        className="px-2 py-1 border border-slate-200 rounded-lg text-xs font-semibold bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                      >
                        <option value="Pending">Pending</option>
                        <option value="Verified">Verified</option>
                        <option value="Rejected">Rejected</option>
                      </select>
                      {expanded ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                    </div>
                  </div>

                  {expanded && (
                    <div className="px-5 pb-5 pt-2 border-t border-slate-100">
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {Object.entries(sub.formData || {}).map(([key, value]) => {
                          if (value === null || value === undefined || value === '') return null;

                          // Array of objects (repeater)
                          if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'object') {
                            return (
                              <div key={key} className="col-span-2 md:col-span-3 space-y-2">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                                <div className="space-y-2">
                                  {value.map((item: any, i: number) => (
                                    <div key={i} className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                                      <p className="text-[10px] font-bold text-indigo-500 uppercase mb-2">#{i + 1}</p>
                                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                        {Object.entries(item).map(([k, v]) => (
                                          <div key={k} className="space-y-0.5">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase">{k.replace(/([A-Z])/g, ' $1').trim()}</p>
                                            <p className="text-xs text-slate-700">{String(v)}</p>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          }

                          // Array of strings (checkbox / file URLs)
                          if (Array.isArray(value) && value.length > 0) {
                            const isFiles = typeof value[0] === 'string' && (value[0].startsWith('http') || value[0].includes('/'));
                            return (
                              <div key={key} className="space-y-1">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                                {isFiles ? (
                                  <div className="flex flex-col gap-1">
                                    {value.map((url: string, i: number) => (
                                      <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-medium truncate max-w-xs">
                                        <ExternalLink className="w-3 h-3 shrink-0" />
                                        {url.split('/').pop() || 'File'}
                                      </a>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="flex flex-wrap gap-1">
                                    {value.map((v: string, i: number) => (
                                      <span key={i} className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded text-xs font-medium border border-indigo-100">
                                        {v}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          }

                          // String / Number / Boolean
                          return (
                            <div key={key} className="space-y-1">
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                              <p className="text-sm text-slate-700 font-medium break-words">{String(value)}</p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-4">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(p => p - 1)}
                  className="px-3 py-1.5 text-sm font-semibold text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-30"
                >
                  Prev
                </button>
                <span className="text-sm text-slate-500">Page {page} of {totalPages}</span>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage(p => p + 1)}
                  className="px-3 py-1.5 text-sm font-semibold text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-30"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Submissions;
