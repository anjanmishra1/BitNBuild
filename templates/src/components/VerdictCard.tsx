import { motion } from 'framer-motion';
import { Bot, HelpCircle, ShieldCheck } from 'lucide-react';
import type { Verdict } from '@/types';

interface VerdictCardProps {
  verdict: Verdict;
  threatLevel: number;
}

const verdictConfig: Record<
  Verdict,
  { icon: typeof Bot; color: string; glow: string; ring: string; label: string; desc: string }
> = {
  'Likely AI Generated': {
    icon: Bot,
    color: 'text-truth-red',
    glow: 'box-glow-red',
    ring: 'border-truth-red/50',
    label: 'Likely AI Generated',
    desc: 'Spider-Sense detected strong signals of machine-generated content.',
  },
  'Mixed Signals': {
    icon: HelpCircle,
    color: 'text-amber-400',
    glow: 'shadow-[0_0_40px_rgba(251,191,36,0.3)]',
    ring: 'border-amber-400/50',
    label: 'Mixed Signals',
    desc: 'Some AI patterns detected, but human elements remain. Inconclusive.',
  },
  'Likely Human Written': {
    icon: ShieldCheck,
    color: 'text-truth-accent',
    glow: 'box-glow-accent',
    ring: 'border-truth-accent/50',
    label: 'Likely Human Written',
    desc: 'Natural variation and authentic voice detected. Text appears human.',
  },
};

export default function VerdictCard({ verdict, threatLevel }: VerdictCardProps) {
  const config = verdictConfig[verdict];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85, y: 40 }}
      whileInView={{ opacity: 1, scale: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.7, type: 'spring', stiffness: 80 }}
      className="relative"
    >
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="absolute rounded-full border animate-radar-pulse"
            style={{
              width: `${300 + i * 80}px`,
              height: `${300 + i * 80}px`,
              borderColor:
                verdict === 'Likely AI Generated'
                  ? 'rgba(177,19,19,0.15)'
                  : verdict === 'Mixed Signals'
                    ? 'rgba(251,191,36,0.15)'
                    : 'rgba(79,195,247,0.15)',
              animationDelay: `${i * 0.6}s`,
              animationDuration: '3.5s',
            }}
          />
        ))}
      </div>

      <div
        className={`relative glass-strong rounded-3xl p-10 md:p-14 text-center overflow-hidden ${config.glow} border-2 ${config.ring}`}
      >
        <div className="absolute inset-0 animated-border animate-border-flow opacity-20" />
        <div className="absolute inset-x-0 top-0 h-px animated-border animate-border-flow opacity-60" />

        <div className="relative flex flex-col items-center gap-6">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            whileInView={{ scale: 1, rotate: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, type: 'spring', stiffness: 100 }}
            className={`relative w-28 h-28 rounded-2xl flex items-center justify-center ${config.glow}`}
          >
            <div
              className={`absolute inset-0 rounded-2xl ${
                verdict === 'Likely AI Generated'
                  ? 'bg-truth-red/15'
                  : verdict === 'Mixed Signals'
                    ? 'bg-amber-400/15'
                    : 'bg-truth-accent/15'
              }`}
            />
            <Icon className={`w-14 h-14 relative ${config.color}`} strokeWidth={1.5} />
          </motion.div>

          <div>
            <div className="text-xs font-display tracking-[0.4em] uppercase text-white/40 mb-3">
              Verdict
            </div>
            <h3 className={`font-display font-black text-3xl sm:text-4xl md:text-5xl ${config.color}`}>
              {config.label}
            </h3>
          </div>

          <p className="text-white/50 text-base max-w-md">{config.desc}</p>

          <div className="flex items-center gap-3 px-5 py-2.5 rounded-full glass">
            <div className="w-2 h-2 rounded-full bg-white/40 animate-pulse" />
            <span className="text-xs font-mono text-white/60">
              Threat Level: {threatLevel}%
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
