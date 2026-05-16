import { cn } from "@/lib/utils";

export type DonutSlice = {
  key: string;
  label: string;
  value: number;
  color: string;
};

const STROKE_W = 22;
const GAP_DEG = 4; // gap between slices, in degrees

export function StatusDonut({
  data,
  centerLabel,
  centerValue,
  size = 180,
}: {
  data: DonutSlice[];
  centerLabel: string;
  centerValue: string;
  size?: number;
}) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const r = (size - STROKE_W) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;

  // Calculate offsets. We render slices as stroke-dasharray segments on a single
  // circle rotated -90deg so 0 starts at top.
  let cursor = 0;
  const segments = data.map((d) => {
    const pct = total > 0 ? d.value / total : 0;
    const sliceDeg = pct * 360;
    const drawDeg = Math.max(0, sliceDeg - GAP_DEG);
    const dash = (drawDeg / 360) * circumference;
    const offset = -((cursor / 360) * circumference);
    cursor += sliceDeg;
    return {
      ...d,
      pct,
      dash,
      offset,
    };
  });

  return (
    <div className="flex items-center gap-6 flex-wrap">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          role="img"
          aria-label={`${centerLabel}: ${centerValue}`}
          style={{ transform: "rotate(-90deg)" }}
        >
          {segments.map((seg) => (
            <circle
              key={seg.key}
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke={seg.color}
              strokeWidth={STROKE_W}
              strokeDasharray={`${seg.dash} ${circumference - seg.dash}`}
              strokeDashoffset={seg.offset}
              strokeLinecap="butt"
            />
          ))}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
            {centerLabel}
          </span>
          <span className="font-display text-2xl text-foreground tabular-nums leading-none mt-1">
            {centerValue}
          </span>
        </div>
      </div>

      <ul className="flex-1 min-w-[140px] space-y-2.5">
        {data.map((d) => {
          const pct = total > 0 ? (d.value / total) * 100 : 0;
          return (
            <li key={d.key} className="flex items-center gap-2.5 text-xs">
              <span
                className={cn("size-2.5 rounded-full shrink-0")}
                style={{ background: d.color }}
              />
              <span className="text-muted-foreground flex-1 truncate">
                {d.label}
              </span>
              <span className="text-foreground font-medium tabular-nums">
                {d.value}
              </span>
              <span className="text-muted-foreground tabular-nums w-9 text-right">
                {Math.round(pct)}%
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
