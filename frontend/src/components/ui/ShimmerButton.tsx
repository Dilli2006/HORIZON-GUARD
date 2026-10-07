import React from 'react';
import { motion } from 'framer-motion';

interface ShimmerButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onAnimationStart' | 'onDragStart' | 'onDragEnd' | 'onDrag'> {
  children: React.ReactNode;
  className?: string;
  shimmerColor?: string;
  shimmerDuration?: string;
  borderRadius?: string;
}

export const ShimmerButton: React.FC<ShimmerButtonProps> = ({
  children,
  className = '',
  shimmerColor = '#ffffff',
  shimmerDuration = '3s',
  borderRadius = '16px',
  onClick,
  disabled,
  ...props
}) => {
  return (
    <motion.button
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.97 }}
      onClick={onClick}
      disabled={disabled}
      style={{ borderRadius }}
      className={`group relative overflow-hidden inline-flex items-center justify-center font-bold transition-all shadow-md active:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      {...props}
    >
      {/* 21st.dev Shimmer Sheen Sweep */}
      <div
        className="pointer-events-none absolute -inset-[100%] opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background: `linear-gradient(110deg, transparent 40%, ${shimmerColor}40 45%, ${shimmerColor}80 50%, ${shimmerColor}40 55%, transparent 60%)`,
          animation: `shimmer-sweep ${shimmerDuration} infinite linear`,
        }}
      />
      <div className="relative z-10 flex items-center gap-2">{children}</div>
    </motion.button>
  );
};
