"use client";

import { Area, AreaChart, ResponsiveContainer } from "recharts";

type Props = {
  data: number[];
  color?: string; // any CSS color or var(--*)
  height?: number;
  className?: string;
};

export function Sparkline({
  data,
  color = "var(--brand)",
  height = 40,
  className,
}: Props) {
  const chartData = data.map((v, i) => ({ i, v }));
  const id = `spark-${color.replace(/[^a-zA-Z0-9]/g, "")}`;

  return (
    <div className={className} style={{ height, width: "100%" }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={chartData}
          margin={{ top: 4, right: 0, bottom: 0, left: 0 }}
        >
          <defs>
            <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.4} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="v"
            stroke={color}
            strokeWidth={2}
            fill={`url(#${id})`}
            dot={false}
            isAnimationActive
            animationDuration={800}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
