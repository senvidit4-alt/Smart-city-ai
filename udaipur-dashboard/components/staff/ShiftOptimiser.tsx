"use client";

import { motion } from "framer-motion";
import { Trash2, Droplets, Construction, ArrowRight } from "lucide-react";
import type { ShiftRecommendation } from "@/types";
import { formatCurrency } from "@/lib/utils";

const iconMap: Record<string, React.ReactNode> = {
  Trash2: <Trash2 className="h-5 w-5" />,
  Droplets: <Droplets className="h-5 w-5" />,
  Construction: <Construction className="h-5 w-5" />,
};

interface ShiftOptimiserProps {
  recommendations: ShiftRecommendation[];
}

export function ShiftOptimiser({ recommendations }: ShiftOptimiserProps) {
  const handleApply = (rec: ShiftRecommendation) => {
    console.log("[ShiftOptimiser] Applying recommendation:", rec.id, rec.action);
  };

  return (
    <div>
      <h3 className="text-sm font-medium text-civic-text mb-3">AI Shift Recommendations</h3>
      <div className="grid md:grid-cols-3 gap-4">
        {recommendations.map((rec, i) => (
          <motion.div
            key={rec.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="bg-civic-surface border border-civic-border rounded-xl p-4 hover:shadow-civic-glow transition-shadow duration-200"
          >
            <div className="flex items-center gap-2.5 mb-3">
              <span className="p-2 rounded-lg bg-civic-accent/10 text-civic-accent">
                {iconMap[rec.icon] ?? <Droplets className="h-5 w-5" />}
              </span>
              <span className="text-sm font-medium text-civic-text">{rec.department}</span>
            </div>

            <p className="text-xs text-civic-muted mb-2">{rec.issue}</p>
            <p className="text-xs font-semibold text-civic-text mb-3">{rec.action}</p>

            <div className="bg-civic-bg rounded-lg p-2.5 mb-3 space-y-1">
              <div className="flex justify-between text-[11px]">
                <span className="text-civic-muted">Saves</span>
                <span className="font-mono text-civic-green">{formatCurrency(rec.impact_savings)}</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-civic-muted">Covers</span>
                <span className="font-mono text-civic-text">{rec.impact_zones} extra zones</span>
              </div>
            </div>

            <button
              onClick={() => handleApply(rec)}
              className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg bg-civic-accent/10 border border-civic-accent/30 text-civic-accent text-xs hover:bg-civic-accent/20 transition-colors"
              aria-label={`Apply recommendation for ${rec.department}`}
            >
              Apply & notify
              <ArrowRight className="h-3 w-3" />
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
