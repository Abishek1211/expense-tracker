interface SparklineProps {
  data: number[];
  /** Height in px; width always fills the container. */
  height?: number;
  className?: string;
}

/**
 * Minimal inline-SVG trend line. Deliberately not Recharts — a decorative
 * 6-point line inside a stat card doesn't warrant a chart engine, a
 * ResponsiveContainer, or the re-render cost that comes with them.
 * Strokes with `currentColor` so callers control it via text colour.
 */
export default function Sparkline({ data, height = 32, className = '' }: SparklineProps) {
  if (data.length < 2) return null;

  const width = 100; // viewBox units; preserveAspectRatio="none" stretches it
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const stepX = width / (data.length - 1);

  // Inset by 2 units top and bottom so the stroke never clips.
  const points = data.map((value, index) => {
    const x = index * stepX;
    const y = 2 + (1 - (value - min) / span) * (height - 4);
    return [x, y] as const;
  });

  const line = points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`).join(' ');
  const area = `${line} L${width},${height} L0,${height} Z`;
  const [lastX, lastY] = points[points.length - 1];

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className={`w-full ${className}`}
      style={{ height }}
      aria-hidden="true"
    >
      <path d={area} fill="currentColor" opacity={0.12} />
      <path
        d={line}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      <circle cx={lastX} cy={lastY} r={2} fill="currentColor" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
