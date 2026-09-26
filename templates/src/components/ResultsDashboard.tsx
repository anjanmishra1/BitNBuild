import { motion } from 'framer-motion';
import { Brain, User, Gauge, AlertTriangle } from 'lucide-react';
import GlassCard from '@/components/GlassCard';
import CountUp from '@/components/CountUp';
import type { AnalysisResult } from '@/types';

interface ResultsDashboardProps {
  result: AnalysisResult;
}

export default function ResultsDashboard({ result }: ResultsDashboardProps) {
  const cards = [
    {
      label: 'AI Probability',
      value: result.aiProbability,
      icon: Brain,
      color: 'red',
      suffix: '%',
    },
    {
      label: 'Human Probability',
      value: result.humanProbability,
      icon: User,
      color: 'accent',
      suffix: '%',
    },
    {
      label: 'Confidence Level',
      value: result.confidence,
      icon: Gauge,
      color: 'accent',
      suffix: '%',
    },
    {
      label: 'Spider-Sense Threat',
      value: result.threatLevel,
      icon: AlertTriangle,
      color: 'red',
      suffix: '%',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, i) => {
        const Icon = card.icon;
        const isRed = card.color === 'red';
        return (
          <GlassCard
            key={card.label}
            glow={card.color as 'red' | 'accent'}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
            whileHover={{ y: -6 }}
            className="p-6 text-center relative overflow-hidden"
          >
            <div
              className={`absolute -top-8 -right-8 w-24 h-24 rounded-full blur-2xl ${
                isRed ? 'bg-truth-red/20' : 'bg-truth-accent/20'
              }`}
            />
            <div className="relative flex flex-col items-center gap-3">
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  isRed ? 'bg-truth-red/15 text-truth-red' : 'bg-truth-accent/15 text-truth-accent'
                }`}
              >
                <Icon className="w-6 h-6" />
              </div>
              <div
                className={`font-display font-black text-4xl ${
                  isRed ? 'text-glow-red text-truth-red' : 'text-glow-accent text-truth-accent'
                }`}
              >
                <CountUp end={card.value} suffix={card.suffix} />
              </div>
              <div className="text-xs font-display tracking-widest uppercase text-white/50">
                {card.label}
              </div>
              <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden mt-1">
                <motion.div
                  initial={{ width: 0 }}
                  whileInView={{ width: `${card.value}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 1, delay: 0.3 + i * 0.1, ease: 'easeOut' }}
                  className={`h-full rounded-full ${
                    isRed
                      ? 'bg-gradient-to-r from-truth-red to-truth-red/60'
                      : 'bg-gradient-to-r from-truth-accent to-truth-accent/60'
                  }`}
                />
              </div>
            </div>
          </GlassCard>
        );
      })}
    </div>
  );
}
