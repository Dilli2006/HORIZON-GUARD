import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Sparkles, Activity } from 'lucide-react';

interface AIPulseBadgeProps {
  status?: 'shielded' | 'analyzing' | 'threat';
  text?: string;
  className?: string;
}

export const AIPulseBadge: React.FC<AIPulseBadgeProps> = ({
  status = 'shielded',
  text = 'AUTONOMOUS IMMUNITY ACTIVE',
  className = '',
}) => {
  const configs = {
    shielded: {
      color: 'bg-emerald-500',
      ring: 'ring-emerald-500/30',
      textClass: 'text-emerald-700 dark:text-emerald-300',
      bgClass: 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-200/60 dark:border-emerald-800/40',
      icon: ShieldCheck,
    },
    analyzing: {
      color: 'bg-brand-500',
      ring: 'ring-brand-500/30',
      textClass: 'text-brand-600 dark:text-brand-300',
      bgClass: 'bg-brand-50/80 dark:bg-brand-950/40 border-brand-200/60 dark:border-brand-800/40',
      icon: Sparkles,
    },
    threat: {
      color: 'bg-rose-500',
      ring: 'ring-rose-500/30',
      textClass: 'text-rose-700 dark:text-rose-300',
      bgClass: 'bg-rose-50/80 dark:bg-rose-950/40 border-rose-200/60 dark:border-rose-800/40',
      icon: Activity,
    },
  };

  const current = configs[status] || configs.shielded;
  const Icon = current.icon;

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-[11px] font-bold tracking-wide backdrop-blur-md transition-all shadow-sm ${current.bgClass} ${current.textClass} ${className}`}
    >
      {/* Concentric Pulsing Radar Rings */}
      <span className="relative flex h-2 w-2">
        <motion.span
          animate={{ scale: [1, 2.4], opacity: [0.8, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut' }}
          className={`absolute inline-flex h-full w-full rounded-full ${current.color}`}
        />
        <span className={`relative inline-flex rounded-full h-2 w-2 ${current.color}`} />
      </span>

      <Icon className="w-3.5 h-3.5" />
      <span>{text}</span>
    </div>
  );
};
