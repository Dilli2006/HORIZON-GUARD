import React, { useState, useEffect } from 'react';
import { Search, Filter, Download, Upload, Trash2, Scale, Shield, AlertTriangle, CheckCircle, RefreshCw, Plus } from 'lucide-react';
import { Expense, MerchantTrustItem, api, formatINR } from '../lib/api';

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
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Transactions Ledger</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Audit log with automated keyword categorization and Merchant Trust indexing.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Add Expense Button */}
          {onOpenAddExpense && (
            <button
              onClick={onOpenAddExpense}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold transition shadow-md shadow-brand-500/20"
            >
              <Plus className="w-4 h-4" />
              <span>Record Expense</span>
            </button>
          )}

          {/* CSV Export */}
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          {/* CSV Import */}
          <label className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer">
            <Upload className="w-3.5 h-3.5" />
            <span>{importing ? 'Importing...' : 'Import CSV'}</span>
            <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
          </label>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="fintech-card bg-white dark:bg-[#121620] border border-slate-200/70 dark:border-white/5 p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search merchant, location, notes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs py-2 pl-9 pr-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          {categories.map((c) => {
            const isSelected = (c === 'All' && !category) || category === c;
            return (
              <button
                key={c}
                onClick={() => setCategory(c === 'All' ? '' : c)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {c}
              </button>
            );
          })}
        </div>
      </div>

      {/* Transactions Table */}
      <div className="fintech-card bg-white dark:bg-[#121620] border border-slate-200/70 dark:border-white/5 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 dark:bg-slate-900/60 border-b border-slate-200/60 dark:border-white/5 text-slate-500 dark:text-slate-400 font-semibold">
              <tr>
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-4">Merchant & Trust</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Method & City</th>
                <th className="py-3 px-4">Immune Status</th>
                <th className="py-3 px-4 text-right">Amount</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-slate-700 dark:text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-blue-500" />
                    <span>Loading transactions...</span>
                  </td>
                </tr>
              ) : expenses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No transactions match the filter criteria.
                  </td>
                </tr>
              ) : (
                expenses.map((e) => {
                  const trust = trustMap[e.merchant];
                  const hasAnomaly = !!e.anomaly;
                  const isBlocked = !!e.anomaly?.blocked_by_antibody_id;

                  return (
                    <tr key={e.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="font-bold text-slate-900 dark:text-white block">{e.date}</span>
                        <span className="text-[10px] text-slate-400">{e.time}</span>
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 dark:text-white">{e.merchant}</span>
                          
                          {/* Merchant Trust Badge */}
                          {trust && (
                            <span
                              title={`Trust: ${trust.trust}/100 based on ${trust.visits} visits`}
                              className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                                trust.level === 'trusted'
                                  ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                                  : trust.level === 'risky'
                                  ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                              }`}
                            >
                              Trust {trust.trust}
                            </span>
                          )}
                        </div>
                        {e.notes && <span className="text-[10px] text-slate-400 block line-clamp-1">{e.notes}</span>}
                      </td>

                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-lg text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {e.category}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-[11px]">
                        <span className="block text-slate-900 dark:text-white font-medium">{e.payment_method}</span>
                        <span className="text-slate-400">{e.location || 'Bengaluru'}</span>
                      </td>

                      <td className="py-3 px-4">
                        {isBlocked ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
                            <Shield className="w-3 h-3" /> Blocked #AB{e.anomaly?.blocked_by_antibody_id}
                          </span>
                        ) : hasAnomaly ? (
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            e.anomaly?.severity === 'High'
                              ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
                              : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                          }`}>
                            <AlertTriangle className="w-3 h-3" /> Risk {e.anomaly?.risk_score}/100
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                            <CheckCircle className="w-3 h-3" /> Clean
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right font-extrabold text-slate-900 dark:text-white text-sm">
                        {formatINR(e.amount)}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {hasAnomaly && (
                            <button
                              onClick={() => onOpenCourt(e.anomaly!.id)}
                              title="Take to Court"
                              className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 hover:bg-amber-500 hover:text-white transition"
                            >
                              <Scale className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(e.id)}
                            title="Delete"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
