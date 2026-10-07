import React, { useState } from 'react';
import { X, Zap, Moon, Compass, Copy, DollarSign, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../lib/api';
import { BorderBeam } from './ui/BorderBeam';

interface SimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInjected: () => void;
}

export const SimulatorModal: React.FC<SimulatorModalProps> = ({ isOpen, onClose, onInjected }) => {
  const [loading, setLoading] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<any>(null);

  if (!isOpen) return null;

  const scenarios = [
    {
      id: 'duplicate' as const,
      title: 'Duplicate Charge within 48h',
      desc: 'Simulates a double-swipe or duplicate billing from a merchant for the identical INR amount.',
      icon: Copy,
      color: 'from-amber-500 to-orange-500',
    },
    {
      id: 'huge' as const,
      title: '15× Median Spending Spike',
      desc: 'Injects a massive purchase at a luxury boutique exceeding 3× user history median.',
      icon: DollarSign,
      color: 'from-rose-500 to-red-600',
    },
    {
      id: 'night' as const,
      title: '3 AM Midnight Impulse Purchase',
      desc: 'Simulates high-value transaction between 11 PM and 5 AM triggering late-night sleep guards.',
      icon: Moon,
      color: 'from-purple-500 to-indigo-600',
    },
    {
      id: 'travel' as const,
      title: 'Impossible Travel (Bengaluru → Delhi in 45m)',
      desc: 'Creates a physical card transaction in Bengaluru followed by Delhi 45 minutes later (>800 km/h).',
      icon: Compass,
      color: 'from-blue-500 to-cyan-600',
    },
  ];

  const handleInject = async (kind: 'duplicate' | 'huge' | 'night' | 'travel') => {
    setLoading(kind);
    try {
      const res = await api.injectFraud(kind);
      setLastResult(res);
      onInjected();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(null);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative z-10 bg-white dark:bg-navy-800 w-full max-w-2xl rounded-[28px] border border-slate-200/80 dark:border-white/10 shadow-3xl overflow-hidden flex flex-col"
        >
          <BorderBeam colorFrom="#FF0055" colorTo="#4318FF" size={250} duration={6} />

          {/* Header */}
          <div className="px-6 py-5 border-b border-gray-100 dark:border-white/5 flex items-center justify-between bg-gray-50/50 dark:bg-navy-900/40">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-500 to-red-600 text-white flex items-center justify-center shadow-lg shadow-rose-500/25">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-navy-700 dark:text-white font-poppins">
                  Live Fraud Simulator
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Stress-test the Financial Immune System with real-time attack vectors.
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-navy-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-navy-700 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-4">
            <p className="text-xs text-gray-600 dark:text-gray-300 font-medium">
              Select an attack vector below. The backend pipeline runs instantly, scores the threat, and broadcasts an SSE alert to trigger the Financial Courtroom.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {scenarios.map((sc) => {
                const Icon = sc.icon;
                const isLoading = loading === sc.id;
                return (
                  <motion.button
                    key={sc.id}
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={!!loading}
                    onClick={() => handleInject(sc.id)}
                    className="p-4 rounded-2xl border border-gray-100 dark:border-white/5 bg-lightPrimary dark:bg-navy-900 hover:bg-gray-100/80 dark:hover:bg-navy-700/60 transition-all text-left group flex flex-col justify-between shadow-sm"
                  >
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`w-8 h-8 rounded-xl bg-gradient-to-tr ${sc.color} text-white flex items-center justify-center shadow-md`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-black text-navy-700 dark:text-white group-hover:text-brand-500 transition-colors font-poppins">
                          {sc.title}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-3 leading-relaxed">
                        {sc.desc}
                      </p>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-gray-200/50 dark:border-white/5 text-[10px] font-bold">
                      <span className="text-gray-400">Simulation Trigger</span>
                      <span className="text-rose-500 group-hover:translate-x-1 transition-transform flex items-center gap-1">
                        {isLoading ? 'Injecting...' : 'Inject Attack →'}
                      </span>
                    </div>
                  </motion.button>
                );
              })}
            </div>

            {lastResult && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 text-xs flex items-center gap-2.5 shadow-sm"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span className="text-emerald-900 dark:text-emerald-200 font-medium">
                  Injected <strong>{lastResult.label}</strong>. Telemetry processed and notification broadcasted!
                </span>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
