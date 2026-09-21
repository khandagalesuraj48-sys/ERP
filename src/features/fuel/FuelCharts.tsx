"use client";

import {
  Bar,
  BarChart,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

const lightTooltipStyle = {
  backgroundColor: "#FFFFFF",
  border: "1px solid #E2E8F0",
  borderRadius: "8px",
  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.08)",
  color: "#1E293B",
  fontSize: "12px",
} as const;

export function FuelCostLine({ data }: { data: { date: string; cost: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
        <XAxis dataKey="date" stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} dy={4} />
        <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v}`} />
        <Tooltip contentStyle={lightTooltipStyle} formatter={(v) => [`₹${v}`, "Fuel Cost"]} />
        <Line type="monotone" dataKey="cost" stroke="#2563EB" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function CostPerKmBar({ data }: { data: { name: string; value: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
        <XAxis dataKey="name" stroke="#94A3B8" fontSize={10} tickLine={false} axisLine={false} interval={0} angle={-25} textAnchor="end" height={45} />
        <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v}`} />
        <Tooltip contentStyle={lightTooltipStyle} cursor={{ fill: "#F8FAFC" }} formatter={(v) => [`₹${v}`, "Unit Rate"]} />
        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
          {data.map((d, i) => (
            <Cell key={i} fill={i < 3 ? "#DC2626" : i >= data.length - 3 ? "#16A34A" : "#2563EB"} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function CostBreakdownDonut({
  fuel,
  maintenance,
  other,
}: {
  fuel: number;
  maintenance: number;
  other: number;
}) {
  const data = [
    { name: "Fuel", value: fuel, color: "#2563EB" },
    { name: "Maintenance", value: maintenance, color: "#D97706" },
    { name: "Other", value: other, color: "#64748B" },
  ];
  return (
    <div className="flex items-center gap-6">
      <div className="w-[130px] h-[130px] shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" innerRadius={42} outerRadius={62} paddingAngle={3} stroke="none">
              {data.map((d) => (
                <Cell key={d.name} fill={d.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="space-y-2.5 flex-1">
        {data.map((d) => (
          <div key={d.name} className="flex items-center justify-between text-[12px]">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full" style={{ background: d.color }} />
              <span className="text-gray-600 font-medium">{d.name}</span>
            </div>
            <span className="font-semibold text-gray-900 font-mono">
              ₹{(d.value / 1000).toFixed(1)}k
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
