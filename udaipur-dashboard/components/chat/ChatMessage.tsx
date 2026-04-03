"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ThinkingSteps } from "./ThinkingSteps";
import type { ChatMessage as ChatMessageType } from "@/types";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface ChatMessageProps {
  message: ChatMessageType;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";

  return (
    <motion.article
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className={cn("flex", isUser ? "justify-end" : "justify-start")}
      aria-label={`${message.role} message`}
    >
      <div
        className={cn(
          "max-w-[88%] px-3.5 py-2.5 text-sm leading-relaxed",
          isUser
            ? "bg-civic-accent/10 border border-civic-accent/20 rounded-2xl rounded-tr-sm text-civic-text"
            : "bg-civic-surface border border-civic-border rounded-2xl rounded-tl-sm text-civic-text"
        )}
      >
        {message.thinking_steps && message.thinking_steps.length > 0 && (
          <ThinkingSteps steps={message.thinking_steps} collapsed />
        )}

        <div className="prose prose-invert prose-sm max-w-none
          prose-p:my-1 prose-p:text-civic-text
          prose-headings:text-civic-text prose-headings:font-semibold
          prose-strong:text-civic-text prose-strong:font-semibold
          prose-code:font-mono prose-code:text-civic-accent prose-code:bg-civic-bg prose-code:px-1 prose-code:rounded
          prose-table:text-xs prose-th:text-civic-muted prose-td:text-civic-text
          prose-li:text-civic-text prose-ul:my-1 prose-ol:my-1
          prose-a:text-civic-accent-dim
        ">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {message.content}
          </ReactMarkdown>
        </div>

        <p className="text-[10px] text-civic-muted mt-1.5 font-mono">
          {new Date(message.timestamp).toLocaleTimeString("en-IN", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          })}
          {message.tools_used && message.tools_used.length > 0 && (
            <span className="ml-2 text-civic-accent-dim">
              · {message.tools_used.length} tools
            </span>
          )}
        </p>
      </div>
    </motion.article>
  );
}
