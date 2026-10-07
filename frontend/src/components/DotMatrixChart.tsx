import React from 'react';
import { MoreHorizontal } from 'lucide-react';
import { SummaryData } from '../lib/api';

interface DotMatrixChartProps {
  summary: SummaryData;
}

export const DotMatrixChart: React.FC<DotMatrixChartProps> = ({ summary }) => {
  const weekdayData = summary.weekday || [
    { day: 'Mon', count: 24 },
    { day: 'Tue', count: 32 },
    { day: 'Wed', count: 48 },
    { day: 'Thu', count: 38 },
    { day: 'Fri', count: 44 },
    { day: 'Sat', count: 52 },
    { day: 'Sun', count: 31 },
  ];

  // Find peak day
  const peak = weekdayData.reduce((prev, curr) => (curr.count > prev.count ? curr : prev), weekdayData[0]);
  const maxCount = Math.max(...weekdayData.map(d => d.count), 1);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Card 1: Transactions Matrix (Screenshot 1 & 3 style) */}
      <div className="fintech-card bg-white dark:bg-[#121620] border border-slate-200/70 dark:border-white/5 p-6 shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400">Transactions Volume</h3>
          <button className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition">
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center justify-between my-2">
          <div>
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {summary.transactions}
            </span>
            <span className="text-xs text-slate-400 block">Total Processed</span>
          </div>

          {/* Peak Badge */}
          <div className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200/40 shadow-sm">
            Peak: <strong>{peak?.day || 'Wed'}</strong>
          </div>
        </div>

        {/* Dot Matrix Histogram (Exact match to Screenshot 1 & 3) */}
        <div className="flex items-end justify-between gap-2 h-20 pt-4">
          {weekdayData.map((d) => {
            const isPeak = d.day === peak?.day;
            const numDots = Math.max(1, Math.min(6, Math.round((d.count / maxCount) * 6)));

            return (
              <div key={d.day} className="flex-1 flex flex-col items-center gap-1">
                {/* Dots stacked vertically */}
                <div className="flex flex-col-reverse gap-1.5 items-center justify-end h-14">
                  {Array.from({ length: 6 }).map((_, dotIdx) => {
                    const isActive = dotIdx < numDots;
                    return (
                      <div
                        key={dotIdx}
                        className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                          isActive
                            ? isPeak
                              ? 'bg-emerald-500 shadow-sm shadow-emerald-500/40'
                              : 'bg-emerald-300 dark:bg-emerald-500/60'
                            : 'bg-slate-100 dark:bg-slate-800'
                        }`}
                      />
                    );
                  })}
                </div>
                <span className="text-[10px] font-semibold text-slate-400 mt-1">{d.day}</span>
              </div>
            );
          })}
        </div>

        <div className="flex justify-between items-center pt-3 mt-1 border-t border-slate-100 dark:border-white/5 text-[11px] text-slate-400">
          <span>vs previous period</span>
          <span className="font-semibold text-slate-700 dark:text-slate-300">+48 transactions</span>
        </div>
      </div>

      {/* Card 2: Threat Load / Anomalies (Customers card style in Screenshot 3) */}
      <div className="fintech-card bg-white dark:bg-[#121620] border border-slate-200/70 dark:border-white/5 p-6 shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400">Open Threats</h3>
          <button className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition">
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center justify-between my-2">
          <div>
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {summary.open_anomalies}
            </span>
            <span className="text-xs text-rose-500 font-semibold block">Under Court Jurisdiction</span>
          </div>

          <div className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200/40 shadow-sm">
            Top: <strong>High Risk</strong>
          </div>
        </div>

        {/* Dot Matrix in Blue / Cyan */}
        <div className="flex items-end justify-between gap-2 h-20 pt-4">
          {['Night', 'Burst', 'Travel', 'Z-Score', '1st-Time', 'Round', 'Dup'].map((detector, idx) => {
            const dots = [5, 3, 2, 6, 4, 2, 4][idx];
            return (
              <div key={detector} className="flex-1 flex flex-col items-center gap-1">
                <div className="flex flex-col-reverse gap-1.5 items-center justify-end h-14">
                  {Array.from({ length: 6 }).map((_, dotIdx) => {
                    const isActive = dotIdx < dots;
                    return (
                      <div
                        key={dotIdx}
                        className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                          isActive
                            ? 'bg-blue-600 dark:bg-blue-500 shadow-sm shadow-blue-500/40'
                            : 'bg-slate-100 dark:bg-slate-800'
                        }`}
                      />
                    );
                  })}
                </div>
                <span className="text-[9px] font-semibold text-slate-400 mt-1 line-clamp-1">{detector}</span>
              </div>
            );
          })}
        </div>

        <div className="flex justify-between items-center pt-3 mt-1 border-t border-slate-100 dark:border-white/5 text-[11px] text-slate-400">
          <span>Active defense efficacy</span>
          <span className="font-semibold text-emerald-600 dark:text-emerald-400">92.4% explainability</span>
        </div>
      </div>
    </div>
  );
};
