import React, { useState, useEffect } from 'react';
import { Wallet, AlertTriangle, TrendingUp, CheckCircle, RefreshCw, Sparkles, Bell } from 'lucide-react';
import { BudgetStatus, ForecastItem, SubscriptionItem, api, formatINR } from '../lib/api';

export const BudgetsTab: React.FC = () => {
  const [budgets, setBudgets] = useState<BudgetStatus[]>([]);
  const [forecast, setForecast] = useState<ForecastItem[]>([]);
  const [subscriptions, setSubscriptions] = useState<SubscriptionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [newLimit, setNewLimit] = useState('');

  const fetchData = () => {
    setLoading(true);
    Promise.all([api.getBudgets(), api.getForecast(), api.getSubscriptions()])
      .then(([b, f, s]) => {
        setBudgets(b);
        setForecast(f);
        setSubscriptions(s);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSaveBudget = async (category: string) => {
    const val = parseFloat(newLimit);
    if (isNaN(val) || val <= 0) return;
    try {
      await api.updateBudget(category, val);
      setEditingCategory(null);
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn pb-12">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Budgets & Predictive Telemetry
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Linear month-end run rates, overspend alerts, and subscription price hikes.
        </p>
      </div>

      {/* Section 1: Month-End Forecast Alerts */}
      <div className="fintech-card bg-white dark:bg-[#121620] border border-slate-200/70 dark:border-white/5 p-6 shadow-sm">
        <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
          <TrendingUp className="w-4 h-4 text-blue-500" />
          <span>Predictive Month-End Run-Rate Projections</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {forecast.map((fc) => {
            const isOver = fc.status === 'over';
            const isWarn = fc.status === 'warning';

            return (
              <div
                key={fc.category}
                className={`p-4 rounded-2xl border text-xs flex items-start gap-3 ${
                  isOver
                    ? 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/40 text-rose-950 dark:text-rose-100'
                    : isWarn
                    ? 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/40 text-amber-950 dark:text-amber-100'
                    : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200/50 dark:border-white/5 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                  isOver ? 'bg-rose-500/20 text-rose-600' : isWarn ? 'bg-amber-500/20 text-amber-600' : 'bg-emerald-500/20 text-emerald-600'
                }`}>
                  {isOver || isWarn ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                </div>

                <div className="flex-1">
                  <div className="flex items-center justify-between font-bold mb-1">
                    <span>{fc.category}</span>
                    <span>Projected: {formatINR(fc.projected)} ({fc.pct_projected}%)</span>
                  </div>
                  <p className="opacity-90">{fc.message}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Section 2: Budget vs Actual Bars */}
      <div className="fintech-card bg-white dark:bg-[#121620] border border-slate-200/70 dark:border-white/5 p-6 shadow-sm">
        <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
          <Wallet className="w-4 h-4 text-emerald-500" />
          <span>Category Budgets & Actual Consumption</span>
        </h2>

        <div className="space-y-4">
          {budgets.map((b) => {
            const isOver = b.over;
            const barClass = isOver ? 'striped-bar-red' : b.pct > 75 ? 'striped-bar-amber' : 'striped-bar-green';

            return (
              <div key={b.category} className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40">
                <div className="flex justify-between items-center text-xs mb-1.5">
                  <span className="font-bold text-slate-900 dark:text-white">{b.category}</span>
                  
                  <div className="flex items-center gap-3">
                    <span className="text-slate-500">
                      Actual: <strong className="text-slate-900 dark:text-white">{formatINR(b.actual)}</strong>
                    </span>
                    <span className="text-slate-400">/</span>
                    {editingCategory === b.category ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          value={newLimit}
                          onChange={(e) => setNewLimit(e.target.value)}
                          className="w-20 text-xs px-2 py-0.5 rounded bg-white dark:bg-slate-900 border"
                        />
                        <button
                          onClick={() => handleSaveBudget(b.category)}
                          className="text-[10px] font-bold text-blue-500"
                        >
                          Save
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setEditingCategory(b.category);
                          setNewLimit(b.monthly_limit.toString());
                        }}
                        className="text-slate-600 dark:text-slate-300 font-semibold hover:underline"
                      >
                        Limit: {formatINR(b.monthly_limit)}
                      </button>
                    )}
                    <span className={`font-extrabold text-xs px-2 py-0.5 rounded-full ${
                      isOver ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                    }`}>
                      {b.pct}%
                    </span>
                  </div>
                </div>

                {/* Striped progress bar */}
                <div className="h-3 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${barClass} rounded-full transition-all duration-500`}
                    style={{ width: `${Math.min(b.pct, 100)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Section 3: Subscriptions & Price Hike Alerts */}
      <div className="fintech-card bg-white dark:bg-[#121620] border border-slate-200/70 dark:border-white/5 p-6 shadow-sm">
        <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
          <Bell className="w-4 h-4 text-purple-500" />
          <span>Recurring Subscriptions & Silent Price Hike Detector</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {subscriptions.map((sub) => (
            <div
              key={sub.merchant}
              className={`p-4 rounded-2xl border text-xs flex flex-col justify-between ${
                sub.alert
                  ? 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/50'
                  : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200/50 dark:border-white/5'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-extrabold text-sm text-slate-900 dark:text-white">{sub.merchant}</span>
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
                    {sub.cadence}
                  </span>
                </div>
                <div className="text-xl font-extrabold text-slate-900 dark:text-white mb-1">
                  {formatINR(sub.amount)}
                </div>
                {sub.alert ? (
                  <p className="text-rose-600 dark:text-rose-400 font-semibold text-[11px] mt-1">
                    ⚠️ {sub.alert}
                  </p>
                ) : (
                  <p className="text-slate-400 text-[11px]">Next renewal: {sub.next_expected}</p>
                )}
              </div>

              <div className="pt-3 mt-3 border-t border-slate-200/40 dark:border-white/5 flex justify-between text-[11px] text-slate-400">
                <span>Annual cost</span>
                <span className="font-bold text-slate-700 dark:text-slate-300">{formatINR(sub.annual_cost)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
