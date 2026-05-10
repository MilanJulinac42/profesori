"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { cn } from "@/lib/utils";

export type DonutSlice = {
  key: string;
  label: string;
  value: number;
  color: string; // CSS color or var(--*)
};

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

  return (
    <div className="flex items-center gap-6 flex-wrap">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip
              cursor={false}
              contentStyle={{
                background: "var(--popover)",
                border: "1px solid var(--border)",
                borderRadius: 12,
                fontSize: 12,
                boxShadow: "0 8px 24px -8px rgba(0,0,0,0.35)",
                color: "var(--foreground)",
              }}
              formatter={(value, _name, p) => {
                const v = Number(value) || 0;
                const label =
                  (p as { payload?: { label?: string } })?.payload?.label ?? "";
                return [
                  `${v} (${total > 0 ? Math.round((v / total) * 100) : 0}%)`,
                  label,
                ];
              }}
            />
            <Pie
              data={data}
              dataKey="value"
              nameKey="key"
              innerRadius="65%"
              outerRadius="100%"
              paddingAngle={2}
              stroke="var(--card)"
              strokeWidth={3}
              startAngle={90}
              endAngle={450}
              animationDuration={900}
            >
              {data.map((d) => (
                <Cell key={d.key} fill={d.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
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
                className={cn(
                  "size-2.5 rounded-full shrink-0",
                )}
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
