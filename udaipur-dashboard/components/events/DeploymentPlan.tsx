"use client";

import { motion } from "framer-motion";
import { X, Truck, Shield, Droplets, IndianRupee } from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EventTimeline } from "./EventTimeline";
import type { CityEvent } from "@/types";
import { formatCurrency } from "@/lib/utils";

interface DeploymentPlanProps {
  event: CityEvent;
  onClose: () => void;
}

export function DeploymentPlan({ event, onClose }: DeploymentPlanProps) {
  const resources = [
    { label: "Trucks", icon: <Truck className="h-4 w-4" />, required: event.trucks_required, normal: Math.floor(event.trucks_required * 0.6) },
    { label: "Officers", icon: <Shield className="h-4 w-4" />, required: event.officers_required, normal: Math.floor(event.officers_required * 0.6) },
    { label: "Tankers", icon: <Droplets className="h-4 w-4" />, required: event.tankers_required, normal: Math.floor(event.tankers_required * 0.7) },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-civic-surface border border-civic-accent/30 rounded-xl p-5"
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-civic-text">{event.name} — Deployment Plan</h3>
          <p className="text-xs text-civic-muted mt-0.5">{event.location} · T-{event.days_away} days</p>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge level={event.risk_level} pulse />
          <button onClick={onClose} className="p-1 rounded hover:bg-white/5 text-civic-muted" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Resource table */}
        <div>
          <h4 className="text-xs text-civic-muted uppercase tracking-wider mb-2">Resource Requirements</h4>
          <div className="space-y-2">
            {resources.map((r) => (
              <div key={r.label} className="flex items-center justify-between bg-civic-bg rounded-lg px-3 py-2">
                <div className="flex items-center gap-2 text-civic-muted">
                  {r.icon}
                  <span className="text-xs">{r.label}</span>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="text-civic-muted">Normal: <span className="font-mono text-civic-text">{r.normal}</span></span>
                  <span className="text-civic-orange font-mono font-semibold">{r.required}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Cost */}
          <div className="mt-3 flex items-center gap-2 bg-civic-bg rounded-lg px-3 py-2.5 border border-civic-border">
            <IndianRupee className="h-4 w-4 text-civic-yellow" />
            <span className="text-xs text-civic-muted">Estimated Cost</span>
            <span className="ml-auto font-mono text-sm font-semibold text-civic-yellow">
              {formatCurrency(event.cost_estimate)}
            </span>
          </div>
        </div>

        {/* Timeline */}
        <EventTimeline event={event} />
      </div>
    </motion.div>
  );
}
