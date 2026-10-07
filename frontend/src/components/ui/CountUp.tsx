import React, { useEffect } from 'react';
import { useMotionValue, useSpring, useTransform, motion } from 'framer-motion';

interface CountUpProps {
  value: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
  formatINR?: boolean;
  className?: string;
}

export const CountUp: React.FC<CountUpProps> = ({
  value,
  prefix = '',
  suffix = '',
  formatINR = false,
  className = '',
}) => {
  const motionVal = useMotionValue(0);
  const springVal = useSpring(motionVal, {
    damping: 30,
    stiffness: 120,
    mass: 0.8,
  });

  useEffect(() => {
    motionVal.set(value);
  }, [value, motionVal]);

  const display = useTransform(springVal, (current) => {
    const rounded = Math.round(current);
    if (formatINR) {
      const isNeg = rounded < 0;
      const absVal = Math.abs(rounded);
      let str = absVal.toString();
      if (str.length > 3) {
        let head = str.slice(0, -3);
        const tail = str.slice(-3);
        const parts: string[] = [];
        while (head.length > 2) {
          parts.unshift(head.slice(-2));
          head = head.slice(0, -2);
        }
        if (head.length > 0) parts.unshift(head);
        str = parts.join(',') + ',' + tail;
      }
      return `${prefix}${isNeg ? '-' : ''}₹${str}${suffix}`;
    }
    return `${prefix}${rounded.toLocaleString()}${suffix}`;
  });

  return <motion.span className={className}>{display}</motion.span>;
};
