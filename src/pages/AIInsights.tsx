import React, { useState, useEffect } from 'react';
import { Brain, ChevronDown, Loader2, TrendingUp, AlertTriangle, CheckCircle2, Target } from 'lucide-react';
import { aiService, clientService } from '../services/api';
import type { Client, AIInsights as AIInsightsType } from '../types';

const PRIORITY_COLORS = {
  high: 'bg-red-50 text-red-700 border-red-200',
  medium: 'bg-amber-50 text-amber-700 border-amber-200',
  low: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

const AIInsights: React.FC = () => {
  const [clientId, setClientId] = useState('');
  const [insights, setInsights] = useState<AIInsightsType | null>(null);
  const [loading, setLoading] = useState(false);
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

  const handleAnalyze = async () => {
    if (!clientId) return;

    setLoading(true);
    setInsights(null);

    try {
      const result = await aiService.analyzeClient(clientId);
      setInsights(result);
    } catch (error) {
      console.error('Error analyzing client:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/60 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center">
            <Brain className="w-5 h-5 text-violet-500" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">AI Client Insights</h2>
            <p className="text-sm text-slate-500">Analyze client data and get actionable recommendations</p>
          </div>
        </div>
      </div>

      {/* Client Selector */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/60 mb-6">
        <h3 className="text-sm font-semibold text-slate-700 mb-3">Select Client</h3>
        <div className="flex gap-3">
          <div className="relative flex-1">
            <select
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="w-full appearance-none px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white pr-10"
            >
              <option value="">Choose a client to analyze...</option>
              {clients.map((c) => (
                <option key={c._id} value={c._id}>{c.companyName}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
          <button
            onClick={handleAnalyze}
            disabled={loading || !clientId}
            className="flex items-center gap-2 px-5 py-2.5 bg-violet-500 text-white rounded-xl font-medium hover:bg-violet-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Brain className="w-4 h-4" />
            )}
            Analyze
          </button>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="bg-white p-10 rounded-2xl shadow-sm border border-slate-200/60 text-center">
          <div className="w-14 h-14 rounded-2xl bg-violet-50 flex items-center justify-center mx-auto mb-4">
            <Loader2 className="w-7 h-7 text-violet-500 animate-spin" />
          </div>
          <p className="text-sm text-slate-500 font-medium">Analyzing client data...</p>
          <p className="text-xs text-slate-400 mt-1">AI is reviewing conversations, status, and history</p>
        </div>
      )}

      {/* Insights */}
      {!loading && insights && (
        <div className="space-y-4">
          {/* Summary */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/60">
            <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
              <Target className="w-4 h-4 text-violet-500" />
              Summary
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">{insights.summary}</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Strengths */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/60">
              <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-500" />
                Strengths
              </h3>
              <ul className="space-y-2">
                {insights.strengths.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                    {s}
                  </li>
                ))}
                {insights.strengths.length === 0 && <p className="text-sm text-slate-400">No strengths identified</p>}
              </ul>
            </div>

            {/* Risks */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/60">
              <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                Risks
              </h3>
              <ul className="space-y-2">
                {insights.risks.map((r, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                    <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                    {r}
                  </li>
                ))}
                {insights.risks.length === 0 && <p className="text-sm text-slate-400">No risks identified</p>}
              </ul>
            </div>
          </div>

          {/* Next Steps */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/60">
            <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
              <Target className="w-4 h-4 text-primary" />
              Recommended Next Steps
            </h3>
            <ol className="space-y-2">
              {insights.nextSteps.map((step, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                  <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                  {step}
                </li>
              ))}
            </ol>
          </div>

          {/* Recommendations */}
          {insights.recommendations.length > 0 && (
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/60">
              <h3 className="text-sm font-semibold text-slate-700 mb-3">Suggested Actions</h3>
              <div className="space-y-2">
                {insights.recommendations.map((rec, i) => (
                  <div key={i} className={`flex items-center justify-between p-3 rounded-xl border ${PRIORITY_COLORS[rec.priority]}`}>
                    <span className="text-sm">{rec.action}</span>
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-white/50 capitalize">{rec.priority}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {!loading && !insights && (
        <div className="bg-white p-10 rounded-2xl shadow-sm border border-slate-200/60 text-center">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <Brain className="w-7 h-7 text-slate-300" />
          </div>
          <p className="text-sm text-slate-500 font-medium">Select a client to analyze</p>
          <p className="text-xs text-slate-400 mt-1">AI will review the client's data and provide insights</p>
        </div>
      )}
    </div>
  );
};

export default AIInsights;
