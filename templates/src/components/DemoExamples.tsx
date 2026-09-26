import { motion } from 'framer-motion';
import { Bot, User, Newspaper, type LucideIcon } from 'lucide-react';
import GlassCard from '@/components/GlassCard';
import SectionHeading from '@/components/SectionHeading';
import { demoExamples } from '@/lib/demoData';

const iconMap: Record<string, LucideIcon> = { Bot, User, Newspaper };
const labelColor: Record<string, string> = {
  'AI Generated': 'text-truth-red bg-truth-red/15',
  'Human Written': 'text-truth-accent bg-truth-accent/15',
  'Fake News': 'text-amber-400 bg-amber-400/15',
};

interface DemoExamplesProps {
  onSelect: (text: string) => void;
}

export default function DemoExamples({ onSelect }: DemoExamplesProps) {
  return (
    <section className="relative px-4 py-20 max-w-5xl mx-auto">
      <SectionHeading
        eyebrow="Test Bench"
        title="Demo Examples"
        subtitle="Load a sample into the scanner to see the Truth Serum in action."
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {demoExamples.map((example, i) => {
          const Icon = iconMap[example.id === 'ai' ? 'Bot' : example.id === 'human' ? 'User' : 'Newspaper'];
          return (
            <GlassCard
              key={example.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.12 }}
              whileHover={{ y: -6 }}
              glow="accent"
              className="p-6 flex flex-col gap-4 cursor-pointer"
              onClick={() => onSelect(example.text)}
            >
              <div className="flex items-center justify-between">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-white/5 text-truth-accent">
                  <Icon className="w-5 h-5" />
                </div>
                <span className={`text-[10px] font-display tracking-widest uppercase px-2.5 py-1 rounded-full ${labelColor[example.label]}`}>
                  {example.label}
                </span>
              </div>
              <div>
                <h4 className="font-display font-bold text-lg text-white mb-1">{example.title}</h4>
                <p className="text-sm text-white/50 leading-relaxed">{example.description}</p>
              </div>
              <p className="text-xs text-white/30 font-mono line-clamp-2 italic">
                "{example.text.slice(0, 90)}..."
              </p>
              <div className="mt-auto pt-2 text-xs font-display tracking-widest uppercase text-truth-accent/70 flex items-center gap-1.5">
                Load into Scanner →
              </div>
            </GlassCard>
          );
        })}
      </div>
    </section>
  );
}
