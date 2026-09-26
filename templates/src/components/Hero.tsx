import { motion } from 'framer-motion';
import { ChevronDown, ShieldCheck } from 'lucide-react';
import Radar from '@/components/Radar';
import ParticleField from '@/components/ParticleField';

export default function Hero({ onActivate }: { onActivate: () => void }) {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center px-4 py-20 overflow-hidden">
      <ParticleField count={50} />

      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <Radar size={640} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 text-center max-w-4xl"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass mb-8"
        >
          <ShieldCheck className="w-4 h-4 text-truth-accent" />
          <span className="text-sm font-display tracking-widest text-truth-accent/90 uppercase">
            Misinformation Defense System
          </span>
        </motion.div>

        <h1 className="font-display font-black text-5xl sm:text-6xl md:text-7xl lg:text-8xl leading-[1.05] mb-6">
          <span className="block text-white">Daily Bugle</span>
          <span className="block text-glow-red text-truth-red">Truth Serum</span>
        </h1>

        <p className="text-lg sm:text-xl md:text-2xl text-white/60 font-light mb-10 max-w-2xl mx-auto">
          The city's Spider-Sense against AI-generated misinformation.
        </p>

        <motion.button
          onClick={onActivate}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.97 }}
          className="group relative inline-flex items-center gap-3 px-10 py-4 rounded-full font-display font-bold text-lg tracking-wide uppercase text-white overflow-hidden"
        >
          <span className="absolute inset-0 rounded-full bg-gradient-to-r from-truth-red via-truth-red to-truth-blue group-hover:from-truth-red group-hover:to-truth-accent transition-all duration-500" />
          <span className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 box-glow-red" />
          <span className="absolute -inset-1 rounded-full border border-truth-accent/30 group-hover:border-truth-accent/60 transition-colors duration-500" />
          <span className="relative flex items-center gap-3">
            <motion.span
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
              className="w-5 h-5 rounded-full border-2 border-white/40 border-t-white"
            />
            Activate Spider-Sense
          </span>
        </motion.button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/40"
      >
        <span className="text-xs font-display tracking-widest uppercase">Scroll to Investigate</span>
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <ChevronDown className="w-5 h-5" />
        </motion.div>
      </motion.div>
    </section>
  );
}
