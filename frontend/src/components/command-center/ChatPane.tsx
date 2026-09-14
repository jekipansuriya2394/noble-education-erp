"use client";

import React, { useState, useRef, useEffect } from "react";
import { useCommandContext } from "../../context/CommandContext";
import { MessageBubble } from "./MessageBubble";
import { QuickActionChips } from "./QuickActionChips";
import {
  Send,
  Trash2,
  Sparkles,
  Cpu,
  Lock,
  CornerDownLeft,
} from "lucide-react";

export const ChatPane: React.FC = () => {
  const { messages, isStreaming, sendMessage, clearConversation, currentRole } =
    useCommandContext();
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isStreaming]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isStreaming) return;
    const text = input;
    setInput("");
    await sendMessage(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="flex flex-col h-full bg-background rounded-2xl border border-border shadow-sm overflow-hidden">
      {/* Top Pane Action Bar */}
      <div className="p-3.5 border-b border-border bg-card/60 backdrop-blur flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-primary/10 text-primary text-[11px] font-semibold">
            <Cpu className="w-3.5 h-3.5" />
            <span>Local Ollama (Llama 3)</span>
          </div>
          <div className="hidden sm:flex items-center gap-1 text-[11px] text-muted-foreground">
            <Lock className="w-3 h-3 text-emerald-600" />
            <span>Read-Only AST SQL Guards Active</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={clearConversation}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors text-xs"
            title="Clear Chat History"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-2 scroll-smooth"
      >
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}

        {isStreaming && messages[messages.length - 1]?.role !== "assistant" && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground italic my-2">
            <Sparkles className="w-3.5 h-3.5 text-primary animate-spin" />
            <span>Llama 3 is analyzing query and verifying execution guards...</span>
          </div>
        )}
      </div>

      {/* Suggested Quick Actions */}
      <div className="px-4 border-t border-border bg-card/30">
        <QuickActionChips />
      </div>

      {/* Chat Input Bar */}
      <div className="p-4 border-t border-border bg-card">
        <form onSubmit={handleSubmit} className="relative">
          <textarea
            rows={2}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              currentRole === "admin"
                ? "Enter command e.g., 'Find all students who haven't paid tuition and draft reminder emails'..."
                : "Enter command for Grade 10 Math e.g., 'Show attendance dropouts and continuous assessment decline'..."
            }
            className="w-full resize-none p-3.5 pr-24 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
          />

          <div className="absolute right-3 bottom-3 flex items-center gap-2">
            <span className="hidden sm:inline-flex items-center text-[10px] text-muted-foreground">
              Press Enter <CornerDownLeft className="w-2.5 h-2.5 ml-0.5" />
            </span>
            <button
              type="submit"
              disabled={!input.trim() || isStreaming}
              className="p-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 transition-all shadow-sm"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
