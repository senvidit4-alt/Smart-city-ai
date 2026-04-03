import { cn, riskColor } from "@/lib/utils";
import type { RiskLevel } from "@/types";

interface RiskIndicatorProps {
  level: RiskLevel;
  label?: string;
  className?: string;
}

export function RiskIndicator({ level, label, className }: RiskIndicatorProps) {
  const color = riskColor(level);
  const shouldPulse = level === "critical" || level === "high";

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span className="relative flex h-2.5 w-2.5">
        {shouldPulse && (
          <span
            className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60"
            style={{ backgroundColor: color }}
          />
        )}
        <span
          className="relative inline-flex rounded-full h-2.5 w-2.5"
          style={{ backgroundColor: color }}
        />
      </span>
      {label && (
        <span className="text-xs font-medium" style={{ color }}>
          {label}
        </span>
      )}
    </div>
  );
}
