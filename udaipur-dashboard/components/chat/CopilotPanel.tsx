"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Bot, Loader2, Mic, Volume2, VolumeX, FileText, ImageIcon } from "lucide-react";
import { useDropzone } from "react-dropzone";
import { useAppStore } from "@/store/useAppStore";
import { useChat } from "@/hooks/useChat";
import { ChatMessage } from "./ChatMessage";
import { QuickActions } from "./QuickActions";
import { ThinkingSteps } from "./ThinkingSteps";
import { VoiceModal } from "./VoiceModal";
import { cn } from "@/lib/utils";

// ─── Suggestion tiles ─────────────────────────────────────────────────────────

const suggestions = [
  { icon: "🌅", label: "Morning briefing" },
  { icon: "📍", label: "Hiran Magri status" },
  { icon: "🎪", label: "Gangaur Fair plan" },
  { icon: "👥", label: "Thursday shifts" },
  { icon: "🎉", label: "Festival readiness" },
  { icon: "⚠️", label: "Critical cases" },
];

const suggestionPrompts: Record<string, string> = {
  "Morning briefing": "Give me the morning briefing for Udaipur Municipal Corporation",
  "Hiran Magri status": "Analyse Hiran Magri ward — complaints, risk level, and recommended actions",
  "Gangaur Fair plan": "Generate deployment plan for Gangaur Fair",
  "Thursday shifts": "Optimise staff shifts for Thursday",
  "Festival readiness": "Festival readiness check — are we prepared for upcoming events?",
  "Critical cases": "List all critical severity complaints and recommended resolutions",
};

// ─── Component ────────────────────────────────────────────────────────────────

export function CopilotPanel() {
  const { chatOpen, setChatOpen, prefillMessage, setPrefillMessage } = useAppStore();
  const { chatHistory, sendMessage, isLoading, thinkingSteps } = useChat();

  const [input, setInput] = useState("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);

  // ── Voice input ──────────────────────────────────────────────────────────────
  const [showVoiceModal, setShowVoiceModal] = useState(false);

  // ── Voice output ─────────────────────────────────────────────────────────────
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // ── Scroll to bottom ─────────────────────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory, isLoading]);

  // ── Prefill from map / other pages ───────────────────────────────────────────
  useEffect(() => {
    if (prefillMessage && chatOpen) {
      setInput(prefillMessage);
      setPrefillMessage("");
      textareaRef.current?.focus();
    }
  }, [prefillMessage, chatOpen, setPrefillMessage]);

  // ── Voice output ─────────────────────────────────────────────────────────────
  const speak = useCallback(async (text: string) => {
    if (!voiceEnabled || typeof window === "undefined") return;
    try {
      setIsSpeaking(true);
      // Try Groq PlayAI TTS first, fall back to browser speechSynthesis
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/text-to-speech`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: text.slice(0, 500) }),
        }
      );

      if (res.ok && res.headers.get("content-type")?.includes("audio")) {
        const audioBlob = await res.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        audio.onended = () => { setIsSpeaking(false); URL.revokeObjectURL(audioUrl); };
        audio.onerror = () => { setIsSpeaking(false); fallbackSpeak(text); };
        audio.play().catch(() => fallbackSpeak(text));
      } else {
        fallbackSpeak(text);
      }
    } catch {
      fallbackSpeak(text);
    }
  }, [voiceEnabled]);

  const fallbackSpeak = useCallback((text: string) => {
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text.slice(0, 400));
    const isHindi = /[\u0900-\u097F]/.test(text);
    const isHinglish = /(kya|hai|mein|ka|ki|ko|se|aur|nahi|hain)\b/i.test(text);
    utt.lang = isHindi || isHinglish ? "hi-IN" : "en-IN";
    utt.rate = 0.9;
    utt.onstart = () => setIsSpeaking(true);
    utt.onend = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utt);
  }, []);

  const stopSpeaking = useCallback(() => {
    window.speechSynthesis?.cancel();
    setIsSpeaking(false);
  }, []);

  // ── File drop ────────────────────────────────────────────────────────────────
  const onDrop = useCallback((accepted: File[]) => {
    const file = accepted[0];
    if (!file) return;
    setUploadedFile(file);
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = () => setFilePreview(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setFilePreview(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".webp"],
      "application/pdf": [".pdf"],
      "text/csv": [".csv"],
    },
    maxFiles: 1,
    noClick: true, // only drag-and-drop; click handled by paperclip button
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Send ─────────────────────────────────────────────────────────────────────
  const handleSend = useCallback(async () => {
    if ((!input.trim() && !uploadedFile) || isLoading) return;

    if (uploadedFile) {
      // Multipart path — send directly to Next.js proxy
      const formData = new FormData();
      formData.append("message", input || `Analyse this ${uploadedFile.type.startsWith("image/") ? "image" : "file"}`);
      formData.append("history", JSON.stringify(chatHistory));
      formData.append("file", uploadedFile);

      // Add user message to store manually via sendMessage with a marker
      const label = `[Attached: ${uploadedFile.name}] ${input}`.trim();
      setInput("");
      setUploadedFile(null);
      setFilePreview(null);
      await sendMessage(label, formData);
    } else {
      const msg = input.trim();
      setInput("");
      await sendMessage(msg);
    }
  }, [input, uploadedFile, isLoading, chatHistory, sendMessage]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Speak last assistant message when it arrives
  const lastMsg = chatHistory[chatHistory.length - 1];
  useEffect(() => {
    if (lastMsg?.role === "assistant") speak(lastMsg.content);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastMsg?.id]);

  return (
    <AnimatePresence>
      {chatOpen && (
        <>
          <motion.aside
          initial={{ x: 420, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 420, opacity: 0 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="fixed right-0 top-0 h-screen w-[400px] bg-civic-surface border-l border-civic-border shadow-2xl z-50 flex flex-col"
          style={{ willChange: "transform, opacity" }}
          aria-label="AI Copilot Panel"
        >
          {/* ── Header ── */}
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-civic-border shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-civic-accent/10 border border-civic-accent/30 flex items-center justify-center">
                <Bot className="h-4 w-4 text-civic-accent" />
              </div>
              <div>
                <p className="text-sm font-semibold text-civic-text">Smart City Copilot</p>
                <div className="flex items-center gap-1.5">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-civic-green opacity-75" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-civic-green" />
                  </span>
                  <span className="text-[10px] text-civic-muted">Live · 8 tools active</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {/* Voice output toggle */}
              <button
                onClick={() => { if (isSpeaking) stopSpeaking(); setVoiceEnabled((v) => !v); }}
                className={cn(
                  "p-1.5 rounded-lg transition-colors",
                  voiceEnabled ? "bg-civic-accent/20 text-civic-accent" : "text-civic-muted hover:text-civic-text"
                )}
                aria-label={voiceEnabled ? "Disable voice output" : "Enable voice output"}
                title={voiceEnabled ? "Voice output on" : "Voice output off"}
              >
                {isSpeaking ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              </button>

              <button
                onClick={() => setChatOpen(false)}
                className="p-1.5 rounded-lg hover:bg-white/5 text-civic-muted hover:text-civic-text transition-colors"
                aria-label="Close Copilot"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* ── Quick Actions ── */}
          <div className="shrink-0 overflow-y-auto max-h-64">
            <QuickActions onSelect={(p) => sendMessage(p)} />
          </div>

          {/* ── Messages ── */}
          <div
            {...getRootProps()}
            className={cn(
              "flex-1 overflow-y-auto px-3 py-3 space-y-3 min-h-0 transition-colors",
              isDragActive && "bg-civic-accent/5 ring-1 ring-inset ring-civic-accent/30"
            )}
          >
            <input {...getInputProps()} />

            {isDragActive && (
              <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
                <div className="bg-civic-surface border border-civic-accent/40 rounded-xl px-6 py-4 text-civic-accent text-sm">
                  Drop file to attach
                </div>
              </div>
            )}

            {chatHistory.length === 0 && (
              <div className="pt-2">
                <p className="text-xs text-civic-muted text-center mb-4">
                  Ask anything about Udaipur city operations
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {suggestions.map((s) => (
                    <button
                      key={s.label}
                      onClick={() => sendMessage(suggestionPrompts[s.label])}
                      className={cn(
                        "flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs",
                        "bg-civic-bg border border-civic-border text-civic-muted",
                        "hover:border-civic-accent/40 hover:text-civic-text hover:shadow-civic-glow",
                        "transition-all duration-200 text-left"
                      )}
                    >
                      <span>{s.icon}</span>
                      <span>{s.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {chatHistory.map((msg) => (
              <ChatMessage key={msg.id} message={msg} />
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-civic-surface border border-civic-border rounded-2xl rounded-tl-sm px-3.5 py-2.5 max-w-[88%]">
                  {thinkingSteps.length > 0 && <ThinkingSteps steps={thinkingSteps} />}
                  <div className="flex items-center gap-2 text-civic-muted text-xs">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Analysing...
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* ── File preview ── */}
          {uploadedFile && (
            <div className="mx-3 mb-2 flex items-center gap-2 bg-civic-bg border border-civic-border rounded-lg px-3 py-2">
              {filePreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={filePreview} alt="preview" className="w-9 h-9 rounded object-cover shrink-0" />
              ) : (
                <FileText className="h-5 w-5 text-civic-accent shrink-0" />
              )}
              <span className="text-xs text-civic-text flex-1 truncate">{uploadedFile.name}</span>
              <button
                onClick={() => { setUploadedFile(null); setFilePreview(null); }}
                className="text-civic-muted hover:text-civic-red transition-colors"
                aria-label="Remove file"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {/* ── Input area ── */}
          <div className="shrink-0 border-t border-civic-border p-3">
            <div className="flex items-end gap-2 bg-civic-bg border border-civic-border rounded-xl px-3 py-2 focus-within:border-civic-accent/40 transition-colors">
              {/* Hidden file input for paperclip */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf,.csv"
                className="hidden"
                onChange={(e) => { if (e.target.files?.[0]) onDrop([e.target.files[0]]); }}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="text-civic-muted hover:text-civic-accent transition-colors shrink-0 pb-0.5"
                aria-label="Attach file"
                title="Attach image, PDF or CSV"
              >
                <ImageIcon className="h-4 w-4" />
              </button>

              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about any ward, event, or resource..."
                rows={1}
                className="flex-1 bg-transparent text-sm text-civic-text placeholder:text-civic-muted resize-none outline-none max-h-24 leading-relaxed"
                style={{ minHeight: "1.5rem" }}
                aria-label="Chat input"
              />

              {/* Voice input */}
              <button
                onClick={() => setShowVoiceModal(true)}
                className="shrink-0 p-1 rounded-lg text-civic-muted hover:text-civic-accent hover:bg-civic-accent/10 transition-all duration-200"
                aria-label="Voice input"
                title="Speak your query"
              >
                <Mic className="h-4 w-4" />
              </button>

              {/* Send */}
              <button
                onClick={handleSend}
                disabled={(!input.trim() && !uploadedFile) || isLoading}
                className={cn(
                  "p-1.5 rounded-lg transition-all duration-200 shrink-0",
                  (input.trim() || uploadedFile) && !isLoading
                    ? "bg-civic-accent/20 text-civic-accent hover:bg-civic-accent/30"
                    : "text-civic-muted cursor-not-allowed"
                )}
                aria-label="Send message"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
            <p className="text-[10px] text-civic-muted mt-1.5 text-center">
              Enter to send · Shift+Enter for newline · drag & drop files
            </p>
          </div>
        </motion.aside>

        {/* Voice modal — rendered outside the panel so it covers full viewport */}
        {showVoiceModal && (
          <VoiceModal
            onResult={(text) => {
              console.log("[CopilotPanel] onResult received:", text);
              setInput(text);
              setShowVoiceModal(false);
              setTimeout(() => textareaRef.current?.focus(), 100);
              textareaRef.current?.focus();
            }}
            onClose={() => setShowVoiceModal(false)}
          />
        )}
        </>
      )}
    </AnimatePresence>
  );
}
