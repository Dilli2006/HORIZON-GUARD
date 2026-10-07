import React, { useState } from 'react';
import { X, Zap, AlertTriangle, Moon, Compass, Copy, DollarSign, CheckCircle2 } from 'lucide-react';
import { api } from '../lib/api';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-[#121620] w-full max-w-2xl rounded-[28px] border border-slate-200 dark:border-white/10 shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-white/5 flex items-center justify-between bg-slate-50/60 dark:bg-slate-900/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Live Fraud Simulator</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Stress-test the Financial Immune System with real-time attack vectors.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <p className="text-xs text-slate-600 dark:text-slate-300">
            Select a vector below. The backend pipeline runs instantly, scores the threat, and broadcasts an SSE alert.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {scenarios.map((sc) => {
              const Icon = sc.icon;
              const isLoading = loading === sc.id;
              return (
                <button
                  key={sc.id}
                  disabled={!!loading}
                  onClick={() => handleInject(sc.id)}
                  className="p-4 rounded-2xl border border-slate-200/70 dark:border-white/5 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 transition-all text-left group flex flex-col justify-between"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-8 h-8 rounded-xl bg-gradient-to-tr ${sc.color} text-white flex items-center justify-center shadow-sm`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-blue-500 transition">
                      {sc.title}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-3">
                    {sc.desc}
                  </p>
                  <div className="flex items-center justify-between pt-2 border-t border-slate-200/40 dark:border-white/5 text-[10px] font-bold">
                    <span className="text-slate-400">Threat Action</span>
                    <span className="text-rose-500 group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                      {isLoading ? 'Injecting...' : 'Inject Attack →'}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {lastResult && (
            <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span className="text-emerald-900 dark:text-emerald-200">
                Injected <strong>{lastResult.label}</strong>. Watch the top right for real-time SSE alerts!
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
