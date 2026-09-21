"use client";

import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

const data = [
  { day: "Mon", utilization: 72 },
  { day: "Tue", utilization: 78 },
  { day: "Wed", utilization: 74 },
  { day: "Thu", utilization: 83 },
  { day: "Fri", utilization: 88 },
  { day: "Sat", utilization: 69 },
  { day: "Sun", utilization: 64 },
];

export function UtilizationChart() {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="util" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2563EB" stopOpacity={0.18} />
            <stop offset="100%" stopColor="#2563EB" stopOpacity={0.01} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
        <XAxis
          dataKey="day"
          stroke="#94A3B8"
          fontSize={11}
          tickLine={false}
          axisLine={false}
          dy={6}
        />
        <YAxis
          stroke="#94A3B8"
          fontSize={11}
          tickLine={false}
          axisLine={false}
          domain={[40, 100]}
          tickFormatter={(v) => `${v}%`}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "#FFFFFF",
            border: "1px solid #E2E8F0",
            borderRadius: "8px",
            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.08)",
            fontSize: "12px",
            color: "#1E293B",
          }}
          formatter={(v) => [`${v}%`, "Fleet Utilization"]}
        />
        <Area
          type="monotone"
          dataKey="utilization"
          stroke="#2563EB"
          strokeWidth={2}
          fill="url(#util)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
