import { motion } from 'framer-motion';

interface LoadingOverlayProps {
  progress: number;
}

export default function LoadingOverlay({ progress }: LoadingOverlayProps) {
  const phases = [
    'Tokenizing input...',
    'Scanning linguistic patterns...',
    'Cross-referencing AI signatures...',
    'Computing threat vectors...',
    'Generating verdict...',
  ];
  const phaseIndex = Math.min(Math.floor((progress / 100) * phases.length), phases.length - 1);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-truth-bg/80 backdrop-blur-md"
    >
      <div className="relative flex flex-col items-center gap-8">
        <div className="relative w-48 h-48 flex items-center justify-center">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="absolute rounded-full border border-truth-accent/20 animate-radar-pulse"
              style={{
                width: `${80 + i * 50}px`,
                height: `${80 + i * 50}px`,
                animationDelay: `${i * 0.5}s`,
              }}
            />
          ))}
          <div className="absolute w-40 h-40 rounded-full border border-truth-red/20 animate-radar-rotate origin-center">
            <div
              className="absolute top-0 left-1/2 h-20 w-20 origin-bottom-left"
              style={{
                background: 'conic-gradient(from 0deg, rgba(79,195,247,0.3), transparent 60deg)',
                clipPath: 'polygon(0 100%, 100% 100%, 100% 0)',
              }}
            />
          </div>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-12 h-12 rounded-full border-4 border-white/10 border-t-truth-accent"
          />
        </div>

        <div className="text-center">
          <div className="font-display font-bold text-xl text-white mb-2">Scanning the Web...</div>
          <motion.div
            key={phaseIndex}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm text-truth-accent/70 font-mono"
          >
            {phases[phaseIndex]}
          </motion.div>
        </div>

        <div className="w-64 h-1.5 rounded-full bg-white/5 overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-truth-accent to-truth-red"
            style={{ width: `${progress}%` }}
            transition={{ ease: 'linear' }}
          />
        </div>
        <div className="text-xs font-mono text-white/40">{progress}%</div>
      </div>
    </motion.div>
  );
}
