"use client";

import { CheckCircle2, Circle } from "lucide-react";
import type { CityEvent } from "@/types";
import { cn } from "@/lib/utils";

interface EventTimelineProps {
  event: CityEvent;
}

export function EventTimeline({ event }: EventTimelineProps) {
  const sorted = [...event.checklist].sort((a, b) => b.due_days_before - a.due_days_before);

  return (
    <div>
      <h4 className="text-xs text-civic-muted uppercase tracking-wider mb-2">T-Minus Checklist</h4>
      <div className="space-y-2">
        {sorted.map((item) => {
          const overdue = item.due_days_before >= event.days_away && !item.completed;
          return (
            <div
              key={item.id}
              className={cn(
                "flex items-start gap-2.5 p-2.5 rounded-lg border",
                item.completed
                  ? "bg-civic-green/5 border-civic-green/20"
                  : overdue
                  ? "bg-civic-red/5 border-civic-red/20"
                  : "bg-civic-bg border-civic-border"
              )}
            >
              {item.completed ? (
                <CheckCircle2 className="h-4 w-4 text-civic-green shrink-0 mt-0.5" />
              ) : (
                <Circle className={cn("h-4 w-4 shrink-0 mt-0.5", overdue ? "text-civic-red" : "text-civic-muted")} />
              )}
              <div className="flex-1 min-w-0">
                <p className={cn("text-xs", item.completed ? "text-civic-muted line-through" : "text-civic-text")}>
                  {item.label}
                </p>
                <p className={cn("text-[10px] mt-0.5", overdue ? "text-civic-red" : "text-civic-muted")}>
                  T-{item.due_days_before} days {overdue ? "· OVERDUE" : ""}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
