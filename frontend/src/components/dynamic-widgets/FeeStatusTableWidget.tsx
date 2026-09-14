"use client";

import React, { useState } from "react";
import { formatCurrency } from "../../lib/utils";
import { StudentFeeRow } from "../../lib/types";
import { useCommandContext } from "../../context/CommandContext";
import {
  AlertCircle,
  CheckCircle2,
  Mail,
  ArrowUpDown,
  Search,
  Download,
  Users,
} from "lucide-react";

interface Props {
  title: string;
  data: any[];
}

export const FeeStatusTableWidget: React.FC<Props> = ({ title, data }) => {
  const { sendSingleReminder, sendMessage } = useCommandContext();
  const [search, setSearch] = useState("");
  const [sortAsc, setSortAsc] = useState(false);

  // Normalize data rows
  const rows: StudentFeeRow[] = data.map((item, idx) => ({
    studentId: item.studentId || item.id || item.student_id || idx + 1,
    studentName:
      item.studentName ||
      item.student_name ||
      `${item.first_name || ""} ${item.last_name || ""}`.trim() ||
      `Student #${idx + 1}`,
    gradeLevel: item.gradeLevel || item.grade_level || "Grade 10",
    term: item.term || "Fall 2026",
    balanceDue: Number(item.balanceDue || item.balance_due || 0),
    dueDate: item.dueDate || item.due_date || "2026-08-15",
    status: (item.status || "overdue").toLowerCase() as any,
    email: item.email || "student@school.edu",
  }));

  const filtered = rows
    .filter(
      (r) =>
        r.studentName.toLowerCase().includes(search.toLowerCase()) ||
        r.gradeLevel.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) =>
      sortAsc ? a.balanceDue - b.balanceDue : b.balanceDue - a.balanceDue
    );

  const totalOverdue = filtered.reduce((acc, curr) => acc + curr.balanceDue, 0);

  return (
    <div className="w-full my-3 rounded-xl border border-border bg-card text-card-foreground shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-4 bg-muted/40 border-b border-border flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400">
              <AlertCircle className="w-4 h-4" />
            </span>
            <h4 className="font-semibold text-sm tracking-tight">{title}</h4>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {filtered.length} students with outstanding balances • Total:{" "}
            <span className="font-semibold text-rose-600 dark:text-rose-400">
              {formatCurrency(totalOverdue)}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() =>
              sendMessage(
                "Draft and queue customized reminder emails for all outstanding tuition defaulters."
              )
            }
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
          >
            <Mail className="w-3.5 h-3.5" />
            Draft Bulk Reminders
          </button>
        </div>
      </div>

      {/* Filter toolbar */}
      <div className="p-3 bg-card border-b border-border flex items-center justify-between gap-2">
        <div className="relative flex-1 max-w-xs">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Filter by student name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1 text-xs rounded-md border border-input bg-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <button
          onClick={() => setSortAsc(!sortAsc)}
          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded-md border border-input text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
        >
          <ArrowUpDown className="w-3 h-3" />
          {sortAsc ? "Lowest Balance" : "Highest Balance"}
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-muted/30 text-muted-foreground font-medium border-b border-border">
            <tr>
              <th className="py-2.5 px-3 font-medium">Student</th>
              <th className="py-2.5 px-3 font-medium">Grade</th>
              <th className="py-2.5 px-3 font-medium">Term</th>
              <th className="py-2.5 px-3 font-medium">Balance Due</th>
              <th className="py-2.5 px-3 font-medium">Due Date</th>
              <th className="py-2.5 px-3 font-medium">Status</th>
              <th className="py-2.5 px-3 text-right font-medium">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map((row) => (
              <tr
                key={row.studentId}
                className="hover:bg-muted/20 transition-colors group"
              >
                <td className="py-2.5 px-3 font-medium text-foreground">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold">
                      {row.studentName.charAt(0)}
                    </div>
                    <div>
                      <div>{row.studentName}</div>
                      <div className="text-[10px] text-muted-foreground">
                        {row.email}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="py-2.5 px-3 text-muted-foreground">
                  {row.gradeLevel}
                </td>
                <td className="py-2.5 px-3 text-muted-foreground">
                  {row.term}
                </td>
                <td className="py-2.5 px-3 font-semibold text-rose-600 dark:text-rose-400">
                  {formatCurrency(row.balanceDue)}
                </td>
                <td className="py-2.5 px-3 text-muted-foreground">
                  {row.dueDate}
                </td>
                <td className="py-2.5 px-3">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                    Overdue
                  </span>
                </td>
                <td className="py-2.5 px-3 text-right">
                  <button
                    onClick={() => sendSingleReminder(row.studentId)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-medium border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                  >
                    <Mail className="w-3 h-3" />
                    Notify
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
