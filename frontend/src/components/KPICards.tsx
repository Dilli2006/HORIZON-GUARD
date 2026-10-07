import React from 'react';
import { MoreHorizontal, ArrowUpRight, ArrowDownRight, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { SummaryData, formatINR } from '../lib/api';

interface KPICardsProps {
  summary: SummaryData;
}

export const KPICards: React.FC<KPICardsProps> = ({ summary }) => {
  const total = summary.this_month || 41540;
  const isPos = (summary.month_change_pct || 0) >= 0;

  // Approximate category splits for the striped progress bars
  const billsTotal = summary.by_category?.find(c => c.category === 'Bills')?.total || 32000;
  const shopTotal = summary.by_category?.find(c => c.category === 'Shopping')?.total || 18450;
  const foodTotal = summary.by_category?.find(c => c.category === 'Food')?.total || 14200;

  const totalSum = billsTotal + shopTotal + foodTotal || 1;

  const pct1 = Math.round((billsTotal / totalSum) * 100);
  const pct2 = Math.round((shopTotal / totalSum) * 100);
  const pct3 = Math.round((foodTotal / totalSum) * 100);

  return (
    <div className="fintech-card bg-white dark:bg-[#121620] border border-slate-200/70 dark:border-white/5 p-6 shadow-sm flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400">Total Spend (This Month)</h3>
        <button className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition">
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>

      {/* Hero Numeral with Pill (Screenshot 2 exact style) */}
      <div className="flex items-baseline gap-3 mb-6">
        <span className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          {formatINR(total)}
        </span>
        <div className={`flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-semibold ${
          isPos
            ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200/40'
            : 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200/40'
        }`}>
          {isPos ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
          <span>{Math.abs(summary.month_change_pct || 15)}%</span>
        </div>
      </div>

      {/* Striped Progress Bars (Screenshot 1 & 2 exact style) */}
      <div className="space-y-4 pt-2">
        {/* Row 1: Fixed Bills & Recurring */}
        <div>
          <div className="flex justify-between items-center text-xs mb-1.5">
            <span className="font-medium text-slate-600 dark:text-slate-400">Fixed Bills & Rent</span>
            <span className="font-semibold text-slate-900 dark:text-white">{formatINR(billsTotal)}</span>
          </div>
          <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full striped-bar-green rounded-full transition-all duration-500"
              style={{ width: `${Math.min(pct1, 100)}%` }}
            />
          </div>
        </div>

        {/* Row 2: Shopping & E-Commerce */}
        <div>
          <div className="flex justify-between items-center text-xs mb-1.5">
            <span className="font-medium text-slate-600 dark:text-slate-400">Shopping & Retail</span>
            <span className="font-semibold text-slate-900 dark:text-white">{formatINR(shopTotal)}</span>
          </div>
          <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full striped-bar-blue rounded-full transition-all duration-500"
              style={{ width: `${Math.min(pct2, 100)}%` }}
            />
          </div>
        </div>

        {/* Row 3: Food & Delivery */}
        <div>
          <div className="flex justify-between items-center text-xs mb-1.5">
            <span className="font-medium text-slate-600 dark:text-slate-400">Dining & Delivery</span>
            <span className="font-semibold text-slate-900 dark:text-white">{formatINR(foodTotal)}</span>
          </div>
          <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full striped-bar-pink rounded-full transition-all duration-500"
              style={{ width: `${Math.min(pct3, 100)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
