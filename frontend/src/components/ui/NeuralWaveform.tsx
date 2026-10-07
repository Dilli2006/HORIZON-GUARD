import React from 'react';
import { motion } from 'framer-motion';

interface NeuralWaveformProps {
  active?: boolean;
  bars?: number;
  className?: string;
  color?: string;
}

export const NeuralWaveform: React.FC<NeuralWaveformProps> = ({
  active = true,
  bars = 16,
  className = '',
  color = 'from-brand-500 to-cyan-400',
}) => {
  return (
    <div className={`flex items-center gap-1 h-7 ${className}`}>
      {Array.from({ length: bars }).map((_, i) => (
        <motion.span
          key={i}
          animate={
            active
              ? {
                  scaleY: [0.2, Math.min(1, 0.3 + ((i % 4) + 1) * 0.22), 0.3, Math.min(1, 0.4 + ((i % 5) + 1) * 0.15), 0.2],
                  opacity: [0.6, 1, 0.7, 0.95, 0.6],
                }
              : { scaleY: 0.2, opacity: 0.4 }
          }
          transition={{
            duration: 1.2 + (i % 3) * 0.25,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: (i * 0.08) % 0.8,
          }}
          className={`w-1 h-full rounded-full bg-gradient-to-t ${color} origin-center`}
        />
      ))}
    </div>
  );
};
