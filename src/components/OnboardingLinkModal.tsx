import React, { useState, useEffect } from 'react';
import { X, Link2, Check, Clock, Copy, Send } from 'lucide-react';
import { onboardingService } from '../services/api';
import type { ServiceType } from '../types';

interface OnboardingLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientId: string;
  clientName: string;
  initialServices?: string[];
}

const SERVICE_OPTIONS: { value: ServiceType; label: string }[] = [
  { value: 'pos', label: 'Customize POS Software' },
  { value: 'ai_agent', label: 'AI Sales & CS Agent' },
  { value: 'erp', label: 'ERP Development' },
  { value: 'ecommerce', label: 'E-commerce Application' },
  { value: 'software', label: 'Customize Software' },
];

const OnboardingLinkModal: React.FC<OnboardingLinkModalProps> = ({
  isOpen,
  onClose,
  clientId,
  clientName,
  initialServices = [],
}) => {
  const [selectedServices, setSelectedServices] = useState<ServiceType[]>([]);
  const [generatedLink, setGeneratedLink] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSelectedServices(initialServices as ServiceType[]);
      setGeneratedLink('');
      setExpiresAt('');
      setCopied(false);
    }
  }, [isOpen, initialServices]);

  if (!isOpen) return null;

  const toggleService = (value: ServiceType) => {
    setSelectedServices(prev =>
      prev.includes(value) ? prev.filter(s => s !== value) : [...prev, value]
    );
  };

  const handleGenerate = async () => {
    if (selectedServices.length === 0) return;
    setLoading(true);
    try {
      const result = await onboardingService.generateLink(clientId, selectedServices);
      setGeneratedLink(result.link);
      setExpiresAt(result.expiresAt);
    } catch (err) {
      console.error('Failed to generate link', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generatedLink);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = generatedLink;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h3 className="text-lg font-bold text-slate-900">Generate Onboarding Link</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <p className="text-sm text-slate-600 mb-1">
              Client: <span className="font-semibold text-slate-900">{clientName}</span>
            </p>
            <p className="text-xs text-slate-400">Select services for the onboarding form</p>
          </div>

          {!generatedLink ? (
            <>
              <div className="space-y-2">
                {SERVICE_OPTIONS.map(opt => {
                  const checked = selectedServices.includes(opt.value);
                  return (
                    <label
                      key={opt.value}
                      className={`flex items-center gap-3 px-4 py-3 border rounded-xl cursor-pointer transition-all text-sm ${
                        checked ? 'bg-indigo-50 border-indigo-300 text-indigo-700' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleService(opt.value)}
                        className="sr-only"
                      />
                      <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 ${
                        checked ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300'
                      }`}>
                        {checked && (
                          <Check className="w-3.5 h-3.5 text-white" />
                        )}
                      </div>
                      {opt.label}
                    </label>
                  );
                })}
              </div>

              <button
                onClick={handleGenerate}
                disabled={loading || selectedServices.length === 0}
                className="w-full py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm flex items-center justify-center gap-2"
              >
                {loading ? (
                  'Generating...'
                ) : (
                  <>
                    <Link2 className="w-4 h-4" />
                    Generate Link
                  </>
                )}
              </button>
            </>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <Check className="w-5 h-5 text-emerald-600" />
                  <span className="text-sm font-semibold text-emerald-700">Link Generated!</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 bg-white border border-emerald-200 rounded-lg">
                  <Link2 className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="text-sm text-slate-700 truncate flex-1 font-mono">{generatedLink}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Clock className="w-4 h-4" />
                <span>Expires: {new Date(expiresAt).toLocaleString()}</span>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleCopy}
                  className="flex-1 py-3 border border-slate-300 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition-all text-sm flex items-center justify-center gap-2"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Copied!' : 'Copy Link'}
                </button>
                <button
                  onClick={() => {
                    const msg = `Hi ${clientName}, here is your onboarding form link: ${generatedLink}`;
                    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
                  }}
                  className="flex-1 py-3 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition-all text-sm flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  Send via WhatsApp
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OnboardingLinkModal;
