import React from 'react';
import {
  LayoutDashboard,
  Receipt,
  AlertOctagon,
  ShieldAlert,
  Wallet,
  Sparkles,
  X,
  Play
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { BorderBeam } from './ui/BorderBeam';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  openSimulator: () => void;
  openDNA: () => void;
  openDemoTour: () => void;
  immunityScore: number;
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  openSimulator,
  openDNA,
  openDemoTour,
  immunityScore,
  isOpen,
  onClose,
}) => {
  const routes = [
    { id: 'overview', name: 'Main Dashboard', icon: LayoutDashboard },
    { id: 'transactions', name: 'Transactions', icon: Receipt },
    { id: 'anomalies', name: 'Anomalies & Court', icon: AlertOctagon },
    { id: 'antibodies', name: 'Immunity & Antibodies', icon: ShieldAlert },
    { id: 'budgets', name: 'Budgets & Forecast', icon: Wallet },
    { id: 'assistant', name: 'AI Assistant', icon: Sparkles },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm xl:hidden"
          />
        )}
      </AnimatePresence>

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-[290px] bg-white dark:bg-navy-800 transition-all duration-300 ease-in-out flex flex-col justify-between shadow-xl shadow-shadow-500/10 dark:shadow-none border-r border-gray-100 dark:border-white/5 ${
          isOpen ? 'translate-x-0' : '-translate-x-full xl:translate-x-0'
        }`}
      >
        <div>
          {/* Horizon UI Brand Title */}
          <div className="mx-[30px] mt-[32px] mb-[24px] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white shadow-lg shadow-brand-500/30"
              >
                <ShieldAlert className="w-4 h-4" />
              </motion.div>
              <h1 className="text-[22px] font-extrabold uppercase tracking-tight text-navy-700 dark:text-white font-poppins">
                HORIZON <span className="font-semibold bg-gradient-to-r from-brand-500 to-cyan-500 bg-clip-text text-transparent">GUARD</span>
              </h1>
            </div>
            <button onClick={onClose} className="xl:hidden text-gray-500 hover:text-gray-700 dark:hover:text-white transition">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="h-px bg-gradient-to-r from-transparent via-gray-200 dark:via-white/10 to-transparent mb-6 mx-6" />

          {/* Navigation Links with Framer Motion layout animation */}
          <ul className="mb-auto pt-1 space-y-0.5 px-3">
            {routes.map((route, i) => {
              const Icon = route.icon;
              const isActive = activeTab === route.id;

              return (
                <motion.li
                  key={route.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05, duration: 0.3 }}
                  className="relative"
                >
                  <button
                    onClick={() => {
                      setActiveTab(route.id);
                      onClose();
                    }}
                    className={`relative flex items-center gap-3.5 w-full py-3 px-4 rounded-xl text-left transition-all duration-200 ${
                      isActive
                        ? 'font-bold text-brand-500 dark:text-white bg-brand-50/80 dark:bg-brand-500/10'
                        : 'font-medium text-gray-600 dark:text-gray-400 hover:text-navy-700 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/5'
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${
                      isActive
                        ? 'bg-brand-500 text-white shadow-md shadow-brand-500/30'
                        : 'bg-gray-100 dark:bg-navy-700 text-gray-400 dark:text-gray-400'
                    }`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-[13px] tracking-wide">{route.name}</span>

                    {/* Horizon UI Signature Active Indicator Line */}
                    {isActive && (
                      <motion.div
                        layoutId="sidebar-active-indicator"
                        className="absolute right-0 top-1/2 -translate-y-1/2 h-8 w-1 rounded-l-lg bg-brand-500 dark:bg-brand-400"
                        transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                      />
                    )}
                  </button>
                </motion.li>
              );
            })}
          </ul>
        </div>

        {/* Bottom Horizon UI Promo / Status Card */}
        <div className="p-5">
          <div className="relative rounded-[20px] bg-gradient-to-br from-brand-400 via-brand-500 to-brand-700 p-5 text-white shadow-xl shadow-brand-500/30 text-center overflow-hidden">
            {/* Ambient Orb Glow */}
            <div className="absolute -right-6 -bottom-6 w-28 h-28 bg-white/10 rounded-full blur-2xl pointer-events-none animate-pulse-glow" />
            <div className="absolute -left-4 -top-4 w-20 h-20 bg-cyan-400/15 rounded-full blur-2xl pointer-events-none animate-pulse-glow" style={{ animationDelay: '3s' }} />
            
            <BorderBeam colorFrom="#00F0FF" colorTo="#FFFFFF" size={180} duration={6} />

            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm mx-auto flex items-center justify-center mb-3">
              <ShieldAlert className="w-6 h-6 text-white" />
            </div>

            <h4 className="text-base font-extrabold">Immunity: {immunityScore}%</h4>
            <p className="text-[11px] text-brand-100 mt-1 mb-4">
              Active defense protecting against fraud vectors with machine-learned antibodies.
            </p>

            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={openDemoTour}
              className="relative w-full py-2.5 rounded-xl bg-white text-brand-600 text-xs font-bold shadow-lg hover:shadow-xl hover:bg-gray-50 transition flex items-center justify-center gap-1.5 overflow-hidden group"
            >
              <span className="absolute inset-0 w-1/3 h-full bg-brand-500/10 skew-x-12 -translate-x-full group-hover:translate-x-[400%] transition-transform duration-700 ease-out pointer-events-none" />
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Take 2m Demo Tour</span>
            </motion.button>
          </div>
        </div>
      </aside>
    </>
  );
};
