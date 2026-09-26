import { motion } from 'framer-motion';
import {
  Repeat, AlignCenter, Type, BarChart3, Shuffle, BookOpen, Heart,
  type LucideIcon,
} from 'lucide-react';
import GlassCard from '@/components/GlassCard';
import SectionHeading from '@/components/SectionHeading';
import type { Explanation } from '@/types';

const iconMap: Record<string, LucideIcon> = {
  Repeat, AlignCenter, Type, BarChart3, Shuffle, BookOpen, Heart,
};

const severityStyles: Record<Explanation['severity'], { color: string; bg: string }> = {
  high: { color: 'text-truth-red', bg: 'bg-truth-red/15' },
  medium: { color: 'text-amber-400', bg: 'bg-amber-400/15' },
  low: { color: 'text-truth-accent', bg: 'bg-truth-accent/15' },
};

export default function ExplanationSection({ explanations }: { explanations: Explanation[] }) {
  return (
    <section className="relative px-4 py-20 max-w-5xl mx-auto">
      <SectionHeading
        eyebrow="Forensic Breakdown"
        title="Why Spider-Sense Triggered"
        subtitle="The patterns and signals that led the scanner to its verdict."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {explanations.map((exp, i) => {
          const Icon = iconMap[exp.icon] ?? BarChart3;
          const style = severityStyles[exp.severity];
          return (
            <GlassCard
              key={i}
              initial={{ opacity: 0, x: i % 2 === 0 ? -30 : 30, y: 20 }}
              whileInView={{ opacity: 1, x: 0, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              whileHover={{ y: -4 }}
              className="p-6 flex gap-4 items-start"
            >
              <div className={`shrink-0 w-12 h-12 rounded-xl flex items-center justify-center ${style.bg} ${style.color}`}>
                <Icon className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-display font-bold text-lg text-white mb-1">{exp.title}</h4>
                <p className="text-white/50 text-sm leading-relaxed">{exp.description}</p>
                <div className="mt-3 inline-flex items-center gap-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${style.color.replace('text-', 'bg-')}`} />
                  <span className="text-[10px] font-display tracking-widest uppercase text-white/40">
                    {exp.severity} signal
                  </span>
                </div>
              </div>
            </GlassCard>
          );
        })}
      </div>
    </section>
  );
}
