export type Verdict = 'Likely AI Generated' | 'Mixed Signals' | 'Likely Human Written';

export interface Explanation {
  title: string;
  description: string;
  icon: string;
  severity: 'high' | 'medium' | 'low';
}

export interface HighlightedSegment {
  start: number;
  end: number;
  type: 'generic' | 'repetitive' | 'low-variation';
  tooltip: string;
}

export interface ThreatMetric {
  label: string;
  value: number;
  color: 'red' | 'accent' | 'mixed';
}

export interface AnalysisResult {
  aiProbability: number;
  humanProbability: number;
  confidence: number;
  verdict: Verdict;
  explanations: Explanation[];
  highlightedText: HighlightedSegment[];
  metrics: {
    sentenceDiversity: number;
    vocabularyRichness: number;
    repetitionScore: number;
    aiPatternMatch: number;
  };
  threatLevel: number;
}
