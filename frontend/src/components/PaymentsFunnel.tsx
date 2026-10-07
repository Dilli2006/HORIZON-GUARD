import React from 'react';
import { MoreHorizontal, Sparkles, ArrowRight, ShieldCheck, AlertTriangle } from 'lucide-react';
import { SummaryData, formatINR } from '../lib/api';

interface PaymentsFunnelProps {
  summary: SummaryData;
  onExplorePrompt: (prompt: string) => void;
  openCourtForFirstAnomaly?: () => void;
}

export const PaymentsFunnel: React.FC<PaymentsFunnelProps> = ({
  summary,
  onExplorePrompt,
}) => {
  const totalTxns = summary.transactions || 269;
  const flagged = summary.open_anomalies || 33;
  const blocked = summary.antibody_hits || 4;
  const legitimate = Math.max(0, totalTxns - flagged);
  const immuneScore = summary.immunity?.score || 72;

  // Conversion / dropoff calculations
  const normalPct = Math.round((legitimate / totalTxns) * 100);
  const flagPct = Math.round((flagged / totalTxns) * 100);

  const [promptText, setPromptText] = React.useState('');

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && promptText.trim()) {
      onExplorePrompt(promptText);
      setPromptText('');
    }
  };

  const steps = [
    { label: 'Ingested Transactions', count: `${totalTxns}`, volume: formatINR(summary.total_spend), barClass: 'striped-bar-blue', opacity: '100' },
    { label: 'Passed Immunity Gate', count: `${legitimate}`, volume: formatINR(summary.total_spend - summary.amount_at_risk), barClass: 'striped-bar-cyan', opacity: '90' },
    { label: 'Antibody Shielded', count: `${blocked}`, volume: 'Auto-Blocked', barClass: 'striped-bar-green', opacity: '80' },
    { label: 'Flagged Anomalies', count: `${flagged}`, volume: formatINR(summary.amount_at_risk), barClass: 'striped-bar-red', opacity: '70' },
    { label: 'Court Verified', count: `${summary.immunity?.resolved || 0}`, volume: 'Immune Loop', barClass: 'striped-bar-amber', opacity: '60' },
  ];

  return (
    <div className="fintech-card bg-white dark:bg-[#121620] border border-slate-200/70 dark:border-white/5 p-6 shadow-sm flex flex-col justify-between relative overflow-hidden">
      {/* Card Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Financial Immune Shield</h2>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400">
              Active Defense
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Real-time pipeline: Ingestion → Feature Extraction → Hybrid Detectors → Antibody Interception
          </p>
        </div>
        <button className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition">
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>

      {/* 3D Funnel Columns (Reference from Screenshot 1) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-2 pb-6">
        {steps.map((s, idx) => {
          // Heights staggered to recreate the stepped 3D funnel perspective
          const heights = ['h-44', 'h-36', 'h-28', 'h-24', 'h-20'];
          return (
            <div key={s.label} className="flex flex-col justify-end">
              <div className="mb-2">
                <span className="text-[11px] font-medium text-slate-400 dark:text-slate-400 block line-clamp-1">
                  {s.label}
                </span>
                <span className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight block">
                  {s.count}
                </span>
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  {s.volume}
                </span>
              </div>
              
              {/* Stepped Hatched/Striped Funnel Bar */}
              <div className="relative group cursor-pointer">
                <div
                  className={`w-full ${heights[idx]} rounded-2xl ${s.barClass} transition-transform duration-300 group-hover:scale-[1.02] shadow-sm`}
                  style={{ opacity: parseInt(s.opacity) / 100 }}
                />
                
                {/* Floating tooltip badge like in Screenshot 1 */}
                {idx === 2 && (
                  <div className="absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-[10px] font-medium px-2.5 py-1 rounded-full shadow-md border border-slate-100 dark:border-white/10 pointer-events-none">
                    Shielded: <strong className="text-emerald-500 font-bold">{normalPct}% Safe</strong> | At Risk: <strong className="text-rose-500 font-bold">{flagPct}%</strong>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* AI Explorer Prompt Input Bar (Screenshot 1 bottom element) */}
      <div className="mt-4 pt-4 border-t border-slate-100 dark:border-white/5">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-3.5 h-3.5 text-blue-500 animate-pulse" />
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            What would you like to explore next?
          </span>
        </div>
        <div className="relative flex items-center">
          <input
            type="text"
            value={promptText}
            onChange={(e) => setPromptText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything: 'Show 3 AM purchases' or 'How much spent on Food?'"
            className="w-full text-xs py-2.5 pl-3 pr-20 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
          />
          <button
            onClick={() => {
              if (promptText.trim()) {
                onExplorePrompt(promptText);
                setPromptText('');
              }
            }}
            className="absolute right-1.5 px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition flex items-center gap-1"
          >
            Ask <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {/* Quick prompt chips */}
        <div className="flex flex-wrap gap-1.5 mt-2">
          {[
            { label: '/food-spend', query: 'How much did I spend on food this month?' },
            { label: '/3am-impulse', query: 'Show all 3 AM purchases' },
            { label: '/open-anomalies', query: 'What are the top open anomalies?' },
            { label: '/top-merchants', query: 'Which merchants had the highest spending?' },
          ].map((chip) => (
            <button
              key={chip.label}
              onClick={() => onExplorePrompt(chip.query)}
              className="px-2 py-0.5 rounded-lg text-[10px] font-mono font-medium bg-slate-100 dark:bg-slate-800/80 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950/60 dark:hover:text-blue-300 text-slate-600 dark:text-slate-400 transition"
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
