import React, { useState } from 'react';
import { AlertTriangle, Scale, Shield, CheckCircle, RefreshCw, Sparkles, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AnomalyDetail, api, formatINR } from '../lib/api';
import { SpotlightCard } from '../components/ui/SpotlightCard';
import { BorderBeam } from '../components/ui/BorderBeam';
import { ShimmerButton } from '../components/ui/ShimmerButton';

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
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-700 dark:text-white font-poppins tracking-tight">
            Explainable Anomaly Feed
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Every flag includes exact detector mathematical contributions, SHAP telemetry, and counterfactual resolutions.
          </p>
        </div>

        <ShimmerButton
          onClick={handleRunDetection}
          disabled={detecting}
          className="px-4 py-2.5 bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs rounded-xl shadow-lg shadow-brand-500/25"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${detecting ? 'animate-spin' : ''}`} />
          <span>{detecting ? 'Re-running Models...' : 'Re-run Detection Engine'}</span>
        </ShimmerButton>
      </div>

      {/* Filter Tabs */}
      <SpotlightCard className="!p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Status filters */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-bold text-gray-400 mr-2 uppercase tracking-wide">Status:</span>
            {[
              { id: 'open', label: 'Open Docket' },
              { id: 'fraud', label: 'Ruled Fraud' },
              { id: 'legit', label: 'Ruled Legit' },
              { id: '', label: 'All Cases' },
            ].map((tab) => {
              const isSelected = filterStatus === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setFilterStatus(tab.id)}
                  className={`relative px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                    isSelected
                      ? 'text-white'
                      : 'text-gray-600 dark:text-gray-400 hover:text-navy-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-navy-700/60'
                  }`}
                >
                  {isSelected && (
                    <motion.div
                      layoutId="active-status-pill"
                      className="absolute inset-0 bg-navy-700 dark:bg-white dark:text-navy-900 rounded-xl shadow-md"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                  <span className={`relative z-10 ${isSelected ? 'text-white dark:text-navy-900' : ''}`}>
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Severity filters */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-bold text-gray-400 mr-2 uppercase tracking-wide">Severity:</span>
            {['', 'High', 'Medium', 'Low'].map((sev) => {
              const isSelected = filterSeverity === sev;
              return (
                <button
                  key={sev}
                  onClick={() => setFilterSeverity(sev)}
                  className={`relative px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                    isSelected
                      ? 'text-white'
                      : 'text-gray-600 dark:text-gray-400 hover:text-navy-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-navy-700/60'
                  }`}
                >
                  {isSelected && (
                    <motion.div
                      layoutId="active-sev-pill"
                      className="absolute inset-0 bg-brand-500 rounded-xl shadow-md shadow-brand-500/25"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10">{sev || 'All Levels'}</span>
                </button>
              );
            })}
          </div>
        </div>
      </SpotlightCard>

      {/* Anomalies List */}
      <div className="space-y-4">
        {filtered.length === 0 ? (
          <SpotlightCard className="!p-12 text-center text-gray-400">
            <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
            <span className="text-base font-extrabold block text-navy-700 dark:text-white">
              No anomalies found in this filter
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 block">
              Your financial immune system is operating at maximum integrity.
            </span>
          </SpotlightCard>
        ) : (
          filtered.map((a, idx) => {
            const isBlocked = !!a.blocked_by_antibody_id;
            const isHigh = a.severity === 'High';

            return (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04, duration: 0.3 }}
              >
                <SpotlightCard className="!p-6 relative group overflow-hidden">
                  {/* Subtle BorderBeam on High Severity Threats */}
                  {isHigh && (
                    <BorderBeam
                      colorFrom="#FF0055"
                      colorTo="#FFAA00"
                      size={280}
                      duration={7}
                    />
                  )}

                  {/* Header Row */}
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      {/* Risk Badge */}
                      <motion.div
                        whileHover={{ scale: 1.1, rotate: 4 }}
                        className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center font-extrabold text-sm shadow-md ${
                          a.severity === 'High'
                            ? 'bg-rose-500/15 text-rose-600 border border-rose-500/30 dark:bg-rose-950/40'
                            : a.severity === 'Medium'
                            ? 'bg-amber-500/15 text-amber-600 border border-amber-500/30 dark:bg-amber-950/40'
                            : 'bg-brand-500/15 text-brand-600 border border-brand-500/30 dark:bg-brand-950/40'
                        }`}
                      >
                        <span className="text-base font-poppins">{a.risk_score}</span>
                        <span className="text-[9px] uppercase tracking-wider font-bold">Risk</span>
                      </motion.div>

                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-base font-extrabold text-navy-700 dark:text-white font-poppins group-hover:text-brand-500 transition-colors">
                            {a.expense.merchant}
                          </h3>
                          <span className="text-xs px-2.5 py-0.5 rounded-full bg-lightPrimary dark:bg-navy-700 font-bold text-navy-700 dark:text-white">
                            {a.expense.category}
                          </span>
                          {isBlocked && (
                            <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/70 font-bold text-purple-700 dark:text-purple-300 flex items-center gap-1 border border-purple-500/20">
                              <Shield className="w-3 h-3" /> Blocked by Antibody #{a.blocked_by_antibody_id}
                            </span>
                          )}
                          {a.status !== 'open' && (
                            <span className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full ${
                              a.status === 'fraud'
                                ? 'bg-rose-100 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 border border-rose-500/25'
                                : 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25'
                            }`}>
                              Ruled {a.status}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 mt-1 font-medium">
                          {a.expense.date} at {a.expense.time} · {a.expense.location} · {a.expense.payment_method}
                        </p>
                      </div>
                    </div>

                    {/* Amount and Court CTA */}
                    <div className="flex items-center gap-4">
                      <span className="text-2xl font-black text-navy-700 dark:text-white font-poppins">
                        {formatINR(a.expense.amount)}
                      </span>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => onOpenCourt(a.id)}
                        className="px-4 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs transition shadow-md shadow-brand-500/20 flex items-center gap-1.5"
                      >
                        <Scale className="w-3.5 h-3.5" />
                        <span>Take to Court</span>
                      </motion.button>
                    </div>
                  </div>

                  {/* Evidence Reasons */}
                  <div className="p-4 rounded-2xl bg-lightPrimary dark:bg-navy-900 border border-gray-100 dark:border-white/5 space-y-1.5 text-xs mt-4">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-gray-400 block mb-1">
                      Detector Evidence Findings:
                    </span>
                    {a.reasons.map((r, i) => (
                      <div key={i} className="flex items-start gap-2 text-navy-700 dark:text-gray-200">
                        <span className="text-rose-500 font-bold mt-0.5">•</span>
                        <span>{r}</span>
                      </div>
                    ))}
                  </div>

                  {/* Counterfactual Explanation Pill */}
                  {a.counterfactuals && a.counterfactuals.length > 0 && (
                    <div className="flex items-center gap-2 text-xs text-indigo-700 dark:text-indigo-300 bg-indigo-50/80 dark:bg-indigo-950/40 p-3 rounded-xl border border-indigo-200/50 dark:border-indigo-800/30 mt-3">
                      <HelpCircle className="w-4 h-4 shrink-0 text-brand-500" />
                      <span><strong>Counterfactual:</strong> {a.counterfactuals[0]}</span>
                    </div>
                  )}
                </SpotlightCard>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
};
