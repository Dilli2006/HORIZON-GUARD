import React, { useState, useEffect } from 'react';
import { Wallet, AlertTriangle, TrendingUp, CheckCircle, Bell, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import { BudgetStatus, ForecastItem, SubscriptionItem, api, formatINR } from '../lib/api';
import { SpotlightCard } from '../components/ui/SpotlightCard';
import { CountUp } from '../components/ui/CountUp';
import { BorderBeam } from '../components/ui/BorderBeam';
import { ShimmerButton } from '../components/ui/ShimmerButton';

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
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-700 dark:text-white font-poppins tracking-tight">
          Budgets & Predictive Telemetry
        </h1>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
          Linear month-end run rates, overspend alerts, and subscription stealth price hike detectors.
        </p>
      </div>

      {/* Section 1: Month-End Forecast Alerts */}
      <SpotlightCard className="!p-6">
        <h2 className="text-base font-extrabold text-navy-700 dark:text-white font-poppins flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-brand-500" />
          <span>Predictive Month-End Run-Rate Projections</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {forecast.map((fc, i) => {
            const isOver = fc.status === 'over';
            const isWarn = fc.status === 'warning';

            return (
              <motion.div
                key={fc.category}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`p-4 rounded-2xl border text-xs flex items-start gap-3.5 ${
                  isOver
                    ? 'bg-rose-50/80 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/50 text-rose-950 dark:text-rose-100'
                    : isWarn
                    ? 'bg-amber-50/80 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/50 text-amber-950 dark:text-amber-100'
                    : 'bg-lightPrimary dark:bg-navy-900 border-gray-100 dark:border-white/5 text-navy-700 dark:text-gray-300'
                }`}
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                  isOver ? 'bg-rose-500/20 text-rose-600' : isWarn ? 'bg-amber-500/20 text-amber-600' : 'bg-emerald-500/20 text-emerald-600'
                }`}>
                  {isOver || isWarn ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                </div>

                <div className="flex-1">
                  <div className="flex items-center justify-between font-extrabold mb-1">
                    <span className="text-sm font-poppins">{fc.category}</span>
                    <span className="text-xs">
                      Projected: {formatINR(fc.projected)} ({fc.pct_projected}%)
                    </span>
                  </div>
                  <p className="opacity-90 text-[11px] font-medium leading-relaxed">{fc.message}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </SpotlightCard>

      {/* Section 2: Budget vs Actual Bars */}
      <SpotlightCard className="!p-6">
        <h2 className="text-base font-extrabold text-navy-700 dark:text-white font-poppins flex items-center gap-2 mb-4">
          <Wallet className="w-5 h-5 text-emerald-500" />
          <span>Category Budgets & Actual Consumption</span>
        </h2>

        <div className="space-y-4">
          {budgets.map((b) => {
            const isOver = b.over;
            const barBg = isOver
              ? 'bg-gradient-to-r from-rose-500 to-red-600'
              : b.pct > 75
              ? 'bg-gradient-to-r from-amber-400 to-orange-500'
              : 'bg-gradient-to-r from-brand-500 to-cyan-400';

            return (
              <div key={b.category} className="p-4 rounded-2xl bg-lightPrimary dark:bg-navy-900 border border-gray-100 dark:border-white/5">
                <div className="flex justify-between items-center text-xs mb-2">
                  <span className="font-extrabold text-sm text-navy-700 dark:text-white font-poppins">{b.category}</span>
                  
                  <div className="flex items-center gap-3">
                    <span className="text-gray-500">
                      Actual: <strong className="text-navy-700 dark:text-white font-bold">{formatINR(b.actual)}</strong>
                    </span>
                    <span className="text-gray-400">/</span>
                    {editingCategory === b.category ? (
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          value={newLimit}
                          onChange={(e) => setNewLimit(e.target.value)}
                          className="w-24 text-xs px-2.5 py-1 rounded-lg bg-white dark:bg-navy-800 border border-brand-500"
                        />
                        <button
                          onClick={() => handleSaveBudget(b.category)}
                          className="px-2 py-1 rounded bg-brand-500 text-white text-[11px] font-bold"
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
                        className="text-brand-500 dark:text-cyan-400 font-bold hover:underline"
                      >
                        Limit: {formatINR(b.monthly_limit)}
                      </button>
                    )}
                    <span className={`font-black text-xs px-2.5 py-0.5 rounded-full ${
                      isOver ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/70 dark:text-rose-300' : 'bg-gray-100 text-gray-700 dark:bg-navy-800 dark:text-gray-300'
                    }`}>
                      {b.pct}%
                    </span>
                  </div>
                </div>

                {/* Animated Progress Bar */}
                <div className="h-3 w-full bg-gray-200 dark:bg-navy-800 rounded-full overflow-hidden p-0.5">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(b.pct, 100)}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className={`h-full ${barBg} rounded-full shadow-sm`}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </SpotlightCard>

      {/* Section 3: Subscriptions & Price Hike Alerts */}
      <SpotlightCard className="!p-6">
        <h2 className="text-base font-extrabold text-navy-700 dark:text-white font-poppins flex items-center gap-2 mb-4">
          <Bell className="w-5 h-5 text-purple-500" />
          <span>Recurring Subscriptions & Silent Price Hike Detector</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {subscriptions.map((sub, i) => (
            <motion.div
              key={sub.merchant}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`p-5 rounded-2xl border text-xs flex flex-col justify-between relative overflow-hidden ${
                sub.alert
                  ? 'bg-rose-50/80 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/50'
                  : 'bg-lightPrimary dark:bg-navy-900 border-gray-100 dark:border-white/5'
              }`}
            >
              {sub.alert && (
                <BorderBeam colorFrom="#FF0055" colorTo="#FFAA00" size={180} duration={5} />
              )}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-extrabold text-base text-navy-700 dark:text-white font-poppins">{sub.merchant}</span>
                  <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-white dark:bg-navy-800 text-gray-500 border border-gray-100 dark:border-white/5">
                    {sub.cadence}
                  </span>
                </div>
                <div className="text-2xl font-black text-navy-700 dark:text-white font-poppins mb-1">
                  {formatINR(sub.amount)}
                </div>
                {sub.alert ? (
                  <p className="text-rose-600 dark:text-rose-400 font-bold text-xs mt-1">
                    ⚠️ {sub.alert}
                  </p>
                ) : (
                  <p className="text-gray-400 text-xs">Next renewal: {sub.next_expected}</p>
                )}
              </div>

              <div className="pt-3.5 mt-3.5 border-t border-gray-200/50 dark:border-white/5 flex justify-between text-xs text-gray-400">
                <span>Annualized cost</span>
                <span className="font-black text-navy-700 dark:text-white">{formatINR(sub.annual_cost)}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </SpotlightCard>
    </div>
  );
};
