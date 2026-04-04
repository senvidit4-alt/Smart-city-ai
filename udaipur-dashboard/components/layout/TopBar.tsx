"use client";

import { usePathname } from "next/navigation";
import { Bell, Bot, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppStore } from "@/store/useAppStore";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

const routeTitles: Record<string, { title: string; breadcrumb: string }> = {
  "/complaints": { title: "Complaints",     breadcrumb: "Dashboard / Complaints" },
  "/events":     { title: "Events",         breadcrumb: "Dashboard / Events" },
  "/staff":      { title: "Staff Planning", breadcrumb: "Dashboard / Staff Planning" },
};

export function TopBar() {
  const pathname = usePathname();
  const { toggleChat, unreadAlertCount, markAlertsRead } = useAppStore();
  const route = routeTitles[pathname] ?? { title: "Dashboard", breadcrumb: "Dashboard" };

  // Client-only time to avoid SSR hydration mismatch
  const [time, setTime] = useState("");
  useEffect(() => {
    const fmt = () =>
      new Date().toLocaleTimeString("en-IN", {
        hour: "2-digit", minute: "2-digit", hour12: true,
      });
    setTime(fmt());
    const id = setInterval(() => setTime(fmt()), 60000);
    return () => clearInterval(id);
  }, []);

  return (
    <header className="h-14 bg-civic-surface/80 backdrop-blur-md sticky top-0 z-40 border-b border-civic-border flex items-center px-6 gap-4">

      {/* Left: animated title on route change */}
      <AnimatePresence mode="wait">
        <motion.div
          key={pathname}
          className="flex-1 min-w-0"
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 6 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          <h1 className="text-sm font-semibold text-civic-text truncate">{route.title}</h1>
          <p className="text-[11px] text-civic-muted truncate">{route.breadcrumb}</p>
        </motion.div>
      </AnimatePresence>

      {/* Centre: Search */}
      <button
        className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-civic-bg border border-civic-border text-civic-muted text-xs hover:border-civic-accent/40 transition-colors duration-200 w-48"
        aria-label="Search (Cmd+K)"
      >
        <Search className="h-3.5 w-3.5" />
        <span>Search wards, events...</span>
        <kbd className="ml-auto text-[10px] bg-civic-border/50 px-1 rounded">⌘K</kbd>
      </button>

      {/* Right */}
      <div className="flex items-center gap-2">
        <span className="text-[11px] text-civic-muted hidden lg:block font-mono">{time}</span>

        {/* Alert bell */}
        <motion.button
          onClick={markAlertsRead}
          whileTap={{ scale: 0.9 }}
          className="relative p-2 rounded-lg hover:bg-white/5 text-civic-muted hover:text-civic-text transition-colors duration-200"
          aria-label={`${unreadAlertCount} unread alerts`}
        >
          <Bell className="h-4 w-4" />
          <AnimatePresence>
            {unreadAlertCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 25 }}
                className="absolute top-1 right-1 h-2 w-2 rounded-full bg-civic-red"
              />
            )}
          </AnimatePresence>
        </motion.button>

        {/* Ask Copilot */}
        <motion.button
          onClick={toggleChat}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.96 }}
          transition={{ duration: 0.15 }}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium",
            "bg-civic-accent/10 border border-civic-accent/30 text-civic-accent",
            "hover:bg-civic-accent/20 transition-colors duration-200"
          )}
          aria-label="Open AI Copilot"
        >
          <Bot className="h-3.5 w-3.5" />
          Ask Copilot
        </motion.button>

        <div className="w-7 h-7 rounded-full bg-civic-accent/20 border border-civic-accent/30 flex items-center justify-center text-[10px] font-mono text-civic-accent">
          UMC
        </div>
      </div>
    </header>
  );
}
