import React from 'react';
import { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { SpotlightCard } from './ui/SpotlightCard';
import { CountUp } from './ui/CountUp';

interface HorizonWidgetProps {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  extra?: React.ReactNode;
  iconBg?: string;
  iconColor?: string;
}

export const HorizonWidget: React.FC<HorizonWidgetProps> = ({
  icon: Icon,
  title,
  subtitle,
  extra,
  iconBg = 'bg-brand-50 dark:bg-navy-700',
  iconColor = 'text-brand-500 dark:text-brand-400',
}) => {
  // Check if title is currency or percentage for CountUp animation
  const isCurrency = title.startsWith('₹');
  const isPercentage = title.endsWith('%');
  const numericValue = parseFloat(title.replace(/[₹,%\s]/g, ''));
  const canAnimate = !isNaN(numericValue) && numericValue >= 0;

  return (
    <SpotlightCard className="!p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3.5">
          {/* Horizon UI Signature Round Icon with Framer spring hover */}
          <motion.div
            whileHover={{ scale: 1.12, rotate: 6 }}
            transition={{ type: 'spring', stiffness: 350, damping: 15 }}
            className={`rounded-2xl ${iconBg} p-3.5 ${iconColor} flex items-center justify-center shrink-0 shadow-inner`}
          >
            <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
          </motion.div>

          <div className="flex flex-col">
            <p className="text-[11px] sm:text-xs font-semibold text-gray-500 dark:text-gray-400 tracking-wide uppercase">
              {subtitle}
            </p>
            <h4 className="text-xl sm:text-2xl font-extrabold text-navy-700 dark:text-white font-poppins tracking-tight mt-0.5">
              {canAnimate ? (
                isCurrency ? (
                  <CountUp value={numericValue} formatINR />
                ) : isPercentage ? (
                  <CountUp value={numericValue} suffix="%" />
                ) : (
                  <CountUp value={numericValue} />
                )
              ) : (
                title
              )}
            </h4>
          </div>
        </div>

        {extra && <div className="shrink-0">{extra}</div>}
      </div>
    </SpotlightCard>
  );
};
