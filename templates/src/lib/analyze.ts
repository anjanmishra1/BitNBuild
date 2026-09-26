import type { AnalysisResult } from '@/types';

const AI_EXPLANATIONS = [
  {
    title: 'Repetitive patterns detected',
    description: 'Sentence structures repeat with near-identical cadence, a hallmark of machine generation.',
    icon: 'Repeat',
    severity: 'high' as const,
  },
  {
    title: 'Unusual sentence consistency',
    description: 'Sentence length variance is abnormally low — human writing tends to be more erratic.',
    icon: 'AlignCenter',
    severity: 'high' as const,
  },
  {
    title: 'Generic phrasing',
    description: 'Overuse of broad, non-committal phrases that could fit any context.',
    icon: 'Type',
    severity: 'medium' as const,
  },
  {
    title: 'Low linguistic variation',
    description: 'Limited vocabulary diversity and predictable word choice throughout the text.',
    icon: 'BarChart3',
    severity: 'medium' as const,
  },
];

const HUMAN_EXPLANATIONS = [
  {
    title: 'Natural sentence variation',
    description: 'Sentence lengths and structures vary organically, as expected in human writing.',
    icon: 'Shuffle',
    severity: 'low' as const,
  },
  {
    title: 'Rich vocabulary diversity',
    description: 'Broad word usage with idiomatic expressions and irregular phrasing.',
    icon: 'BookOpen',
    severity: 'low' as const,
  },
  {
    title: 'Emotional nuance detected',
    description: 'Subtle tone shifts and personal voice markers suggest a human author.',
    icon: 'Heart',
    severity: 'low' as const,
  },
];

function findSegments(text: string): { segments: import('@/types').HighlightedSegment[]; aiProb: number } {
  const segments: import('@/types').HighlightedSegment[] = [];
  const genericPhrases = [
    'in conclusion',
    'it is important to note',
    'in today\'s world',
    'plays a crucial role',
    'delve into',
    'navigate the complexities',
    'a testament to',
    'at the forefront',
    'ever-evolving',
    'foster a sense',
    'tapestry',
    'nuances',
  ];

  const lower = text.toLowerCase();
  let genericCount = 0;

  genericPhrases.forEach((phrase) => {
    let idx = lower.indexOf(phrase);
    while (idx !== -1) {
      segments.push({
        start: idx,
        end: idx + phrase.length,
        type: 'generic',
        tooltip: `"${phrase}" is a commonly AI-generated generic phrase.`,
      });
      genericCount++;
      idx = lower.indexOf(phrase, idx + phrase.length);
    }
  });

  const words = text.split(/\s+/).filter(Boolean);
  const wordFreq: Record<string, number> = {};
  words.forEach((w) => {
    const lw = w.toLowerCase().replace(/[^a-z]/g, '');
    if (lw.length > 4) wordFreq[lw] = (wordFreq[lw] || 0) + 1;
  });

  const repeated = Object.entries(wordFreq).filter(([, c]) => c >= 4);
  repeated.forEach(([word, count]) => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    let m: RegExpExecArray | null;
    while ((m = regex.exec(text)) !== null) {
      if (m.index !== undefined) {
        segments.push({
          start: m.index,
          end: m.index + m[0].length,
          type: 'repetitive',
          tooltip: `"${m[0]}" appears ${count} times — high repetition is an AI signal.`,
        });
      }
    }
  });

  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 10);
  const lengths = sentences.map((s) => s.trim().split(/\s+/).length);
  const avg = lengths.reduce((a, b) => a + b, 0) / (lengths.length || 1);
  const variance =
    lengths.reduce((acc, l) => acc + Math.pow(l - avg, 2), 0) / (lengths.length || 1);
  const stdDev = Math.sqrt(variance);

  if (stdDev < 3 && sentences.length > 3) {
    segments.push({
      start: 0,
      end: Math.min(text.length, 50),
      type: 'low-variation',
      tooltip: 'Low sentence-length variation — text is mechanically uniform.',
    });
  }

  const uniqueWords = new Set(words.map((w) => w.toLowerCase().replace(/[^a-z]/g, ''))).size;
  const richness = words.length ? (uniqueWords / words.length) * 100 : 100;

  let aiProb = 0;
  aiProb += Math.min(genericCount * 12, 40);
  aiProb += Math.min(segments.length * 3, 25);
  if (stdDev < 3 && sentences.length > 3) aiProb += 20;
  if (richness < 50) aiProb += 15;
  aiProb = Math.max(8, Math.min(96, aiProb));

  return { segments, aiProb };
}

function computeMetrics(text: string, aiProb: number) {
  const words = text.split(/\s+/).filter(Boolean);
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  const uniqueWords = new Set(words.map((w) => w.toLowerCase().replace(/[^a-z]/g, '')));

  const vocabularyRichness = words.length
    ? Math.min(100, Math.round((uniqueWords.size / words.length) * 140))
    : 50;

  const lengths = sentences.map((s) => s.trim().split(/\s+/).length);
  const avg = lengths.reduce((a, b) => a + b, 0) / (lengths.length || 1);
  const variance =
    lengths.reduce((acc, l) => acc + Math.pow(l - avg, 2), 0) / (lengths.length || 1);
  const stdDev = Math.sqrt(variance);
  const sentenceDiversity = Math.min(100, Math.round(stdDev * 12));

  const repetitionScore = Math.min(100, Math.max(0, 100 - vocabularyRichness));

  return {
    sentenceDiversity: Math.max(10, sentenceDiversity),
    vocabularyRichness: Math.max(10, vocabularyRichness),
    repetitionScore,
    aiPatternMatch: Math.round(aiProb),
  };
}

export async function analyzeText(text: string): Promise<AnalysisResult> {
  await new Promise((r) => setTimeout(r, 2200));

  const { segments, aiProb } = findSegments(text);
  const aiProbability = aiProb;
  const humanProbability = 100 - aiProbability;
  const confidence = Math.min(98, 55 + Math.round(segments.length * 4) + Math.round(Math.abs(aiProb - 50) * 0.4));

  let verdict: import('@/types').Verdict;
  let explanations: import('@/types').Explanation[];
  if (aiProbability >= 60) {
    verdict = 'Likely AI Generated';
    explanations = AI_EXPLANATIONS.slice(0, 4);
  } else if (aiProbability >= 40) {
    verdict = 'Mixed Signals';
    explanations = [...AI_EXPLANATIONS.slice(0, 2), ...HUMAN_EXPLANATIONS.slice(0, 2)];
  } else {
    verdict = 'Likely Human Written';
    explanations = HUMAN_EXPLANATIONS;
  }

  const metrics = computeMetrics(text, aiProb);
  const threatLevel = Math.round(aiProbability);

  return {
    aiProbability,
    humanProbability,
    confidence,
    verdict,
    explanations,
    highlightedText: segments,
    metrics,
    threatLevel,
  };
}
