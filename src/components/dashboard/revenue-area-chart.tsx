"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Point = {
  label: string;
  value: number; // paras — ostvareno (completed časovi)
  projected: number; // paras — projektovano (scheduled časovi koji nisu još odrzani)
};

export function RevenueAreaChart({
  data,
  height = 260,
}: {
  data: Point[];
  height?: number;
}) {
  // Konvertujemo paras → RSD ovde da Y-osa i tooltip budu u istoj jedinici.
  const chartData = data.map((d) => ({
    label: d.label,
    held: Math.round(d.value / 100),
    projected: Math.round(d.projected / 100),
  }));

  // Pronađi prvi indeks gde počinju projektovani podaci — za vertikalnu
  // "danas" liniju.
  const todayIdx = chartData.findIndex((d) => d.projected > 0 && d.held === 0);

  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={chartData}
          margin={{ top: 8, right: 8, bottom: 0, left: -8 }}
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
          <CartesianGrid
            strokeDasharray="2 4"
            stroke="var(--border)"
            vertical={false}
          />
          <XAxis
            dataKey="label"
            stroke="var(--muted-foreground)"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            stroke="var(--muted-foreground)"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            width={56}
            tickFormatter={(n: number) =>
              n >= 1000 ? `${Math.round(n / 1000)}k` : String(n)
            }
          />
          <Tooltip
            cursor={{ stroke: "var(--border)", strokeWidth: 1 }}
            contentStyle={{
              background: "var(--popover)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              fontSize: 12,
              boxShadow: "0 8px 24px -8px rgba(0,0,0,0.35)",
              color: "var(--foreground)",
            }}
            labelStyle={{
              color: "var(--muted-foreground)",
              fontSize: 11,
              marginBottom: 4,
            }}
            formatter={(value, name) => [
              `${new Intl.NumberFormat("sr-Latn-RS").format(Number(value) || 0)} RSD`,
              name === "held" ? "Ostvareno" : "Planirano",
            ]}
          />
          {todayIdx > 0 && (
            <ReferenceLine
              x={chartData[todayIdx - 1]?.label}
              stroke="var(--muted-foreground)"
              strokeDasharray="3 3"
              strokeOpacity={0.5}
              label={{
                value: "danas",
                position: "top",
                fill: "var(--muted-foreground)",
                fontSize: 10,
              }}
            />
          )}
          <Area
            type="monotone"
            dataKey="held"
            stroke="url(#rev-stroke)"
            strokeWidth={2.5}
            fill="url(#rev-fill)"
            dot={false}
            activeDot={{
              r: 5,
              fill: "var(--chart-1)",
              stroke: "var(--background)",
              strokeWidth: 2,
            }}
            animationDuration={900}
          />
          <Area
            type="monotone"
            dataKey="projected"
            stroke="var(--chart-4)"
            strokeWidth={2}
            strokeDasharray="5 4"
            fill="url(#proj-fill)"
            dot={false}
            activeDot={{
              r: 4,
              fill: "var(--chart-4)",
              stroke: "var(--background)",
              strokeWidth: 2,
            }}
            animationDuration={900}
            animationBegin={300}
          />
        </AreaChart>
      </ResponsiveContainer>

      {/* Legenda */}
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
