import { useRef, type ReactNode } from 'react';
import { motion, useInView } from 'framer-motion';

interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  children?: ReactNode;
}

export default function SectionHeading({ eyebrow, title, subtitle, children }: SectionHeadingProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6 }}
      className="text-center mb-12"
    >
      {eyebrow && (
        <div className="inline-flex items-center gap-2 mb-4">
          <span className="h-px w-8 bg-truth-accent/40" />
          <span className="text-xs font-display tracking-[0.3em] text-truth-accent/70 uppercase">
            {eyebrow}
          </span>
          <span className="h-px w-8 bg-truth-accent/40" />
        </div>
      )}
      <h2 className="font-display font-bold text-3xl sm:text-4xl md:text-5xl text-white mb-4">
        {title}
      </h2>
      {subtitle && (
        <p className="text-white/50 text-lg max-w-2xl mx-auto">{subtitle}</p>
      )}
      {children}
    </motion.div>
  );
}
