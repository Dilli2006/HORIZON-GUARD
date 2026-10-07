import React, { useState } from 'react';
import { AlertTriangle, Scale, Shield, CheckCircle, RefreshCw, Filter, Sparkles, HelpCircle } from 'lucide-react';
import { AnomalyDetail, api, formatINR } from '../lib/api';

interface AnomaliesTabProps {
  anomalies: AnomalyDetail[];
  onOpenCourt: (anomalyId: number) => void;
  onRefresh: () => void;
}

export const AnomaliesTab: React.FC<AnomaliesTabProps> = ({ anomalies, onOpenCourt, onRefresh }) => {
  const [filterSeverity, setFilterSeverity] = useState('');
  const [filterStatus, setFilterStatus] = useState('open');
  const [detecting, setDetecting] = useState(false);

  const handleRunDetection = async () => {
    setDetecting(true);
    try {
      await api.runDetection();
      onRefresh();
    } catch (e) {
      console.error(e);
    } finally {
      setDetecting(false);
    }
  };

  const filtered = anomalies.filter((a) => {
    if (filterSeverity && a.severity !== filterSeverity) return false;
    if (filterStatus && a.status !== filterStatus) return false;
    return true;
  });

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Explainable Anomaly Feed</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Every flag includes exact detector mathematical contributions and counterfactual resolutions.
          </p>
        </div>

        <button
          onClick={handleRunDetection}
          disabled={detecting}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition shadow-sm"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${detecting ? 'animate-spin' : ''}`} />
          <span>{detecting ? 'Re-running Models...' : 'Re-run Detection Engine'}</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 fintech-card bg-white dark:bg-[#121620] border border-slate-200/70 dark:border-white/5 p-4 shadow-sm">
        {/* Status filters */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-semibold text-slate-400 mr-2">Status:</span>
          {[
            { id: 'open', label: 'Open Docket' },
            { id: 'fraud', label: 'Ruled Fraud' },
            { id: 'legit', label: 'Ruled Legit' },
            { id: '', label: 'All Cases' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                filterStatus === tab.id
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Severity filters */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-semibold text-slate-400 mr-2">Severity:</span>
          {['', 'High', 'Medium', 'Low'].map((sev) => (
            <button
              key={sev}
              onClick={() => setFilterSeverity(sev)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                filterSeverity === sev
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {sev || 'All Levels'}
            </button>
          ))}
        </div>
      </div>

      {/* Anomalies List */}
      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="fintech-card bg-white dark:bg-[#121620] border border-slate-200/70 dark:border-white/5 p-12 text-center text-slate-400">
            <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
            <span className="text-sm font-bold block text-slate-700 dark:text-slate-300">No anomalies in this category</span>
            <span className="text-xs">Your financial immune system is operating smoothly.</span>
          </div>
        ) : (
          filtered.map((a) => {
            const isBlocked = !!a.blocked_by_antibody_id;
            return (
              <div
                key={a.id}
                className="fintech-card bg-white dark:bg-[#121620] border border-slate-200/70 dark:border-white/5 p-6 shadow-sm hover:border-slate-300 dark:hover:border-white/20 transition-all flex flex-col justify-between gap-4"
              >
                {/* Header Row */}
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    {/* Risk Badge */}
                    <div className={`w-12 h-12 rounded-2xl flex flex-col items-center justify-center font-extrabold text-sm shadow-sm ${
                      a.severity === 'High'
                        ? 'bg-rose-500/15 text-rose-600 border border-rose-500/30'
                        : a.severity === 'Medium'
                        ? 'bg-amber-500/15 text-amber-600 border border-amber-500/30'
                        : 'bg-blue-500/15 text-blue-600 border border-blue-500/30'
                    }`}>
                      <span>{a.risk_score}</span>
                      <span className="text-[9px] uppercase tracking-wider font-semibold">Risk</span>
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                          {a.expense.merchant}
                        </h3>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 font-semibold text-slate-600 dark:text-slate-400">
                          {a.expense.category}
                        </span>
                        {isBlocked && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/60 font-bold text-purple-700 dark:text-purple-300 flex items-center gap-1">
                            <Shield className="w-3 h-3" /> Blocked by Antibody #{a.blocked_by_antibody_id}
                          </span>
                        )}
                        {a.status !== 'open' && (
                          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                            a.status === 'fraud'
                              ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
                              : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                          }`}>
                            Ruled {a.status}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {a.expense.date} at {a.expense.time} · {a.expense.location} · {a.expense.payment_method}
                      </p>
                    </div>
                  </div>

                  {/* Amount and Court CTA */}
                  <div className="flex items-center gap-4">
                    <span className="text-xl font-extrabold text-slate-900 dark:text-white">
                      {formatINR(a.expense.amount)}
                    </span>
                    <button
                      onClick={() => onOpenCourt(a.id)}
                      className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 text-white font-bold text-xs transition shadow-sm flex items-center gap-1.5"
                    >
                      <Scale className="w-3.5 h-3.5" />
                      <span>Take to Court</span>
                    </button>
                  </div>
                </div>

                {/* Evidence Reasons */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/50 dark:border-white/5 space-y-1.5 text-xs">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Detector Evidence Findings:
                  </span>
                  {a.reasons.map((r, i) => (
                    <div key={i} className="flex items-start gap-2 text-slate-700 dark:text-slate-300">
                      <span className="text-rose-500 font-bold mt-0.5">•</span>
                      <span>{r}</span>
                    </div>
                  ))}
                </div>

                {/* Counterfactual Explanation Pill */}
                {a.counterfactuals && a.counterfactuals.length > 0 && (
                  <div className="flex items-center gap-2 text-xs text-indigo-700 dark:text-indigo-300 bg-indigo-50/70 dark:bg-indigo-950/30 p-2.5 rounded-xl border border-indigo-200/50 dark:border-indigo-800/30">
                    <HelpCircle className="w-3.5 h-3.5 shrink-0" />
                    <span><strong>Counterfactual:</strong> {a.counterfactuals[0]}</span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
