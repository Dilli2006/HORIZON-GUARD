import React from 'react';
import { X, AlertTriangle, ShieldCheck, Zap } from 'lucide-react';
import { SSEToast } from '../hooks/useSSE';

interface ToastContainerProps {
  toasts: SSEToast[];
  onDismiss: (id: string) => void;
  onOpenAnomaly?: (anomalyId: number) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-16 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((t) => {
        const isThreat = t.type === 'anomaly';
        return (
          <div
            key={t.id}
            className={`pointer-events-auto p-4 rounded-2xl shadow-xl border backdrop-blur-md transition-all animate-slideDown flex items-start gap-3 ${
              isThreat
                ? 'bg-rose-50/95 dark:bg-rose-950/90 border-rose-200 dark:border-rose-800 text-rose-950 dark:text-rose-100'
                : 'bg-emerald-50/95 dark:bg-emerald-950/90 border-emerald-200 dark:border-emerald-800 text-emerald-950 dark:text-emerald-100'
            }`}
          >
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
              isThreat ? 'bg-rose-500/20 text-rose-600' : 'bg-emerald-500/20 text-emerald-600'
            }`}>
              {isThreat ? <Zap className="w-4 h-4 animate-bounce" /> : <ShieldCheck className="w-4 h-4" />}
            </div>

            <div className="flex-1 text-xs">
              <span className="font-bold block tracking-tight">{t.title}</span>
              <p className="opacity-90 mt-0.5 text-[11px] leading-tight">{t.message}</p>
            </div>

            <button
              onClick={() => onDismiss(t.id)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
