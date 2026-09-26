import { motion } from 'framer-motion';

export default function Radar({ size = 300 }: { size?: number }) {
  const rings = [0.25, 0.5, 0.75, 1];
  const blips = [
    { angle: 35, dist: 0.4, delay: 0.5 },
    { angle: 120, dist: 0.6, delay: 1.2 },
    { angle: 200, dist: 0.3, delay: 2.0 },
    { angle: 280, dist: 0.7, delay: 0.8 },
    { angle: 75, dist: 0.85, delay: 1.6 },
  ];

  return (
    <div
      className="relative"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <div className="absolute inset-0 rounded-full border border-truth-accent/20" />
      <div className="absolute inset-0 rounded-full bg-truth-accent/5 blur-2xl" />

      {rings.map((r, i) => (
        <div
          key={i}
          className="absolute rounded-full border border-truth-accent/15"
          style={{
            inset: `${(1 - r) * 50}%`,
          }}
        />
      ))}

      <div className="absolute top-1/2 left-0 right-0 h-px bg-truth-accent/15" />
      <div className="absolute left-1/2 top-0 bottom-0 w-px bg-truth-accent/15" />

      <div className="absolute inset-0 animate-radar-rotate origin-center">
        <div
          className="absolute top-0 left-1/2 h-1/2 w-1/2 origin-bottom-left"
          style={{
            background:
              'conic-gradient(from 0deg, rgba(79,195,247,0.35), transparent 60deg)',
            clipPath: 'polygon(0 100%, 100% 100%, 100% 0)',
          }}
        />
        <div className="absolute top-0 left-1/2 h-1/2 w-px bg-gradient-to-t from-truth-accent to-transparent" />
      </div>

      <div className="absolute inset-0 flex items-center justify-center">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="absolute rounded-full border border-truth-accent/40 animate-radar-pulse"
            style={{
              width: `${(i + 1) * 33}%`,
              height: `${(i + 1) * 33}%`,
              animationDelay: `${i * 1}s`,
            }}
          />
        ))}
      </div>

      {blips.map((blip, i) => {
        const rad = (blip.angle * Math.PI) / 180;
        const x = 50 + Math.cos(rad) * blip.dist * 50;
        const y = 50 + Math.sin(rad) * blip.dist * 50;
        return (
          <motion.div
            key={i}
            className="absolute w-2 h-2 rounded-full bg-truth-red"
            style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)' }}
            animate={{ opacity: [0, 1, 0], scale: [0.5, 1.5, 0.5] }}
            transition={{ duration: 3, delay: blip.delay, repeat: Infinity }}
          >
            <div className="absolute inset-0 rounded-full bg-truth-red animate-ping" />
          </motion.div>
        );
      })}

      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-3 h-3 rounded-full bg-truth-accent shadow-[0_0_20px_rgba(79,195,247,0.8)]" />
      </div>
    </div>
  );
}
