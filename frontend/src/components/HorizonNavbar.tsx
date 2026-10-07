import React from 'react';
import {
  Search,
  Sun,
  Moon,
  RefreshCw,
  Plus,
  Zap,
  Sparkles,
  Menu,
  Shield
} from 'lucide-react';

interface HorizonNavbarProps {
  activeTab: string;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  openSimulator: () => void;
  openAddExpense: () => void;
  openReceiptScan: () => void;
  onReseed: () => void;
  isSeeding: boolean;
  onOpenMobileMenu: () => void;
}

export const HorizonNavbar: React.FC<HorizonNavbarProps> = ({
  activeTab,
  darkMode,
  setDarkMode,
  openSimulator,
  openAddExpense,
  openReceiptScan,
  onReseed,
  isSeeding,
  onOpenMobileMenu,
}) => {
  const titles: Record<string, string> = {
    overview: 'Main Dashboard',
    transactions: 'Transactions Ledger',
    anomalies: 'Anomalies & Courtroom',
    antibodies: 'Immunity & Antibodies',
    budgets: 'Budgets & Predictive Run Rates',
    assistant: 'AI Expense Assistant',
  };

  return (
    <nav className="sticky top-4 z-40 flex flex-row flex-wrap items-center justify-between rounded-2xl bg-white/70 dark:bg-navy-800/70 backdrop-blur-xl p-3 shadow-3xl shadow-shadow-500/10 dark:shadow-none border border-white/60 dark:border-white/5 transition-all">
      {/* Left: Horizon Breadcrumbs & Page Title */}
      <div className="ml-2">
        <div className="h-6 pt-1">
          <p className="text-xs font-normal text-gray-600 dark:text-gray-400">
            Pages / <span className="font-semibold text-navy-700 dark:text-white capitalize">{activeTab}</span>
          </p>
        </div>
        <p className="text-xl sm:text-2xl font-bold capitalize text-navy-700 dark:text-white font-poppins tracking-tight">
          {titles[activeTab] || 'Dashboard'}
        </p>
      </div>

      {/* Right: Horizon Floating Action Pill */}
      <div className="flex items-center gap-2 mt-2 sm:mt-0 bg-white dark:bg-navy-900 p-2 rounded-full shadow-md shadow-shadow-500/10 dark:shadow-none border border-gray-100 dark:border-white/5">
        {/* Mobile Hamburger */}
        <button
          onClick={onOpenMobileMenu}
          className="xl:hidden p-2 text-gray-600 dark:text-gray-300 hover:text-navy-700 rounded-full"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Quick Add Expense - Horizon Brand Button */}
        <button
          onClick={openAddExpense}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-brand-500 hover:bg-brand-600 active:bg-brand-700 text-white text-xs font-bold transition shadow-md shadow-brand-500/20"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Add Expense</span>
        </button>

        {/* Inject Fraud Demo Button */}
        <button
          onClick={openSimulator}
          className="flex items-center gap-1 px-3 py-2 rounded-full bg-red-500 hover:bg-red-600 text-white text-xs font-bold transition shadow-md shadow-red-500/20"
        >
          <Zap className="w-3.5 h-3.5" />
          <span>Inject Fraud</span>
        </button>

        {/* Scan Receipt */}
        <button
          onClick={openReceiptScan}
          title="Scan Receipt with Gemini Vision"
          className="hidden md:flex items-center gap-1 px-3 py-2 rounded-full bg-lightPrimary dark:bg-navy-700 text-navy-700 dark:text-white text-xs font-semibold hover:opacity-80 transition"
        >
          <Sparkles className="w-3.5 h-3.5 text-brand-500" />
          <span>Receipt OCR</span>
        </button>

        {/* Reseed 60 Days Data */}
        <button
          onClick={onReseed}
          disabled={isSeeding}
          title="Reseed 60 Days Demo Telemetry"
          className="p-2 text-gray-500 hover:text-navy-700 dark:text-gray-400 dark:hover:text-white rounded-full bg-lightPrimary dark:bg-navy-700 transition"
        >
          <RefreshCw className={`w-4 h-4 ${isSeeding ? 'animate-spin text-brand-500' : ''}`} />
        </button>

        {/* Theme Toggle */}
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="p-2 text-gray-500 hover:text-navy-700 dark:text-gray-400 dark:hover:text-white rounded-full bg-lightPrimary dark:bg-navy-700 transition"
          title="Toggle Light / Dark mode"
        >
          {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-navy-700" />}
        </button>

        {/* User Avatar */}
        <div className="w-9 h-9 rounded-full ring-2 ring-brand-500/40 p-0.5 ml-1">
          <img
            src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
            alt="Aarav Sharma"
            className="w-full h-full object-cover rounded-full"
          />
        </div>
      </div>
    </nav>
  );
};
