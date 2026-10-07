import React from 'react';
import { Shield, Bell, Search, Sun, Moon, Sparkles, RefreshCw, Zap } from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  openSimulator: () => void;
  onReseed: () => void;
  isSeeding: boolean;
  openAddExpense: () => void;
  openReceiptScan: () => void;
  unreadCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  darkMode,
  setDarkMode,
  openSimulator,
  onReseed,
  isSeeding,
  openAddExpense,
  openReceiptScan,
  unreadCount = 0,
}) => {
  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'transactions', label: 'Transactions' },
    { id: 'anomalies', label: 'Anomalies' },
    { id: 'antibodies', label: 'Immunity & Antibodies' },
    { id: 'budgets', label: 'Budgets' },
    { id: 'assistant', label: 'AI Assistant' },
  ];

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-slate-200/60 dark:border-white/10 px-6 py-3 transition-colors">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg text-slate-900 dark:text-white tracking-tight">ExpenseGuard</span>
              <span className="text-[10px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300">
                Immune v2
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Financial Immune System</p>
          </div>
        </div>

        {/* Center Nav tabs */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-100/80 dark:bg-slate-800/60 p-1 rounded-2xl border border-slate-200/50 dark:border-white/5">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 text-sm font-medium rounded-xl transition-all ${
                  isActive
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/40 dark:hover:bg-slate-700/40'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Quick Add Expense */}
          <button
            onClick={openAddExpense}
            className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 transition shadow-sm"
          >
            <span>+ Add Expense</span>
          </button>

          {/* Quick Scan Receipt */}
          <button
            onClick={openReceiptScan}
            title="Scan Receipt with Gemini Vision"
            className="flex items-center gap-1 px-3 py-2 text-xs font-medium rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-500" />
            <span className="hidden lg:inline">Receipt OCR</span>
          </button>

          {/* Inject Fraud Demo Button */}
          <button
            onClick={openSimulator}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-gradient-to-r from-red-600 to-rose-600 text-white hover:from-red-500 hover:to-rose-500 transition shadow-sm shadow-red-500/20"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Inject Fraud</span>
          </button>

          {/* Seed demo */}
          <button
            onClick={onReseed}
            disabled={isSeeding}
            title="Reseed 60 Days Data"
            className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-xl bg-slate-100 dark:bg-slate-800 transition"
          >
            <RefreshCw className={`w-4 h-4 ${isSeeding ? 'animate-spin text-blue-500' : ''}`} />
          </button>

          {/* Theme Toggle */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-xl bg-slate-100 dark:bg-slate-800 transition"
            title="Toggle theme"
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>

          {/* User Avatar */}
          <div className="w-9 h-9 rounded-full ring-2 ring-blue-500/30 p-0.5 ml-1">
            <img
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
              alt="Aarav Sharma"
              className="w-full h-full object-cover rounded-full"
            />
          </div>
        </div>
      </div>
    </header>
  );
};
