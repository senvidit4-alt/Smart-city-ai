"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, AlertTriangle, CalendarDays, Users, LayoutDashboard } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuickActionsProps {
  onSelect: (prompt: string) => void;
}

const groups = [
  {
    label: "Overview",
    icon: <LayoutDashboard className="h-3 w-3" />,
    actions: [
      { label: "Morning briefing", prompt: "Give me the morning briefing for Udaipur Municipal Corporation" },
      { label: "City status", prompt: "What is the overall city status right now?" },
    ],
  },
  {
    label: "Complaints",
    icon: <AlertTriangle className="h-3 w-3" />,
    actions: [
      { label: "Hiran Magri status", prompt: "Analyse Hiran Magri ward — complaints, risk level, and recommended actions" },
      { label: "Surge analysis", prompt: "Which wards are seeing complaint surges this week?" },
      { label: "Critical cases", prompt: "List all critical severity complaints and recommended resolutions" },
    ],
  },
  {
    label: "Events",
    icon: <CalendarDays className="h-3 w-3" />,
    actions: [
      { label: "Gangaur Fair plan", prompt: "Generate deployment plan for Gangaur Fair" },
      { label: "Festival readiness", prompt: "Festival readiness check — are we prepared for upcoming events?" },
    ],
  },
  {
    label: "Staff",
    icon: <Users className="h-3 w-3" />,
    actions: [
      { label: "Thursday shifts", prompt: "Optimise staff shifts for Thursday — identify overtime and reallocation opportunities" },
      { label: "Cost savings", prompt: "What are the top staff cost saving opportunities this week?" },
    ],
  },
];

export function QuickActions({ onSelect }: QuickActionsProps) {
  const [open, setOpen] = useState(true);

  return (
    <div className="border-b border-civic-border">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-2.5 text-xs text-civic-muted hover:text-civic-text transition-colors"
        aria-expanded={open}
      >
        <span className="uppercase tracking-wider">Quick Actions</span>
        {open ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
      </button>

      {open && (
        <div className="px-3 pb-3 space-y-2.5">
          {groups.map((group) => (
            <div key={group.label}>
              <div className="flex items-center gap-1.5 text-[10px] text-civic-muted uppercase tracking-wider mb-1.5 px-1">
                {group.icon}
                {group.label}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {group.actions.map((action) => (
                  <button
                    key={action.label}
                    onClick={() => onSelect(action.prompt)}
                    className={cn(
                      "px-2.5 py-1 rounded-full text-[11px] border transition-all duration-200",
                      "bg-civic-bg border-civic-border text-civic-muted",
                      "hover:border-civic-accent/40 hover:text-civic-accent hover:bg-civic-accent/5"
                    )}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
