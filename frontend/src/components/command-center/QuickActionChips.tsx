"use client";

import React from "react";
import { useCommandContext } from "../../context/CommandContext";
import {
  CreditCard,
  TrendingDown,
  AlertTriangle,
  FileBarChart,
  UserX,
  MailCheck,
  CheckCircle,
} from "lucide-react";

export const QuickActionChips: React.FC = () => {
  const { currentRole, sendMessage, isStreaming } = useCommandContext();

  const adminActions = [
    {
      label: "Audit Unpaid Tuition & Reminders",
      prompt: "Find all students who haven't paid tuition and draft reminder emails",
      icon: CreditCard,
    },
    {
      label: "30-Day Attendance Trend",
      prompt: "Show the 30-day rolling attendance trend and check if any grade is below the 85% threshold",
      icon: TrendingDown,
    },
    {
      label: "High-Risk Attrition Interventions",
      prompt: "Identify students with high failure/attrition risk and review counselor briefings",
      icon: AlertTriangle,
    },
    {
      label: "Financial Reconciliation",
      prompt: "Generate financial reconciliation report for Fall 2026",
      icon: FileBarChart,
    },
  ];

  const teacherActions = [
    {
      label: "Grade 10 Attendance Dropouts",
      prompt: "Show attendance rate and absences for my Grade 10 students",
      icon: UserX,
    },
    {
      label: "Liam Johnson High-Risk Briefing",
      prompt: "Generate guidance counselor briefing and teacher outreach draft for Liam Johnson",
      icon: AlertTriangle,
    },
    {
      label: "Continuous Assessment Decline",
      prompt: "Which students in Grade 10 Math have dropped more than 15% between Quiz 1 and Midterm?",
      icon: TrendingDown,
    },
    {
      label: "Tuition Defaulters in Grade 10",
      prompt: "List Grade 10 students with outstanding tuition fee invoices",
      icon: CreditCard,
    },
  ];

  const actions = currentRole === "admin" ? adminActions : teacherActions;

  return (
    <div className="flex items-center gap-2 overflow-x-auto py-2 px-1 text-xs no-scrollbar">
      <span className="text-[11px] font-semibold text-muted-foreground whitespace-nowrap mr-1">
        Suggested Actions:
      </span>
      {actions.map((act, i) => {
        const Icon = act.icon;
        return (
          <button
            key={i}
            disabled={isStreaming}
            onClick={() => sendMessage(act.prompt)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border bg-card hover:bg-accent text-foreground transition-all duration-200 whitespace-nowrap shadow-sm disabled:opacity-50 text-[11px] font-medium"
          >
            <Icon className="w-3.5 h-3.5 text-primary" />
            {act.label}
          </button>
        );
      })}
    </div>
  );
};
