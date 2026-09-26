import { useState, useCallback, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import WebBackground from '@/components/WebBackground';
import NavBar from '@/components/NavBar';
import Hero from '@/components/Hero';
import TruthScanner from '@/components/TruthScanner';
import ResultsDashboard from '@/components/ResultsDashboard';
import VerdictCard from '@/components/VerdictCard';
import ExplanationSection from '@/components/ExplanationSection';
import SuspiciousHighlighter from '@/components/SuspiciousHighlighter';
import ThreatAnalytics from '@/components/ThreatAnalytics';
import DemoExamples from '@/components/DemoExamples';
import AboutSection from '@/components/AboutSection';
import Footer from '@/components/Footer';
import LoadingOverlay from '@/components/LoadingOverlay';
import { analyzeText } from '@/lib/analyze';
import type { AnalysisResult } from '@/types';

export default function App() {
  const [text, setText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const scannerRef = useRef<HTMLDivElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const scrollToScanner = useCallback(() => {
    document.getElementById('scanner')?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const handleAnalyze = useCallback(async () => {
    if (!text.trim()) return;
    setIsAnalyzing(true);
    setProgress(0);
    setResult(null);

    const progressTimer = setInterval(() => {
      setProgress((p) => (p < 90 ? p + Math.random() * 8 : p)), 120;
    });

    try {
      const analysis = await analyzeText(text);
      clearInterval(progressTimer);
      setProgress(100);
      setTimeout(() => {
        setResult(analysis);
        setIsAnalyzing(false);
        setTimeout(() => {
          resultsRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 200);
      }, 400);
    } catch {
      clearInterval(progressTimer);
      setIsAnalyzing(false);
    }
  }, [text]);

  const handleDemoSelect = useCallback((demoText: string) => {
    setText(demoText);
    setResult(null);
    document.getElementById('scanner')?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  return (
    <div className="relative min-h-screen text-white">
      <WebBackground />
      <NavBar />

      <main className="relative z-10">
        <Hero onActivate={scrollToScanner} />

        <div ref={scannerRef}>
          <TruthScanner
            text={text}
            onTextChange={setText}
            onAnalyze={handleAnalyze}
            isAnalyzing={isAnalyzing}
          />
        </div>

        <AnimatePresence>
          {isAnalyzing && <LoadingOverlay progress={progress} />}
        </AnimatePresence>

        {result && (
          <div ref={resultsRef}>
            <section className="relative px-4 py-16 max-w-5xl mx-auto">
              <ResultsDashboard result={result} />
            </section>

            <section className="relative px-4 py-10 max-w-4xl mx-auto">
              <VerdictCard verdict={result.verdict} threatLevel={result.threatLevel} />
            </section>

            <ExplanationSection explanations={result.explanations} />

            <SuspiciousHighlighter text={text} segments={result.highlightedText} />

            <div id="analytics">
              <ThreatAnalytics result={result} />
            </div>
          </div>
        )}

        <div id="demo">
          <DemoExamples onSelect={handleDemoSelect} />
        </div>

        <div id="about">
          <AboutSection />
        </div>
      </main>

      <Footer />
    </div>
  );
}
