"use client";

import React, { useState } from "react";
import { CounselorBriefingData } from "../../lib/types";
import { formatCurrency } from "../../lib/utils";
import { useCommandContext } from "../../context/CommandContext";
import {
  ShieldAlert,
  UserCheck,
  Send,
  BookOpen,
  FileText,
  Clock,
  Sparkles,
  Calendar,
} from "lucide-react";

interface Props {
  title: string;
  data: CounselorBriefingData;
}

export const CounselorBriefingWidget: React.FC<Props> = ({ title, data }) => {
  const { approveIntervention } = useCommandContext();
  const [activeTab, setActiveTab] = useState<"diagnostics" | "protocol" | "outreach">("outreach");
  const [isApproved, setIsApproved] = useState(false);
  const [teacherMsg, setTeacherMsg] = useState(data.teacherOutreachText);

  const handleApprove = () => {
    setIsApproved(true);
    approveIntervention(data.studentId);
  };

  return (
    <div className="w-full my-3 rounded-xl border border-rose-500/30 bg-card text-card-foreground shadow-sm overflow-hidden">
      {/* Header with High-Risk Alert */}
      <div className="p-4 bg-rose-500/10 border-b border-rose-500/20 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-rose-600 text-white shadow-sm">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-sm tracking-tight text-foreground">
                {data.studentName} ({data.gradeLevel})
              </h4>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-600 text-white uppercase tracking-wider">
                Risk Score: {data.riskScore.toFixed(3)} • HIGH
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Automated Retention Diagnostics & Multi-Tier Intervention Package
            </p>
          </div>
        </div>

        {/* Quick stat chips */}
        <div className="flex items-center gap-2 text-xs">
          <div className="px-2.5 py-1 rounded bg-background border border-border text-muted-foreground">
            Attendance: <strong className="text-rose-600">{Math.round(data.attendanceRate * 100)}%</strong>
          </div>
          <div className="px-2.5 py-1 rounded bg-background border border-border text-muted-foreground">
            CA Drop: <strong className="text-rose-600">-{data.gradeDropDelta}%</strong>
          </div>
          <div className="px-2.5 py-1 rounded bg-background border border-border text-muted-foreground">
            Arrears: <strong className="text-rose-600">{formatCurrency(data.balanceDue)}</strong>
          </div>
        </div>
      </div>

      {/* Tabs bar */}
      <div className="flex border-b border-border bg-muted/20 text-xs font-medium">
        <button
          onClick={() => setActiveTab("outreach")}
          className={`flex items-center gap-1.5 px-4 py-2.5 border-b-2 transition-colors ${
            activeTab === "outreach"
              ? "border-primary text-primary bg-background font-semibold"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Send className="w-3.5 h-3.5" />
          Teacher Outreach Draft
        </button>
        <button
          onClick={() => setActiveTab("protocol")}
          className={`flex items-center gap-1.5 px-4 py-2.5 border-b-2 transition-colors ${
            activeTab === "protocol"
              ? "border-primary text-primary bg-background font-semibold"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          Counselor 1-on-1 Protocol
        </button>
        <button
          onClick={() => setActiveTab("diagnostics")}
          className={`flex items-center gap-1.5 px-4 py-2.5 border-b-2 transition-colors ${
            activeTab === "diagnostics"
              ? "border-primary text-primary bg-background font-semibold"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          Risk Factor Drivers ({data.topRiskFactors.length})
        </button>
      </div>

      {/* Tab Contents */}
      <div className="p-4 text-xs">
        {activeTab === "outreach" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-muted-foreground flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                AI-Drafted Empathetic Outreach Message (Ready for Teacher Review)
              </span>
              <span className="text-[11px] text-muted-foreground">
                Tone: Supportive & Non-Accusatory
              </span>
            </div>

            <textarea
              rows={4}
              value={teacherMsg}
              onChange={(e) => setTeacherMsg(e.target.value)}
              disabled={isApproved}
              className="w-full p-3 rounded-lg border border-input bg-background text-foreground text-xs leading-relaxed focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-75"
            />

            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Will be dispatched to {data.studentName} & verified guardian email
              </span>

              <button
                onClick={handleApprove}
                disabled={isApproved}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold shadow-sm transition-all ${
                  isApproved
                    ? "bg-emerald-600 text-white cursor-default"
                    : "bg-primary text-primary-foreground hover:bg-primary/90"
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                {isApproved ? "Approved & Dispatched" : "Approve & Dispatch Outreach"}
              </button>
            </div>
          </div>
        )}

        {activeTab === "protocol" && (
          <div className="space-y-3">
            <h5 className="font-semibold text-foreground">
              Guidance Counselor 1-on-1 Interview Strategy
            </h5>
            <div className="p-3 rounded-lg bg-muted/40 border border-border leading-relaxed text-muted-foreground whitespace-pre-wrap">
              {data.briefingSheetText}
            </div>
            <div className="flex items-center gap-2 pt-1">
              <button className="inline-flex items-center gap-1 px-3 py-1.5 rounded text-xs font-medium border border-input hover:bg-accent transition-colors">
                <Calendar className="w-3.5 h-3.5" />
                Schedule 1-on-1 Meeting
              </button>
            </div>
          </div>
        )}

        {activeTab === "diagnostics" && (
          <div className="space-y-2">
            <h5 className="font-semibold text-foreground">
              Algorithmic Risk Drivers (Scikit-Learn Feature Contributions)
            </h5>
            <div className="space-y-1.5 pt-1">
              {data.topRiskFactors.map((factor, i) => (
                <div
                  key={i}
                  className="p-2.5 rounded-lg bg-rose-500/5 border border-rose-500/20 text-rose-700 dark:text-rose-300 flex items-center gap-2"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                  <span>{factor}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
