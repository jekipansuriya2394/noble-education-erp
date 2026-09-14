"use client";

import React from "react";
import { useCommandContext } from "../../context/CommandContext";
import { Shield, GraduationCap, ChevronDown, Check } from "lucide-react";

export const RoleSelector: React.FC = () => {
  const { currentRole, setRole, teacherScope } = useCommandContext();
  const [open, setOpen] = React.useState(false);

  return (
    <div className="relative inline-block text-left">
      <button
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-card hover:bg-accent text-xs font-medium text-foreground transition-colors shadow-sm"
      >
        {currentRole === "admin" ? (
          <>
            <span className="p-1 rounded bg-primary/10 text-primary">
              <Shield className="w-3.5 h-3.5" />
            </span>
            <div className="text-left">
              <span className="block font-semibold">School Administrator</span>
              <span className="block text-[10px] text-muted-foreground">
                Institutional Scope
              </span>
            </div>
          </>
        ) : (
          <>
            <span className="p-1 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <GraduationCap className="w-3.5 h-3.5" />
            </span>
            <div className="text-left">
              <span className="block font-semibold">{teacherScope.teacherName}</span>
              <span className="block text-[10px] text-muted-foreground">
                {teacherScope.gradeLevel} • {teacherScope.subject}
              </span>
            </div>
          </>
        )}
        <ChevronDown className="w-3.5 h-3.5 text-muted-foreground ml-1" />
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 mt-1.5 w-64 rounded-xl border border-border bg-popover text-popover-foreground shadow-lg z-50 p-1.5 space-y-1">
            <div className="px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground border-b border-border">
              Switch Operational Role
            </div>

            {/* Admin Option */}
            <button
              onClick={() => {
                setRole("admin");
                setOpen(false);
              }}
              className={`w-full flex items-start gap-2.5 p-2 rounded-lg text-left text-xs transition-colors ${
                currentRole === "admin"
                  ? "bg-accent font-semibold text-primary"
                  : "hover:bg-accent text-foreground"
              }`}
            >
              <div className="p-1.5 rounded bg-primary/10 text-primary mt-0.5">
                <Shield className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span>School Administrator</span>
                  {currentRole === "admin" && (
                    <Check className="w-3.5 h-3.5 text-primary" />
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground font-normal">
                  System-wide queries, institutional tuition, cross-grade reports.
                </p>
              </div>
            </button>

            {/* Teacher Option */}
            <button
              onClick={() => {
                setRole("teacher");
                setOpen(false);
              }}
              className={`w-full flex items-start gap-2.5 p-2 rounded-lg text-left text-xs transition-colors ${
                currentRole === "teacher"
                  ? "bg-accent font-semibold text-emerald-600 dark:text-emerald-400"
                  : "hover:bg-accent text-foreground"
              }`}
            >
              <div className="p-1.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mt-0.5">
                <GraduationCap className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span>Class Teacher</span>
                  {currentRole === "teacher" && (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground font-normal">
                  Context restricted to Grade 10 Math (28 enrolled students).
                </p>
              </div>
            </button>
          </div>
        </>
      )}
    </div>
  );
};
