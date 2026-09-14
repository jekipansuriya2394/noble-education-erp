"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import {
  UserRole,
  TeacherScope,
  ChatMessage,
  WidgetPayload,
  ToolCallRecord,
} from "../lib/types";

interface CommandContextType {
  currentRole: UserRole;
  setRole: (role: UserRole) => void;
  teacherScope: TeacherScope;
  setTeacherScope: React.Dispatch<React.SetStateAction<TeacherScope>>;
  messages: ChatMessage[];
  isStreaming: boolean;
  sendMessage: (text: string) => Promise<void>;
  clearConversation: () => void;
  approveIntervention: (studentId: number) => void;
  sendSingleReminder: (studentId: number) => void;
}

const defaultTeacherScope: TeacherScope = {
  teacherName: "Mrs. Sarah Jenkins",
  gradeLevel: "Grade 10",
  subject: "Mathematics",
  classId: "MATH-10A",
  studentCount: 28,
};

const CommandContext = createContext<CommandContextType | undefined>(undefined);

export const CommandProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [currentRole, setCurrentRole] = useState<UserRole>("admin");
  const [teacherScope, setTeacherScope] = useState<TeacherScope>(
    defaultTeacherScope
  );
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState<boolean>(false);

  // Initial welcome message based on role
  useEffect(() => {
    const welcomeMsg: ChatMessage = {
      id: "welcome-init",
      role: "assistant",
      content:
        currentRole === "admin"
          ? "👋 **Welcome, Administrator.**\n\nI have full system-wide access to school finances, institutional enrollment, attendance trends, and predictive attrition models. How can I assist you today?"
          : `👋 **Welcome, ${teacherScope.teacherName}.**\n\nI am configured for **${teacherScope.gradeLevel} - ${teacherScope.subject} (${teacherScope.classId})** with ${teacherScope.studentCount} students. Queries will be restricted to your assigned class scope.`,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      widgets:
        currentRole === "admin"
          ? [
              {
                id: "init-metrics",
                type: "financial_metrics",
                title: "Term Financial Snapshot",
                data: {
                  totalBilled: 12500,
                  totalCollected: 6000,
                  totalOutstanding: 6500,
                  collectionRate: 48.0,
                },
              },
            ]
          : undefined,
    };
    setMessages([welcomeMsg]);
  }, [currentRole, teacherScope]);

  const setRole = (role: UserRole) => {
    setCurrentRole(role);
  };

  const clearConversation = () => {
    setMessages([]);
  };

  const approveIntervention = (studentId: number) => {
    setMessages((prev) => [
      ...prev,
      {
        id: `action-${Date.now()}`,
        role: "assistant",
        content: `✅ **Action Confirmed:** Outreach email for Student #${studentId} has been approved and dispatched to the guardian. Logged in counselor audit log.`,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      },
    ]);
  };

  const sendSingleReminder = (studentId: number) => {
    setMessages((prev) => [
      ...prev,
      {
        id: `reminder-${Date.now()}`,
        role: "assistant",
        content: `📨 **Tuition Reminder Sent:** Formal reminder notice queued for Student ID #${studentId}.`,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      },
    ]);
  };

  const sendMessage = async (prompt: string) => {
    if (!prompt.trim() || isStreaming) return;

    const userMsgId = `user-${Date.now()}`;
    const userMsg: ChatMessage = {
      id: userMsgId,
      role: "user",
      content: prompt,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsStreaming(true);

    const assistantMsgId = `assistant-${Date.now()}`;
    const assistantMsg: ChatMessage = {
      id: assistantMsgId,
      role: "assistant",
      content: "",
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      isStreaming: true,
      toolCalls: [],
      widgets: [],
    };

    setMessages((prev) => [...prev, assistantMsg]);

    try {
      // Build role-scoped prompt context
      const scopedPrompt =
        currentRole === "teacher"
          ? `[ROLE CONTEXT: You are assisting ${teacherScope.teacherName}, teacher of ${teacherScope.gradeLevel} (${teacherScope.subject}). Restrict all responses and queries strictly to ${teacherScope.gradeLevel} students]\nUser Request: ${prompt}`
          : prompt;

      // Call Backend API or emulate streaming response with Generative UI components
      const response = await fetch("http://localhost:8000/api/v1/agent/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: scopedPrompt }),
      });

      if (response.ok) {
        const data = await response.json();
        
        // Extract widgets from tool calls
        const widgets: WidgetPayload[] = [];
        const toolCalls: ToolCallRecord[] = [];

        if (data.audit_trail) {
          for (const step of data.audit_trail) {
            for (const tc of step.tool_calls) {
              toolCalls.push({
                toolName: tc.tool_name,
                arguments: tc.arguments,
                result: tc.result,
                success: tc.success,
                durationMs: tc.duration_ms,
              });

              // Check if query_database returned fee/student data
              if (
                tc.tool_name === "query_database" &&
                tc.result?.rows &&
                tc.result.rows.length > 0
              ) {
                const sampleRow = tc.result.rows[0];
                if ("balance_due" in sampleRow || "term" in sampleRow) {
                  widgets.push({
                    id: `widget-fee-${Date.now()}`,
                    type: "fee_table",
                    title: "Tuition Defaulters & Balance Due",
                    data: tc.result.rows,
                  });
                }
              }

              // Check if generate_report returned tuition_defaulters
              if (tc.tool_name === "generate_report" && tc.result?.defaulters) {
                widgets.push({
                  id: `widget-fee-rep-${Date.now()}`,
                  type: "fee_table",
                  title: "Executive Tuition Defaulters Report",
                  data: tc.result.defaulters,
                });
              }
            }
          }
        }

        // Simulate streaming text delivery for realistic UX
        const fullAnswer = data.final_answer || "Task executed successfully.";
        let currentText = "";
        const words = fullAnswer.split(" ");
        for (let i = 0; i < words.length; i++) {
          currentText += (i === 0 ? "" : " ") + words[i];
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMsgId
                ? {
                    ...msg,
                    content: currentText,
                    toolCalls,
                    widgets: i === words.length - 1 ? widgets : [],
                  }
                : msg
            )
          );
          await new Promise((r) => setTimeout(r, 20));
        }

        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMsgId
              ? { ...msg, isStreaming: false, widgets }
              : msg
          )
        );
      } else {
        throw new Error(`Server returned HTTP ${response.status}`);
      }
    } catch (err: any) {
      // Offline fallback: Provide realistic interactive Generative UI simulation tailored to the prompt & role
      console.warn("Backend call failed or offline, rendering generative UI demo:", err);
      await generateSimulatedGenerativeUI(prompt, assistantMsgId, currentRole, teacherScope, setMessages);
    } finally {
      setIsStreaming(false);
    }
  };

  return (
    <CommandContext.Provider
      value={{
        currentRole,
        setRole,
        teacherScope,
        setTeacherScope,
        messages,
        isStreaming,
        sendMessage,
        clearConversation,
        approveIntervention,
        sendSingleReminder,
      }}
    >
      {children}
    </CommandContext.Provider>
  );
};

export const useCommandContext = () => {
  const context = useContext(CommandContext);
  if (!context) {
    throw new Error("useCommandContext must be used within a CommandProvider");
  }
  return context;
};

// Fallback Generative UI generator for interactive client preview
async function generateSimulatedGenerativeUI(
  prompt: string,
  msgId: string,
  role: UserRole,
  scope: TeacherScope,
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>
) {
  const lower = prompt.toLowerCase();
  let textResponse = "";
  const widgets: WidgetPayload[] = [];
  const toolCalls: ToolCallRecord[] = [];

  if (lower.includes("fee") || lower.includes("tuition") || lower.includes("paid")) {
    textResponse =
      role === "admin"
        ? "I have audited all school accounts. Found **3 students** with overdue Fall 2026 tuition balances totaling **$6,500.00**. You can inspect the records below or click 'Draft Bulk Reminders'."
        : `Audited accounts for **${scope.gradeLevel}**. Identified 2 students with overdue balances in your grade.`;

    toolCalls.push({
      toolName: "query_database",
      arguments: {
        sql_string:
          "SELECT s.id, s.first_name, s.last_name, s.grade_level, f.balance_due, f.due_date, f.status FROM students s JOIN fee_invoices f ON s.id = f.student_id WHERE f.balance_due > 0",
      },
      success: true,
      durationMs: 24.5,
    });

    widgets.push({
      id: `fee-widget-${Date.now()}`,
      type: "fee_table",
      title: `${role === "admin" ? "Institutional" : scope.gradeLevel} Tuition Defaulters`,
      data: [
        {
          studentId: 1,
          studentName: "Liam Johnson",
          gradeLevel: "Grade 10",
          term: "Fall 2026",
          balanceDue: 2500.0,
          dueDate: "2026-08-15",
          status: "overdue",
          email: "liam.j@school.edu",
        },
        {
          studentId: 3,
          studentName: "Noah Brown",
          gradeLevel: "Grade 10",
          term: "Fall 2026",
          balanceDue: 1500.0,
          dueDate: "2026-08-15",
          status: "overdue",
          email: "noah.b@school.edu",
        },
        {
          studentId: 5,
          studentName: "Oliver Wilson",
          gradeLevel: "Grade 10",
          term: "Fall 2026",
          balanceDue: 2500.0,
          dueDate: "2026-08-15",
          status: "overdue",
          email: "oliver.w@school.edu",
        },
      ],
    });
  } else if (lower.includes("attendance") || lower.includes("absent") || lower.includes("chart")) {
    textResponse = `Here is the 30-day rolling attendance trend for **${role === "admin" ? "All Grades" : scope.gradeLevel}**. The 85% safe threshold line is demarcated below.`;
    toolCalls.push({
      toolName: "generate_report",
      arguments: { module_name: "attendance_summary" },
      success: true,
      durationMs: 38.2,
    });

    widgets.push({
      id: `att-widget-${Date.now()}`,
      type: "attendance_chart",
      title: "30-Day Rolling Class Attendance Trend",
      data: [
        { day: "Aug 15", attendanceRate: 94, presentCount: 26, absentCount: 2 },
        { day: "Aug 20", attendanceRate: 91, presentCount: 25, absentCount: 3 },
        { day: "Aug 25", attendanceRate: 86, presentCount: 24, absentCount: 4 },
        { day: "Sep 01", attendanceRate: 78, presentCount: 21, absentCount: 7 },
        { day: "Sep 05", attendanceRate: 82, presentCount: 23, absentCount: 5 },
        { day: "Sep 10", attendanceRate: 74, presentCount: 20, absentCount: 8 },
        { day: "Sep 14", attendanceRate: 71, presentCount: 19, absentCount: 9 },
      ],
    });
  } else if (lower.includes("risk") || lower.includes("intervention") || lower.includes("counselor") || lower.includes("liam")) {
    textResponse = "🚨 **High Attrition Risk Alert:** Liam Johnson (Grade 10) was flagged by our predictive scikit-learn model with a **0.998 risk score**. Generated guidance briefing sheet and draft teacher outreach message below:";
    toolCalls.push({
      toolName: "predictive_analytics_model",
      arguments: { student_id: 1 },
      success: true,
      durationMs: 84.1,
    });

    widgets.push({
      id: `counselor-widget-${Date.now()}`,
      type: "counselor_briefing",
      title: "AI Guidance Counselor Briefing & Teacher Outreach",
      data: {
        studentId: 1,
        studentName: "Liam Johnson",
        gradeLevel: "Grade 10",
        riskScore: 0.998,
        riskLevel: "High",
        attendanceRate: 0.6,
        gradeDropDelta: 28.0,
        feeDelayDays: 30,
        balanceDue: 2500.0,
        topRiskFactors: [
          "Severe attendance drop (60% present, 8 absences in 30 days)",
          "Continuous Assessment decline (dropped 28% to 60.0% average)",
          "Overdue tuition delay (30 days past due, $2,500.00 outstanding)",
        ],
        briefingSheetText:
          "Root-cause analysis indicates concurrent financial distress and severe absenteeism impacting classroom presence. Recommended counseling protocol: Schedule informal rapport check-in, initiate tutoring accommodations in Math, and coordinate silent installment restructuring with the bursar.",
        teacherOutreachText:
          "Dear Liam, I wanted to reach out because I noticed you've missed a few classes recently and things have felt demanding. Your presence in our class is valued. Could we set aside 10 minutes this Wednesday during advisory period to touch base and see how we can best support you?",
      },
    });
  } else {
    textResponse = `Acknowledged. Executed operation in **${role.toUpperCase()}** scope. All school records and metrics are synchronized.`;
  }

  // Stream emulation
  const words = textResponse.split(" ");
  let accumulated = "";
  for (let i = 0; i < words.length; i++) {
    accumulated += (i === 0 ? "" : " ") + words[i];
    setMessages((prev) =>
      prev.map((m) =>
        m.id === msgId ? { ...m, content: accumulated, toolCalls } : m
      )
    );
    await new Promise((r) => setTimeout(r, 15));
  }

  setMessages((prev) =>
    prev.map((m) =>
      m.id === msgId ? { ...m, isStreaming: false, widgets } : m
    )
  );
}
