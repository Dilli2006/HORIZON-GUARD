import React, { useState, useEffect } from 'react';
import { X, Dna, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api, SpendDNAData } from '../lib/api';
import { BorderBeam } from './ui/BorderBeam';

interface SpendDNAModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SpendDNAModal: React.FC<SpendDNAModalProps> = ({ isOpen, onClose }) => {
  const [data, setData] = useState<SpendDNAData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    api.getSpendDNA()
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [isOpen]);

  if (!isOpen) return null;

  // Geometry for Radial SVG Fingerprint
  const size = 320;
  const center = size / 2;
  const radius = 100;

  // Compute 24 radial points for hours
  const hours = data?.hours || Array(24).fill(0.3);
  const hourPathPoints = hours.map((val, i) => {
    const angle = (i / 24) * 2 * Math.PI - Math.PI / 2;
    const r = radius + val * 45;
    const x = center + r * Math.cos(angle);
    const y = center + r * Math.sin(angle);
    return `${x},${y}`;
  });

  const hourD = `M ${hourPathPoints.join(' L ')} Z`;

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
          className="relative z-10 bg-white dark:bg-navy-800 w-full max-w-2xl rounded-[28px] border border-slate-200/80 dark:border-white/10 shadow-3xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          <BorderBeam colorFrom="#4318FF" colorTo="#00F0FF" size={280} duration={7} />

          {/* Header */}
          <div className="px-6 py-5 border-b border-gray-100 dark:border-white/5 flex items-center justify-between bg-gray-50/50 dark:bg-navy-900/40">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-brand-500/10 text-brand-500 flex items-center justify-center">
                <Dna className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-black text-navy-700 dark:text-white font-poppins">Spend DNA Fingerprint</h3>
                  <span className="font-mono text-[10px] px-2.5 py-0.5 rounded-full bg-lightPrimary dark:bg-navy-700 text-brand-500 dark:text-brand-300 font-bold">
                    #{data?.fingerprint || 'e89c204b71'}
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Mathematical biometric signature of your spending patterns and anomaly vectors.
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

          {/* Body */}
          <div className="p-6 overflow-y-auto space-y-6">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-400">
                <RefreshCw className="w-8 h-8 animate-spin text-brand-500" />
                <span className="text-xs font-semibold">Computing biometric spending radar...</span>
              </div>
            ) : (
              <>
                {/* Radial Radar Visual */}
                <div className="flex flex-col items-center justify-center">
                  <div className="relative">
                    <svg width={size} height={size} className="overflow-visible">
                      {/* Concentric baseline circles */}
                      {[40, 70, 100, 130].map((r) => (
                        <circle
                          key={r}
                          cx={center}
                          cy={center}
                          r={r}
                          fill="none"
                          stroke="currentColor"
                          className="text-gray-200 dark:text-navy-700"
                          strokeDasharray={r === 100 ? '4 4' : 'none'}
                          strokeWidth="1"
                        />
                      ))}

                      {/* Radial hour axes */}
                      {Array.from({ length: 8 }).map((_, i) => {
                        const angle = (i / 8) * 2 * Math.PI;
                        const x2 = center + 140 * Math.cos(angle);
                        const y2 = center + 140 * Math.sin(angle);
                        return (
                          <line
                            key={i}
                            x1={center}
                            y1={center}
                            x2={x2}
                            y2={y2}
                            stroke="currentColor"
                            className="text-gray-200 dark:text-navy-700"
                            strokeWidth="1"
                          />
                        );
                      })}

                      {/* Normal Spending Polygon */}
                      <path
                        d={hourD}
                        fill="rgba(67, 24, 255, 0.2)"
                        stroke="#4318FF"
                        strokeWidth="2.5"
                        className="transition-all duration-500"
                      />

                      {/* Anomaly Glitch Spikes (Red projecting nodes) */}
                      {(data?.glitches || []).map((g, i) => {
                        const angle = ((g.hour || 12) / 24) * 2 * Math.PI - Math.PI / 2;
                        const r = radius + 55 + (g.score / 100) * 35;
                        const x = center + r * Math.cos(angle);
                        const y = center + r * Math.sin(angle);

                        return (
                          <g key={i}>
                            <line
                              x1={center}
                              y1={center}
                              x2={x}
                              y2={y}
                              stroke="#EF4444"
                              strokeWidth="1.5"
                              strokeDasharray="2 2"
                              className="animate-pulse"
                            />
                            <circle cx={x} cy={y} r="5" fill="#EF4444" className="animate-ping opacity-75" />
                            <circle cx={x} cy={y} r="4" fill="#EF4444" />
                          </g>
                        );
                      })}
                    </svg>

                    {/* Center Core Badge */}
                    <div className="absolute inset-0 m-auto w-16 h-16 rounded-full bg-white dark:bg-navy-900 border border-gray-200 dark:border-white/10 flex flex-col items-center justify-center shadow-xl pointer-events-none">
                      <span className="text-[10px] font-black text-brand-500">DNA</span>
                      <span className="text-[9px] text-gray-400 font-semibold">Baseline</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-5 text-xs text-gray-500 dark:text-gray-400 mt-4 font-semibold">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-brand-500" />
                      <span>Hourly Spend Baseline</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                      <span>Anomaly Glitch Spikes</span>
                    </div>
                  </div>
                </div>

                {/* Traits Breakdown */}
                <div className="p-4 rounded-2xl bg-lightPrimary dark:bg-navy-900 border border-gray-100 dark:border-white/5">
                  <span className="text-xs font-black uppercase tracking-wider text-navy-700 dark:text-white block mb-2 font-poppins">
                    Biometric Behavior Traits:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {(data?.traits || []).map((t, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1.5 rounded-xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-300 text-xs font-bold border border-brand-200/50 dark:border-brand-800/40 shadow-sm"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
