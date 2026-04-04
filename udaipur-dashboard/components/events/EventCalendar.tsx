"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Users, Truck, Shield, Clock } from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { DeploymentPlan } from "./DeploymentPlan";
import type { CityEvent } from "@/types";
import { cn, riskColor } from "@/lib/utils";
import { useAppStore } from "@/store/useAppStore";

interface EventCalendarProps {
  events: CityEvent[];
}

export function EventCalendar({ events }: EventCalendarProps) {
  const [selected, setSelected] = useState<CityEvent | null>(null);
  const { setChatOpen, setPrefillMessage } = useAppStore();

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {events.map((event, i) => {
          const color = riskColor(event.risk_level);
          const urgent = event.days_away <= 7;
          return (
            <motion.article
              key={event.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.06 }}
              className={cn(
                "bg-civic-surface border border-civic-border rounded-xl overflow-hidden",
                "hover:shadow-civic-glow transition-shadow duration-200 cursor-pointer"
              )}
              onClick={() => setSelected(selected?.id === event.id ? null : event)}
            >
              {/* Color band */}
              <div className="h-1.5" style={{ backgroundColor: color, opacity: 0.8 }} />

              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="text-sm font-semibold text-civic-text">{event.name}</h3>
                    <p className="text-xs text-civic-muted mt-0.5">{event.location}</p>
                  </div>
                  <StatusBadge level={event.risk_level} pulse={event.risk_level === "critical"} />
                </div>

                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[10px] bg-civic-bg border border-civic-border px-2 py-0.5 rounded-full text-civic-muted">
                    {event.type}
                  </span>
                  <span
                    className={cn(
                      "text-[10px] px-2 py-0.5 rounded-full font-mono font-medium",
                      urgent ? "bg-civic-red/15 text-civic-red border border-civic-red/30" : "bg-civic-bg border border-civic-border text-civic-muted"
                    )}
                  >
                    T-{event.days_away}d
                  </span>
                </div>

                <div className="flex items-center gap-3 text-xs text-civic-muted mb-3">
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {event.crowd_estimate.toLocaleString()}
                  </span>
                  <span className="flex items-center gap-1">
                    <Truck className="h-3 w-3" />
                    {event.trucks_required}
                  </span>
                  <span className="flex items-center gap-1">
                    <Shield className="h-3 w-3" />
                    {event.officers_required}
                  </span>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setPrefillMessage(`Get full deployment plan for ${event.name} at ${event.location}`);
                    setChatOpen(true);
                  }}
                  className="w-full py-1.5 rounded-lg bg-civic-accent/10 border border-civic-accent/30 text-civic-accent text-xs hover:bg-civic-accent/20 transition-colors"
                >
                  Get deployment plan
                </button>
              </div>
            </motion.article>
          );
        })}
      </div>

      {selected && (
        <DeploymentPlan event={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}
