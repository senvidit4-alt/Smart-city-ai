"use client";

import { Treemap, ResponsiveContainer } from "recharts";
import type { Complaint } from "@/types";
import { useMemo } from "react";
import { riskColor } from "@/lib/utils";

interface WardHeatmapProps {
  complaints: Complaint[];
}

interface TreemapContentProps {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  name?: string;
  value?: number;
  fill?: string;
}

function TreemapContent(props: TreemapContentProps) {
  const { x = 0, y = 0, width = 0, height = 0, name, value, fill } = props;
  return (
    <g>
      <rect
        x={x} y={y} width={width} height={height}
        style={{ fill: fill ?? "#1E3A5F", fillOpacity: 0.7, stroke: "#080C14", strokeWidth: 2 }}
      />
      {width > 50 && height > 30 && (
        <>
          <text x={x + width / 2} y={y + height / 2 - 6}
            textAnchor="middle" fill="#E2E8F0" fontSize={10} fontWeight={500}>
            {name}
          </text>
          <text x={x + width / 2} y={y + height / 2 + 8}
            textAnchor="middle" fill="#E2E8F0" fontSize={11} fontFamily="monospace">
            {value}
          </text>
        </>
      )}
    </g>
  );
}

export function WardHeatmap({ complaints }: WardHeatmapProps) {
  const data = useMemo(() => {
    const byWard: Record<string, number> = {};
    complaints.forEach((c) => {
      byWard[c.ward] = (byWard[c.ward] || 0) + 1;
    });
    const max = Math.max(...Object.values(byWard));
    return Object.entries(byWard).map(([ward, count]) => {
      const ratio = count / max;
      const level = ratio > 0.7 ? "critical" : ratio > 0.5 ? "high" : ratio > 0.3 ? "medium" : "low";
      return { name: ward, size: count, fill: riskColor(level) };
    });
  }, [complaints]);

  return (
    <div className="bg-civic-surface border border-civic-border rounded-xl p-4">
      <h3 className="text-sm font-medium text-civic-text mb-4">Complaints by Ward</h3>
      <ResponsiveContainer width="100%" height={200}>
        <Treemap
          data={data}
          dataKey="size"
          aspectRatio={4 / 3}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          content={<TreemapContent /> as any}
        />
      </ResponsiveContainer>
    </div>
  );
}
