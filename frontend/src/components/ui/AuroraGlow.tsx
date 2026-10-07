import React from 'react';
import { motion } from 'framer-motion';

interface AuroraGlowProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const AuroraGlow: React.FC<AuroraGlowProps> = ({ className = '', size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-48 h-48',
    md: 'w-80 h-80',
    lg: 'w-[480px] h-[480px]',
  };

  return (
    <div className={`pointer-events-none absolute overflow-hidden ${className}`}>
      {/* Primary Indigo/Cyan Aurora Orb */}
      <motion.div
        animate={{
          scale: [1, 1.25, 0.95, 1],
          x: [0, 25, -20, 0],
          y: [0, -30, 20, 0],
        }}
        transition={{
          duration: 14,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className={`absolute rounded-full bg-gradient-to-tr from-brand-600/25 via-blueSecondary/20 to-cyan-400/20 blur-3xl ${sizeClasses[size]}`}
      />

      {/* Secondary Violet/Magenta Counter Orb */}
      <motion.div
        animate={{
          scale: [1.1, 0.9, 1.2, 1.1],
          x: [0, -35, 15, 0],
          y: [0, 25, -25, 0],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 2,
        }}
        className={`absolute rounded-full bg-gradient-to-br from-purple-600/20 via-pink-500/15 to-transparent blur-3xl ${sizeClasses[size]}`}
      />
    </div>
  );
};
