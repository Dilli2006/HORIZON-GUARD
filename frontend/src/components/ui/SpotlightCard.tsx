import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';

interface SpotlightCardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onAnimationStart' | 'onDragStart' | 'onDragEnd' | 'onDrag'> {
  children: React.ReactNode;
  className?: string;
  spotlightColor?: string;
  borderColor?: string;
}

export const SpotlightCard: React.FC<SpotlightCardProps> = ({
  children,
  className = '',
  spotlightColor = 'rgba(67, 24, 255, 0.14)',
  borderColor = 'rgba(67, 24, 255, 0.35)',
  ...props
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setPosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{ y: -3, transition: { duration: 0.2, ease: 'easeOut' } }}
      className={`relative overflow-hidden rounded-[20px] bg-white dark:bg-navy-800 border border-slate-200/80 dark:border-white/5 shadow-xl shadow-shadow-500/10 dark:shadow-none transition-colors ${className}`}
      {...props}
    >
      {/* 21st.dev / React Bits Spotlight Cursor Glow */}
      <div
        className="pointer-events-none absolute -inset-px rounded-[20px] opacity-0 transition-opacity duration-300"
        style={{
          opacity: isHovered ? 1 : 0,
          background: `radial-gradient(550px circle at ${position.x}px ${position.y}px, ${spotlightColor}, transparent 65%)`,
        }}
      />

      {/* Border Highlight Overlay */}
      <div
        className="pointer-events-none absolute -inset-px rounded-[20px] opacity-0 transition-opacity duration-300"
        style={{
          opacity: isHovered ? 1 : 0,
          border: `1px solid ${borderColor}`,
          maskImage: `radial-gradient(280px circle at ${position.x}px ${position.y}px, black, transparent)`,
          WebkitMaskImage: `radial-gradient(280px circle at ${position.x}px ${position.y}px, black, transparent)`,
        }}
      />

      {/* Inner Content */}
      <div className="relative z-10 h-full">{children}</div>
    </motion.div>
  );
};
