"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { Complaint } from "@/types";
import { useMemo } from "react";

interface SurgeChartProps {
  complaints: Complaint[];
}

export function SurgeChart({ complaints }: SurgeChartProps) {
  const data = useMemo(() => {
    const byDate: Record<string, Record<string, number>> = {};
    const types = ["Water Supply", "Road Damage", "Garbage Collection", "Sewage", "Street Light"];

    complaints.forEach((c) => {
      const d = c.date.slice(0, 10);
      if (!byDate[d]) byDate[d] = {};
      if (types.includes(c.type)) {
        byDate[d][c.type] = (byDate[d][c.type] || 0) + 1;
      }
    });

    return Object.entries(byDate)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-14)
      .map(([date, counts]) => ({
        date: new Date(date).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
        ...counts,
      }));
  }, [complaints]);

  const colors = ["#00F3FF", "#FF8800", "#00FF88", "#FFCC00", "#FF4444"];
  const types = ["Water Supply", "Road Damage", "Garbage Collection", "Sewage", "Street Light"];

  return (
    <div className="bg-civic-surface border border-civic-border rounded-xl p-4">
      <h3 className="text-sm font-medium text-civic-text mb-4">Complaint Surge — Last 14 Days</h3>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
          <defs>
            {types.map((t, i) => (
              <linearGradient key={t} id={`grad-${i}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={colors[i]} stopOpacity={0.3} />
                <stop offset="95%" stopColor={colors[i]} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1E3A5F" />
          <XAxis dataKey="date" tick={{ fill: "#64748B", fontSize: 10 }} tickLine={false} />
          <YAxis tick={{ fill: "#64748B", fontSize: 10 }} tickLine={false} axisLine={false} />
          <Tooltip
            contentStyle={{ background: "#111827", border: "1px solid #1E3A5F", borderRadius: 8, fontSize: 11 }}
            labelStyle={{ color: "#E2E8F0" }}
          />
          <Legend wrapperStyle={{ fontSize: 10, color: "#64748B" }} />
          {types.map((t, i) => (
            <Area
              key={t}
              type="monotone"
              dataKey={t}
              stroke={colors[i]}
              fill={`url(#grad-${i})`}
              strokeWidth={1.5}
              dot={false}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
