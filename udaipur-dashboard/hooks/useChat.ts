"use client";

import { useState, useCallback } from "react";
import axios from "axios";
import { mockChatResponse } from "@/lib/mock-api";
import { useAppStore } from "@/store/useAppStore";
import type { ChatMessage, ThinkingStep, ChatResponse } from "@/types";

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK_API === "true";

function generateId() {
  return Math.random().toString(36).slice(2, 10);
}

export function useChat() {
  const { chatHistory, addMessage } = useAppStore();
  const [isLoading, setIsLoading] = useState(false);
  const [thinkingSteps, setThinkingSteps] = useState<ThinkingStep[]>([]);

  const sendMessage = useCallback(
    async (content: string, formData?: FormData) => {
      if (!content.trim() || isLoading) return;

      const userMsg: ChatMessage = {
        id: generateId(),
        role: "user",
        content,
        timestamp: new Date().toISOString(),
      };
      addMessage(userMsg);
      setIsLoading(true);
      setThinkingSteps([]);

      try {
        let response: ChatResponse;

        if (USE_MOCK) {
          await new Promise((r) => setTimeout(r, 1200));
          response = mockChatResponse(content);
        } else if (formData) {
          // File upload path — multipart via Next.js proxy
          const { data } = await axios.post<ChatResponse>("/api/chat", formData, {
            timeout: 180000,
          });
          response = data;
        } else {
          // JSON path via Next.js proxy
          const { data } = await axios.post<ChatResponse>(
            "/api/chat",
            { message: content, history: chatHistory },
            { timeout: 180000 }
          );
          response = data;
        }

        setThinkingSteps(response.thinking_steps ?? []);

        const assistantMsg: ChatMessage = {
          id: generateId(),
          role: "assistant",
          content: response.reply,
          timestamp: new Date().toISOString(),
          tools_used: response.tools_used,
          thinking_steps: response.thinking_steps,
        };
        addMessage(assistantMsg);
      } catch {
        addMessage({
          id: generateId(),
          role: "assistant",
          content:
            "I encountered an error connecting to the analysis engine. Please check the backend connection and try again.",
          timestamp: new Date().toISOString(),
        });
      } finally {
        setIsLoading(false);
        setThinkingSteps([]);
      }
    },
    [chatHistory, addMessage, isLoading]
  );

  return { chatHistory, sendMessage, isLoading, thinkingSteps };
}
