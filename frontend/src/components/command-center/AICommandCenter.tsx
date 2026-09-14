"use client";

import React from "react";
import { CommandProvider, useCommandContext } from "../../context/CommandContext";
import { ChatPane } from "./ChatPane";
import { RoleSelector } from "./RoleSelector";
import {
  School,
  Sparkles,
  ShieldCheck,
  Zap,
  Activity,
} from "lucide-react";

const CommandCenterInner: React.FC = () => {
  const { currentRole, teacherScope } = useCommandContext();

  return (
    <div className="flex flex-col h-screen w-full bg-background text-foreground overflow-hidden">
      {/* Top Navbar */}
      <header className="h-16 px-6 border-b border-border bg-card flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-md">
            <School className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-sm sm:text-base tracking-tight text-foreground">
                AI Command Center
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Llama 3 Agent Active
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Autonomous Educational ERP Operations & Predictive Guidance
            </p>
          </div>
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 text-xs text-muted-foreground border-r border-border pr-3">
            <span className="flex items-center gap-1">
              <Activity className="w-3.5 h-3.5 text-primary" />
              Term: <strong>Fall 2026</strong>
            </span>
          </div>

          <RoleSelector />
        </div>
      </header>

      {/* Main Workspace Area */}
      <main className="flex-1 p-3 sm:p-5 overflow-hidden">
        <div className="h-full max-w-6xl mx-auto flex flex-col">
          <ChatPane />
        </div>
      </main>
    </div>
  );
};

export const AICommandCenter: React.FC = () => {
  return (
    <CommandProvider>
      <CommandCenterInner />
    </CommandProvider>
  );
};
