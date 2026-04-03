"use client";

import type { StaffDepartment } from "@/types";
import { efficiencyColor, efficiencyClass, cn } from "@/lib/utils";

interface EfficiencyGridProps {
  departments: StaffDepartment[];
}

export function EfficiencyGrid({ departments }: EfficiencyGridProps) {
  return (
    <div className="bg-civic-surface border border-civic-border rounded-xl overflow-hidden">
      <table className="w-full text-xs" aria-label="Staff efficiency table">
        <thead className="sticky top-0 bg-civic-surface border-b border-civic-border">
          <tr>
            {["Department", "Total", "Available", "Deployed", "Efficiency", "OT Hours"].map((h) => (
              <th key={h} className="px-4 py-3 text-left text-civic-muted uppercase tracking-wider font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {departments.map((dept) => {
            const color = efficiencyColor(dept.efficiency_pct);
            const rowTint = dept.efficiency_pct < 75
              ? "bg-civic-red/3"
              : dept.efficiency_pct < 85
              ? "bg-civic-yellow/3"
              : "";
            return (
              <tr key={dept.department} className={cn("border-b border-civic-border/40 hover:bg-white/3 transition-colors", rowTint)}>
                <td className="px-4 py-3 font-medium text-civic-text">{dept.department}</td>
                <td className="px-4 py-3 font-mono text-civic-text">{dept.total}</td>
                <td className="px-4 py-3 font-mono text-civic-text">{dept.available}</td>
                <td className="px-4 py-3 font-mono text-civic-text">{dept.deployed}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-civic-border rounded-full overflow-hidden max-w-16">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${dept.efficiency_pct}%`, backgroundColor: color }}
                      />
                    </div>
                    <span className={cn("font-mono font-semibold", efficiencyClass(dept.efficiency_pct))}>
                      {dept.efficiency_pct}%
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 font-mono text-civic-muted">{dept.overtime_hours}h</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
