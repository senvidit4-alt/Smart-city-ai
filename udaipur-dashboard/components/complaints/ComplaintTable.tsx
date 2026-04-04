"use client";

import { useState } from "react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { SectionLoader } from "@/components/ui/SectionLoader";
import { ChevronUp, ChevronDown } from "lucide-react";
import { formatDate, cn } from "@/lib/utils";
import type { Complaint, Severity } from "@/types";
import { useAppStore } from "@/store/useAppStore";

interface ComplaintTableProps {
  complaints: (Complaint & { isNew?: boolean })[];
  isLoading: boolean;
}

type SortKey = keyof Pick<Complaint, "id" | "date" | "ward" | "type" | "severity" | "status">;

export function ComplaintTable({ complaints, isLoading }: ComplaintTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [selected, setSelected] = useState<Complaint | null>(null);
  const { setChatOpen, setPrefillMessage } = useAppStore();

  const severityOrder: Record<Severity, number> = { critical: 0, high: 1, medium: 2, low: 3 };

  const sorted = [...complaints].sort((a, b) => {
    let cmp = 0;
    if (sortKey === "severity") {
      cmp = severityOrder[a.severity] - severityOrder[b.severity];
    } else {
      cmp = String(a[sortKey]).localeCompare(String(b[sortKey]));
    }
    return sortDir === "asc" ? cmp : -cmp;
  });

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
  };

  const SortIcon = ({ k }: { k: SortKey }) =>
    sortKey === k ? (
      sortDir === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
    ) : null;

  const cols: { key: SortKey; label: string }[] = [
    { key: "id", label: "ID" },
    { key: "date", label: "Date" },
    { key: "ward", label: "Ward" },
    { key: "type", label: "Type" },
    { key: "severity", label: "Severity" },
    { key: "status", label: "Status" },
  ];

  if (isLoading) return <SectionLoader variant="table" rows={8} />;

  return (
    <>
      <div className="overflow-auto rounded-xl border border-civic-border">
        <table className="w-full text-xs" aria-label="Complaints table">
          <thead className="sticky top-0 bg-civic-surface z-10">
            <tr className="border-b border-civic-border">
              {cols.map((col) => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col.key)}
                  className="px-3 py-2.5 text-left text-civic-muted uppercase tracking-wider cursor-pointer hover:text-civic-text transition-colors select-none"
                >
                  <span className="flex items-center gap-1">
                    {col.label}
                    <SortIcon k={col.key} />
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.slice(0, 50).map((c) => (
              <tr
                key={c.id}
                onClick={() => setSelected(c)}
                className={cn(
                  "border-b border-civic-border/40 cursor-pointer transition-colors",
                  c.isNew
                    ? "animate-flash bg-civic-red/8"
                    : "hover:bg-white/3"
                )}
              >
                <td className="px-3 py-2.5 font-mono text-civic-muted">{c.id}</td>
                <td className="px-3 py-2.5 text-civic-text">{formatDate(c.date)}</td>
                <td className="px-3 py-2.5 text-civic-text">{c.ward}</td>
                <td className="px-3 py-2.5 text-civic-text">{c.type}</td>
                <td className="px-3 py-2.5">
                  <StatusBadge level={c.severity} pulse={c.severity === "critical"} />
                </td>
                <td className="px-3 py-2.5">
                  <span className={cn(
                    "px-2 py-0.5 rounded-full text-[10px] border",
                    c.status === "resolved" || c.status === "closed"
                      ? "bg-civic-green/10 text-civic-green border-civic-green/20"
                      : c.status === "in_progress"
                      ? "bg-civic-accent/10 text-civic-accent border-civic-accent/20"
                      : "bg-civic-orange/10 text-civic-orange border-civic-orange/20"
                  )}>
                    {c.status.replace("_", " ")}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Detail Modal */}
      {selected && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelected(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Complaint details"
        >
          <div
            className="bg-civic-surface border border-civic-border rounded-xl p-6 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="font-mono text-sm text-civic-muted">{selected.id}</p>
                <p className="text-base font-semibold text-civic-text mt-0.5">{selected.type}</p>
              </div>
              <StatusBadge level={selected.severity} pulse />
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-civic-muted">Ward</span>
                <span className="text-civic-text">{selected.ward}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-civic-muted">Date</span>
                <span className="text-civic-text font-mono">{formatDate(selected.date)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-civic-muted">Status</span>
                <span className="text-civic-text">{selected.status.replace("_", " ")}</span>
              </div>
              {selected.assigned_to && (
                <div className="flex justify-between">
                  <span className="text-civic-muted">Assigned</span>
                  <span className="text-civic-text">{selected.assigned_to}</span>
                </div>
              )}
              <div className="pt-2 border-t border-civic-border">
                <p className="text-civic-muted text-xs mb-1">Description</p>
                <p className="text-civic-text text-xs">{selected.description}</p>
              </div>
            </div>
            <button
              onClick={() => {
                setPrefillMessage(`Analyse ${selected.ward} ward — complaints, risk level, and recommended actions`);
                setChatOpen(true);
                setSelected(null);
              }}
              className="mt-4 w-full py-2 rounded-lg bg-civic-accent/10 border border-civic-accent/30 text-civic-accent text-sm hover:bg-civic-accent/20 transition-colors"
            >
              Analyse this ward in Copilot
            </button>
          </div>
        </div>
      )}
    </>
  );
}
