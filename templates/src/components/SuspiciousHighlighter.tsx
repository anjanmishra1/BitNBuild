import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import SectionHeading from '@/components/SectionHeading';
import type { HighlightedSegment } from '@/types';

interface HighlighterProps {
  text: string;
  segments: HighlightedSegment[];
}

export default function SuspiciousHighlighter({ text, segments }: HighlighterProps) {
  const [hovered, setHovered] = useState<number | null>(null);

  const chunks = useMemo(() => {
    if (!segments.length) return [{ text, highlight: false, segment: null }];
    const sorted = [...segments].sort((a, b) => a.start - b.start);
    const result: { text: string; highlight: boolean; segment: HighlightedSegment | null }[] = [];
    let cursor = 0;
    sorted.forEach((seg) => {
      if (seg.start > cursor) {
        result.push({ text: text.slice(cursor, seg.start), highlight: false, segment: null });
      }
      result.push({ text: text.slice(seg.start, seg.end), highlight: true, segment: seg });
      cursor = Math.max(cursor, seg.end);
    });
    if (cursor < text.length) {
      result.push({ text: text.slice(cursor), highlight: false, segment: null });
    }
    return result;
  }, [text, segments]);

  return (
    <section className="relative px-4 py-20 max-w-5xl mx-auto">
      <SectionHeading
        eyebrow="Evidence Map"
        title="Suspicious Text Highlighter"
        subtitle="Suspicious phrases are flagged with a red glow. Hover over them to see why."
      />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="glass-strong rounded-2xl p-6 md:p-8 relative overflow-hidden"
      >
        <div className="absolute inset-0 pointer-events-none opacity-5 bg-gradient-to-b from-truth-red/20 to-transparent" />
        <p className="relative text-base leading-relaxed text-white/80 font-sans whitespace-pre-wrap">
          {chunks.map((chunk, i) =>
            chunk.highlight && chunk.segment ? (
              <span key={i} className="relative inline">
                <motion.span
                  onHoverStart={() => setHovered(i)}
                  onHoverEnd={() => setHovered(null)}
                  className="relative cursor-help rounded px-0.5 text-white"
                  style={{
                    background: 'rgba(177,19,19,0.25)',
                    boxShadow: '0 0 12px rgba(177,19,19,0.4)',
                  }}
                  whileHover={{ backgroundColor: 'rgba(177,19,19,0.45)' }}
                >
                  {chunk.text}
                  {hovered === i && (
                    <motion.span
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 z-20 w-64 px-3 py-2 rounded-lg glass-strong text-xs text-white/90 text-center font-sans pointer-events-none"
                    >
                      {chunk.segment.tooltip}
                    </motion.span>
                  )}
                </motion.span>
              </span>
            ) : (
              <span key={i}>{chunk.text}</span>
            )
          )}
        </p>

        {segments.length === 0 && (
          <div className="mt-4 text-center text-sm text-truth-accent/60 font-mono">
            No suspicious patterns detected in this text.
          </div>
        )}
      </motion.div>

      <div className="flex flex-wrap justify-center gap-4 mt-6">
        {[
          { label: 'Generic AI Phrase', color: 'bg-truth-red' },
          { label: 'Repetitive', color: 'bg-truth-red/70' },
          { label: 'Low Variation', color: 'bg-truth-red/50' },
        ].map((legend) => (
          <div key={legend.label} className="flex items-center gap-2 text-xs text-white/40">
            <span className={`w-3 h-3 rounded ${legend.color}`} />
            {legend.label}
          </div>
        ))}
      </div>
    </section>
  );
}
