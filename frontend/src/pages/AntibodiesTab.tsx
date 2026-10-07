import React, { useState, useEffect } from 'react';
import { Shield, CheckCircle, RefreshCw, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { AntibodyItem, api, formatINR } from '../lib/api';
import { SpotlightCard } from '../components/ui/SpotlightCard';
import { CountUp } from '../components/ui/CountUp';
import { BorderBeam } from '../components/ui/BorderBeam';
import { ShimmerButton } from '../components/ui/ShimmerButton';

interface AntibodiesTabProps {
  onOpenVaccine: () => void;
  onRefresh: () => void;
}

export const AntibodiesTab: React.FC<AntibodiesTabProps> = ({ onOpenVaccine }) => {
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

  const totalHits = data.antibodies.reduce((acc, a) => acc + (a.hits || 0), 0);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-700 dark:text-white font-poppins tracking-tight">
            Financial Immune System
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Learned fraud antibodies auto-blocking incoming attacks, and court-trained whitelisted dampeners.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <ShimmerButton
            onClick={onOpenVaccine}
            className="px-4 py-2.5 bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs rounded-xl shadow-lg shadow-brand-500/25"
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Manage Vaccine Packs</span>
          </ShimmerButton>
        </div>
      </div>

      {/* Summary KPI row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <SpotlightCard className="!p-5">
          <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 block uppercase tracking-wider">
            Active Fraud Antibodies
          </span>
          <span className="text-3xl font-black text-navy-700 dark:text-white mt-1 block font-poppins">
            <CountUp value={data.antibodies.length} />
          </span>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold mt-1 block">
            Auto-blocking identical vector signatures
          </span>
        </SpotlightCard>

        <SpotlightCard className="!p-5">
          <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 block uppercase tracking-wider">
            Attack Invasions Blocked
          </span>
          <span className="text-3xl font-black text-brand-500 dark:text-brand-400 mt-1 block font-poppins">
            <CountUp value={totalHits} suffix=" Hits" />
          </span>
          <span className="text-[11px] text-gray-400 font-semibold mt-1 block">
            Neutralized prior to financial clearance
          </span>
        </SpotlightCard>

        <SpotlightCard className="!p-5">
          <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 block uppercase tracking-wider">
            Whitelisted Patterns
          </span>
          <span className="text-3xl font-black text-navy-700 dark:text-white mt-1 block font-poppins">
            <CountUp value={data.whitelist.length} />
          </span>
          <span className="text-[11px] text-gray-400 font-semibold mt-1 block">
            Confirmed legitimate by user courtroom verdicts
          </span>
        </SpotlightCard>
      </div>

      {/* Section 1: Learned Antibodies */}
      <div>
        <h2 className="text-lg font-extrabold text-navy-700 dark:text-white font-poppins mb-3 flex items-center gap-2">
          <Shield className="w-5 h-5 text-rose-500" />
          <span>Active Neutralizing Antibodies</span>
        </h2>

        {data.antibodies.length === 0 ? (
          <SpotlightCard className="!p-8 text-center text-gray-400">
            <span className="text-xs font-semibold">
              No antibodies synthesized yet. Take an anomaly to court and rule Fraud to generate one!
            </span>
          </SpotlightCard>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {data.antibodies.map((ab, i) => (
              <motion.div
                key={ab.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, duration: 0.3 }}
              >
                <SpotlightCard className="!p-6 flex flex-col justify-between h-full relative group">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold text-rose-600 bg-rose-50 dark:bg-rose-950/70 px-3 py-1 rounded-xl border border-rose-200/50 dark:border-rose-900/40">
                        Antibody #{ab.id}
                      </span>
                      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-lightPrimary dark:bg-navy-700 text-gray-600 dark:text-gray-300">
                        {ab.origin === 'acquired' ? 'Acquired Inoculation' : 'Synthesized in Court'}
                      </span>
                    </div>

                    <p className="text-xs font-extrabold text-navy-700 dark:text-white mb-3">
                      {ab.description}
                    </p>

                    {/* Pattern Signature Pill Box */}
                    <div className="p-3.5 rounded-xl bg-lightPrimary dark:bg-navy-900 text-[11px] font-mono text-gray-700 dark:text-gray-300 space-y-1.5 border border-gray-100 dark:border-white/5">
                      <div><strong className="text-brand-500">Merchant:</strong> {ab.pattern_signature?.merchant || 'Any'}</div>
                      <div><strong className="text-brand-500">Category:</strong> {ab.pattern_signature?.category || 'Any'}</div>
                      <div><strong className="text-brand-500">Amount Band:</strong> {formatINR(ab.pattern_signature?.amount_min || 0)} – {formatINR(ab.pattern_signature?.amount_max || 0)}</div>
                      <div><strong className="text-brand-500">Time Window:</strong> {ab.pattern_signature?.hour_start}:00 – {ab.pattern_signature?.hour_end}:00</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3.5 mt-3.5 border-t border-gray-100 dark:border-white/5 text-xs">
                    <span className="text-gray-400 font-medium">Hits Neutralized</span>
                    <span className="font-black text-rose-600 dark:text-rose-400">
                      {ab.hits} attacks blocked
                    </span>
                  </div>
                </SpotlightCard>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Section 2: Whitelisted Patterns */}
      <div>
        <h2 className="text-lg font-extrabold text-navy-700 dark:text-white font-poppins mb-3 flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-emerald-500" />
          <span>Whitelisted Safe Patterns (False Alarm Dampeners)</span>
        </h2>

        {data.whitelist.length === 0 ? (
          <SpotlightCard className="!p-8 text-center text-gray-400">
            <span className="text-xs font-semibold">
              No whitelist entries yet. Rule Legit in Court to train the dampener.
            </span>
          </SpotlightCard>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {data.whitelist.map((w, i) => (
              <motion.div
                key={w.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, duration: 0.3 }}
              >
                <SpotlightCard className="!p-5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/70 px-3 py-1 rounded-xl border border-emerald-200/50">
                      Whitelist #{w.id}
                    </span>
                    <span className="text-[10px] text-gray-400">{w.created_at?.slice(0, 10)}</span>
                  </div>
                  <p className="text-xs font-bold text-navy-700 dark:text-white mb-2">
                    {w.description}
                  </p>
                  <div className="text-[11px] text-gray-500 dark:text-gray-400">
                    Dampens anomaly detector confidence by 70% to prevent repeated false alarms.
                  </div>
                </SpotlightCard>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
