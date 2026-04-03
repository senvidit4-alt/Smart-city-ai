import { cn } from "@/lib/utils";

interface SectionLoaderProps {
  rows?: number;
  className?: string;
  variant?: "card" | "table" | "chart";
}

function SkeletonBlock({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded bg-civic-border/40 animate-pulse",
        className
      )}
    />
  );
}

export function SectionLoader({ rows = 3, className, variant = "card" }: SectionLoaderProps) {
  if (variant === "table") {
    return (
      <div className={cn("space-y-2", className)}>
        <SkeletonBlock className="h-8 w-full" />
        {Array.from({ length: rows }).map((_, i) => (
          <SkeletonBlock key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (variant === "chart") {
    return (
      <div className={cn("space-y-2", className)}>
        <SkeletonBlock className="h-4 w-32" />
        <SkeletonBlock className="h-48 w-full" />
      </div>
    );
  }

  return (
    <div className={cn("grid gap-4", className)}>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="bg-civic-surface border border-civic-border rounded-xl p-4 space-y-3"
        >
          <SkeletonBlock className="h-3 w-24" />
          <SkeletonBlock className="h-7 w-20" />
          <SkeletonBlock className="h-3 w-32" />
        </div>
      ))}
    </div>
  );
}
