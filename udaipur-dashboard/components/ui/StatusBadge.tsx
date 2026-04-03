import { cn, riskBgClass } from "@/lib/utils";
import type { RiskLevel, Severity } from "@/types";

interface StatusBadgeProps {
  level: RiskLevel | Severity;
  label?: string;
  className?: string;
  pulse?: boolean;
}

export function StatusBadge({ level, label, className, pulse }: StatusBadgeProps) {
  const displayLabel = label ?? level.charAt(0).toUpperCase() + level.slice(1);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border",
        riskBgClass(level),
        className
      )}
    >
      {pulse && (level === "critical" || level === "high") && (
        <span className="relative flex h-1.5 w-1.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-current" />
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-current" />
        </span>
      )}
      {displayLabel}
    </span>
  );
}
