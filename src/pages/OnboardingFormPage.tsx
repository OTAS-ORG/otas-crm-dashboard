import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { onboardingService } from '../services/api';
import type { OnboardingFormData } from '../types';
import DynamicFormRenderer from '../components/DynamicFormRenderer';
import SaveContinueBanner from '../components/SaveContinueBanner';
import { ShieldCheck, Clock, CheckCircle, AlertTriangle, Building2 } from 'lucide-react';

type PageState = 'loading' | 'form' | 'success' | 'error' | 'expired' | 'submitted';

const OnboardingFormPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const [pageState, setPageState] = useState<PageState>('loading');
  const [formData, setFormData] = useState<OnboardingFormData | null>(null);
  const [formValues, setFormValues] = useState<Record<string, any>>({});
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isDirty = useRef(false);

  useEffect(() => {
    if (!token) return;
    loadForm();
  }, [token]);

  useEffect(() => {
    return () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    };
  }, []);

  const loadForm = async () => {
    try {
      setPageState('loading');
      const data = await onboardingService.getFormData(token!);
      setFormData(data);
      setFormValues(data.savedFormData || {});
      if (data.savedFormData && Object.keys(data.savedFormData).length > 0) {
        isDirty.current = true;
      }
      setPageState('form');
    } catch (err: any) {
      const msg = err.response?.data?.message || '';
      if (msg.includes('expired')) {
        setPageState('expired');
      } else if (msg.includes('already been submitted')) {
        setPageState('submitted');
      } else {
        setError(msg || 'Failed to load form');
        setPageState('error');
      }
    }
  };

  const scheduleAutoSave = useCallback(() => {
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(async () => {
      if (!isDirty.current || !token) return;
      setSaving(true);
      try {
        await onboardingService.saveFormData(token, formValues);
        setLastSaved(new Date());
      } catch (err) {
        console.error('Auto-save failed', err);
      } finally {
        setSaving(false);
      }
    }, 5000);
  }, [token, formValues]);

  const handleFieldChange = (name: string, value: any) => {
    setFormValues(prev => {
      const updated = { ...prev, [name]: value };
      return updated;
    });
    isDirty.current = true;
    scheduleAutoSave();
  };

  const handleManualSave = async () => {
    if (!token) return;
    setSaving(true);
    try {
      await onboardingService.saveFormData(token, formValues);
      setLastSaved(new Date());
    } catch (err: any) {
      console.error('Save failed', err);
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    if (!token) return;
    setSubmitting(true);
    try {
      await onboardingService.submitForm(token, formValues);
      setPageState('success');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (pageState === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mx-auto mb-4" />
          <p className="text-sm text-slate-500">Loading form...</p>
        </div>
      </div>
    );
  }

  if (pageState === 'expired') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center max-w-sm mx-4">
          <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8 text-amber-600" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 mb-2">Link Expired</h1>
          <p className="text-sm text-slate-500">This onboarding link has expired. Please contact OTAS for a new link.</p>
        </div>
      </div>
    );
  }

  if (pageState === 'submitted') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center max-w-sm mx-4">
          <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-indigo-600" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 mb-2">Already Submitted</h1>
          <p className="text-sm text-slate-500">This form has already been completed. Thank you!</p>
        </div>
      </div>
    );
  }

  if (pageState === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center max-w-sm mx-4">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 mb-2">Error</h1>
          <p className="text-sm text-slate-500">{error}</p>
        </div>
      </div>
    );
  }

  if (pageState === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center max-w-sm mx-4">
          <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-emerald-600" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 mb-2">Thank You!</h1>
          <p className="text-sm text-slate-500">Your onboarding information has been submitted successfully. Our team will review it shortly.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-slate-900">OTAS Client Onboarding</h1>
              <p className="text-xs text-slate-500">{formData?.client.companyName}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {saving && (
              <span className="text-xs text-slate-400">Saving...</span>
            )}
            {!saving && lastSaved && (
              <span className="text-xs text-emerald-600">Saved</span>
            )}
            <button
              type="button"
              onClick={handleManualSave}
              disabled={saving || submitting}
              className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Save
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        <SaveContinueBanner link={window.location.href} expiresAt={formData?.expiresAt || ''} />

        <div className="bg-white border border-slate-200 rounded-2xl p-6">
          <h2 className="text-base font-bold text-slate-900 mb-1">Your Information</h2>
          <p className="text-sm text-slate-500 mb-4">Pre-filled from CRM data. Please verify and update if needed.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Company Name</label>
              <input
                type="text"
                value={formValues.companyName || formData?.client.companyName || ''}
                onChange={(e) => handleFieldChange('companyName', e.target.value)}
                className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm bg-slate-50 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Primary Contact</label>
              <input
                type="text"
                value={formValues.contactPerson || formData?.client.contactPerson || ''}
                onChange={(e) => handleFieldChange('contactPerson', e.target.value)}
                className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm bg-slate-50 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Contact Info</label>
              <input
                type="text"
                value={formValues.contactInfo || formData?.client.contactInfo || ''}
                onChange={(e) => handleFieldChange('contactInfo', e.target.value)}
                className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm bg-slate-50 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Email</label>
              <input
                type="email"
                value={formValues.email || formData?.client.email || ''}
                onChange={(e) => handleFieldChange('email', e.target.value)}
                className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm bg-slate-50 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              />
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Building2 className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-900">Selected Services</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {formData?.services.map((s) => (
              <span key={s} className="px-3 py-1.5 text-xs font-semibold bg-indigo-100 text-indigo-700 rounded-full capitalize">
                {s.replace('_', ' ')}
              </span>
            ))}
            {(!formData?.services || formData.services.length === 0) && (
              <span className="text-sm text-slate-400">No services selected</span>
            )}
          </div>
        </div>

        {[...(formData?.formConfigs || [])].sort((a, b) => {
          if (a.serviceType === 'general') return -1;
          if (b.serviceType === 'general') return 1;
          return 0;
        }).map((config) => (
          <div key={config.serviceType}>
            <div className="flex items-center gap-2 mb-3 mt-2">
              <div className="h-px flex-1 bg-slate-200" />
              <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest px-3 py-1 bg-indigo-50 rounded-full border border-indigo-100">
                {config.serviceName}
              </span>
              <div className="h-px flex-1 bg-slate-200" />
            </div>
            <DynamicFormRenderer
              sections={config.sections}
              formData={formValues}
              onChange={handleFieldChange}
              preFilled={{
                companyName: formData?.client.companyName || '',
                contactPerson: formData?.client.contactPerson || '',
                contactInfo: formData?.client.contactInfo || '',
                email: formData?.client.email || '',
              }}
              services={formData?.services || []}
            />
          </div>
        ))}

        <div className="flex gap-3 pb-8">
          <button
            type="button"
            onClick={handleManualSave}
            disabled={saving || submitting}
            className="flex-1 py-3 border border-slate-300 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition-all text-sm"
          >
            {saving ? 'Saving...' : 'Save Progress'}
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving || submitting}
            className="flex-1 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-all text-sm"
          >
            {submitting ? 'Submitting...' : 'Submit'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default OnboardingFormPage;
