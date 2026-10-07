import React, { useState, useEffect } from 'react';
import { X, Dna, Sparkles, RefreshCw, AlertTriangle } from 'lucide-react';
import { api, SpendDNAData, formatINR } from '../lib/api';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-[#121620] w-full max-w-2xl rounded-[28px] border border-slate-200 dark:border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-white/5 flex items-center justify-between bg-slate-50/60 dark:bg-slate-900/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
              <Dna className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Spend DNA Fingerprint</h3>
                <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                  #{data?.fingerprint || 'e89c204b71'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Mathematical biometric signature of your spending habits and anomaly spikes.
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

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-slate-400">
              <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
              <span className="text-xs">Computing biometric spending radar...</span>
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
                        className="text-slate-200 dark:text-slate-800"
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
                          className="text-slate-200 dark:text-slate-800"
                          strokeWidth="1"
                        />
                      );
                    })}

                    {/* Normal Spending Polygon */}
                    <path
                      d={hourD}
                      fill="rgba(59, 130, 246, 0.2)"
                      stroke="#3B82F6"
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
                  <div className="absolute inset-0 m-auto w-16 h-16 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 flex flex-col items-center justify-center shadow-lg pointer-events-none">
                    <span className="text-[10px] font-bold text-blue-600">DNA</span>
                    <span className="text-[9px] text-slate-400">Baseline</span>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-[11px] text-slate-500 mt-4">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                    <span>Hourly Spending Habit</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                    <span>Anomaly Glitch Spikes</span>
                  </div>
                </div>
              </div>

              {/* Traits Breakdown */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/50 dark:border-white/5">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-2">
                  Biometric Behavior Traits:
                </span>
                <div className="flex flex-wrap gap-2">
                  {(data?.traits || []).map((t, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 text-xs font-semibold border border-blue-200/50 dark:border-blue-900/40"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
