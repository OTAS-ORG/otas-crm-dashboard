import React, { useState, useEffect, useRef } from 'react';
import {
  Plus, Save, Loader2, CheckCircle, Settings2, Copy, Trash2,
  Download, Upload, Eye, X
} from 'lucide-react';
import { onboardingService } from '../services/api';
import FormSectionEditor from '../components/FormSectionEditor';
import FormBuilderPreview from '../components/FormBuilderPreview';
import type { OnboardingFormConfig, FormSection } from '../types';

const FormBuilder: React.FC = () => {
  const [configs, setConfigs] = useState<OnboardingFormConfig[]>([]);
  const [selectedType, setSelectedType] = useState('');
  const [currentConfig, setCurrentConfig] = useState<OnboardingFormConfig | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showCloneModal, setShowCloneModal] = useState(false);
  const [cloneName, setCloneName] = useState('');
  const [cloneType, setCloneType] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);
  const [importText, setImportText] = useState('');
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [newServiceType, setNewServiceType] = useState('');
  const [newServiceName, setNewServiceName] = useState('');
  const [showNewService, setShowNewService] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadConfigs();
  }, []);

  useEffect(() => {
    const found = configs.find(c => c.serviceType === selectedType);
    setCurrentConfig(found || null);
    setSaved(false);
  }, [selectedType, configs]);

  const loadConfigs = async () => {
    setLoading(true);
    try {
      const data = await onboardingService.getConfigs();
      setConfigs(data);
      if (data.length > 0 && !selectedType) {
        setSelectedType(data[0].serviceType);
      }
    } catch (err) {
      console.error('Failed to load configs', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!currentConfig) return;
    setSaving(true);
    try {
      const updated = await onboardingService.updateConfig(currentConfig.serviceType, {
        sections: currentConfig.sections,
        serviceName: currentConfig.serviceName,
      });
      setConfigs(prev => prev.map(c => c.serviceType === updated.serviceType ? updated : c));
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error('Failed to save config', err);
    } finally {
      setSaving(false);
    }
  };

  const addSection = () => {
    if (!currentConfig) return;
    const newSection: FormSection = {
      title: `Section ${currentConfig.sections.length + 1}`,
      description: '',
      fields: [],
    };
    setCurrentConfig({ ...currentConfig, sections: [...currentConfig.sections, newSection] });
  };

  const updateSection = (index: number, updated: FormSection) => {
    if (!currentConfig) return;
    const sections = [...currentConfig.sections];
    sections[index] = updated;
    setCurrentConfig({ ...currentConfig, sections });
  };

  const removeSection = (index: number) => {
    if (!currentConfig) return;
    setCurrentConfig({ ...currentConfig, sections: currentConfig.sections.filter((_, i) => i !== index) });
  };

  const moveSection = (from: number, to: number) => {
    if (!currentConfig) return;
    if (to < 0 || to >= currentConfig.sections.length) return;
    const sections = [...currentConfig.sections];
    const [moved] = sections.splice(from, 1);
    sections.splice(to, 0, moved);
    setCurrentConfig({ ...currentConfig, sections });
  };

  const moveField = (sectionIndex: number, from: number, to: number) => {
    if (!currentConfig) return;
    if (to < 0 || to >= currentConfig.sections[sectionIndex].fields.length) return;
    const sections = [...currentConfig.sections];
    const fields = [...sections[sectionIndex].fields];
    const [moved] = fields.splice(from, 1);
    fields.splice(to, 0, moved);
    sections[sectionIndex] = { ...sections[sectionIndex], fields };
    setCurrentConfig({ ...currentConfig, sections });
  };

  const handleClone = async () => {
    if (!currentConfig || !cloneType || !cloneName) return;
    try {
      const cloned = await onboardingService.cloneConfig(currentConfig.serviceType, cloneType, cloneName);
      setConfigs(prev => [...prev, cloned]);
      setShowCloneModal(false);
      setCloneName('');
      setCloneType('');
      setSelectedType(cloned.serviceType);
    } catch (err) {
      console.error('Failed to clone', err);
    }
  };

  const handleExport = async (serviceType: string) => {
    try {
      const data = await onboardingService.exportConfig(serviceType);
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `form-config-${serviceType}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export', err);
    }
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setImportText(ev.target?.result as string);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleImport = async () => {
    try {
      const parsed = JSON.parse(importText);
      const imported = await onboardingService.importConfig(parsed, true);
      setConfigs(prev => {
        const existing = prev.findIndex(c => c.serviceType === imported.serviceType);
        if (existing >= 0) {
          const next = [...prev];
          next[existing] = imported;
          return next;
        }
        return [...prev, imported];
      });
      setShowImportModal(false);
      setImportText('');
      setSelectedType(imported.serviceType);
    } catch (err) {
      console.error('Failed to import', err);
    }
  };

  const handleDelete = async (serviceType: string) => {
    if (serviceType === 'general') return;
    if (!confirm(`Delete config for "${serviceType}"?`)) return;
    try {
      await onboardingService.deleteConfig(serviceType);
      setConfigs(prev => prev.filter(c => c.serviceType !== serviceType));
      if (selectedType === serviceType) {
        setSelectedType(configs[0]?.serviceType || '');
      }
    } catch (err) {
      console.error('Failed to delete', err);
    }
  };

  const handleAddService = async () => {
    if (!newServiceType || !newServiceName) return;
    try {
      const created = await onboardingService.updateConfig(newServiceType, {
        sections: [],
        serviceName: newServiceName,
      });
      setConfigs(prev => [...prev, created]);
      setShowNewService(false);
      setNewServiceType('');
      setNewServiceName('');
      setSelectedType(created.serviceType);
    } catch (err) {
      console.error('Failed to create service type', err);
    }
  };

  const allFieldNames = currentConfig?.sections.flatMap(s => s.fields.map(f => f.name)) || [];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600">
              <Settings2 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-black text-slate-900">Form Builder</h1>
              <p className="text-xs text-slate-500">Configure onboarding forms per service type</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowNewService(true)}
              className="px-3 py-2 border border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition-all text-sm flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              New Type
            </button>
            <button
              onClick={() => setShowImportModal(true)}
              className="px-3 py-2 border border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition-all text-sm flex items-center gap-1.5"
            >
              <Upload className="w-4 h-4" />
              Import
            </button>
            <button
              onClick={handleSave}
              disabled={!currentConfig || saving}
              className="px-5 py-2 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-all text-sm flex items-center gap-2"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : saved ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {saved ? 'Saved!' : 'Save'}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex gap-3 mb-6 overflow-x-auto pb-2">
          {configs.map(cfg => (
            <div key={cfg.serviceType} className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => setSelectedType(cfg.serviceType)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
                  selectedType === cfg.serviceType
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {cfg.serviceName}
              </button>
              {selectedType === cfg.serviceType && (
                <div className="flex items-center gap-0.5">
                  <button
                    onClick={() => handleExport(cfg.serviceType)}
                    title="Export"
                    className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                  {cfg.serviceType !== 'general' && (
                    <button
                      onClick={() => handleDelete(cfg.serviceType)}
                      title="Delete"
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {currentConfig ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Service Name</label>
                    <input
                      value={currentConfig.serviceName}
                      onChange={(e) => setCurrentConfig({ ...currentConfig, serviceName: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                  <div className="pt-5">
                    <span className="text-xs text-slate-400 font-mono">{currentConfig.serviceType}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowCloneModal(true)}
                    className="px-3 py-1.5 border border-slate-200 text-slate-600 text-xs font-semibold rounded-lg hover:bg-slate-50 transition-all flex items-center gap-1"
                  >
                    <Copy className="w-3 h-3" />
                    Clone
                  </button>
                  <button
                    onClick={() => handleExport(currentConfig.serviceType)}
                    className="px-3 py-1.5 border border-slate-200 text-slate-600 text-xs font-semibold rounded-lg hover:bg-slate-50 transition-all flex items-center gap-1"
                  >
                    <Download className="w-3 h-3" />
                    Export JSON
                  </button>
                  <button
                    onClick={() => setShowPreviewModal(true)}
                    className="px-3 py-1.5 border border-slate-200 text-slate-600 text-xs font-semibold rounded-lg hover:bg-slate-50 transition-all flex items-center gap-1"
                  >
                    <Eye className="w-3 h-3" />
                    Full Preview
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                {currentConfig.sections.map((section, i) => (
                  <FormSectionEditor
                    key={`${selectedType}-${i}`}
                    section={section}
                    sectionIndex={i}
                    onChange={(updated) => updateSection(i, updated)}
                    onRemove={() => removeSection(i)}
                    onMoveUp={() => moveSection(i, i - 1)}
                    onMoveDown={() => moveSection(i, i + 1)}
                    isFirst={i === 0}
                    isLast={i === currentConfig.sections.length - 1}
                    allFieldNames={allFieldNames}
                    onMoveFieldUp={(fi) => moveField(i, fi, fi - 1)}
                    onMoveFieldDown={(fi) => moveField(i, fi, fi + 1)}
                  />
                ))}

                <button
                  onClick={addSection}
                  className="w-full py-4 border-2 border-dashed border-slate-300 text-slate-500 font-semibold rounded-2xl hover:border-indigo-400 hover:text-indigo-600 transition-all text-sm flex items-center justify-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Add Section
                </button>
              </div>
            </div>

            <div className="lg:sticky lg:top-24 lg:self-start">
              <FormBuilderPreview
                serviceName={currentConfig.serviceName}
                sections={currentConfig.sections}
              />
            </div>
          </div>
        ) : (
          <div className="text-center py-20">
            <Settings2 className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 font-medium">Select a service type to configure its form.</p>
          </div>
        )}
      </div>

      {/* Clone Modal */}
      {showCloneModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowCloneModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6 space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Clone Form Config</h3>
            <p className="text-sm text-slate-500">Clone "{currentConfig?.serviceName}" as a starting point</p>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">New Service Type (key)</label>
              <input
                value={cloneType}
                onChange={(e) => setCloneType(e.target.value.replace(/\s+/g, '_').toLowerCase())}
                placeholder="e.g. custom_crm"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Display Name</label>
              <input
                value={cloneName}
                onChange={(e) => setCloneName(e.target.value)}
                placeholder="e.g. Custom CRM Development"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowCloneModal(false)} className="px-4 py-2 text-slate-600 font-semibold rounded-xl hover:bg-slate-50 text-sm">
                Cancel
              </button>
              <button
                onClick={handleClone}
                disabled={!cloneType || !cloneName}
                className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-50 text-sm"
              >
                Clone
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowImportModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 p-6 space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Import Form Config</h3>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">JSON Config File</label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleImportFile}
                className="w-full text-sm text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
              />
            </div>
            {importText && (
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Preview</label>
                <pre className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-600 max-h-40 overflow-auto">
                  {JSON.stringify(JSON.parse(importText), null, 2).slice(0, 500)}...
                </pre>
              </div>
            )}
            <div className="flex gap-3 justify-end">
              <button onClick={() => { setShowImportModal(false); setImportText(''); }} className="px-4 py-2 text-slate-600 font-semibold rounded-xl hover:bg-slate-50 text-sm">
                Cancel
              </button>
              <button
                onClick={handleImport}
                disabled={!importText}
                className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-50 text-sm"
              >
                Import
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Service Type Modal */}
      {showNewService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowNewService(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6 space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Add Service Type</h3>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Service Type (key)</label>
              <input
                value={newServiceType}
                onChange={(e) => setNewServiceType(e.target.value.replace(/\s+/g, '_').toLowerCase())}
                placeholder="e.g. mobile_app"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Display Name</label>
              <input
                value={newServiceName}
                onChange={(e) => setNewServiceName(e.target.value)}
                placeholder="e.g. Mobile App Development"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowNewService(false)} className="px-4 py-2 text-slate-600 font-semibold rounded-xl hover:bg-slate-50 text-sm">
                Cancel
              </button>
              <button
                onClick={handleAddService}
                disabled={!newServiceType || !newServiceName}
                className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-50 text-sm"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full Preview Modal */}
      {showPreviewModal && currentConfig && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowPreviewModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between z-10">
              <h3 className="text-lg font-bold text-slate-900">Form Preview — {currentConfig.serviceName}</h3>
              <button onClick={() => setShowPreviewModal(false)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <FormBuilderPreview serviceName={currentConfig.serviceName} sections={currentConfig.sections} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FormBuilder;
