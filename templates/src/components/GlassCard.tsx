import { type ReactNode } from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';

interface GlassCardProps extends HTMLMotionProps<'div'> {
  children: ReactNode;
  glow?: 'red' | 'accent' | 'none';
  className?: string;
}

export default function GlassCard({
  children,
  glow = 'none',
  className = '',
  ...props
}: GlassCardProps) {
  const glowClass =
    glow === 'red'
      ? 'hover:box-glow-red'
      : glow === 'accent'
        ? 'hover:box-glow-accent'
        : '';

  return (
    <motion.div
      className={`glass rounded-2xl ${glowClass} transition-all duration-500 ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  );
}
