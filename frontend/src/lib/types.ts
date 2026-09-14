export type UserRole = "admin" | "teacher";

export interface TeacherScope {
  teacherName: string;
  gradeLevel: string;
  subject: string;
  classId: string;
  studentCount: number;
}

export interface ToolCallRecord {
  toolName: string;
  arguments: Record<string, any>;
  result?: any;
  success?: boolean;
  durationMs?: number;
}

export type WidgetType =
  | "fee_table"
  | "attendance_chart"
  | "counselor_briefing"
  | "financial_metrics"
  | "generic_table";

export interface WidgetPayload {
  id: string;
  type: WidgetType;
  title: string;
  data: any;
  timestamp?: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
  toolCalls?: ToolCallRecord[];
  widgets?: WidgetPayload[];
  isStreaming?: boolean;
}

export interface QuickAction {
  id: string;
  label: string;
  prompt: string;
  icon: string;
  role: "admin" | "teacher" | "all";
}

export interface StudentFeeRow {
  studentId: number;
  studentName: string;
  gradeLevel: string;
  term: string;
  balanceDue: number;
  dueDate: string;
  status: "paid" | "overdue" | "partial" | "unpaid";
  email: string;
  guardianEmail?: string;
}

export interface AttendanceDataPoint {
  day: string;
  attendanceRate: number; // 0 to 100
  presentCount: number;
  absentCount: number;
  threshold?: number;
}

export interface CounselorBriefingData {
  studentId: number;
  studentName: string;
  gradeLevel: string;
  riskScore: number;
  riskLevel: "High" | "Medium" | "Low";
  attendanceRate: number;
  gradeDropDelta: number;
  feeDelayDays: number;
  balanceDue: number;
  topRiskFactors: string[];
  briefingSheetText: string;
  teacherOutreachText: string;
}

export interface FinancialSummaryData {
  totalBilled: number;
  totalCollected: number;
  totalOutstanding: number;
  collectionRate: number;
}
