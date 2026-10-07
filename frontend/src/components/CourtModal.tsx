import React, { useState, useEffect } from 'react';
import { X, Scale, Shield, CheckCircle, RefreshCw, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AnomalyDetail, CourtDebate, api, formatINR } from '../lib/api';
import { BorderBeam } from './ui/BorderBeam';

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
        }, 800);
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
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative z-10 bg-white dark:bg-navy-800 w-full max-w-4xl rounded-[28px] border border-slate-200/80 dark:border-white/10 shadow-3xl overflow-hidden flex flex-col max-h-[92vh]"
        >
          <BorderBeam colorFrom="#4318FF" colorTo="#00F0FF" size={320} duration={8} />

          {/* Header */}
          <div className="px-6 py-5 border-b border-gray-100 dark:border-white/5 flex items-center justify-between bg-gray-50/50 dark:bg-navy-900/40">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shadow-md">
                <Scale className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-black text-navy-700 dark:text-white font-poppins">Anomaly Courtroom</h3>
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border border-amber-500/25">
                    Case #{anomaly.id}
                  </span>
                  {debate?.source === 'gemini' && (
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-300 flex items-center gap-1 border border-brand-500/25">
                      <Sparkles className="w-3 h-3 text-brand-500" /> Gemini Multi-Agent
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Presiding Judge Docket: Autonomous Prosecution AI vs Defense AI cross-examination.
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-navy-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-navy-700 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Transaction Metadata Card */}
            <div className="p-4 rounded-2xl bg-lightPrimary dark:bg-navy-900 border border-gray-100 dark:border-white/5 flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="text-xs text-gray-400 block font-semibold uppercase tracking-wider">Merchant & Category</span>
                <span className="text-base font-extrabold text-navy-700 dark:text-white font-poppins">
                  {anomaly.expense.merchant}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400 ml-2 font-medium">
                  ({anomaly.expense.category} · {anomaly.expense.payment_method})
                </span>
              </div>
              <div>
                <span className="text-xs text-gray-400 block font-semibold uppercase tracking-wider">Amount & Timestamp</span>
                <span className="text-xl font-black text-navy-700 dark:text-white font-poppins">
                  {formatINR(anomaly.expense.amount)}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                  {anomaly.expense.date} at {anomaly.expense.time} ({anomaly.expense.location})
                </span>
              </div>
              <div>
                <span className="text-xs text-gray-400 block font-semibold uppercase tracking-wider">Risk Index</span>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-black text-rose-500 font-poppins">
                    {anomaly.risk_score} / 100
                  </span>
                  <span className="text-xs font-bold text-rose-600 bg-rose-50 dark:bg-rose-950/60 px-2.5 py-0.5 rounded-full border border-rose-500/25">
                    {anomaly.severity}
                  </span>
                </div>
              </div>
            </div>

            {/* Live Cross-Examination Feed */}
            <div className="space-y-3.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  Live Judicial Debate Transcript
                </span>
                {loading && (
                  <span className="text-xs text-brand-500 flex items-center gap-1.5 font-semibold">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Synthesizing Arguments...
                  </span>
                )}
              </div>

              {visibleRounds.map((r, i) => {
                const isPros = r.speaker === 'prosecutor';
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: isPros ? -15 : 15 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                    className={`flex gap-3 ${isPros ? 'justify-start' : 'justify-end'}`}
                  >
                    {isPros && (
                      <div className="w-9 h-9 rounded-2xl bg-rose-500/15 text-rose-600 flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
                        ⚖️ P
                      </div>
                    )}

                    <div className={`max-w-[78%] rounded-2xl p-4 text-xs leading-relaxed shadow-sm ${
                      isPros
                        ? 'bg-rose-50/80 dark:bg-rose-950/40 border border-rose-200/60 dark:border-rose-900/40 text-rose-950 dark:text-rose-100'
                        : 'bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-900/40 text-emerald-950 dark:text-emerald-100'
                    }`}>
                      <div className="flex items-center justify-between font-black mb-1.5">
                        <span className={isPros ? 'text-rose-600' : 'text-emerald-600'}>
                          {isPros ? 'Prosecutor (Accusation AI)' : 'Defender (Defense AI)'}
                        </span>
                        <span className="text-[10px] opacity-60">Round {r.round}</span>
                      </div>
                      <p className="font-medium leading-relaxed">{r.text}</p>
                    </div>

                    {!isPros && (
                      <div className="w-9 h-9 rounded-2xl bg-emerald-500/15 text-emerald-600 flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
                        🛡️ D
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>

            {/* Post-Verdict Learning Confirmation Banner */}
            {verdictResult && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-4 rounded-2xl bg-brand-50 dark:bg-brand-950/40 border border-brand-200 dark:border-brand-800/50 text-xs shadow-md"
              >
                <div className="flex items-center gap-2 font-black text-brand-600 dark:text-brand-300 mb-1 text-sm font-poppins">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  <span>Verdict Recorded: {verdictResult.verdict.toUpperCase()}</span>
                </div>
                <p className="text-gray-600 dark:text-gray-300">
                  {verdictResult.note}
                </p>
                <div className="flex items-center gap-5 mt-2 font-bold text-[11px] text-gray-500 dark:text-gray-400">
                  <span>Open Threats: {verdictResult.open_before} → <strong>{verdictResult.open_after}</strong></span>
                  <span>Immunity Score: {verdictResult.immunity_before}% → <strong className="text-emerald-500">{verdictResult.immunity_after}%</strong></span>
                </div>
              </motion.div>
            )}
          </div>

          {/* Footer Actions: Judge Ruling Buttons */}
          <div className="p-6 border-t border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-navy-900/30 flex flex-wrap items-center justify-between gap-4">
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {anomaly.status !== 'open' ? (
                <span>Case closed with verdict: <strong className="uppercase font-bold text-brand-500">{anomaly.status}</strong></span>
              ) : (
                <span>Your ruling trains the self-learning Financial Immune System in real-time.</span>
              )}
            </div>

            {anomaly.status === 'open' && !verdictResult && (
              <div className="flex items-center gap-3">
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  disabled={verdictLoading}
                  onClick={() => handleVerdict('legit')}
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition shadow-md shadow-emerald-600/25 flex items-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Rule Legit (Add to Whitelist)</span>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  disabled={verdictLoading}
                  onClick={() => handleVerdict('fraud')}
                  className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition shadow-md shadow-rose-600/25 flex items-center gap-2"
                >
                  <Shield className="w-4 h-4" />
                  <span>Rule Fraud (Synthesize Antibody)</span>
                </motion.button>
              </div>
            )}

            {(anomaly.status !== 'open' || verdictResult) && (
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl bg-navy-700 dark:bg-white text-white dark:text-navy-900 font-bold text-xs transition shadow-md"
              >
                Close Courtroom
              </motion.button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
