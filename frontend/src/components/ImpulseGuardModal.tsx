import React, { useState, useEffect } from 'react';
import { X, Moon, Clock, ShieldCheck, HeartHandshake, AlertCircle } from 'lucide-react';
import { api, formatINR } from '../lib/api';

interface ImpulseGuardModalProps {
  isOpen: boolean;
  onClose: () => void;
  expenseData: {
    merchant: string;
    amount: number;
    category: string;
    reasons: string[];
  } | null;
  onProceed: () => void;
  onCancelled: (avoidedAmount: number) => void;
}

export const ImpulseGuardModal: React.FC<ImpulseGuardModalProps> = ({
  isOpen,
  onClose,
  expenseData,
  onProceed,
  onCancelled,
}) => {
  const [fastMode, setFastMode] = useState(true);
  const [timeLeft, setTimeLeft] = useState(5); // 5s demo speed by default

  useEffect(() => {
    if (!isOpen) return;
    setTimeLeft(fastMode ? 5 : 600);
  }, [isOpen, fastMode]);

  useEffect(() => {
    if (!isOpen || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((t) => Math.max(0, t - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen, timeLeft]);

  if (!isOpen || !expenseData) return null;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  const handleCancel = async () => {
    try {
      await api.logGuard({
        merchant: expenseData.merchant,
        amount: expenseData.amount,
        category: expenseData.category,
        reasons: expenseData.reasons,
        decision: 'cancelled',
      });
      onCancelled(expenseData.amount);
    } catch (e) {
      console.error(e);
    }
  };

  const handleProceed = async () => {
    try {
      await api.logGuard({
        merchant: expenseData.merchant,
        amount: expenseData.amount,
        category: expenseData.category,
        reasons: expenseData.reasons,
        decision: 'proceeded',
      });
      onProceed();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-[#121620] w-full max-w-lg rounded-[28px] border border-slate-200 dark:border-white/10 shadow-2xl overflow-hidden p-6 text-center">
        {/* Header Icon */}
        <div className="w-16 h-16 rounded-3xl bg-indigo-500/10 text-indigo-500 mx-auto flex items-center justify-center mb-4">
          <Moon className="w-8 h-8" />
        </div>

        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">
          Emotional Spending Guard
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
          "Sleep on it: Take a breath before confirming this 3 AM purchase."
        </p>

        {/* Warning Box */}
        <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 text-left mb-6">
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800 dark:text-amber-400 mb-1">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>Late Night / Stress Pattern Detected</span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300">
            You're spending <strong>{formatINR(expenseData.amount)}</strong> at{' '}
            <strong>{expenseData.merchant}</strong>.
          </p>
          {expenseData.reasons?.map((r, i) => (
            <p key={i} className="text-[11px] text-amber-700 dark:text-amber-300 mt-1">
              • {r}
            </p>
          ))}
        </div>

        {/* Cooling Timer */}
        <div className="my-6">
          <div className="text-4xl font-extrabold font-mono text-slate-900 dark:text-white tracking-wider">
            {minutes}:{seconds < 10 ? `0${seconds}` : seconds}
          </div>
          <span className="text-xs text-slate-400">Cooling-off countdown</span>

          {/* Hackathon Demo Accelerator Toggle */}
          <div className="mt-3 flex items-center justify-center gap-2">
            <button
              onClick={() => {
                setFastMode(!fastMode);
                setTimeLeft(!fastMode ? 10 : 600);
              }}
              className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
            >
              <span>{fastMode ? '⚡ Demo Speed Active (10s)' : 'Switch to 10s Demo Speed'}</span>
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            onClick={handleCancel}
            className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition shadow-sm flex items-center justify-center gap-1.5"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>I'll Pass (Save {formatINR(expenseData.amount)})</span>
          </button>

          <button
            onClick={handleProceed}
            disabled={timeLeft > 0 && !fastMode}
            className={`flex-1 py-3 px-4 rounded-xl font-bold text-xs transition ${
              timeLeft > 0 && !fastMode
                ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90'
            }`}
          >
            <span>Proceed Anyway</span>
          </button>
        </div>
      </div>
    </div>
  );
};
