"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useStaff } from "@/hooks/useStaff";
import { EfficiencyGrid } from "@/components/staff/EfficiencyGrid";
import { ShiftOptimiser } from "@/components/staff/ShiftOptimiser";
import { CostSavingBanner } from "@/components/staff/CostSavingBanner";
import { SectionLoader } from "@/components/ui/SectionLoader";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { efficiencyColor } from "@/lib/utils";

const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function StaffPage() {
  const [activeDay, setActiveDay] = useState("Thu");
  const { data, isLoading, error, refetch } = useStaff({ day: activeDay });

  if (isLoading) return <SectionLoader rows={4} />;
  if (error)
    return (
      <div className="text-civic-red text-sm p-4 bg-civic-surface border border-civic-red/30 rounded-xl flex justify-between">
        Failed to load staff data
        <button onClick={() => refetch()} className="underline">Retry</button>
      </div>
    );
  if (!data) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Day selector */}
      <div className="flex items-center gap-1 bg-civic-surface border border-civic-border rounded-xl p-1 w-fit">
        {days.map((day) => (
          <button
            key={day}
            onClick={() => setActiveDay(day)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
              activeDay === day
                ? "bg-civic-accent/20 text-civic-accent border border-civic-accent/30"
                : "text-civic-muted hover:text-civic-text"
            }`}
            aria-pressed={activeDay === day}
          >
            {day}
          </button>
        ))}
      </div>

      {/* Cost Saving Banner */}
      <CostSavingBanner
        savings={data.potential_savings}
        overtimeCost={data.overtime_cost}
        netOptimisation={data.net_optimisation}
      />

      {/* Efficiency Grid */}
      <EfficiencyGrid departments={data.departments} />

      {/* Shift Optimiser */}
      <ShiftOptimiser recommendations={data.recommendations} />

      {/* Weekly Trend */}
      <div className="bg-civic-surface border border-civic-border rounded-xl p-4">
        <h3 className="text-sm font-medium text-civic-text mb-4">7-Day Efficiency Trend</h3>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={data.weekly_trend} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1E3A5F" vertical={false} />
            <XAxis dataKey="day" tick={{ fill: "#64748B", fontSize: 11 }} tickLine={false} />
            <YAxis
              tick={{ fill: "#64748B", fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              domain={[60, 100]}
              tickFormatter={(v) => `${v}%`}
            />
            <Tooltip
              contentStyle={{ background: "#111827", border: "1px solid #1E3A5F", borderRadius: 8, fontSize: 11 }}
              formatter={(v: number) => [`${v}%`, "Efficiency"]}
            />
            <Bar dataKey="efficiency" radius={[4, 4, 0, 0]}>
              {data.weekly_trend.map((entry) => (
                <Cell key={entry.day} fill={efficiencyColor(entry.efficiency)} fillOpacity={0.8} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
