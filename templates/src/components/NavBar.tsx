import { motion } from 'framer-motion';
import { Newspaper, Github, AlertCircle } from 'lucide-react';

export default function NavBar() {
  return (
    <motion.nav
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="fixed top-0 left-0 right-0 z-40 glass-strong border-b border-white/5"
    >
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative w-9 h-9 rounded-lg flex items-center justify-center bg-gradient-to-br from-truth-red to-truth-blue">
            <Newspaper className="w-5 h-5 text-white" />
            <div className="absolute inset-0 rounded-lg box-glow-red opacity-50" />
          </div>
          <div className="hidden sm:block">
            <div className="font-display font-bold text-white text-sm leading-tight">Daily Bugle</div>
            <div className="text-[10px] font-display tracking-[0.2em] text-truth-accent/70 uppercase">
              Truth Serum
            </div>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-1">
          {[
            { label: 'Scanner', href: '#scanner' },
            { label: 'Analytics', href: '#analytics' },
            { label: 'Demo', href: '#demo' },
            { label: 'About', href: '#about' },
          ].map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="px-4 py-2 rounded-lg text-sm font-display tracking-wide text-white/60 hover:text-truth-accent hover:bg-truth-accent/10 transition-all"
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full glass">
            <AlertCircle className="w-3.5 h-3.5 text-truth-red" />
            <span className="text-[10px] font-display tracking-widest uppercase text-white/50">
              Live
            </span>
          </div>
          <a
            href="https://bolt.new"
            target="_blank"
            rel="noopener noreferrer"
            className="w-9 h-9 rounded-lg flex items-center justify-center text-white/40 hover:text-white hover:bg-white/5 transition-all"
            aria-label="Source"
          >
            <Github className="w-4.5 h-4.5" />
          </a>
        </div>
      </div>
    </motion.nav>
  );
}
