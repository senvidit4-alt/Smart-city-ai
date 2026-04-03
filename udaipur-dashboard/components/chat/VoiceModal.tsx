"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, X } from "lucide-react";

interface VoiceModalProps {
  onResult: (text: string) => void;
  onClose: () => void;
}

export function VoiceModal({ onResult, onClose }: VoiceModalProps) {
  const [status, setStatus] = useState<"listening" | "processing" | "error">("listening");
  const [transcript, setTranscript] = useState("");
  const [volume, setVolume] = useState(0);
  const [errorDetail, setErrorDetail] = useState("");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const animRef = useRef<number>(0);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    // 300ms delay prevents instant-close from strict-mode double-invoke
    const timer = setTimeout(() => {
      if (mountedRef.current) startVoice();
    }, 300);

    return () => {
      mountedRef.current = false;
      clearTimeout(timer);
      recognitionRef.current?.stop();
      cancelAnimationFrame(animRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startVoice = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Volume visualiser
      const ctx = new AudioContext();
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);

      const tick = () => {
        if (!mountedRef.current) return;
        const data = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(data);
        const avg = data.reduce((a, b) => a + b, 0) / data.length;
        setVolume(avg);
        animRef.current = requestAnimationFrame(tick);
      };
      tick();

      // Speech recognition
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      console.log("[VoiceModal] SR available:", !!SR, "| URL:", window.location.href);
      if (!SR) {
        if (mountedRef.current) { setErrorDetail("SpeechRecognition not supported"); setStatus("error"); }
        return;
      }

      const recognition = new SR();
      recognition.lang = "en-IN";
      recognition.continuous = false;
      recognition.interimResults = true;
      recognitionRef.current = recognition;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onresult = (event: any) => {
        if (!mountedRef.current) return;
        let finalText = "";
        let interimText = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) finalText += event.results[i][0].transcript;
          else interimText += event.results[i][0].transcript;
        }
        setTranscript(finalText || interimText);
        if (finalText && mountedRef.current) {
          setStatus("processing");
          stream.getTracks().forEach((t) => t.stop());
          setTimeout(() => {
            if (mountedRef.current) onResult(finalText.trim());
          }, 600);
        }
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onerror = (e: any) => {
        if (!mountedRef.current) return;
        console.error("[VoiceModal] SpeechRecognition error:", e.error, e.message);
        setErrorDetail(e.error);
        if (e.error === "not-allowed") setStatus("error");
      };

      // NOTE: no onend handler — that was causing the instant-close bug
      console.log("[VoiceModal] Starting recognition...");

      recognition.onstart = () => console.log("🎤 Recognition started");
      recognition.onspeechstart = () => console.log("🗣️ Speech detected");
      recognition.onspeechend = () => console.log("⏹️ Speech ended");
      recognition.onend = () => console.log("🔚 Recognition ended");

      setTimeout(() => {
        try {
          recognition.start();
          console.log("Recognition started");
        } catch (e) {
          console.log("Recognition start error:", e);
        }
      }, 500);
    } catch (err: unknown) {
      console.error("[VoiceModal] getUserMedia error:", err);
      if (mountedRef.current) {
        const name = err instanceof Error ? err.name : "";
        if (name === "NotAllowedError") setStatus("error");
      }
    }
  };

  const scale = 1 + (volume / 255) * 1.2;

  return (
    <div
      className="fixed inset-0 z-[200] flex flex-col items-center justify-end pb-20"
      style={{ background: "rgba(8,12,20,0.92)", backdropFilter: "blur(12px)" }}
      // No onClick on backdrop — was causing instant close
    >
      {/* Status */}
      <div className="mb-8 text-center px-6">
        {status === "listening" && (
          <>
            <p className="text-civic-accent text-xl font-medium mb-1">Listening…</p>
            <p className="text-civic-muted text-sm">Speak your query clearly</p>
          </>
        )}
        {status === "processing" && (
          <p className="text-civic-green text-xl font-medium">Got it! ✓</p>
        )}
        {status === "error" && (
          <>
            <p className="text-civic-red text-xl font-medium mb-1">Mic access denied</p>
            <p className="text-civic-muted text-sm">
              Click the 🔒 icon in your browser address bar and allow microphone
            </p>
            {errorDetail && (
              <p className="text-civic-muted text-xs mt-2 font-mono bg-civic-bg px-3 py-1 rounded">
                error: {errorDetail}
              </p>
            )}
            <p className="text-civic-muted text-xs mt-2">
              Must use Chrome/Edge on localhost or HTTPS
            </p>
          </>
        )}
      </div>

      {/* Live transcript */}
      {transcript && (
        <div className="mb-6 mx-8 bg-civic-surface border border-civic-border rounded-2xl px-5 py-3 text-center max-w-xs">
          <p className="text-civic-text text-sm">&ldquo;{transcript}&rdquo;</p>
        </div>
      )}

      {/* Animated mic button */}
      <div className="relative flex items-center justify-center mb-8">
        {status === "listening" &&
          [1, 2, 3].map((r) => (
            <div
              key={r}
              className="absolute rounded-full"
              style={{
                width: `${70 + r * 35}px`,
                height: `${70 + r * 35}px`,
                border: `1px solid rgba(0,243,255,${0.3 - r * 0.08})`,
                transform: `scale(${scale})`,
                transition: "transform 0.08s ease",
              }}
            />
          ))}

        <div
          className="relative w-20 h-20 rounded-full flex items-center justify-center"
          style={{
            background:
              status === "processing"
                ? "#00FF88"
                : status === "error"
                ? "#FF4444"
                : "#00F3FF",
            boxShadow:
              status === "processing"
                ? "0 0 50px rgba(0,255,136,0.6)"
                : status === "error"
                ? "none"
                : "0 0 50px rgba(0,243,255,0.6)",
            transform: status === "listening" ? `scale(${1 + volume / 400})` : "scale(1)",
            transition: "transform 0.08s ease",
          }}
        >
          <Mic size={30} className="text-civic-bg" />
        </div>
      </div>

      {/* Cancel */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-civic-surface border border-civic-border text-civic-muted hover:text-civic-text transition-colors"
        aria-label="Cancel voice input"
      >
        <X size={14} />
        <span className="text-sm">Cancel</span>
      </button>
    </div>
  );
}
