import React, { useState, useEffect } from 'react';
import {
  Search,
  Download,
  Upload,
  Trash2,
  Scale,
  Shield,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Plus,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Expense, MerchantTrustItem, api, formatINR } from '../lib/api';
import { SpotlightCard } from '../components/ui/SpotlightCard';
import { ShimmerButton } from '../components/ui/ShimmerButton';

interface TransactionsTabProps {
  onOpenCourt: (anomalyId: number) => void;
  trustMap: Record<string, MerchantTrustItem>;
  onRefresh: () => void;
  refreshKey?: number;
  onOpenAddExpense?: () => void;
}

export const TransactionsTab: React.FC<TransactionsTabProps> = ({
  onOpenCourt,
  trustMap,
  onRefresh,
  refreshKey,
  onOpenAddExpense,
}) => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);

  const fetchExpenses = () => {
    setLoading(true);
    api.getExpenses({ search, category, limit: 120 })
      .then(setExpenses)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchExpenses();
  }, [search, category, refreshKey]);

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this transaction?')) return;
    try {
      await api.deleteExpense(id);
      fetchExpenses();
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  const handleExport = () => {
    window.open('http://localhost:8000/expenses/export', '_blank');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      await fetch('http://localhost:8000/expenses/import', { method: 'POST', body: formData });
      fetchExpenses();
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setImporting(false);
    }
  };

  const categories = ['All', 'Food', 'Travel', 'Shopping', 'Bills', 'Entertainment', 'Health', 'Education', 'Other'];

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-700 dark:text-white font-poppins tracking-tight">
            Transactions Ledger
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Real-time biometric spend ledger with Merchant Trust indexing and automatic anomaly triage.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Add Expense Button */}
          {onOpenAddExpense && (
            <ShimmerButton
              onClick={onOpenAddExpense}
              className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold rounded-xl shadow-lg shadow-brand-500/25"
            >
              <Plus className="w-4 h-4" />
              <span>Record Expense</span>
            </ShimmerButton>
          )}

          {/* CSV Export */}
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-navy-800 text-navy-700 dark:text-white text-xs font-bold border border-slate-200/70 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-navy-700 transition shadow-sm"
          >
            <Download className="w-3.5 h-3.5 text-brand-500" />
            <span>Export CSV</span>
          </motion.button>

          {/* CSV Import */}
          <motion.label
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-navy-800 text-navy-700 dark:text-white text-xs font-bold border border-slate-200/70 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-navy-700 transition shadow-sm cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5 text-brand-500" />
            <span>{importing ? 'Importing...' : 'Import CSV'}</span>
            <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
          </motion.label>
        </div>
      </div>

      {/* Filter Bar with Animated Category Tabs */}
      <SpotlightCard className="!p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="relative flex-1 min-w-[260px]">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search merchant, location, notes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs py-2.5 pl-9 pr-3 rounded-xl bg-lightPrimary dark:bg-navy-900 border border-transparent dark:border-white/10 text-navy-700 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </div>

          {/* Category Pills with Framer layoutId */}
          <div className="flex flex-wrap items-center gap-1.5">
            {categories.map((c) => {
              const isSelected = (c === 'All' && !category) || category === c;
              return (
                <button
                  key={c}
                  onClick={() => setCategory(c === 'All' ? '' : c)}
                  className={`relative px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                    isSelected
                      ? 'text-white'
                      : 'text-gray-600 dark:text-gray-400 hover:text-navy-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-navy-700/60'
                  }`}
                >
                  {isSelected && (
                    <motion.div
                      layoutId="active-cat-pill"
                      className="absolute inset-0 bg-brand-500 rounded-xl shadow-md shadow-brand-500/25"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10">{c}</span>
                </button>
              );
            })}
          </div>
        </div>
      </SpotlightCard>

      {/* Transactions Table */}
      <SpotlightCard className="!p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50/70 dark:bg-navy-900/60 border-b border-gray-100 dark:border-white/5 text-gray-500 dark:text-gray-400 font-bold uppercase text-[11px]">
              <tr>
                <th className="py-3.5 px-4">Date & Time</th>
                <th className="py-3.5 px-4">Merchant & Trust</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Method & City</th>
                <th className="py-3.5 px-4">Immune Status</th>
                <th className="py-3.5 px-4 text-right">Amount</th>
                <th className="py-3.5 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5 text-navy-700 dark:text-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-brand-500" />
                    <span className="font-semibold text-xs">Querying Horizon Ledger...</span>
                  </td>
                </tr>
              ) : expenses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400">
                    <span className="font-semibold text-xs">No transactions match the filter criteria.</span>
                  </td>
                </tr>
              ) : (
                expenses.map((e) => {
                  const trust = trustMap[e.merchant];
                  const hasAnomaly = !!e.anomaly;
                  const isBlocked = !!e.anomaly?.blocked_by_antibody_id;

                  return (
                    <motion.tr
                      key={e.id}
                      whileHover={{ backgroundColor: 'rgba(67, 24, 255, 0.03)' }}
                      transition={{ duration: 0.15 }}
                      className="transition-colors group"
                    >
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="font-bold text-navy-700 dark:text-white block">{e.date}</span>
                        <span className="text-[10px] text-gray-400">{e.time}</span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-navy-700 dark:text-white group-hover:text-brand-500 transition-colors">
                            {e.merchant}
                          </span>

                          {/* Merchant Trust Badge */}
                          {trust && (
                            <span
                              title={`Trust: ${trust.trust}/100 based on ${trust.visits} visits`}
                              className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                                trust.level === 'trusted'
                                  ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20'
                                  : trust.level === 'risky'
                                  ? 'bg-rose-100 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 border border-rose-500/20'
                                  : 'bg-gray-100 dark:bg-navy-700 text-gray-600 dark:text-gray-400'
                              }`}
                            >
                              Trust {trust.trust}
                            </span>
                          )}
                        </div>
                        {e.notes && <span className="text-[10px] text-gray-400 block line-clamp-1">{e.notes}</span>}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-lightPrimary dark:bg-navy-700 text-navy-700 dark:text-white">
                          {e.category}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-[11px]">
                        <span className="block text-navy-700 dark:text-white font-medium">{e.payment_method}</span>
                        <span className="text-gray-400">{e.location || 'Bengaluru'}</span>
                      </td>

                      <td className="py-3.5 px-4">
                        {isBlocked ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-100 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 border border-purple-500/25">
                            <Shield className="w-3 h-3" /> Auto-Blocked #AB{e.anomaly?.blocked_by_antibody_id}
                          </span>
                        ) : hasAnomaly ? (
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            e.anomaly?.severity === 'High'
                              ? 'bg-rose-100 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 border border-rose-500/25'
                              : 'bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border border-amber-500/25'
                          }`}>
                            <AlertTriangle className="w-3 h-3" /> Risk {e.anomaly?.risk_score}/100
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
                            <CheckCircle className="w-3.5 h-3.5" /> Clean
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right font-extrabold text-navy-700 dark:text-white text-sm">
                        {formatINR(e.amount)}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {hasAnomaly && (
                            <motion.button
                              whileHover={{ scale: 1.15 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => onOpenCourt(e.anomaly!.id)}
                              title="Take to Court"
                              className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 hover:bg-amber-500 hover:text-white transition shadow-sm"
                            >
                              <Scale className="w-3.5 h-3.5" />
                            </motion.button>
                          )}
                          <motion.button
                            whileHover={{ scale: 1.15 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleDelete(e.id)}
                            title="Delete"
                            className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </motion.button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </SpotlightCard>
    </div>
  );
};
