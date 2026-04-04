"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useComplaints } from "@/hooks/useComplaints";
import { ComplaintTable } from "@/components/complaints/ComplaintTable";
import { SurgeChart } from "@/components/complaints/SurgeChart";
import { WardHeatmap } from "@/components/complaints/WardHeatmap";
import { SectionLoader } from "@/components/ui/SectionLoader";
import { useAppStore } from "@/store/useAppStore";
import { Sparkles } from "lucide-react";
import type { Complaint, Severity, ComplaintStatus } from "@/types";

// ─── Ticker constants ─────────────────────────────────────────────────────────

const WARDS = [
  "Hiran Magri", "Sector 14", "Shobhagpura", "Panchwati",
  "Madhuban", "Sukhadia Circle", "Chetak Circle", "Pratap Nagar",
  "Bhupal Pura", "Old City",
];

const TYPES = [
  "Garbage Overflow", "Pothole", "Street Light",
  "Water Leakage", "Stray Animal", "Sewage Block",
  "Road Damage", "Drain Overflow",
];

const SEVERITIES: Severity[] = ["low", "medium", "high", "critical"];

const SEVERITY_COLORS: Record<Severity, string> = {
  low:      "#00FF88",
  medium:   "#FFCC00",
  high:     "#FF8800",
  critical: "#FF4444",
};

const SEVERITY_LABELS: Record<Severity, string> = {
  low: "Low", medium: "Medium", high: "High", critical: "Critical",
};

function rand<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

interface TickerItem {
  id: number;
  ward: string;
  type: string;
  severity: Severity;
  time: string;
  isNew: boolean;
}

function generateTickerItem(id: number): TickerItem {
  return {
    id,
    ward: rand(WARDS),
    type: rand(TYPES),
    severity: rand(SEVERITIES),
    time: new Date().toLocaleTimeString("en-IN", {
      hour: "2-digit", minute: "2-digit", second: "2-digit",
    }),
    isNew: false,
  };
}

// ─── Filters ──────────────────────────────────────────────────────────────────

const wardOptions = ["All Wards", "Hiran Magri", "Sukhadia Circle", "Fateh Sagar", "Chetak Circle", "Ambamata", "Badi", "Pratap Nagar", "Sector 11", "Sector 14", "Old City"];
const typeOptions = ["All Types", "Water Supply", "Road Damage", "Garbage Collection", "Street Light", "Sewage", "Encroachment", "Noise Pollution"];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ComplaintsPage() {
  const [ward, setWard] = useState("");
  const [type, setType] = useState("");
  const [days, setDays] = useState(30);
  const { data, isLoading } = useComplaints({ ward: ward || undefined, type: type || undefined, days });
  const { setChatOpen, setPrefillMessage } = useAppStore();

  // ── Ticker state ─────────────────────────────────────────────────────────
  // Start with empty/stable slots — populate after mount to avoid hydration mismatch
  const [ticker, setTicker] = useState<TickerItem[]>(() =>
    Array.from({ length: 4 }, (_, i) => ({
      id: i,
      ward: WARDS[i % WARDS.length],
      type: TYPES[i % TYPES.length],
      severity: SEVERITIES[i % SEVERITIES.length],
      time: "00:00:00",
      isNew: false,
    }))
  );
  const [flashIndex, setFlashIndex] = useState<number | null>(null);
  const replaceIndexRef = useRef(0);
  const [mounted, setMounted] = useState(false);

  // Populate with random data only after hydration is complete
  useEffect(() => {
    setTicker(Array.from({ length: 4 }, (_, i) => generateTickerItem(i)));
    setMounted(true);
  }, []);

  // ── Live complaints for table ─────────────────────────────────────────────
  const [liveComplaints, setLiveComplaints] = useState<(Complaint & { isNew?: boolean })[]>([]);
  const [newAlert, setNewAlert] = useState<string | null>(null);

  useEffect(() => {
    if (!mounted) return;
    const interval = setInterval(() => {
      const idx = replaceIndexRef.current % 4;
      const item = generateTickerItem(Date.now());
      item.isNew = true;

      setFlashIndex(idx);
      setTicker((prev) => {
        const updated = [...prev];
        updated[idx] = item;
        return updated;
      });

      // Also push to live complaints table
      const complaint: Complaint & { isNew: boolean } = {
        id: `LIVE-${item.id}`,
        date: new Date().toISOString().split("T")[0],
        ward: item.ward,
        type: item.type,
        severity: item.severity,
        status: "pending" as ComplaintStatus,
        description: `${item.type} reported in ${item.ward} area — awaiting field inspection.`,
        location: `${item.ward}, Udaipur`,
        isNew: true,
      };
      setLiveComplaints((prev) => [complaint, ...prev].slice(0, 50));
      setNewAlert(`New ${SEVERITY_LABELS[item.severity].toUpperCase()} — ${item.type} in ${item.ward}`);
      setTimeout(() => setNewAlert(null), 3500);

      // Remove flash after 1s
      setTimeout(() => {
        setFlashIndex(null);
        setTicker((prev) => {
          const updated = [...prev];
          if (updated[idx]) updated[idx] = { ...updated[idx], isNew: false };
          return updated;
        });
      }, 1000);

      replaceIndexRef.current++;
    }, 5000);

    return () => clearInterval(interval);
  }, [mounted]);

  const allComplaints: (Complaint & { isNew?: boolean })[] = [
    ...liveComplaints,
    ...(data?.complaints ?? []),
  ];

  const selectClass = "bg-civic-bg border border-civic-border rounded-lg px-3 py-2 text-sm text-civic-text focus:outline-none focus:border-civic-accent/50 transition-colors";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* ── Toast alert ── */}
      <AnimatePresence>
        {newAlert && (
          <motion.div
            initial={{ opacity: 0, x: 60, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 60, scale: 0.95 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="fixed top-4 right-4 z-50 flex items-center gap-3 bg-civic-surface border border-civic-red rounded-xl px-4 py-3 shadow-[0_0_24px_rgba(255,68,68,0.2)] max-w-sm"
          >
            <span className="relative flex h-2.5 w-2.5 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-civic-red opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-civic-red" />
            </span>
            <div>
              <p className="text-[10px] text-civic-red font-semibold uppercase tracking-wider">Live Complaint</p>
              <p className="text-xs text-civic-text">{newAlert}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Filters ── */}
      <div className="flex flex-wrap items-center gap-3">
        <select value={ward} onChange={(e) => setWard(e.target.value)} className={selectClass} aria-label="Filter by ward">
          {wardOptions.map((w) => <option key={w} value={w === "All Wards" ? "" : w}>{w}</option>)}
        </select>
        <select value={type} onChange={(e) => setType(e.target.value)} className={selectClass} aria-label="Filter by type">
          {typeOptions.map((t) => <option key={t} value={t === "All Types" ? "" : t}>{t}</option>)}
        </select>
        <select value={days} onChange={(e) => setDays(Number(e.target.value))} className={selectClass} aria-label="Filter by date range">
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
          <option value={60}>Last 60 days</option>
        </select>
      </div>

      {/* ── Metric cards ── */}
      {isLoading ? (
        <SectionLoader rows={3} className="grid-cols-3" />
      ) : (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-civic-surface border border-civic-border rounded-xl p-4">
            <p className="text-xs text-civic-muted uppercase tracking-wider mb-2">Total Complaints</p>
            <p className="font-mono text-2xl font-semibold text-civic-text">
              {(data?.total ?? 0) + liveComplaints.length}
            </p>
            {liveComplaints.length > 0 && (
              <p className="text-[10px] text-civic-green mt-1">+{liveComplaints.length} live this session</p>
            )}
          </div>
          <div className="bg-civic-surface border border-civic-border rounded-xl p-4">
            <p className="text-xs text-civic-muted uppercase tracking-wider mb-2">Pending</p>
            <p className="font-mono text-2xl font-semibold text-civic-orange">
              {(data?.pending ?? 0) + liveComplaints.length}
            </p>
            {data && (
              <p className="text-xs text-civic-muted mt-1">
                {Math.round(((data.pending + liveComplaints.length) / ((data.total + liveComplaints.length) || 1)) * 100)}% of total
              </p>
            )}
          </div>
          <div className="bg-civic-surface border border-civic-border rounded-xl p-4">
            <p className="text-xs text-civic-muted uppercase tracking-wider mb-2">Week-on-Week Surge</p>
            <p className="font-mono text-2xl font-semibold text-civic-red">+{data?.surge_pct ?? 18}%</p>
            <p className="text-xs text-civic-muted mt-1">vs last week</p>
          </div>
        </div>
      )}

      {/* ── Live Ticker Bar ── */}
      <div className="rounded-xl border border-civic-border bg-[#0D1421] overflow-hidden" suppressHydrationWarning>
        {/* Header */}
        <div className="flex items-center gap-2 px-4 py-2 border-b border-civic-border">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-civic-red opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-civic-red" />
          </span>
          <span className="text-xs font-semibold text-civic-red tracking-wider">LIVE INCOMING</span>
          <span className="text-xs text-civic-muted ml-1">Udaipur Municipal — Real-time complaint feed</span>
          <div className="ml-auto flex items-center gap-1.5">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-civic-green opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-civic-green" />
            </span>
            <span className="text-xs text-civic-green">Active</span>
          </div>
        </div>

        {/* 4 complaint slots */}
        <div className="grid grid-cols-4 divide-x divide-civic-border">
          {ticker.map((c, i) => {
            const color = SEVERITY_COLORS[c.severity];
            return (
              <div
                key={c.id}
                className="px-3 py-2.5 transition-all duration-500"
                style={{
                  background: flashIndex === i ? `${color}18` : "transparent",
                }}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span
                    className="text-[10px] font-medium px-1.5 py-0.5 rounded-full"
                    style={{
                      color,
                      background: `${color}20`,
                      border: `1px solid ${color}40`,
                    }}
                  >
                    {SEVERITY_LABELS[c.severity]}
                  </span>
                  {flashIndex === i && (
                    <span className="text-[10px] text-civic-red animate-pulse font-semibold">NEW</span>
                  )}
                </div>
                <p className="text-xs font-medium text-civic-text truncate">{c.type}</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="w-1 h-1 rounded-full shrink-0" style={{ background: color }} />
                  <p className="text-[11px] text-civic-muted truncate">{c.ward}</p>
                </div>
                <p className="text-[10px] text-civic-muted/60 mt-1 font-mono">{c.time}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Table + Charts ── */}
      <div className="grid lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3">
          <ComplaintTable
            complaints={allComplaints}
            isLoading={isLoading && liveComplaints.length === 0}
          />
        </div>
        <div className="lg:col-span-2 space-y-4">
          {allComplaints.length > 0 && <SurgeChart complaints={allComplaints} />}
          {allComplaints.length > 0 && <WardHeatmap complaints={allComplaints} />}
        </div>
      </div>

      {/* ── Predictive Alert ── */}
      <div className="bg-civic-surface border border-civic-accent/30 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="h-4 w-4 text-civic-accent" />
          <span className="text-xs font-semibold text-civic-accent uppercase tracking-wider">AI Prediction</span>
        </div>
        <p className="text-sm text-civic-text mb-1">
          <span className="font-semibold">Badi ward</span> predicted to see a{" "}
          <span className="text-civic-orange font-semibold">+34% surge</span> in Water Supply complaints
          over the next 7 days based on seasonal patterns and current lake levels.
        </p>
        <p className="text-xs text-civic-muted mb-3">
          Recommended: Deploy 2 additional tankers and pre-assign 1 field officer to Badi area.
        </p>
        <button
          onClick={() => {
            setPrefillMessage("Analyse surge prediction for Badi ward — water supply complaints and recommended actions");
            setChatOpen(true);
          }}
          className="px-4 py-1.5 rounded-lg bg-civic-accent/10 border border-civic-accent/30 text-civic-accent text-xs hover:bg-civic-accent/20 transition-colors"
        >
          Take action in Copilot
        </button>
      </div>
    </motion.div>
  );
}
