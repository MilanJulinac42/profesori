type Props = {
  data: number[];
  color?: string;
  height?: number;
  className?: string;
};

const W = 100; // viewBox width — stretched via preserveAspectRatio

/**
 * Tiny area sparkline as plain SVG. ~0 KB dependency cost vs ~308 KB recharts.
 * Width fills container; height is exact (px). viewBox scales horizontally.
 */
export function Sparkline({
  data,
  color = "var(--brand)",
  height = 40,
  className,
}: Props) {
  if (data.length < 2) return <div className={className} style={{ height }} />;

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = Math.max(1e-9, max - min);
  const stepX = W / (data.length - 1);
  const top = 4;
  const usableH = height - top;

  const points = data.map((v, i) => {
    const x = i * stepX;
    const y = top + (1 - (v - min) / range) * usableH;
    return [x, y] as const;
  });

  const linePath = points
    .map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`)
    .join(" ");
  const areaPath = `${linePath} L${W} ${height} L0 ${height} Z`;

  const gradientId = `spark-${Math.random().toString(36).slice(2, 9)}`;

  return (
    <svg
      className={className}
      viewBox={`0 0 ${W} ${height}`}
      preserveAspectRatio="none"
      width="100%"
      height={height}
      role="img"
      aria-hidden
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.4} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${gradientId})`} />
      <path
        d={linePath}
        fill="none"
        stroke={color}
        strokeWidth={2}
        vectorEffect="non-scaling-stroke"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}
