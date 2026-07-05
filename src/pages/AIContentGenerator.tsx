import React, { useState, useEffect } from 'react';
import { Sparkles, FileText, Mail, ClipboardList, FileSignature, Copy, Check, Loader2, ChevronDown } from 'lucide-react';
import { aiService, clientService } from '../services/api';
import type { Client } from '../types';

const CONTENT_TYPES = [
  { id: 'proposal', label: 'Business Proposal', icon: FileText, description: 'Professional proposal with scope, timeline, and pricing' },
  { id: 'email', label: 'Follow-up Email', icon: Mail, description: 'Professional follow-up email for client communication' },
  { id: 'summary', label: 'Meeting Summary', icon: ClipboardList, description: 'Structured summary with action items and decisions' },
  { id: 'contract', label: 'Contract Terms', icon: FileSignature, description: 'Draft contract terms and conditions' },
];

const AIContentGenerator: React.FC = () => {
  const [selectedType, setSelectedType] = useState('proposal');
  const [clientId, setClientId] = useState('');
  const [context, setContext] = useState('');
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const data = await clientService.getClients();
        setClients(data);
      } catch (error) {
        console.error('Error fetching clients:', error);
      }
    };
    fetchClients();
  }, []);

  const handleGenerate = async () => {
    if (!context.trim() && !clientId) return;

    setLoading(true);
    setOutput('');

    try {
      const result = await aiService.generateContent(selectedType, clientId || undefined, { description: context });
      setOutput(result.content);
    } catch (error) {
      setOutput('Error: Failed to generate content. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const renderContent = (content: string) => {
    return content.split('\n').map((line, i) => {
      if (line.startsWith('**') && line.endsWith('**')) {
        return <h3 key={i} className="text-lg font-bold text-slate-800 mt-4 mb-2">{line.replace(/\*\*/g, '')}</h3>;
      }
      if (line.startsWith('## ')) {
        return <h3 key={i} className="text-lg font-bold text-slate-800 mt-4 mb-2">{line.slice(3)}</h3>;
      }
      if (line.startsWith('# ')) {
        return <h2 key={i} className="text-xl font-bold text-slate-800 mt-5 mb-3">{line.slice(2)}</h2>;
      }
      if (line.startsWith('- ') || line.startsWith('* ')) {
        return <li key={i} className="ml-5 text-slate-600 mb-1">{line.slice(2)}</li>;
      }
      if (/^\d+\./.test(line)) {
        return <li key={i} className="ml-5 text-slate-600 mb-1 list-decimal">{line.replace(/^\d+\.\s*/, '')}</li>;
      }
      if (line.trim() === '') return <br key={i} />;
      return <p key={i} className="text-slate-600 mb-1">{line}</p>;
    });
  };

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/60 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">AI Content Generator</h2>
            <p className="text-sm text-slate-500">Generate professional content for your clients</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel - Controls */}
        <div className="space-y-4">
          {/* Content Type Selector */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/60">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Content Type</h3>
            <div className="space-y-2">
              {CONTENT_TYPES.map((type) => {
                const Icon = type.icon;
                return (
                  <button
                    key={type.id}
                    onClick={() => setSelectedType(type.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all ${
                      selectedType === type.id
                        ? 'bg-primary/10 border-2 border-primary/30'
                        : 'bg-slate-50 border-2 border-transparent hover:border-slate-200'
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                      selectedType === type.id ? 'bg-primary text-white' : 'bg-slate-200 text-slate-500'
                    }`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className={`text-sm font-medium ${selectedType === type.id ? 'text-primary' : 'text-slate-700'}`}>{type.label}</p>
                      <p className="text-xs text-slate-400">{type.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Client Selector */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/60">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Client (Optional)</h3>
            <div className="relative">
              <select
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="w-full appearance-none px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white pr-10"
              >
                <option value="">No client selected</option>
                {clients.map((c) => (
                  <option key={c._id} value={c._id}>{c.companyName}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* Context Input */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/60">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Details / Instructions</h3>
            <textarea
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder={
                selectedType === 'proposal' ? 'Describe the project, services needed, and any specific requirements...'
                : selectedType === 'email' ? 'What is the purpose of this follow-up? Any key points to mention...'
                : selectedType === 'summary' ? 'Paste your meeting notes or describe the discussion...'
                : 'Describe the engagement scope, terms, and conditions...'
              }
              rows={6}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
            />
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={loading || (!context.trim() && !clientId)}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Generate Content
              </>
            )}
          </button>
        </div>

        {/* Right Panel - Output */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 min-h-[500px] flex flex-col">
            {/* Output Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h3 className="text-sm font-semibold text-slate-700">Generated Content</h3>
              {output && (
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              )}
            </div>

            {/* Output Content */}
            <div className="flex-1 p-5">
              {loading ? (
                <div className="flex flex-col items-center justify-center h-full py-20">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                    <Loader2 className="w-6 h-6 text-primary animate-spin" />
                  </div>
                  <p className="text-sm text-slate-500">Generating content...</p>
                  <p className="text-xs text-slate-400 mt-1">This may take a moment</p>
                </div>
              ) : output ? (
                <div className="prose prose-sm max-w-none text-slate-700 leading-relaxed">
                  {renderContent(output)}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full py-20 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                    <FileText className="w-7 h-7 text-slate-300" />
                  </div>
                  <p className="text-sm text-slate-500 font-medium">No content generated yet</p>
                  <p className="text-xs text-slate-400 mt-1 max-w-xs">Select a content type, optionally choose a client, add details, and click Generate</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIContentGenerator;
