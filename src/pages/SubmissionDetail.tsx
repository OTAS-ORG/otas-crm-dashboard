import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Loader2, CheckCircle, Clock, XCircle, ExternalLink,
  Download, FileText, Image as ImageIcon, X, ChevronDown, ChevronUp
} from 'lucide-react';
import { onboardingService } from '../services/api';
import { downloadAsImage, downloadAsPDF } from '../utils/export';
import type { Submission } from '../types';

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  Pending: { label: 'Pending', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200', icon: <Clock className="w-4 h-4" /> },
  Verified: { label: 'Verified', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200', icon: <CheckCircle className="w-4 h-4" /> },
  Rejected: { label: 'Rejected', color: 'text-red-700', bg: 'bg-red-50 border-red-200', icon: <XCircle className="w-4 h-4" /> },
};

const SubmissionDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [expandedRepeater, setExpandedRepeater] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (id) loadSubmission(id);
  }, [id]);

  const loadSubmission = async (submissionId: string) => {
    setLoading(true);
    try {
      const data = await onboardingService.getSubmission(submissionId);
      setSubmission(data);
    } catch (err) {
      console.error('Failed to load submission', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!submission?._id) return;
    try {
      const updated = await onboardingService.updateSubmissionStatus(submission._id, newStatus);
      setSubmission(updated);
    } catch (err) {
      console.error('Failed to update status', err);
    }
  };

  const clientName = () => {
    const c = submission?.clientId as any;
    if (typeof c === 'object' && c !== null) return c.companyName || 'Unknown';
    return c || 'Unknown';
  };

  const clientContact = () => {
    const c = submission?.clientId as any;
    if (typeof c === 'object' && c !== null) return c.contactPerson || '';
    return '';
  };

  const isImageUrl = (url: string): boolean => {
    return /\.(jpg|jpeg|png|gif|webp|svg|bmp)(\?.*)?$/i.test(url);
  };

  const downloadFile = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch {
      window.open(url, '_blank');
    }
  };

  const handleExportPNG = async () => {
    setDownloading(true);
    await downloadAsImage('submission-detail', `submission-${id}`);
    setDownloading(false);
  };

  const handleExportPDF = async () => {
    setDownloading(true);
    await downloadAsPDF('submission-detail', `submission-${id}`);
    setDownloading(false);
  };

  const toggleRepeater = (key: string) => {
    setExpandedRepeater(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const formatKey = (key: string) => key.replace(/([A-Z])/g, ' $1').trim();

  const renderFieldValue = (key: string, value: any): React.ReactNode => {
    if (value === null || value === undefined || value === '') return null;

    // Array of objects (repeater)
    if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'object') {
      const isExpanded = expandedRepeater[key] !== false;
      return (
        <div key={key} className="space-y-3">
          <button
            onClick={() => toggleRepeater(key)}
            className="flex items-center gap-2 text-xs font-bold text-indigo-600 uppercase tracking-wide hover:text-indigo-800"
          >
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            {formatKey(key)} ({value.length} items)
          </button>
          {isExpanded && (
            <div className="space-y-3">
              {value.map((item: any, i: number) => (
                <div key={i} className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-[10px] font-bold text-indigo-500 uppercase mb-3">#{i + 1}</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(item).map(([k, v]) => renderFieldValue(k, v))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    // Array of strings (checkbox / file URLs)
    if (Array.isArray(value) && value.length > 0) {
      const hasFileUrls = value.some(v => typeof v === 'string' && (v.startsWith('http') || v.includes('/')));

      if (hasFileUrls) {
        return (
          <div key={key} className="space-y-2">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{formatKey(key)}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {value.map((url: string, i: number) => {
                const filename = url.split('/').pop() || `file-${i}`;
                const isImg = isImageUrl(url);
                return (
                  <div key={i} className="flex items-center gap-3 p-2 bg-white border border-slate-200 rounded-xl">
                    {isImg ? (
                      <div
                        className="w-14 h-14 rounded-lg overflow-hidden bg-slate-100 cursor-pointer shrink-0 hover:opacity-80 transition-opacity"
                        onClick={() => setLightboxUrl(url)}
                      >
                        <img src={url} alt={filename} className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-14 h-14 rounded-lg bg-red-50 flex items-center justify-center shrink-0">
                        <FileText className="w-6 h-6 text-red-500" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-slate-700 truncate">{filename}</p>
                      <div className="flex gap-2 mt-1">
                        <a href={url} target="_blank" rel="noopener noreferrer" className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-0.5">
                          <ExternalLink className="w-3 h-3" /> View
                        </a>
                        <button onClick={() => downloadFile(url, filename)} className="text-[10px] font-bold text-emerald-600 hover:text-emerald-800 flex items-center gap-0.5">
                          <Download className="w-3 h-3" /> Download
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      }

      return (
        <div key={key} className="space-y-1">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{formatKey(key)}</p>
          <div className="flex flex-wrap gap-1.5">
            {value.map((v: string, i: number) => (
              <span key={i} className="px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-semibold border border-indigo-100">
                {v}
              </span>
            ))}
          </div>
        </div>
      );
    }

    // String / Number / Boolean
    return (
      <div key={key} className="space-y-1">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{formatKey(key)}</p>
        <p className="text-sm text-slate-800 font-medium break-words">{String(value)}</p>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-xl shadow-lg text-center">
        <h2 className="text-xl font-bold text-red-600 mb-2">Not Found</h2>
        <p className="text-slate-600 mb-6">Submission not found.</p>
        <button onClick={() => navigate(-1)} className="bg-slate-800 text-white px-6 py-2 rounded-lg hover:bg-slate-700">
          Go Back
        </button>
      </div>
    );
  }

  const status = STATUS_CONFIG[submission.status] || STATUS_CONFIG.Pending;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between max-w-5xl mx-auto">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/admin/submissions')}
              className="flex items-center text-slate-500 hover:text-slate-800 transition-colors font-bold text-sm"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Submissions
            </button>
            <div className="h-6 w-px bg-slate-200" />
            <div>
              <h1 className="text-lg font-black text-slate-900">{clientName()}</h1>
              <p className="text-xs text-slate-500">{clientContact()}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={submission.status}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option value="Pending">Pending</option>
              <option value="Verified">Verified</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Actions Bar */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold ${status.bg} ${status.color}`}>
              {status.icon}
              {status.label}
            </div>
            <span className="text-xs text-slate-400">
              Submitted {new Date(submission.createdAt).toLocaleDateString()} at{' '}
              {new Date(submission.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
            <span className="text-xs text-slate-400">by {submission.submittedBy?.name}</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleExportPNG}
              disabled={downloading}
              className="px-3 py-1.5 border border-slate-200 text-slate-600 text-xs font-semibold rounded-lg hover:bg-slate-50 transition-all flex items-center gap-1.5"
            >
              <ImageIcon className="w-3.5 h-3.5" />
              Download PNG
            </button>
            <button
              onClick={handleExportPDF}
              disabled={downloading}
              className="px-3 py-1.5 border border-slate-200 text-slate-600 text-xs font-semibold rounded-lg hover:bg-slate-50 transition-all flex items-center gap-1.5"
            >
              <FileText className="w-3.5 h-3.5" />
              Download PDF
            </button>
          </div>
        </div>

        {/* Detail Content */}
        <div id="submission-detail" className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          {/* Client Info Header */}
          <div className="bg-gradient-to-r from-[#0F172A] to-[#1E293B] text-white p-6">
            <h2 className="text-lg font-black mb-1">{clientName()}</h2>
            <p className="text-slate-400 text-sm">{clientContact()}</p>
          </div>

          {/* Form Data */}
          <div className="p-6 space-y-8">
            {Object.entries(submission.formData || {}).map(([key, value]) => {
              const rendered = renderFieldValue(key, value);
              if (!rendered) return null;
              return (
                <div key={key} className="space-y-2">
                  {rendered}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Lightbox */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setLightboxUrl(null)}
        >
          <button
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
            onClick={() => setLightboxUrl(null)}
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={lightboxUrl}
            alt="Preview"
            className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            className="absolute bottom-4 right-4 px-4 py-2 bg-white text-slate-900 text-sm font-semibold rounded-xl hover:bg-slate-100 transition-colors flex items-center gap-2"
            onClick={(e) => {
              e.stopPropagation();
              downloadFile(lightboxUrl, lightboxUrl.split('/').pop() || 'image');
            }}
          >
            <Download className="w-4 h-4" />
            Download
          </button>
        </div>
      )}
    </div>
  );
};

export default SubmissionDetail;
