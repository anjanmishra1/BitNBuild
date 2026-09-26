import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Search, Cpu, Radar as RadarIcon, Gavel } from 'lucide-react';
import SectionHeading from '@/components/SectionHeading';

const steps = [
  {
    icon: Search,
    title: 'Text Collection',
    description: 'Input text is ingested and tokenized for deep linguistic analysis.',
  },
  {
    icon: Cpu,
    title: 'Pattern Analysis',
    description: 'Sentence structure, vocabulary diversity, and repetition are measured.',
  },
  {
    icon: RadarIcon,
    title: 'AI Detection',
    description: 'Statistical models compare patterns against known AI generation signatures.',
  },
  {
    icon: Gavel,
    title: 'Verdict Generation',
    description: 'A confidence-weighted verdict is produced with full forensic explanation.',
  },
];

export default function AboutSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section className="relative px-4 py-20 max-w-5xl mx-auto">
      <SectionHeading
        eyebrow="The Workflow"
        title="How Truth Serum Works"
        subtitle="A four-stage pipeline from raw text to verdict."
      />

      <div ref={ref} className="relative">
        <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-truth-accent/30 to-transparent hidden md:block" />

        <div className="space-y-8 md:space-y-0">
          {steps.map((step, i) => {
            const Icon = step.icon;
            const isLeft = i % 2 === 0;
            return (
              <div key={step.title} className="relative md:grid md:grid-cols-2 md:gap-12 items-center md:min-h-[140px]">
                <motion.div
                  initial={{ opacity: 0, x: isLeft ? -40 : 40 }}
                  animate={inView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.6, delay: i * 0.2 }}
                  className={`glass rounded-2xl p-6 flex gap-4 items-start ${isLeft ? 'md:col-start-1' : 'md:col-start-2'}`}
                >
                  <div className="shrink-0 w-12 h-12 rounded-xl flex items-center justify-center bg-truth-accent/15 text-truth-accent">
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-display font-black text-2xl text-truth-accent/40">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <h4 className="font-display font-bold text-lg text-white">{step.title}</h4>
                    </div>
                    <p className="text-sm text-white/50 leading-relaxed">{step.description}</p>
                  </div>
                </motion.div>

                <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 hidden md:flex items-center justify-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={inView ? { scale: 1 } : {}}
                    transition={{ delay: i * 0.2 + 0.3, type: 'spring' }}
                    className="w-4 h-4 rounded-full bg-truth-accent shadow-[0_0_15px_rgba(79,195,247,0.7)] ring-4 ring-truth-accent/10"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
