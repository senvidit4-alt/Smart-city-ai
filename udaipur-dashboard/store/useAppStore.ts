import { create } from "zustand";
import type { Alert, ChatMessage } from "@/types";

interface AppState {
  // Active ward selection
  activeWard: string | null;
  setActiveWard: (ward: string | null) => void;

  // Copilot panel
  chatOpen: boolean;
  setChatOpen: (open: boolean) => void;
  toggleChat: () => void;

  // Chat history
  chatHistory: ChatMessage[];
  addMessage: (msg: ChatMessage) => void;
  clearHistory: () => void;
  prefillMessage: string;
  setPrefillMessage: (msg: string) => void;

  // Alert queue
  alerts: Alert[];
  setAlerts: (alerts: Alert[]) => void;
  unreadAlertCount: number;
  markAlertsRead: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  activeWard: null,
  setActiveWard: (ward) => set({ activeWard: ward }),

  chatOpen: false,
  setChatOpen: (open) => set({ chatOpen: open }),
  toggleChat: () => set((s) => ({ chatOpen: !s.chatOpen })),

  chatHistory: [],
  addMessage: (msg) =>
    set((s) => ({ chatHistory: [...s.chatHistory, msg] })),
  clearHistory: () => set({ chatHistory: [] }),
  prefillMessage: "",
  setPrefillMessage: (msg) => set({ prefillMessage: msg }),

  alerts: [],
  setAlerts: (alerts) =>
    set({ alerts, unreadAlertCount: alerts.length }),
  unreadAlertCount: 0,
  markAlertsRead: () => set({ unreadAlertCount: 0 }),
}));
