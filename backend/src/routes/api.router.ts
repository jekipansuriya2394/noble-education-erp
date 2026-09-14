import { Router } from 'express';
import {
  login,
  refreshToken,
  logout,
  me,
  getDemoCredentials,
} from '../controllers/auth.controller';
import {
  getOrganization,
  getBranches,
  getSchools,
  getAcademicYears,
  createSchool,
} from '../controllers/org.controller';
import {
  getStudents,
  getStudentById,
  createStudent,
  updateStudent,
} from '../controllers/student.controller';
import {
  getTeachers,
  getTeacherById,
  createTeacher,
} from '../controllers/teacher.controller';
import {
  getInquiries,
  createInquiry,
  updateInquiryStatus,
  addFollowUp,
  getAdmissionFunnelMetrics,
} from '../controllers/admission.controller';
import {
  getClasses,
  createClass,
  getSubjects,
  getCourses,
  getRooms,
} from '../controllers/academic.controller';
import {
  getTimetable,
  createTimetableSlot,
} from '../controllers/timetable.controller';
import {
  getClassAttendance,
  markBulkAttendance,
  getStudentAttendanceHistory,
} from '../controllers/attendance.controller';
import {
  getFeeStructures,
  collectFeePayment,
  getStudentFeeStatement,
  getFeePayments,
} from '../controllers/fee.controller';
import {
  getExpenses,
  createExpense,
  getFinancialSummary,
} from '../controllers/accounting.controller';
import {
  getEmployees,
  getLeaveRequests,
  applyLeave,
  reviewLeave,
  getPayrollRuns,
  generatePayrollRun,
} from '../controllers/hr.controller';
import {
  getExams,
  createExam,
  saveMarks,
} from '../controllers/exam.controller';
import {
  getAssignments,
  createAssignment,
  submitAssignment,
} from '../controllers/assignment.controller';
import {
  getBooks,
  issueBook,
  getVehiclesAndRoutes,
  getAnnouncements,
  createAnnouncement,
  getUserNotifications,
} from '../controllers/campus.controller';
import { getSuperAdminDashboardMetrics } from '../controllers/analytics.controller';
import { getAuditLogs } from '../controllers/audit.controller';
import {
  authenticateUser,
  requireRole,
  requirePermission,
  requireSchoolAccess,
} from '../middleware/auth';

const router = Router();

// --- 1. AUTH & SESSION ---
router.post('/auth/login', login);
router.post('/auth/refresh', refreshToken);
router.post('/auth/logout', logout);
router.get('/auth/me', authenticateUser, me);
router.get('/auth/demo-credentials', getDemoCredentials);

// --- 2. MULTI-TENANT ORG & SCHOOLS ---
router.get('/org', getOrganization);
router.get('/org/branches', getBranches);
router.get('/org/schools', getSchools);
router.get('/org/academic-years', getAcademicYears);
router.post('/org/schools', authenticateUser, requireRole('SUPER_ADMIN'), createSchool);

// --- 3. STUDENTS ---
router.get('/students', authenticateUser, requireSchoolAccess, getStudents);
router.get('/students/:id', authenticateUser, getStudentById);
router.post('/students', authenticateUser, requirePermission('students.create'), createStudent);
router.put('/students/:id', authenticateUser, requirePermission('students.edit'), updateStudent);

// --- 4. FACULTY & STAFF ---
router.get('/teachers', authenticateUser, requireSchoolAccess, getTeachers);
router.get('/teachers/:id', authenticateUser, getTeacherById);
router.post('/teachers', authenticateUser, requirePermission('teachers.create'), createTeacher);

// --- 5. ADMISSIONS CRM ---
router.get('/admissions/inquiries', authenticateUser, requireSchoolAccess, getInquiries);
router.post('/admissions/inquiries', authenticateUser, requirePermission('admissions.create'), createInquiry);
router.patch('/admissions/inquiries/:id/status', authenticateUser, updateInquiryStatus);
router.post('/admissions/inquiries/:id/follow-ups', authenticateUser, addFollowUp);
router.get('/admissions/funnel', authenticateUser, getAdmissionFunnelMetrics);

// --- 6. ACADEMICS ---
router.get('/academics/classes', authenticateUser, getClasses);
router.post('/academics/classes', authenticateUser, createClass);
router.get('/academics/subjects', authenticateUser, getSubjects);
router.get('/academics/courses', authenticateUser, getCourses);
router.get('/academics/rooms', authenticateUser, getRooms);

// --- 7. TIMETABLE ---
router.get('/timetable', authenticateUser, getTimetable);
router.post('/timetable/slots', authenticateUser, createTimetableSlot);

// --- 8. ATTENDANCE ---
router.get('/attendance/class', authenticateUser, requirePermission('attendance.view'), getClassAttendance);
router.post('/attendance/class', authenticateUser, requirePermission('attendance.mark'), markBulkAttendance);
router.get('/attendance/student/:studentId', authenticateUser, getStudentAttendanceHistory);

// --- 9. FEES & BILLING ---
router.get('/fees/structures', authenticateUser, requirePermission('fees.view'), getFeeStructures);
router.post('/fees/collect', authenticateUser, requirePermission('fees.collect'), collectFeePayment);
router.get('/fees/statement/:studentId', authenticateUser, getStudentFeeStatement);
router.get('/fees/payments', authenticateUser, requirePermission('fees.view'), getFeePayments);

// --- 10. ACCOUNTING ---
router.get('/accounting/expenses', authenticateUser, getExpenses);
router.post('/accounting/expenses', authenticateUser, createExpense);
router.get('/accounting/summary', authenticateUser, getFinancialSummary);

// --- 11. HR & PAYROLL ---
router.get('/hr/employees', authenticateUser, getEmployees);
router.get('/hr/leaves', authenticateUser, getLeaveRequests);
router.post('/hr/leaves', authenticateUser, applyLeave);
router.patch('/hr/leaves/:id', authenticateUser, reviewLeave);
router.get('/hr/payroll', authenticateUser, requirePermission('payroll.view'), getPayrollRuns);
router.post('/hr/payroll', authenticateUser, requirePermission('payroll.process'), generatePayrollRun);

// --- 12. EXAMINATIONS ---
router.get('/exams', authenticateUser, getExams);
router.post('/exams', authenticateUser, requirePermission('exams.manage'), createExam);
router.post('/exams/marks', authenticateUser, saveMarks);

// --- 13. DIGITAL LEARNING (ASSIGNMENTS) ---
router.get('/assignments', authenticateUser, getAssignments);
router.post('/assignments', authenticateUser, createAssignment);
router.post('/assignments/submit', authenticateUser, submitAssignment);

// --- 14. CAMPUS OPERATIONS ---
router.get('/campus/books', authenticateUser, getBooks);
router.post('/campus/books/issue', authenticateUser, requirePermission('library.manage'), issueBook);
router.get('/campus/transport', authenticateUser, getVehiclesAndRoutes);
router.get('/campus/announcements', authenticateUser, getAnnouncements);
router.post('/campus/announcements', authenticateUser, createAnnouncement);
router.get('/campus/notifications', authenticateUser, getUserNotifications);

// --- 15. ANALYTICS & AUDIT ---
router.get('/analytics/super-admin', authenticateUser, getSuperAdminDashboardMetrics);
router.get('/audit/logs', authenticateUser, requireRole('SUPER_ADMIN'), getAuditLogs);

export default router;
