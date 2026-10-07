import React, { useState, useEffect } from 'react';
import { X, Scale, Shield, AlertTriangle, CheckCircle, RefreshCw, Sparkles, HelpCircle } from 'lucide-react';
import { AnomalyDetail, CourtDebate, api, formatINR } from '../lib/api';

interface CourtModalProps {
  anomaly: AnomalyDetail | null;
  onClose: () => void;
  onVerdictRecorded: () => void;
}

export const CourtModal: React.FC<CourtModalProps> = ({ anomaly, onClose, onVerdictRecorded }) => {
  const [debate, setDebate] = useState<CourtDebate | null>(null);
  const [loading, setLoading] = useState(false);
  const [verdictLoading, setVerdictLoading] = useState(false);
  const [currentRoundIndex, setCurrentRoundIndex] = useState(0);
  const [verdictResult, setVerdictResult] = useState<any>(null);

  useEffect(() => {
    if (!anomaly) return;
    setLoading(true);
    setCurrentRoundIndex(0);
    setVerdictResult(null);

    api.getCourtDebate(anomaly.id)
      .then((data) => {
        setDebate(data);
        // Animate in turns
        let cur = 0;
        const interval = setInterval(() => {
          cur += 1;
          setCurrentRoundIndex(cur);
          if (cur >= (data.rounds?.length || 4)) {
            clearInterval(interval);
          }
        }, 900);
      })
      .catch((err) => {
        console.error(err);
      })
      .finally(() => setLoading(false));
  }, [anomaly]);

  if (!anomaly) return null;

  const handleVerdict = async (verdict: 'legit' | 'fraud') => {
    setVerdictLoading(true);
    try {
      const res = await api.recordVerdict(anomaly.id, verdict);
      setVerdictResult(res);
      onVerdictRecorded();
    } catch (err) {
      console.error(err);
    } finally {
      setVerdictLoading(false);
    }
  };

  const visibleRounds = debate?.rounds?.slice(0, currentRoundIndex + 1) || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-[#121620] w-full max-w-4xl rounded-[28px] border border-slate-200 dark:border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-white/5 flex items-center justify-between bg-slate-50/60 dark:bg-slate-900/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Anomaly Courtroom</h3>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400">
                  Case #{anomaly.id}
                </span>
                {debate?.source === 'gemini' && (
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Gemini LLM
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                You are the presiding Judge. Review the arguments and issue your ruling.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Transaction Metadata Card */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-white/5 flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="text-xs text-slate-400 block font-medium">Merchant & Category</span>
              <span className="text-base font-bold text-slate-900 dark:text-white">
                {anomaly.expense.merchant}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 ml-2">
                ({anomaly.expense.category} · {anomaly.expense.payment_method})
              </span>
            </div>
            <div>
              <span className="text-xs text-slate-400 block font-medium">Amount & Timestamp</span>
              <span className="text-xl font-extrabold text-slate-900 dark:text-white">
                {formatINR(anomaly.expense.amount)}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 ml-2">
                {anomaly.expense.date} at {anomaly.expense.time} ({anomaly.expense.location})
              </span>
            </div>
            <div>
              <span className="text-xs text-slate-400 block font-medium">Assigned Risk Score</span>
              <div className="flex items-center gap-2">
                <span className="text-xl font-extrabold text-rose-500">
                  {anomaly.risk_score} / 100
                </span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
                  {anomaly.severity} Severity
                </span>
              </div>
            </div>
          </div>

          {/* Novel Feature: Counterfactual Explanations Box */}
          {anomaly.counterfactuals && anomaly.counterfactuals.length > 0 && (
            <div className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/20 border border-indigo-200/50 dark:border-indigo-800/30">
              <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-700 dark:text-indigo-300 mb-1">
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Explainable AI Counterfactual: What would make this transaction legitimate?</span>
              </div>
              <ul className="list-disc list-inside text-xs text-slate-600 dark:text-slate-300 space-y-1">
                {anomaly.counterfactuals.map((cf, i) => (
                  <li key={i}>{cf}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Risk Score Waterfall Bar (Novel Feature) */}
          {anomaly.contributions && anomaly.contributions.length > 0 && (
            <div>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-2">
                Risk Score Waterfall Contributions:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {anomaly.contributions.map((c, i) => (
                  <div key={i} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/50 dark:border-white/5 text-xs">
                    <div className="flex justify-between font-bold mb-1">
                      <span className="text-slate-700 dark:text-slate-300">{c.label}</span>
                      <span className="text-rose-500">+{c.score} pts</span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">{c.reason}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Animated Court Debate Rounds */}
          <div className="space-y-4 pt-2">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>Courtroom Arguments</span>
              {loading && <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-500" />}
            </h4>

            {visibleRounds.map((r, i) => {
              const isProsecutor = r.speaker === 'prosecutor';
              return (
                <div
                  key={i}
                  className={`flex gap-3 animate-slideUp ${isProsecutor ? 'justify-start' : 'justify-end'}`}
                >
                  {isProsecutor && (
                    <div className="w-9 h-9 rounded-2xl bg-rose-500/15 text-rose-600 flex items-center justify-center font-bold text-xs shrink-0">
                      ⚖️ P
                    </div>
                  )}

                  <div className={`max-w-[78%] p-4 rounded-2xl text-xs leading-relaxed ${
                    isProsecutor
                      ? 'bg-rose-50/80 dark:bg-rose-950/30 text-rose-950 dark:text-rose-200 border border-rose-200/60 dark:border-rose-800/40'
                      : 'bg-emerald-50/80 dark:bg-emerald-950/30 text-emerald-950 dark:text-emerald-200 border border-emerald-200/60 dark:border-emerald-800/40'
                  }`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold uppercase tracking-wider text-[10px]">
                        {isProsecutor ? 'Prosecution (Fraud Hypothesis)' : 'Defense (Legitimate Hypothesis)'}
                      </span>
                      <span className="text-[10px] opacity-75">Round {r.round}</span>
                    </div>
                    <p>{r.text}</p>
                  </div>

                  {!isProsecutor && (
                    <div className="w-9 h-9 rounded-2xl bg-emerald-500/15 text-emerald-600 flex items-center justify-center font-bold text-xs shrink-0">
                      🛡️ D
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Post-Verdict Learning Confirmation Banner */}
          {verdictResult && (
            <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/50 text-xs">
              <div className="flex items-center gap-2 font-bold text-blue-700 dark:text-blue-300 mb-1">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                <span>Verdict Recorded: {verdictResult.verdict.toUpperCase()}</span>
              </div>
              <p className="text-slate-600 dark:text-slate-300">
                {verdictResult.note}
              </p>
              <div className="flex items-center gap-4 mt-2 font-medium text-[11px] text-slate-500 dark:text-slate-400">
                <span>Open Anomalies: {verdictResult.open_before} → <strong>{verdictResult.open_after}</strong></span>
                <span>Immunity Score: {verdictResult.immunity_before}% → <strong className="text-emerald-500">{verdictResult.immunity_after}%</strong></span>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions: Judge Ruling Buttons */}
        <div className="p-6 border-t border-slate-100 dark:border-white/5 bg-slate-50/40 dark:bg-slate-900/20 flex flex-wrap items-center justify-between gap-4">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            {anomaly.status !== 'open' ? (
              <span>Case closed with verdict: <strong className="uppercase">{anomaly.status}</strong></span>
            ) : (
              <span>Your decision trains the self-learning Financial Immune System.</span>
            )}
          </div>

          {anomaly.status === 'open' && !verdictResult && (
            <div className="flex items-center gap-3">
              <button
                disabled={verdictLoading}
                onClick={() => handleVerdict('legit')}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition shadow-sm flex items-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Rule Legit (Add to Whitelist)</span>
              </button>

              <button
                disabled={verdictLoading}
                onClick={() => handleVerdict('fraud')}
                className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition shadow-sm flex items-center gap-2"
              >
                <Shield className="w-4 h-4" />
                <span>Rule Fraud (Generate Antibody)</span>
              </button>
            </div>
          )}

          {(anomaly.status !== 'open' || verdictResult) && (
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs transition"
            >
              Close Courtroom
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
