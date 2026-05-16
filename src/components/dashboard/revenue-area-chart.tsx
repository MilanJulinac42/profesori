"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Point = {
  label: string;
  value: number; // paras — ostvareno
  projected: number; // paras — planirano
};

type Props = {
  data: Point[];
  height?: number;
};

const PAD_TOP = 12;
const PAD_RIGHT = 12;
const PAD_BOTTOM = 28;
const PAD_LEFT = 48;
const Y_TICKS = 4;
const X_MAX_LABELS = 8;

const formatRsd = (n: number) =>
  new Intl.NumberFormat("sr-Latn-RS").format(n);

const formatTickY = (n: number) =>
  n >= 1000 ? `${Math.round(n / 1000)}k` : String(n);

export function RevenueAreaChart({ data, height = 260 }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(640);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width;
      if (w && w > 0) setWidth(Math.round(w));
    });
    ro.observe(el);
    setWidth(el.clientWidth || 640);
    return () => ro.disconnect();
  }, []);

  // Convert paras → RSD.
  const series = useMemo(
    () =>
      data.map((d) => ({
        label: d.label,
        held: Math.round(d.value / 100),
        projected: Math.round(d.projected / 100),
      })),
    [data],
  );

  const chartW = Math.max(50, width - PAD_LEFT - PAD_RIGHT);
  const chartH = Math.max(50, height - PAD_TOP - PAD_BOTTOM);

  const maxVal = Math.max(
    1,
    ...series.map((d) => Math.max(d.held, d.held + d.projected, d.projected)),
  );
  // Nice round max → 5/10/25/50/100/250/500/1000 multiples
  const niceMax = niceCeil(maxVal);

  const stepX = series.length > 1 ? chartW / (series.length - 1) : chartW;
  const xAt = (i: number) => PAD_LEFT + i * stepX;
  const yAt = (v: number) =>
    PAD_TOP + (1 - Math.min(v, niceMax) / niceMax) * chartH;

  const heldLine = pathFor(series.map((d, i) => [xAt(i), yAt(d.held)]));
  const heldArea = `${heldLine} L${xAt(series.length - 1)} ${
    PAD_TOP + chartH
  } L${xAt(0)} ${PAD_TOP + chartH} Z`;

  const projLine = pathFor(series.map((d, i) => [xAt(i), yAt(d.projected)]));
  const projArea = `${projLine} L${xAt(series.length - 1)} ${
    PAD_TOP + chartH
  } L${xAt(0)} ${PAD_TOP + chartH} Z`;

  // Today reference line: first index where projected > 0 and held === 0
  const todayIdx = series.findIndex((d) => d.projected > 0 && d.held === 0);

  // X labels: pick evenly-spaced subset
  const labelEvery = Math.max(1, Math.ceil(series.length / X_MAX_LABELS));

  // Y ticks
  const yTickValues = Array.from({ length: Y_TICKS + 1 }, (_, i) =>
    Math.round((niceMax / Y_TICKS) * i),
  );

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (series.length === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const localX = e.clientX - rect.left - PAD_LEFT;
    const idx = Math.round(localX / stepX);
    const clamped = Math.max(0, Math.min(series.length - 1, idx));
    setHoverIdx(clamped);
  };
  const onPointerLeave = () => setHoverIdx(null);

  const hover = hoverIdx !== null ? series[hoverIdx] : null;

  return (
    <div className="relative" style={{ width: "100%" }}>
      <div
        ref={containerRef}
        className="relative"
        style={{ width: "100%", height }}
        onPointerMove={onPointerMove}
        onPointerLeave={onPointerLeave}
      >
        <svg
          width={width}
          height={height}
          role="img"
          aria-label="Trend prihoda"
        >
          <defs>
            <linearGradient id="rev-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.55} />
              <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="rev-stroke" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="var(--chart-1)" />
              <stop offset="100%" stopColor="var(--chart-2)" />
            </linearGradient>
            <linearGradient id="proj-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--chart-4)" stopOpacity={0.3} />
              <stop offset="100%" stopColor="var(--chart-4)" stopOpacity={0} />
            </linearGradient>
          </defs>

          {/* Horizontal grid + Y tick labels */}
          {yTickValues.map((v) => {
            const y = yAt(v);
            return (
              <g key={v}>
                <line
                  x1={PAD_LEFT}
                  x2={width - PAD_RIGHT}
                  y1={y}
                  y2={y}
                  stroke="var(--border)"
                  strokeDasharray="2 4"
                />
                <text
                  x={PAD_LEFT - 6}
                  y={y}
                  textAnchor="end"
                  dominantBaseline="central"
                  fill="var(--muted-foreground)"
                  fontSize={11}
                >
                  {formatTickY(v)}
                </text>
              </g>
            );
          })}

          {/* X tick labels */}
          {series.map((d, i) => {
            const isEdge = i === 0 || i === series.length - 1;
            if (!isEdge && i % labelEvery !== 0) return null;
            return (
              <text
                key={i}
                x={xAt(i)}
                y={height - PAD_BOTTOM + 16}
                textAnchor={
                  i === 0 ? "start" : i === series.length - 1 ? "end" : "middle"
                }
                fill="var(--muted-foreground)"
                fontSize={11}
              >
                {d.label}
              </text>
            );
          })}

          {/* Areas */}
          <path d={projArea} fill="url(#proj-fill)" />
          <path
            d={projLine}
            fill="none"
            stroke="var(--chart-4)"
            strokeWidth={2}
            strokeDasharray="5 4"
            strokeLinejoin="round"
          />
          <path d={heldArea} fill="url(#rev-fill)" />
          <path
            d={heldLine}
            fill="none"
            stroke="url(#rev-stroke)"
            strokeWidth={2.5}
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {/* Today reference line */}
          {todayIdx > 0 && (
            <g>
              <line
                x1={xAt(todayIdx - 1)}
                x2={xAt(todayIdx - 1)}
                y1={PAD_TOP}
                y2={PAD_TOP + chartH}
                stroke="var(--muted-foreground)"
                strokeDasharray="3 3"
                strokeOpacity={0.5}
              />
              <text
                x={xAt(todayIdx - 1)}
                y={PAD_TOP - 2}
                textAnchor="middle"
                fill="var(--muted-foreground)"
                fontSize={10}
              >
                danas
              </text>
            </g>
          )}

          {/* Hover crosshair + dot */}
          {hover && hoverIdx !== null && (
            <g pointerEvents="none">
              <line
                x1={xAt(hoverIdx)}
                x2={xAt(hoverIdx)}
                y1={PAD_TOP}
                y2={PAD_TOP + chartH}
                stroke="var(--border)"
                strokeWidth={1}
              />
              {hover.held > 0 && (
                <circle
                  cx={xAt(hoverIdx)}
                  cy={yAt(hover.held)}
                  r={5}
                  fill="var(--chart-1)"
                  stroke="var(--background)"
                  strokeWidth={2}
                />
              )}
              {hover.projected > 0 && (
                <circle
                  cx={xAt(hoverIdx)}
                  cy={yAt(hover.projected)}
                  r={4}
                  fill="var(--chart-4)"
                  stroke="var(--background)"
                  strokeWidth={2}
                />
              )}
            </g>
          )}
        </svg>

        {/* Tooltip */}
        {hover && hoverIdx !== null && (
          <div
            className="pointer-events-none absolute rounded-xl border border-border bg-popover text-foreground shadow-[0_8px_24px_-8px_rgba(0,0,0,0.35)] px-3 py-2 text-xs"
            style={{
              left: clampTooltipX(xAt(hoverIdx), width),
              top: 4,
            }}
          >
            <div className="text-[11px] text-muted-foreground mb-1">
              {hover.label}
            </div>
            {hover.held > 0 && (
              <div className="flex items-center gap-2">
                <span
                  className="inline-block w-2.5 h-2.5 rounded-full"
                  style={{ background: "var(--chart-1)" }}
                />
                <span>Ostvareno:</span>
                <span className="font-medium tabular-nums ml-auto">
                  {formatRsd(hover.held)} RSD
                </span>
              </div>
            )}
            {hover.projected > 0 && (
              <div className="flex items-center gap-2">
                <span
                  className="inline-block w-2.5 h-2.5 rounded-full"
                  style={{ background: "var(--chart-4)" }}
                />
                <span>Planirano:</span>
                <span className="font-medium tabular-nums ml-auto">
                  {formatRsd(hover.projected)} RSD
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="mt-2 flex items-center justify-center gap-4 text-[11px] text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <span
            aria-hidden
            className="inline-block w-3 h-0.5 rounded"
            style={{ background: "var(--chart-1)" }}
          />
          Ostvareno
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span
            aria-hidden
            className="inline-block w-3 h-0.5 rounded border-t border-dashed"
            style={{ borderColor: "var(--chart-4)" }}
          />
          Planirano (zakazani časovi)
        </span>
      </div>
    </div>
  );
}

function pathFor(points: [number, number][]): string {
  if (points.length === 0) return "";
  return points
    .map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`)
    .join(" ");
}

function niceCeil(n: number): number {
  if (n <= 0) return 1;
  const pow = Math.pow(10, Math.floor(Math.log10(n)));
  const norm = n / pow;
  let nice: number;
  if (norm <= 1) nice = 1;
  else if (norm <= 2) nice = 2;
  else if (norm <= 2.5) nice = 2.5;
  else if (norm <= 5) nice = 5;
  else nice = 10;
  return nice * pow;
}

function clampTooltipX(centerX: number, totalW: number): number {
  const tooltipW = 180;
  const half = tooltipW / 2;
  return Math.max(
    PAD_LEFT,
    Math.min(totalW - tooltipW - PAD_RIGHT, centerX - half),
  );
}
