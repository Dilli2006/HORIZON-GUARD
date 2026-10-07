import React from 'react';
import { MoreHorizontal } from 'lucide-react';
import { SummaryData, formatINR } from '../lib/api';

interface DailyTrendChartProps {
  summary: SummaryData;
}

export const DailyTrendChart: React.FC<DailyTrendChartProps> = ({ summary }) => {
  // Use last 14 days of daily points
  const points = (summary.daily || []).slice(-14);
  const maxSpend = Math.max(...points.map((p) => p.total), 3000);

  // Find peak day or highest anomaly day
  const peakPoint = points.reduce((prev, curr) => (curr.total > prev.total ? curr : prev), points[0] || { total: 0 });

  return (
    <div className="fintech-card bg-white dark:bg-[#121620] border border-slate-200/70 dark:border-white/5 p-6 shadow-sm flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400">Daily Spend & Glitch Index</h3>
          <span className="text-xs text-slate-400">Red markers indicate anomaly spikes</span>
        </div>
        <button className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition">
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>

      {/* Step-line visualization inspired by Screenshot 1 & 3 */}
      <div className="relative h-44 w-full flex items-end pt-8 pb-4">
        {/* Step-line Bars with Hairlines */}
        <div className="w-full h-full flex items-end justify-between gap-1 sm:gap-2">
          {points.map((p, idx) => {
            const heightPct = Math.max(12, Math.min(95, Math.round((p.total / maxSpend) * 100)));
            const isAnomalous = p.anomalous;
            const isPeak = p === peakPoint;

            return (
              <div key={p.date} className="flex-1 flex flex-col items-center h-full justify-end group relative">
                {/* Floating Value Pill for Peak or Anomaly */}
                {(isPeak || isAnomalous) && (
                  <div className={`absolute -top-7 px-2 py-0.5 rounded-full text-[10px] font-bold shadow-sm whitespace-nowrap z-10 transition-transform group-hover:scale-110 ${
                    isAnomalous
                      ? 'bg-rose-500 text-white'
                      : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                  }`}>
                    {formatINR(p.total)}
                  </div>
                )}

                {/* Vertical Hairline / Bar Container */}
                <div className="w-full flex flex-col items-center justify-end h-full">
                  {/* Step Line top marker */}
                  <div
                    className={`w-full rounded-t-sm transition-all duration-300 ${
                      isAnomalous
                        ? 'h-1.5 bg-rose-500 ring-4 ring-rose-500/20'
                        : 'h-1 bg-pink-500 dark:bg-pink-400'
                    }`}
                  />
                  
                  {/* Vertical Hairline column fill */}
                  <div
                    className={`w-full transition-all duration-300 border-x ${
                      isAnomalous
                        ? 'bg-rose-500/15 border-rose-500/30'
                        : 'bg-pink-500/10 dark:bg-pink-400/10 border-pink-500/20 dark:border-pink-400/20'
                    }`}
                    style={{ height: `${heightPct}%` }}
                  />
                </div>

                {/* X-axis label */}
                <span className="text-[9px] font-medium text-slate-400 mt-2 block whitespace-nowrap">
                  {p.label.split(' ')[0]}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer legend */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-white/5 text-[11px] text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-pink-500" />
          <span>Normal Baseline</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
          <span className="font-semibold text-rose-500">Anomaly Trigger</span>
        </div>
      </div>
    </div>
  );
};
