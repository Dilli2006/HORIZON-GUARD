import React from 'react';
import { LucideIcon } from 'lucide-react';

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
  iconBg = 'bg-lightPrimary dark:bg-navy-700',
  iconColor = 'text-brand-500 dark:text-white',
}) => {
  return (
    <div className="card-horizon flex !flex-row items-center justify-between">
      <div className="flex items-center gap-4">
        {/* Horizon UI Signature Round Icon */}
        <div className={`rounded-full ${iconBg} p-3.5 ${iconColor} flex items-center justify-center shrink-0`}>
          <Icon className="w-6 h-6" />
        </div>

        <div className="flex flex-col">
          <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">
            {subtitle}
          </p>
          <h4 className="text-xl sm:text-2xl font-bold text-navy-700 dark:text-white font-poppins tracking-tight mt-0.5">
            {title}
          </h4>
        </div>
      </div>

      {extra && <div className="ml-2">{extra}</div>}
    </div>
  );
};
