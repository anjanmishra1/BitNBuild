# Daily Bugle Truth Serum

The city's Spider-Sense against AI-generated misinformation.

A futuristic, superhero-inspired AI text detection platform built with React, Tailwind CSS, Framer Motion, and Lucide Icons.

## Features

- Animated web-pattern background with floating particle network
- Radar pulse effects and scanner sweep animations
- Glassmorphism UI with glowing card borders
- Real-time text analysis with heuristic AI detection
- Suspicious phrase highlighting with tooltips
- Animated threat analytics with circular charts and progress bars
- Three demo examples (AI, Human, Fake News)
- Fully responsive dark-mode design

## Tech Stack

- React 18
- TypeScript
- Vite
- Tailwind CSS 3
- Framer Motion
- Lucide React (icons)

## Getting Started

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Project Structure

```
src/
├── App.tsx              # Main app with analysis flow
├── types.ts             # TypeScript interfaces
├── lib/
│   ├── analyze.ts       # Heuristic analysis engine
│   └── demoData.ts      # Demo example texts
└── components/
    ├── Hero.tsx          # Full-screen hero with radar
    ├── TruthScanner.tsx  # Text input + analyze button
    ├── ResultsDashboard.tsx  # 4 metric cards
    ├── VerdictCard.tsx   # Central verdict display
    ├── ExplanationSection.tsx
    ├── SuspiciousHighlighter.tsx
    ├── ThreatAnalytics.tsx
    ├── DemoExamples.tsx
    ├── AboutSection.tsx
    └── ... shared UI components
```

## License

Original superhero-inspired design. No copyrighted assets used.
