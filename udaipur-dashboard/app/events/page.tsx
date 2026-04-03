"use client";

import { motion } from "framer-motion";
import { useEvents } from "@/hooks/useEvents";
import { EventCalendar } from "@/components/events/EventCalendar";
import { SectionLoader } from "@/components/ui/SectionLoader";
import { CalendarDays } from "lucide-react";

export default function EventsPage() {
  const { data, isLoading, error, refetch } = useEvents();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-civic-accent" />
          <h2 className="text-sm font-semibold text-civic-text">Udaipur Event Intelligence</h2>
        </div>
        <span className="text-xs text-civic-muted">
          {new Date().toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
        </span>
      </div>

      {isLoading && <SectionLoader rows={6} className="grid-cols-3" />}
      {error && (
        <div className="text-civic-red text-sm p-4 bg-civic-surface border border-civic-red/30 rounded-xl flex justify-between">
          Failed to load events
          <button onClick={() => refetch()} className="underline">Retry</button>
        </div>
      )}
      {data && <EventCalendar events={data} />}
    </motion.div>
  );
}
