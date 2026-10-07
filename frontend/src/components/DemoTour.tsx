import React, { useState } from 'react';
import { X, Sparkles, ChevronRight, ChevronLeft, CheckCircle2, Play } from 'lucide-react';

interface DemoTourProps {
  isOpen: boolean;
  onClose: () => void;
  onStepAction: (stepIndex: number) => void;
}

export const DemoTour: React.FC<DemoTourProps> = ({ isOpen, onClose, onStepAction }) => {
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  const steps = [
    {
      title: '1. Financial Immune System Telemetry',
      desc: 'ExpenseGuard ingested 60 days of real Indian INR transactions. Notice the 3D Funnel and the Gross Volume cards styled directly after high-growth fintech interfaces.',
      actionLabel: 'View Overview Telemetry',
    },
    {
      title: '2. Explainable Anomaly Detection Pipeline',
      desc: 'Check the Anomalies tab. The hybrid engine combined Robust Z-score, IsolationForest, Burst detection, Impossible Travel, and Duplicate checks. Every score has mathematical contributions and Counterfactuals.',
      actionLabel: 'Inspect Anomalies Feed',
    },
    {
      title: '3. Anomaly Courtroom: Prosecution vs Defense',
      desc: 'Click "Take to Court" on any flagged charge. Watch the AI Prosecutor argue fraud while the Defender cites historical spending relationships. The user acts as Judge.',
      actionLabel: 'Launch Anomaly Court',
    },
    {
      title: '4. Self-Learning Immunity & Antibodies',
      desc: 'When you rule Fraud, ExpenseGuard synthesizes a pattern Antibody. Future matching attempts are auto-neutralized without manual review. When you rule Legit, it creates a Whitelist dampener.',
      actionLabel: 'Inspect Antibodies & Vaccines',
    },
    {
      title: '5. Live Fraud Simulator & Real-time SSE Alerts',
      desc: 'Click "Inject Fraud" to simulate a real attack (e.g. Impossible Travel Bengaluru to Delhi in 45m). Watch the floating toast fire immediately over Server-Sent Events.',
      actionLabel: 'Open Fraud Simulator',
    },
    {
      title: '6. Emotional Spending Guard (3 AM Impulses)',
      desc: 'Try recording a ₹5,000 purchase at 3 AM. A gentle "Sleep on it" 10-minute cooling timer activates, calculating avoided impulse spend if cancelled.',
      actionLabel: 'Open Add Expense (Guard)',
    },
    {
      title: '7. Spend DNA & Natural Language Assistant',
      desc: 'Inspect your radial Spend DNA fingerprint and ask the AI Assistant questions like "How much spent on food?" with safe structured intent parsing.',
      actionLabel: 'Open AI Assistant',
    },
  ];

  const step = steps[currentStep];

  return (
    <div className="fixed bottom-6 left-6 z-50 max-w-md w-full bg-white dark:bg-[#121620] border-2 border-blue-500 rounded-[26px] shadow-2xl p-5 text-xs animate-slideUp">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-[10px]">
            {currentStep + 1}
          </div>
          <span className="font-extrabold text-slate-900 dark:text-white">{step.title}</span>
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1">
          <X className="w-4 h-4" />
        </button>
      </div>

      <p className="text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
        {step.desc}
      </p>

      <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-white/5">
        <button
          onClick={() => onStepAction(currentStep)}
          className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition flex items-center gap-1.5 shadow-sm"
        >
          <Play className="w-3 h-3" />
          <span>{step.actionLabel}</span>
        </button>

        <div className="flex items-center gap-1">
          <button
            disabled={currentStep === 0}
            onClick={() => setCurrentStep((s) => Math.max(0, s - 1))}
            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 disabled:opacity-30 text-slate-600 dark:text-slate-400"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <span className="text-[10px] text-slate-400 px-1 font-semibold">
            {currentStep + 1} / {steps.length}
          </span>
          <button
            disabled={currentStep === steps.length - 1}
            onClick={() => setCurrentStep((s) => Math.min(steps.length - 1, s + 1))}
            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 disabled:opacity-30 text-slate-600 dark:text-slate-400"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
