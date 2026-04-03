"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, Cpu } from "lucide-react";
import type { ThinkingStep } from "@/types";
import { cn } from "@/lib/utils";

interface ThinkingStepsProps {
  steps: ThinkingStep[];
  collapsed?: boolean;
}

export function ThinkingSteps({ steps, collapsed = false }: ThinkingStepsProps) {
  const [open, setOpen] = useState(!collapsed);

  return (
    <div className="border-l-2 border-civic-border pl-3 my-2">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 text-[11px] text-civic-muted hover:text-civic-text transition-colors"
        aria-expanded={open}
      >
        <Cpu className="h-3 w-3" />
        <span>Tool reasoning ({steps.length} calls)</span>
        {open ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
      </button>

      {open && (
        <div className="mt-2 space-y-1.5">
          {steps.map((step, i) => (
            <div key={i} className="text-[11px] font-mono text-civic-muted italic">
              <span className="text-civic-accent-dim">{step.tool}</span>
              <span className="text-civic-border mx-1">→</span>
              <span>
                {Object.entries(step.params)
                  .map(([k, v]) => `${k}: ${v}`)
                  .join(", ")}
              </span>
              {step.result_summary && (
                <div className={cn("text-[10px] text-civic-muted/70 mt-0.5 pl-2")}>
                  ↳ {step.result_summary}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
