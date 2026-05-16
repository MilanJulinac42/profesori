/**
 * Tiny SVG bar chart of completed lessons per month. Print-friendly
 * (black bars + light grid). Server component, no JS.
 */
export function MonthlyChart({
  values,
  labels,
}: {
  /** 12 numbers, completed lessons in each month. */
  values: number[];
  /** 12 short month labels e.g. ["Jan","Feb",...]. */
  labels: string[];
}) {
  const max = Math.max(1, ...values);
  const W = 600;
  const H = 160;
  const padL = 28;
  const padR = 8;
  const padT = 8;
  const padB = 24;
  const chartW = W - padL - padR;
  const chartH = H - padT - padB;
  const barW = chartW / values.length;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      height={H}
      role="img"
      aria-label="Časovi po mesecima"
      className="text-black/80"
    >
      {/* Horizontal grid (3 lines + baseline) */}
      {[0, 0.25, 0.5, 0.75, 1].map((t) => {
        const y = padT + (1 - t) * chartH;
        return (
          <g key={t}>
            <line
              x1={padL}
              x2={W - padR}
              y1={y}
              y2={y}
              stroke="currentColor"
              strokeOpacity={t === 0 ? 0.4 : 0.12}
              strokeDasharray={t === 0 ? "" : "2 3"}
            />
            <text
              x={padL - 4}
              y={y + 3}
              textAnchor="end"
              fontSize={10}
              fill="currentColor"
              opacity={0.5}
            >
              {Math.round(max * t)}
            </text>
          </g>
        );
      })}
      {/* Bars */}
      {values.map((v, i) => {
        const h = (v / max) * chartH;
        const x = padL + i * barW + barW * 0.18;
        const w = barW * 0.64;
        const y = padT + chartH - h;
        return (
          <g key={i}>
            <rect
              x={x}
              y={y}
              width={w}
              height={h}
              fill="currentColor"
              opacity={v === 0 ? 0.06 : 0.78}
              rx={2}
            />
            {v > 0 && h > 12 && (
              <text
                x={x + w / 2}
                y={y - 3}
                textAnchor="middle"
                fontSize={9}
                fill="currentColor"
                opacity={0.7}
              >
                {v}
              </text>
            )}
          </g>
        );
      })}
      {/* X labels */}
      {labels.map((label, i) => (
        <text
          key={i}
          x={padL + i * barW + barW / 2}
          y={H - 8}
          textAnchor="middle"
          fontSize={10}
          fill="currentColor"
          opacity={0.6}
        >
          {label}
        </text>
      ))}
    </svg>
  );
}
