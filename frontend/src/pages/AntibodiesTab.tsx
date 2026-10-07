import React, { useState, useEffect } from 'react';
import { Shield, Sparkles, CheckCircle, Download, Upload, Zap, Eye, RefreshCw } from 'lucide-react';
import { AntibodyItem, api, formatINR } from '../lib/api';

interface AntibodiesTabProps {
  onOpenVaccine: () => void;
  onRefresh: () => void;
}

export const AntibodiesTab: React.FC<AntibodiesTabProps> = ({ onOpenVaccine, onRefresh }) => {
  const [data, setData] = useState<{ antibodies: AntibodyItem[]; whitelist: any[] }>({
    antibodies: [],
    whitelist: [],
  });
  const [loading, setLoading] = useState(false);

  const fetchAntibodies = () => {
    setLoading(true);
    api.getAntibodies()
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAntibodies();
  }, []);

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Financial Immune System
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Learned fraud antibodies that auto-block incoming attacks, plus whitelisted patterns.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenVaccine}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition shadow-sm"
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Manage Vaccine Packs</span>
          </button>
        </div>
      </div>

      {/* Summary KPI row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="fintech-card bg-white dark:bg-[#121620] border border-slate-200/70 dark:border-white/5 p-5 shadow-sm">
          <span className="text-xs font-semibold text-slate-400 block uppercase">Active Fraud Antibodies</span>
          <span className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1 block">
            {data.antibodies.length}
          </span>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
            Auto-blocking identical vector signatures
          </span>
        </div>

        <div className="fintech-card bg-white dark:bg-[#121620] border border-slate-200/70 dark:border-white/5 p-5 shadow-sm">
          <span className="text-xs font-semibold text-slate-400 block uppercase">Attack Invasions Blocked</span>
          <span className="text-3xl font-extrabold text-blue-600 dark:text-blue-400 mt-1 block">
            {data.antibodies.reduce((acc, a) => acc + (a.hits || 0), 0)} Hits
          </span>
          <span className="text-[11px] text-slate-500 font-medium">
            Neutralized prior to clearance
          </span>
        </div>

        <div className="fintech-card bg-white dark:bg-[#121620] border border-slate-200/70 dark:border-white/5 p-5 shadow-sm">
          <span className="text-xs font-semibold text-slate-400 block uppercase">Whitelisted Patterns</span>
          <span className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1 block">
            {data.whitelist.length}
          </span>
          <span className="text-[11px] text-slate-500 font-medium">
            Confirmed legitimate by User Verdicts
          </span>
        </div>
      </div>

      {/* Section 1: Learned Antibodies */}
      <div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
          <Shield className="w-4 h-4 text-rose-500" />
          <span>Active Neutralizing Antibodies</span>
        </h2>

        {data.antibodies.length === 0 ? (
          <div className="fintech-card bg-white dark:bg-[#121620] border border-slate-200/70 dark:border-white/5 p-8 text-center text-slate-400">
            <span>No antibodies synthesized yet. Take an anomaly to court and rule Fraud to generate one!</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.antibodies.map((ab) => (
              <div
                key={ab.id}
                className="fintech-card bg-white dark:bg-[#121620] border border-slate-200/70 dark:border-white/5 p-5 shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-rose-600 bg-rose-50 dark:bg-rose-950/60 px-2.5 py-1 rounded-xl border border-rose-200/50 dark:border-rose-900/40">
                      Antibody #{ab.id}
                    </span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                      {ab.origin === 'acquired' ? 'Acquired Inoculation' : 'Synthesized in Court'}
                    </span>
                  </div>

                  <p className="text-xs font-bold text-slate-900 dark:text-white mb-2">
                    {ab.description}
                  </p>

                  {/* Pattern Signature Pill Box */}
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-[11px] font-mono text-slate-600 dark:text-slate-300 space-y-1">
                    <div><strong>Merchant:</strong> {ab.pattern_signature?.merchant || 'Any'}</div>
                    <div><strong>Category:</strong> {ab.pattern_signature?.category || 'Any'}</div>
                    <div><strong>Amount Band:</strong> {formatINR(ab.pattern_signature?.amount_min || 0)} – {formatINR(ab.pattern_signature?.amount_max || 0)}</div>
                    <div><strong>Time Window:</strong> {ab.pattern_signature?.hour_start}:00 – {ab.pattern_signature?.hour_end}:00</div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100 dark:border-white/5 text-xs">
                  <span className="text-slate-400">Hits Neutralized</span>
                  <span className="font-extrabold text-rose-600 dark:text-rose-400">
                    {ab.hits} attacks blocked
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Section 2: Whitelisted Patterns */}
      <div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-500" />
          <span>Whitelisted Safe Patterns (False Alarm Dampeners)</span>
        </h2>

        {data.whitelist.length === 0 ? (
          <div className="fintech-card bg-white dark:bg-[#121620] border border-slate-200/70 dark:border-white/5 p-8 text-center text-slate-400">
            <span>No whitelist entries yet. Rule Legit in Court to train the dampener.</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.whitelist.map((w) => (
              <div
                key={w.id}
                className="fintech-card bg-white dark:bg-[#121620] border border-slate-200/70 dark:border-white/5 p-5 shadow-sm"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-xl border border-emerald-200/50">
                    Whitelist #{w.id}
                  </span>
                  <span className="text-[10px] text-slate-400">{w.created_at?.slice(0, 10)}</span>
                </div>
                <p className="text-xs font-semibold text-slate-900 dark:text-white mb-2">
                  {w.description}
                </p>
                <div className="text-[11px] text-slate-500">
                  Dampens risk scores by 70% to prevent recurring false alarms on this pattern.
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
