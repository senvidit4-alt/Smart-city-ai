"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useComplaints } from "@/hooks/useComplaints";
import { ComplaintTable } from "@/components/complaints/ComplaintTable";
import { SurgeChart } from "@/components/complaints/SurgeChart";
import { WardHeatmap } from "@/components/complaints/WardHeatmap";
import { SectionLoader } from "@/components/ui/SectionLoader";
import { useAppStore } from "@/store/useAppStore";
import { Sparkles } from "lucide-react";

const wards = ["All Wards", "Hiran Magri", "Sukhadia Circle", "Fateh Sagar", "Chetak Circle", "Ambamata", "Badi", "Pratap Nagar", "Sector 11", "Sector 14", "Old City"];
const types = ["All Types", "Water Supply", "Road Damage", "Garbage Collection", "Street Light", "Sewage", "Encroachment", "Noise Pollution"];

export default function ComplaintsPage() {
  const [ward, setWard] = useState("");
  const [type, setType] = useState("");
  const [days, setDays] = useState(30);
  const { data, isLoading } = useComplaints({ ward: ward || undefined, type: type || undefined, days });
  const { setChatOpen, setPrefillMessage } = useAppStore();

  const selectClass = "bg-civic-bg border border-civic-border rounded-lg px-3 py-2 text-sm text-civic-text focus:outline-none focus:border-civic-accent/50 transition-colors";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <select value={ward} onChange={(e) => setWard(e.target.value)} className={selectClass} aria-label="Filter by ward">
          {wards.map((w) => <option key={w} value={w === "All Wards" ? "" : w}>{w}</option>)}
        </select>
        <select value={type} onChange={(e) => setType(e.target.value)} className={selectClass} aria-label="Filter by type">
          {types.map((t) => <option key={t} value={t === "All Types" ? "" : t}>{t}</option>)}
        </select>
        <select value={days} onChange={(e) => setDays(Number(e.target.value))} className={selectClass} aria-label="Filter by date range">
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
          <option value={60}>Last 60 days</option>
        </select>
      </div>

      {/* Metric cards */}
      {isLoading ? (
        <SectionLoader rows={3} className="grid-cols-3" />
      ) : data ? (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-civic-surface border border-civic-border rounded-xl p-4">
            <p className="text-xs text-civic-muted uppercase tracking-wider mb-2">Total Complaints</p>
            <p className="font-mono text-2xl font-semibold text-civic-text">{data.total}</p>
          </div>
          <div className="bg-civic-surface border border-civic-border rounded-xl p-4">
            <p className="text-xs text-civic-muted uppercase tracking-wider mb-2">Pending</p>
            <p className="font-mono text-2xl font-semibold text-civic-orange">{data.pending}</p>
            <p className="text-xs text-civic-muted mt-1">{Math.round((data.pending / data.total) * 100)}% of total</p>
          </div>
          <div className="bg-civic-surface border border-civic-border rounded-xl p-4">
            <p className="text-xs text-civic-muted uppercase tracking-wider mb-2">Week-on-Week Surge</p>
            <p className="font-mono text-2xl font-semibold text-civic-red">+{data.surge_pct}%</p>
            <p className="text-xs text-civic-muted mt-1">vs last week</p>
          </div>
        </div>
      ) : null}

      {/* Table + Charts */}
      <div className="grid lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3">
          <ComplaintTable complaints={data?.complaints ?? []} isLoading={isLoading} />
        </div>
        <div className="lg:col-span-2 space-y-4">
          {data && <SurgeChart complaints={data.complaints} />}
          {data && <WardHeatmap complaints={data.complaints} />}
        </div>
      </div>

      {/* Predictive Alert */}
      <div className="bg-civic-surface border border-civic-accent/30 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="h-4 w-4 text-civic-accent" />
          <span className="text-xs font-semibold text-civic-accent uppercase tracking-wider">AI Prediction</span>
        </div>
        <p className="text-sm text-civic-text mb-1">
          <span className="font-semibold">Badi ward</span> predicted to see a <span className="text-civic-orange font-semibold">+34% surge</span> in Water Supply complaints over the next 7 days based on seasonal patterns and current lake levels.
        </p>
        <p className="text-xs text-civic-muted mb-3">Recommended: Deploy 2 additional tankers and pre-assign 1 field officer to Badi area.</p>
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
