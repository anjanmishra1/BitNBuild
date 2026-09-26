import { useMemo } from 'react';

interface Node {
  x: number;
  y: number;
  connections: number[];
}

export default function WebBackground() {
  const nodes = useMemo<Node[]>(() => {
    const result: Node[] = [];
    const cols = 8;
    const rows = 6;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const jitter = 0.08;
        const x = (c / (cols - 1)) * 100 + (Math.random() - 0.5) * 12 * jitter * 100;
        const y = (r / (rows - 1)) * 100 + (Math.random() - 0.5) * 12 * jitter * 100;
        result.push({ x, y, connections: [] });
      }
    }
    for (let i = 0; i < result.length; i++) {
      for (let j = i + 1; j < result.length; j++) {
        const dx = result[i].x - result[j].x;
        const dy = result[i].y - result[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 18 && Math.random() > 0.3) {
          result[i].connections.push(j);
        }
      }
    }
    return result;
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
      <div className="absolute inset-0 bg-truth-bg" />
      <div className="absolute inset-0 bg-gradient-to-br from-truth-blue/20 via-transparent to-truth-red/10" />
      <svg className="absolute inset-0 h-full w-full opacity-[0.12]" preserveAspectRatio="none" viewBox="0 0 100 100">
        {nodes.map((node, i) =>
          node.connections.map((j, k) => (
            <line
              key={`${i}-${j}-${k}`}
              x1={node.x}
              y1={node.y}
              x2={nodes[j].x}
              y2={nodes[j].y}
              stroke="#4FC3F7"
              strokeWidth="0.08"
              vectorEffect="non-scaling-stroke"
            />
          ))
        )}
        {nodes.map((node, i) => (
          <circle
            key={i}
            cx={node.x}
            cy={node.y}
            r="0.25"
            fill="#4FC3F7"
            className="animate-glow-pulse"
            style={{ animationDelay: `${i * 0.1}s` }}
          />
        ))}
      </svg>
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-truth-accent/5 blur-[120px]" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-truth-red/5 blur-[100px]" />
    </div>
  );
}
