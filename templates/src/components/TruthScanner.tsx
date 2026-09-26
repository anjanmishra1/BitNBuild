import { useState, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Eraser, ClipboardPaste, FileText, Sparkles } from 'lucide-react';
import SectionHeading from '@/components/SectionHeading';

interface TruthScannerProps {
  text: string;
  onTextChange: (text: string) => void;
  onAnalyze: () => void;
  isAnalyzing: boolean;
}

export default function TruthScanner({ text, onTextChange, onAnalyze, isAnalyzing }: TruthScannerProps) {
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const charCount = text.length;
  const wordCount = useMemo(() => text.trim().split(/\s+/).filter(Boolean).length, [text]);

  const handlePaste = async () => {
    try {
      const clip = await navigator.clipboard.readText();
      if (clip) onTextChange(clip);
    } catch {
      textareaRef.current?.focus();
    }
  };

  const handleClear = () => {
    onTextChange('');
    textareaRef.current?.focus();
  };

  return (
    <section id="scanner" className="relative px-4 py-20 max-w-5xl mx-auto scroll-mt-20">
      <SectionHeading
        eyebrow="Investigation Console"
        title="Truth Scanner"
        subtitle="Paste any text into the console below and let the Spider-Sense analyze it for AI fingerprints."
      />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.6 }}
        className="relative"
      >
        <div
          className={`relative rounded-2xl glass-strong overflow-hidden transition-all duration-500 ${
            isFocused ? 'box-glow-accent border-truth-accent/40' : ''
          }`}
        >
          {isFocused && (
            <div className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-truth-accent to-transparent animate-scan-line z-10 pointer-events-none" />
          )}

          <div className="flex items-center justify-between px-5 py-3 border-b border-white/5">
            <div className="flex items-center gap-2 text-white/40">
              <FileText className="w-4 h-4 text-truth-accent/60" />
              <span className="text-xs font-display tracking-widest uppercase">Input Field</span>
            </div>
            <div className="flex items-center gap-4 text-xs font-mono text-white/40">
              <span>{wordCount} words</span>
              <span className="text-white/20">|</span>
              <span>{charCount} chars</span>
            </div>
          </div>

          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => onTextChange(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="Paste an article, social media post, message, or headline to investigate..."
            className="w-full h-56 bg-transparent text-white/90 placeholder:text-white/25 text-base leading-relaxed p-5 resize-none focus:outline-none font-sans"
          />

          <div className="flex items-center justify-between px-5 py-3 border-t border-white/5">
            <div className="flex items-center gap-2">
              <button
                onClick={handlePaste}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-display tracking-wide uppercase text-white/60 hover:text-truth-accent hover:bg-truth-accent/10 transition-all"
              >
                <ClipboardPaste className="w-3.5 h-3.5" /> Paste
              </button>
              <button
                onClick={handleClear}
                disabled={!text}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-display tracking-wide uppercase text-white/60 hover:text-truth-red hover:bg-truth-red/10 transition-all disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-white/60"
              >
                <Eraser className="w-3.5 h-3.5" /> Clear
              </button>
            </div>
            <div className="flex items-center gap-1.5 text-white/30">
              <Sparkles className="w-3.5 h-3.5" />
              <span className="text-xs font-mono">Ready</span>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="flex flex-col items-center mt-10"
      >
        <div className="relative flex items-center justify-center">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="absolute rounded-full border border-truth-accent/20 animate-radar-pulse"
              style={{
                width: `${120 + i * 60}px`,
                height: `${120 + i * 60}px`,
                animationDelay: `${i * 0.8}s`,
                animationDuration: '3s',
              }}
            />
          ))}

          <div className="absolute w-48 h-48 rounded-full border border-truth-red/20 animate-radar-rotate origin-center pointer-events-none">
            <div className="absolute top-0 left-1/2 h-24 w-24 origin-bottom-left"
              style={{
                background: 'conic-gradient(from 0deg, rgba(177,19,19,0.2), transparent 60deg)',
                clipPath: 'polygon(0 100%, 100% 100%, 100% 0)',
              }}
            />
          </div>

          {isAnalyzing ? (
            <motion.button
              disabled
              className="relative z-10 w-44 h-44 rounded-full flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-truth-red/30 to-truth-blue/30 border-2 border-truth-accent/40"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
                className="w-10 h-10 rounded-full border-[3px] border-white/20 border-t-truth-accent"
              />
              <span className="font-display font-bold text-sm tracking-wide uppercase text-white">
                Scanning
              </span>
              <span className="text-xs text-white/50 font-mono">the Web...</span>
            </motion.button>
          ) : (
            <motion.button
              onClick={onAnalyze}
              disabled={!text.trim()}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.96 }}
              className="group relative z-10 w-44 h-44 rounded-full flex items-center justify-center text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <span className="absolute inset-0 rounded-full bg-gradient-to-br from-truth-red to-truth-blue group-hover:from-truth-red group-hover:to-truth-red/70 transition-all duration-500" />
              <span className="absolute inset-0 rounded-full opacity-50 group-hover:opacity-100 transition-opacity duration-500 box-glow-red" />
              <span className="absolute -inset-2 rounded-full border border-truth-accent/30 group-hover:border-truth-accent/60 group-hover:animate-radar-rotate transition-colors duration-500" />
              <span className="absolute -inset-5 rounded-full border border-dashed border-truth-accent/15 group-hover:border-truth-accent/30 transition-colors duration-500" />
              <span className="relative font-display font-bold text-sm tracking-wide uppercase text-center leading-tight">
                Activate
                <br />
                Spider-Sense
              </span>
            </motion.button>
          )}
        </div>

        {!isAnalyzing && (
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5 }}
            className="mt-6 text-sm text-white/40 font-mono"
          >
            {text.trim() ? 'Press to analyze' : 'Enter text above to begin'}
          </motion.p>
        )}
      </motion.div>
    </section>
  );
}
