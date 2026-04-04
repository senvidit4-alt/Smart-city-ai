"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, X } from "lucide-react";

interface VoiceModalProps {
  onResult: (text: string) => void;
  onClose: () => void;
}

export function VoiceModal({ onResult, onClose }: VoiceModalProps) {
  const [status, setStatus] = useState<"listening" | "processing" | "error" | "done">("listening");
  const [transcript, setTranscript] = useState("");
  const [volume, setVolume] = useState(0);

  const mountedRef = useRef(true);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const animRef = useRef<number>(0);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    mountedRef.current = true;
    const t = setTimeout(() => {
      if (mountedRef.current) startRecording();
    }, 300);
    return () => {
      mountedRef.current = false;
      clearTimeout(t);
      stopRecording();
      cancelAnimationFrame(animRef.current);
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      streamRef.current = stream;

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
        setVolume(data.reduce((a, b) => a + b, 0) / data.length);
        animRef.current = requestAnimationFrame(tick);
      };
      tick();

      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        if (!mountedRef.current) return;
        setStatus("processing");
        await sendToGroq();
      };

      recorder.start(250); // 250ms chunks — better quality than 100ms
      setStatus("listening");

      // Auto-stop after 10s (was 8s — give more time to speak)
      silenceTimerRef.current = setTimeout(() => {
        if (mediaRecorderRef.current?.state === "recording") {
          mediaRecorderRef.current.stop();
        }
      }, 10000);
    } catch {
      if (mountedRef.current) setStatus("error");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
  };

  const sendToGroq = async () => {
    try {
      const audioBlob = new Blob(chunksRef.current, { type: "audio/webm" });
      console.log("[VoiceModal] Audio blob size:", audioBlob.size, "bytes");

      if (audioBlob.size < 500) {
        console.log("[VoiceModal] Audio too small, closing");
        onClose();
        return;
      }

      const formData = new FormData();
      formData.append("audio", audioBlob, "recording.webm");

      console.log("[VoiceModal] Sending to Groq STT...");
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/speech-to-text`,
        { method: "POST", body: formData }
      );
      const data = await res.json();
      console.log("[VoiceModal] Groq response:", data);

      if (data.text && mountedRef.current) {
        setTranscript(data.text);
        setStatus("done");
        setTimeout(() => {
          if (mountedRef.current) {
            console.log("[VoiceModal] Calling onResult with:", data.text);
            onResult(data.text);
          }
        }, 800);
      } else if (data.error === "hallucination") {
        // Whisper got noise — show retry message
        setTranscript("Samajh nahi aaya, dobara bolein...");
        setStatus("listening");
        chunksRef.current = [];
        // Restart recording
        setTimeout(() => {
          if (mountedRef.current && mediaRecorderRef.current?.state !== "recording") {
            startRecording();
          }
        }, 1500);
      } else {
        console.log("[VoiceModal] No text in response, closing");
        onClose();
      }
    } catch (err) {
      console.error("[VoiceModal] Groq STT error:", err);
      if (mountedRef.current) onClose();
    }
  };

  const handleMicClick = () => {
    if (status === "listening") {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      stopRecording();
    }
  };

  const scale = 1 + (volume / 255) * 1.2;

  return (
    <div
      className="fixed inset-0 z-[200] flex flex-col items-center justify-end pb-16"
      style={{ background: "rgba(8,12,20,0.92)", backdropFilter: "blur(12px)" }}
    >
      {/* Status */}
      <div className="mb-6 text-center px-6 min-h-[4rem]">
        {status === "listening" && (
          <>
            <p className="text-civic-accent text-xl font-medium mb-1">
              सुन रहा हूं... / Listening...
            </p>
            <p className="text-civic-muted text-sm">
              Hindi, Hinglish ya English mein bolein
            </p>
            <p className="text-civic-muted text-xs mt-1">
              Tap mic to stop early • Auto-stops in 8s
            </p>
          </>
        )}
        {status === "processing" && (
          <>
            <p className="text-civic-yellow text-xl font-medium mb-1">Processing...</p>
            <p className="text-civic-muted text-sm">Groq Whisper se transcribe ho raha hai</p>
          </>
        )}
        {status === "done" && (
          <p className="text-civic-green text-xl font-medium">समझ गया! / Got it! ✓</p>
        )}
        {status === "error" && (
          <>
            <p className="text-civic-red text-xl font-medium mb-1">Mic access denied</p>
            <p className="text-civic-muted text-sm">Browser mein mic permission allow karein</p>
          </>
        )}
      </div>

      {/* Transcript bubble */}
      {transcript && (
        <div className="mb-6 mx-8 bg-civic-surface border border-civic-border rounded-2xl px-5 py-3 text-center max-w-sm">
          <p className="text-[10px] text-civic-accent font-semibold uppercase tracking-wider mb-1">
            Groq Whisper
          </p>
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

        <button
          onClick={handleMicClick}
          aria-label="Stop recording"
          className="relative w-20 h-20 rounded-full flex items-center justify-center"
          style={{
            background:
              status === "processing" ? "#FFCC00"
              : status === "done"       ? "#00FF88"
              : status === "error"      ? "#FF4444"
              : "#00F3FF",
            boxShadow:
              status === "processing" ? "0 0 50px rgba(255,204,0,0.6)"
              : status === "done"       ? "0 0 50px rgba(0,255,136,0.6)"
              : status === "error"      ? "none"
              : "0 0 50px rgba(0,243,255,0.6)",
            transform: status === "listening" ? `scale(${1 + volume / 400})` : "scale(1)",
            transition: "transform 0.08s ease",
          }}
        >
          <Mic size={30} className="text-civic-bg" />
        </button>
      </div>

      {/* Powered by badge */}
      <div className="mb-4 flex items-center gap-2 px-3 py-1.5 rounded-full bg-civic-surface border border-civic-border">
        <span className="w-1.5 h-1.5 rounded-full bg-civic-accent" />
        <span className="text-xs text-civic-muted">STT: Groq Whisper · TTS: Sarvam AI</span>
      </div>

      {/* Cancel */}
      <button
        onClick={(e) => { e.stopPropagation(); onClose(); }}
        className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-civic-surface border border-civic-border text-civic-muted hover:text-civic-text transition-colors"
        aria-label="Cancel"
      >
        <X size={14} />
        <span className="text-sm">Cancel / रद्द करें</span>
      </button>
    </div>
  );
}
