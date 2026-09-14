export interface User {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatar?: string;
  role: string;
  roles: string[];
  permissions: string[];
  school?: SchoolSummary | null;
  branch?: BranchSummary | null;
}

export interface SchoolSummary {
  id: string;
  name: string;
  code: string;
}

export interface BranchSummary {
  id: string;
  name: string;
  code?: string;
}

export interface Student {
  id: string;
  admissionNumber: string;
  rollNumber?: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  gender: string;
  dob: string;
  bloodGroup?: string;
  mobile?: string;
  email?: string;
  address: string;
  city: string;
  state: string;
  status: 'ACTIVE' | 'ALUMNI' | 'SUSPENDED' | 'WITHDRAWN';
  stream?: string;
  examPrep?: string;
  school?: SchoolSummary;
  branch?: BranchSummary;
  class?: { id: string; name: string; gradeNumber: number };
  division?: { id: string; name: string };
  parents?: Array<{ parent: Parent; relationship: string }>;
  createdAt: string;
}

export interface Parent {
  id: string;
  fatherName?: string;
  fatherMobile?: string;
  fatherOccupation?: string;
  motherName?: string;
  motherMobile?: string;
  guardianName?: string;
  email?: string;
  address?: string;
}

export interface Employee {
  id: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  gender: string;
  mobile: string;
  email: string;
  joiningDate: string;
  qualification?: string;
  experienceYears: number;
  basicSalary: number;
  status: string;
  department?: { id: string; name: string };
  designation?: { id: string; title: string };
  school?: SchoolSummary;
  teacherProfile?: { id: string; specialization?: string; isClassTeacher: boolean };
}

export interface AdmissionInquiry {
  id: string;
  inquiryNumber: string;
  studentName: string;
  parentName: string;
  mobile: string;
  email?: string;
  course: string;
  classApplied?: string;
  source: string;
  status: 'NEW' | 'CONTACTED' | 'INTERESTED' | 'FOLLOW_UP' | 'VISIT_SCHEDULED' | 'ADMISSION_STARTED' | 'ADMITTED' | 'NOT_INTERESTED' | 'LOST';
  notes?: string;
  createdAt: string;
  school?: { name: string };
  followUps?: Array<{
    id: string;
    followUpDate: string;
    responseNotes: string;
    status: string;
  }>;
}

export interface TimetableSlot {
  id: string;
  dayOfWeek: string;
  periodNumber: number;
  startTime: string;
  endTime: string;
  subject?: { id: string; name: string; code: string };
  teacher?: { employee: { firstName: string; lastName: string } };
  room?: { roomNumber: string };
}

export interface FeePayment {
  id: string;
  receiptNumber: string;
  student: {
    id: string;
    firstName: string;
    lastName: string;
    admissionNumber: string;
    class?: { name: string };
  };
  amountPaid: number;
  paymentDate: string;
  paymentMode: string;
  transactionRef?: string;
  status: string;
  feeInstallment?: { name: string };
}
