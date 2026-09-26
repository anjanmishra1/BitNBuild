import { Newspaper } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="relative px-4 py-12 border-t border-white/5 mt-10">
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-truth-red/15 text-truth-red">
            <Newspaper className="w-5 h-5" />
          </div>
          <div>
            <div className="font-display font-bold text-white text-sm">Daily Bugle Truth Serum</div>
            <div className="text-xs text-white/30 font-mono">Misinformation Defense System</div>
          </div>
        </div>
        <p className="text-xs text-white/30 text-center font-mono">
          Original superhero-inspired design. No copyrighted assets used.
        </p>
      </div>
    </footer>
  );
}
