"use client";

import React, { useState } from "react";
import { ChatMessage } from "../../lib/types";
import { DynamicWidgetRenderer } from "../dynamic-widgets/DynamicWidgetRenderer";
import {
  Bot,
  User,
  Terminal,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  Sparkles,
} from "lucide-react";

interface Props {
  message: ChatMessage;
}

export const MessageBubble: React.FC<Props> = ({ message }) => {
  const isUser = message.role === "user";
  const [showTools, setShowTools] = useState(false);

  // Simple markdown renderer for bolding, bullet points, headers
  const renderFormattedText = (text: string) => {
    return text.split("\n").map((line, i) => {
      // Headers
      if (line.startsWith("### ")) {
        return (
          <h4 key={i} className="font-bold text-sm text-foreground mt-2 mb-1">
            {line.replace("### ", "")}
          </h4>
        );
      }
      if (line.startsWith("## ")) {
        return (
          <h3 key={i} className="font-bold text-base text-foreground mt-3 mb-1.5">
            {line.replace("## ", "")}
          </h3>
        );
      }
      if (line.startsWith("# ")) {
        return (
          <h2 key={i} className="font-bold text-lg text-foreground mt-3 mb-2">
            {line.replace("# ", "")}
          </h2>
        );
      }
      // Bullets
      if (line.startsWith("- ") || line.startsWith("* ")) {
        return (
          <div key={i} className="flex items-start gap-2 ml-2 my-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
            <span
              dangerouslySetInnerHTML={{
                __html: formatInlineMarkdown(line.slice(2)),
              }}
            />
          </div>
        );
      }
      // Standard paragraph
      return (
        <p
          key={i}
          className="my-1 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(line) }}
        />
      );
    });
  };

  const formatInlineMarkdown = (str: string) => {
    return str
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-foreground">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
      .replace(/`(.*?)`/g, '<code class="px-1.5 py-0.5 rounded bg-muted font-mono text-[11px] text-primary">$1</code>');
  };

  return (
    <div
      className={`flex items-start gap-3 my-4 ${
        isUser ? "flex-row-reverse" : "flex-row"
      }`}
    >
      {/* Avatar */}
      <div
        className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-gradient-to-tr from-blue-600 to-indigo-600 text-white"
        }`}
      >
        {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
      </div>

      {/* Bubble Container */}
      <div
        className={`max-w-[85%] sm:max-w-[80%] rounded-2xl p-4 shadow-sm text-xs ${
          isUser
            ? "bg-primary text-primary-foreground rounded-tr-none"
            : "bg-card border border-border text-foreground rounded-tl-none"
        }`}
      >
        {/* Timestamp & Role Tag */}
        <div className="flex items-center justify-between gap-3 text-[10px] text-muted-foreground mb-1.5">
          <span className="font-semibold tracking-wide uppercase">
            {isUser ? "You" : "Llama 3 Operations Agent"}
          </span>
          <span>{message.timestamp}</span>
        </div>

        {/* Tool Execution Ribbon (Collapsed by default, expand for audit) */}
        {!isUser && message.toolCalls && message.toolCalls.length > 0 && (
          <div className="my-2 rounded-lg border border-border bg-muted/40 overflow-hidden text-xs">
            <button
              onClick={() => setShowTools(!showTools)}
              className="w-full px-2.5 py-1.5 flex items-center justify-between text-muted-foreground hover:text-foreground transition-colors font-mono text-[11px]"
            >
              <div className="flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-primary" />
                <span>
                  Invoked {message.toolCalls.length} Tool
                  {message.toolCalls.length > 1 ? "s" : ""}
                </span>
                <span className="inline-flex items-center gap-0.5 text-emerald-600 text-[10px] ml-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Executed
                </span>
              </div>
              {showTools ? (
                <ChevronDown className="w-3.5 h-3.5" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5" />
              )}
            </button>

            {showTools && (
              <div className="p-2.5 border-t border-border bg-background space-y-2 text-[11px] font-mono">
                {message.toolCalls.map((tc, idx) => (
                  <div
                    key={idx}
                    className="p-2 rounded bg-muted/30 border border-border/60"
                  >
                    <div className="flex items-center justify-between text-primary font-bold">
                      <span>⚡ {tc.toolName}</span>
                      <span className="text-muted-foreground font-normal">
                        {tc.durationMs ? `${tc.durationMs.toFixed(1)}ms` : "OK"}
                      </span>
                    </div>
                    <div className="mt-1 text-muted-foreground overflow-x-auto text-[10px]">
                      Args: {JSON.stringify(tc.arguments)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Text Content */}
        <div className="space-y-1">
          {renderFormattedText(message.content)}
          {message.isStreaming && (
            <span className="inline-block w-2 h-4 bg-primary animate-pulse ml-1 align-middle" />
          )}
        </div>

        {/* Inline Generative UI Widgets */}
        {message.widgets && message.widgets.length > 0 && (
          <div className="mt-3 space-y-3">
            {message.widgets.map((w) => (
              <DynamicWidgetRenderer key={w.id} widget={w} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
