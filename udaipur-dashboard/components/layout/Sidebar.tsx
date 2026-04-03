"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageSquare, CalendarDays, Users, Bot } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/useAppStore";

const navItems = [
  { href: "/complaints", icon: MessageSquare, label: "Complaints" },
  { href: "/events",     icon: CalendarDays,  label: "Events" },
  { href: "/staff",      icon: Users,         label: "Staff Planning" },
];

export function Sidebar() {
  const pathname = usePathname();
  const { toggleChat } = useAppStore();

  return (
    <aside className="w-60 shrink-0 h-screen bg-[#060A12] border-r border-civic-border flex flex-col sticky top-0 z-30">

      {/* Logo */}
      <div className="px-4 py-5 border-b border-civic-border">
        <motion.div
          className="flex items-center gap-3"
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="w-8 h-8 rounded-lg bg-civic-accent/10 border border-civic-accent/30 flex items-center justify-center shrink-0">
            <svg viewBox="0 0 32 32" className="w-5 h-5" fill="none">
              <polygon points="16,2 28,10 28,22 16,30 4,22 4,10" stroke="#00F3FF" strokeWidth="1.5" fill="none" />
              <circle cx="16" cy="16" r="4" fill="#00F3FF" opacity="0.8" />
              <line x1="16" y1="2"  x2="16" y2="12" stroke="#00F3FF" strokeWidth="1" opacity="0.5" />
              <line x1="16" y1="20" x2="16" y2="30" stroke="#00F3FF" strokeWidth="1" opacity="0.5" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-civic-text leading-tight">Smart City Copilot</p>
            <p className="text-[11px] text-civic-muted leading-tight">Udaipur Municipal Corp</p>
          </div>
        </motion.div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 space-y-0.5" aria-label="Main navigation">
        {navItems.map(({ href, icon: Icon, label }, i) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <motion.div
              key={href}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            >
              <Link
                href={href}
                className={cn(
                  "relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors duration-200",
                  active ? "text-civic-accent" : "text-civic-muted hover:text-civic-text hover:bg-white/5"
                )}
                aria-current={active ? "page" : undefined}
              >
                <AnimatePresence>
                  {active && (
                    <motion.span
                      layoutId="nav-active"
                      className="absolute inset-0 rounded-lg bg-civic-accent/10"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    />
                  )}
                </AnimatePresence>
                <AnimatePresence>
                  {active && (
                    <motion.span
                      layoutId="nav-bar"
                      className="absolute left-0 top-1 bottom-1 w-0.5 rounded-full bg-civic-accent"
                      initial={{ scaleY: 0 }}
                      animate={{ scaleY: 1 }}
                      exit={{ scaleY: 0 }}
                      transition={{ duration: 0.2 }}
                    />
                  )}
                </AnimatePresence>
                <Icon className="h-4 w-4 shrink-0 relative z-10" />
                <span className="relative z-10">{label}</span>
              </Link>
            </motion.div>
          );
        })}
      </nav>

      {/* Open Copilot */}
      <div className="p-3 border-t border-civic-border">
        <motion.button
          onClick={toggleChat}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          transition={{ duration: 0.15 }}
          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-civic-accent/10 border border-civic-accent/30 text-civic-accent text-sm font-medium hover:bg-civic-accent/20 transition-colors duration-200"
          aria-label="Open AI Copilot"
        >
          <Bot className="h-4 w-4" />
          Open Copilot
        </motion.button>
      </div>
    </aside>
  );
}
