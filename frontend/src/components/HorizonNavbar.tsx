import React from 'react';
import {
  Sun,
  Moon,
  RefreshCw,
  Plus,
  Zap,
  Sparkles,
  Menu,
  ShieldAlert,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { AIPulseBadge } from './ui/AIPulseBadge';

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
    <nav className="sticky top-4 z-40 flex flex-row flex-wrap items-center justify-between rounded-2xl bg-white/80 dark:bg-navy-800/80 backdrop-blur-2xl p-3 shadow-3xl shadow-shadow-500/10 dark:shadow-none border border-white/60 dark:border-white/10 transition-all">
      {/* Left: Horizon Breadcrumbs & Page Title */}
      <div className="ml-2">
        <div className="h-6 pt-1 flex items-center gap-3">
          <p className="text-xs font-normal text-gray-500 dark:text-gray-400">
            Pages / <span className="font-semibold text-navy-700 dark:text-white capitalize">{activeTab}</span>
          </p>
          <div className="hidden md:block">
            <AIPulseBadge status="shielded" text="7 DETECTORS ACTIVE" />
          </div>
        </div>
        <p className="text-xl sm:text-2xl font-black capitalize text-navy-700 dark:text-white font-poppins tracking-tight mt-0.5">
          {titles[activeTab] || 'Dashboard'}
        </p>
      </div>

      {/* Right: Horizon Floating Action Pill */}
      <div className="flex items-center gap-2 mt-2 sm:mt-0 bg-white/90 dark:bg-navy-900/90 p-1.5 rounded-full shadow-md shadow-shadow-500/10 dark:shadow-none border border-gray-100 dark:border-white/5 backdrop-blur-md">
        {/* Mobile Hamburger */}
        <button
          onClick={onOpenMobileMenu}
          className="xl:hidden p-2 text-gray-600 dark:text-gray-300 hover:text-navy-700 rounded-full"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Quick Add Expense - Horizon Brand Button with Framer Motion spring */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={openAddExpense}
          className="relative group overflow-hidden flex items-center gap-1.5 px-4 py-2 rounded-full bg-brand-500 hover:bg-brand-600 active:bg-brand-700 text-white text-xs font-bold transition shadow-lg shadow-brand-500/25"
        >
          {/* Animated 21st.dev Shimmer Sheen */}
          <span className="absolute inset-0 w-1/2 h-full bg-white/20 skew-x-12 -translate-x-full group-hover:translate-x-[300%] transition-transform duration-700 ease-out pointer-events-none" />
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Add Expense</span>
        </motion.button>

        {/* Inject Fraud Demo Button with Framer spring */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={openSimulator}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white text-xs font-bold transition shadow-md shadow-red-500/25"
        >
          <Zap className="w-3.5 h-3.5" />
          <span>Inject Fraud</span>
        </motion.button>

        {/* Scan Receipt with OCR */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={openReceiptScan}
          title="Scan Receipt with Gemini Vision"
          className="hidden md:flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-lightPrimary dark:bg-navy-800 text-navy-700 dark:text-white text-xs font-bold hover:bg-gray-100 dark:hover:bg-navy-700 transition border border-transparent dark:border-white/5"
        >
          <Sparkles className="w-3.5 h-3.5 text-brand-500" />
          <span>Receipt OCR</span>
        </motion.button>

        {/* Reseed 60 Days Data */}
        <motion.button
          whileHover={{ scale: 1.1, rotate: 180 }}
          whileTap={{ scale: 0.9 }}
          transition={{ duration: 0.3 }}
          onClick={onReseed}
          disabled={isSeeding}
          title="Reseed 60 Days Demo Telemetry"
          className="p-2 text-gray-500 hover:text-navy-700 dark:text-gray-400 dark:hover:text-white rounded-full bg-lightPrimary dark:bg-navy-800 transition"
        >
          <RefreshCw className={`w-4 h-4 ${isSeeding ? 'animate-spin text-brand-500' : ''}`} />
        </motion.button>

        {/* Theme Toggle with Spring */}
        <motion.button
          whileHover={{ scale: 1.15 }}
          whileTap={{ scale: 0.85 }}
          onClick={() => setDarkMode(!darkMode)}
          className="p-2 text-gray-500 hover:text-navy-700 dark:text-gray-400 dark:hover:text-white rounded-full bg-lightPrimary dark:bg-navy-800 transition"
          title="Toggle Light / Dark mode"
        >
          {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-navy-700" />}
        </motion.button>

        {/* User Avatar with Glowing Status Ring */}
        <div className="relative ml-1">
          <div className="w-9 h-9 rounded-full ring-2 ring-brand-500/50 p-0.5">
            <img
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
              alt="Aarav Sharma"
              className="w-full h-full object-cover rounded-full"
            />
          </div>
          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white dark:border-navy-900 rounded-full" />
        </div>
      </div>
    </nav>
  );
};
