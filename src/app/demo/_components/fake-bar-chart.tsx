/**
 * Pure-SVG monthly revenue chart for the demo dashboard. Same visual
 * language as the real yearbook MonthlyChart but with revenue on Y
 * (formatted as "k") and a brand gradient fill.
 */

const W = 600;
const H = 200;
const PAD_L = 36;
const PAD_R = 8;
const PAD_T = 16;
const PAD_B = 28;

export function FakeBarChart({
  values, // paras
  labels,
}: {
  values: number[];
  labels: string[];
}) {
  const max = Math.max(1, ...values);
  // Nice ceiling — round up to nearest 50k paras (5_000_00 = 5000 RSD).
  const niceMax = Math.ceil(max / (50_000_00 / 1)) * (50_000_00 / 1);
  const chartW = W - PAD_L - PAD_R;
  const chartH = H - PAD_T - PAD_B;
  const barW = chartW / values.length;
  const tickStep = niceMax / 4;
  const fmtK = (paras: number) => `${Math.round(paras / 1000 / 100)}k`;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      height={H}
      role="img"
      aria-label="Mesečni prihod"
      className="text-foreground"
    >
      <defs>
        <linearGradient id="demo-bar-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.85} />
          <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0.4} />
        </linearGradient>
      </defs>

      {/* Y gridlines */}
      {[0, 1, 2, 3, 4].map((i) => {
        const v = i * tickStep;
        const y = PAD_T + (1 - v / niceMax) * chartH;
        return (
          <g key={i}>
            <line
              x1={PAD_L}
              x2={W - PAD_R}
              y1={y}
              y2={y}
              stroke="currentColor"
              strokeOpacity={i === 0 ? 0.3 : 0.08}
              strokeDasharray={i === 0 ? "" : "2 3"}
            />
            <text
              x={PAD_L - 4}
              y={y + 3}
              textAnchor="end"
              fontSize={10}
              fill="currentColor"
              opacity={0.5}
            >
              {fmtK(v)}
            </text>
          </g>
        );
      })}

      {/* Bars */}
      {values.map((v, i) => {
        const h = (v / niceMax) * chartH;
        const x = PAD_L + i * barW + barW * 0.18;
        const w = barW * 0.64;
        const y = PAD_T + chartH - h;
        return (
          <rect
            key={i}
            x={x}
            y={y}
            width={w}
            height={h || 1}
            fill="url(#demo-bar-fill)"
            rx={3}
            opacity={v === 0 ? 0.15 : 1}
          />
        );
      })}

      {/* X labels */}
      {labels.map((label, i) => (
        <text
          key={i}
          x={PAD_L + i * barW + barW / 2}
          y={H - 10}
          textAnchor="middle"
          fontSize={10}
          fill="currentColor"
          opacity={0.55}
        >
          {label}
        </text>
      ))}
    </svg>
  );
}
