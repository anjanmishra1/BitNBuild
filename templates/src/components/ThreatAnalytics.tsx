import { motion } from 'framer-motion';
import SectionHeading from '@/components/SectionHeading';
import type { AnalysisResult } from '@/types';

interface ThreatAnalyticsProps {
  result: AnalysisResult;
}

function CircularProgress({
  value,
  label,
  color,
  delay,
}: {
  value: number;
  label: string;
  color: 'red' | 'accent' | 'mixed';
  delay: number;
}) {
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  const stroke =
    color === 'red'
      ? '#B11313'
      : color === 'accent'
        ? '#4FC3F7'
        : 'url(#mixedGrad)';

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative w-36 h-36">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
          <defs>
            <linearGradient id="mixedGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#B11313" />
              <stop offset="100%" stopColor="#4FC3F7" />
            </linearGradient>
          </defs>
          <circle cx="60" cy="60" r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
          <motion.circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke={stroke}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            whileInView={{ strokeDashoffset: offset }}
            viewport={{ once: true }}
            transition={{ duration: 1.4, delay, ease: 'easeOut' }}
            style={{ filter: `drop-shadow(0 0 6px ${color === 'red' ? 'rgba(177,19,19,0.6)' : 'rgba(79,195,247,0.6)'})` }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`font-display font-black text-2xl ${color === 'red' ? 'text-truth-red' : color === 'accent' ? 'text-truth-accent' : 'text-white'}`}>
            {Math.round(value)}%
          </span>
        </div>
      </div>
      <span className="text-xs font-display tracking-widest uppercase text-white/50 text-center">
        {label}
      </span>
    </div>
  );
}

export default function ThreatAnalytics({ result }: ThreatAnalyticsProps) {
  const bars = [
    { label: 'Sentence Diversity', value: result.metrics.sentenceDiversity, color: 'accent' as const },
    { label: 'Vocabulary Richness', value: result.metrics.vocabularyRichness, color: 'accent' as const },
    { label: 'Repetition Score', value: result.metrics.repetitionScore, color: 'red' as const },
    { label: 'AI Pattern Match', value: result.metrics.aiPatternMatch, color: 'red' as const },
  ];

  return (
    <section className="relative px-4 py-20 max-w-6xl mx-auto">
      <SectionHeading
        eyebrow="Deep Diagnostics"
        title="Threat Analytics"
        subtitle="Granular metrics powering the Spider-Sense verdict."
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="glass-strong rounded-2xl p-8"
        >
          <h4 className="font-display font-bold text-lg text-white mb-8 text-center">Circular Scan</h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 justify-items-center">
            <CircularProgress value={result.metrics.sentenceDiversity} label="Diversity" color="accent" delay={0} />
            <CircularProgress value={result.metrics.vocabularyRichness} label="Vocab" color="accent" delay={0.15} />
            <CircularProgress value={result.metrics.repetitionScore} label="Repeat" color="red" delay={0.3} />
            <CircularProgress value={result.metrics.aiPatternMatch} label="AI Match" color="red" delay={0.45} />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="glass-strong rounded-2xl p-8"
        >
          <h4 className="font-display font-bold text-lg text-white mb-8 text-center">Progress Vectors</h4>
          <div className="space-y-6">
            {bars.map((bar, i) => (
              <div key={bar.label}>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-white/60 font-display tracking-wide">{bar.label}</span>
                  <span className={`text-sm font-mono ${bar.color === 'red' ? 'text-truth-red' : 'text-truth-accent'}`}>
                    {bar.value}%
                  </span>
                </div>
                <div className="h-2.5 rounded-full bg-white/5 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: `${bar.value}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 1.2, delay: i * 0.1, ease: 'easeOut' }}
                    className={`h-full rounded-full ${
                      bar.color === 'red'
                        ? 'bg-gradient-to-r from-truth-red to-truth-red/50'
                        : 'bg-gradient-to-r from-truth-accent to-truth-accent/50'
                    }`}
                    style={{
                      boxShadow: bar.color === 'red' ? '0 0 10px rgba(177,19,19,0.5)' : '0 0 10px rgba(79,195,247,0.5)',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
