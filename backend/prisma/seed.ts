import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Noble Education ERP Database...');

  // 1. Organization
  const org = await prisma.organization.upsert({
    where: { code: 'NOBLE_EDU' },
    update: {},
    create: {
      name: 'Noble Education',
      code: 'NOBLE_EDU',
      location: 'Vadodara, Gujarat, India',
      website: 'nobleedu.in',
      email: 'info@nobleedu.in',
      phone: '+91 265 233 4455',
    },
  });

  // 2. Branches (Vadodara Region)
  const branchAlkapuri = await prisma.branch.upsert({
    where: { code: 'BR_ALKAPURI' },
    update: {},
    create: {
      organizationId: org.id,
      name: 'Alkapuri Campus (Main Hub)',
      code: 'BR_ALKAPURI',
      address: 'Near RC Dutt Road, Alkapuri',
      city: 'Vadodara',
      state: 'Gujarat',
      pincode: '390007',
      phone: '+91 265 233 1122',
    },
  });

  const branchManjalpur = await prisma.branch.upsert({
    where: { code: 'BR_MANJALPUR' },
    update: {},
    create: {
      organizationId: org.id,
      name: 'Manjalpur Branch',
      code: 'BR_MANJALPUR',
      address: 'Opp. Eva Mall, Manjalpur',
      city: 'Vadodara',
      state: 'Gujarat',
      pincode: '390011',
      phone: '+91 265 266 3344',
    },
  });

  const branchKarelibaug = await prisma.branch.upsert({
    where: { code: 'BR_KARELIBAUG' },
    update: {},
    create: {
      organizationId: org.id,
      name: 'Karelibaug Branch',
      code: 'BR_KARELIBAUG',
      address: 'Near Bright Day School, Karelibaug',
      city: 'Vadodara',
      state: 'Gujarat',
      pincode: '390018',
      phone: '+91 265 244 5566',
    },
  });

  // 3. Schools & Institutes under Noble Education
  const schoolRoyal = await prisma.school.upsert({
    where: { code: 'ROYAL_EDUWORLD' },
    update: {},
    create: {
      organizationId: org.id,
      branchId: branchAlkapuri.id,
      name: 'Royal Eduworld School',
      code: 'ROYAL_EDUWORLD',
      type: 'K12_CBSE',
      tagline: 'Empowering Young Minds Through Excellence',
      email: 'contact@royaleduworld.in',
      phone: '+91 265 233 9901',
    },
  });

  const schoolNewheaven = await prisma.school.upsert({
    where: { code: 'NEWHEAVEN_VIDYALAYA' },
    update: {},
    create: {
      organizationId: org.id,
      branchId: branchManjalpur.id,
      name: 'Newheaven Vidyalaya',
      code: 'NEWHEAVEN_VIDYALAYA',
      type: 'K12_GSEB',
      tagline: 'Value-Based Quality Education for Gujarat',
      email: 'info@newheaven.in',
      phone: '+91 265 266 8802',
    },
  });

  const schoolRaghukul = await prisma.school.upsert({
    where: { code: 'RAGHUKUL_VIDYALAYA' },
    update: {},
    create: {
      organizationId: org.id,
      branchId: branchKarelibaug.id,
      name: 'Raghukul Vidyalaya',
      code: 'RAGHUKUL_VIDYALAYA',
      type: 'K12_GSEB',
      tagline: 'Tradition Meets Innovation',
      email: 'admissions@raghukul.in',
      phone: '+91 265 244 7703',
    },
  });

  const schoolCoaching = await prisma.school.upsert({
    where: { code: 'NOBLE_COACHING' },
    update: {},
    create: {
      organizationId: org.id,
      branchId: branchAlkapuri.id,
      name: 'Noble Education Coaching',
      code: 'NOBLE_COACHING',
      type: 'COACHING',
      tagline: 'Premier Institute for JEE, NEET, GUJCET & DDCET',
      email: 'coaching@nobleedu.in',
      phone: '+91 265 233 4400',
    },
  });

  const schoolEngg = await prisma.school.upsert({
    where: { code: 'NOBLE_ENGG_ACADEMY' },
    update: {},
    create: {
      organizationId: org.id,
      branchId: branchAlkapuri.id,
      name: 'Noble Engineering Academy',
      code: 'NOBLE_ENGG_ACADEMY',
      type: 'ENGINEERING',
      tagline: 'Excellence in Technical & Engineering Coaching',
      email: 'engineering@nobleedu.in',
      phone: '+91 265 233 4411',
    },
  });

  // 4. Academic Year
  const academicYear = await prisma.academicYear.upsert({
    where: { id: 'ay_2025_2026' },
    update: {},
    create: {
      id: 'ay_2025_2026',
      name: '2025-2026',
      startDate: new Date('2025-06-01'),
      endDate: new Date('2026-05-31'),
      isCurrent: true,
    },
  });

  // 5. Granular Permissions
  const permissionDefs = [
    { name: 'students.view', module: 'STUDENTS', description: 'View student profiles and records' },
    { name: 'students.create', module: 'STUDENTS', description: 'Admit and register new students' },
    { name: 'students.edit', module: 'STUDENTS', description: 'Update student academic and personal info' },
    { name: 'students.delete', module: 'STUDENTS', description: 'Archive or withdraw student records' },
    { name: 'teachers.view', module: 'TEACHERS', description: 'View teacher details and schedules' },
    { name: 'teachers.create', module: 'TEACHERS', description: 'Add new teaching staff' },
    { name: 'teachers.edit', module: 'TEACHERS', description: 'Edit teacher assignments and salary' },
    { name: 'teachers.delete', module: 'TEACHERS', description: 'Terminate or archive teachers' },
    { name: 'fees.view', module: 'FEES', description: 'View fee structures and payment ledger' },
    { name: 'fees.collect', module: 'FEES', description: 'Collect fees and generate receipts' },
    { name: 'fees.refund', module: 'FEES', description: 'Issue fee refunds' },
    { name: 'fees.edit', module: 'FEES', description: 'Modify fee structures or discounts' },
    { name: 'attendance.view', module: 'ATTENDANCE', description: 'View attendance statistics' },
    { name: 'attendance.mark', module: 'ATTENDANCE', description: 'Mark daily/subject student attendance' },
    { name: 'attendance.edit', module: 'ATTENDANCE', description: 'Correct historical attendance' },
    { name: 'payroll.view', module: 'PAYROLL', description: 'View payroll runs and salary structures' },
    { name: 'payroll.process', module: 'PAYROLL', description: 'Calculate monthly payroll' },
    { name: 'payroll.approve', module: 'PAYROLL', description: 'Approve and disburse salaries' },
    { name: 'reports.view', module: 'REPORTS', description: 'View executive and analytical reports' },
    { name: 'reports.export', module: 'REPORTS', description: 'Export tabular data as Excel/PDF/CSV' },
    { name: 'settings.manage', module: 'SETTINGS', description: 'Manage organization, schools, and roles' },
    { name: 'admissions.view', module: 'ADMISSIONS', description: 'View inquiries and admission CRM' },
    { name: 'admissions.create', module: 'ADMISSIONS', description: 'Create lead inquiries' },
    { name: 'admissions.edit', module: 'ADMISSIONS', description: 'Update inquiry stages and notes' },
    { name: 'exams.manage', module: 'EXAMS', description: 'Schedule exams and publish results' },
    { name: 'library.manage', module: 'LIBRARY', description: 'Manage book inventory and issues' },
    { name: 'transport.manage', module: 'TRANSPORT', description: 'Manage buses, drivers, and routes' },
    { name: 'documents.manage', module: 'DOCUMENTS', description: 'Upload and verify student/staff documents' },
  ];

  for (const p of permissionDefs) {
    await prisma.permission.upsert({
      where: { name: p.name },
      update: {},
      create: p,
    });
  }

  // 6. Roles
  const roles = [
    { name: 'SUPER_ADMIN', displayName: 'Super Administrator', description: 'Full access across all Noble Education branches and schools' },
    { name: 'BRANCH_ADMIN', displayName: 'Branch Administrator', description: 'Branch-wide control of assigned campus' },
    { name: 'SCHOOL_ADMIN', displayName: 'School Administrator', description: 'Complete administrative management for a specific school' },
    { name: 'ACADEMIC_COORDINATOR', displayName: 'Academic Coordinator', description: 'Manages timetables, syllabus, exams, and academic performance' },
    { name: 'TEACHER', displayName: 'Faculty / Teacher', description: 'Classroom teaching, attendance, marks, assignments' },
    { name: 'ACCOUNTANT', displayName: 'Accountant', description: 'Fee collections, receipts, vouchers, expense tracking' },
    { name: 'HR', displayName: 'HR Manager', description: 'Employee records, leave approvals, payroll generation' },
    { name: 'RECEPTION', displayName: 'Front Desk / Reception', description: 'Inquiry management, visitor log, student registration' },
    { name: 'STUDENT', displayName: 'Student', description: 'Academic calendar, attendance, marks, fees, study material' },
    { name: 'PARENT', displayName: 'Parent / Guardian', description: 'View linked children attendance, performance, and fees' },
    { name: 'TRANSPORT', displayName: 'Transport Manager', description: 'Fleet, routes, stops, and driver management' },
    { name: 'LIBRARIAN', displayName: 'Librarian', description: 'Book lending, returns, cataloging, and fines' },
  ];

  for (const r of roles) {
    await prisma.role.upsert({
      where: { name: r.name },
      update: { displayName: r.displayName, description: r.description },
      create: r,
    });
  }

  // 7. Demo Users (Password: Noble@2026)
  const defaultPasswordHash = await bcrypt.hash('Noble@2026', 10);

  const demoUsers = [
    {
      email: 'superadmin@nobleedu.in',
      username: 'superadmin',
      firstName: 'Jayesh',
      lastName: 'Prajapati',
      role: 'SUPER_ADMIN',
      phone: '+91 98250 12345',
      schoolId: null,
      branchId: null,
    },
    {
      email: 'admin.alkapuri@nobleedu.in',
      username: 'admin_alkapuri',
      firstName: 'Bhavin',
      lastName: 'Shah',
      role: 'BRANCH_ADMIN',
      phone: '+91 98251 23456',
      schoolId: null,
      branchId: branchAlkapuri.id,
    },
    {
      email: 'admin.royal@nobleedu.in',
      username: 'admin_royal',
      firstName: 'Dr. Meera',
      lastName: 'Desai',
      role: 'SCHOOL_ADMIN',
      phone: '+91 98252 34567',
      schoolId: schoolRoyal.id,
      branchId: branchAlkapuri.id,
    },
    {
      email: 'coordinator@nobleedu.in',
      username: 'coordinator',
      firstName: 'Prof. Aniket',
      lastName: 'Mehta',
      role: 'ACADEMIC_COORDINATOR',
      phone: '+91 98253 45678',
      schoolId: schoolRoyal.id,
      branchId: branchAlkapuri.id,
    },
    {
      email: 'teacher.rajesh@nobleedu.in',
      username: 'teacher_rajesh',
      firstName: 'Rajesh',
      lastName: 'Panchal',
      role: 'TEACHER',
      phone: '+91 98254 56789',
      schoolId: schoolRoyal.id,
      branchId: branchAlkapuri.id,
    },
    {
      email: 'accountant@nobleedu.in',
      username: 'accountant',
      firstName: 'Dharmesh',
      lastName: 'Trivedi',
      role: 'ACCOUNTANT',
      phone: '+91 98255 67890',
      schoolId: schoolRoyal.id,
      branchId: branchAlkapuri.id,
    },
    {
      email: 'hr@nobleedu.in',
      username: 'hr_manager',
      firstName: 'Pooja',
      lastName: 'Joshi',
      role: 'HR',
      phone: '+91 98256 78901',
      schoolId: schoolRoyal.id,
      branchId: branchAlkapuri.id,
    },
    {
      email: 'reception@nobleedu.in',
      username: 'reception',
      firstName: 'Kinjal',
      lastName: 'Solanki',
      role: 'RECEPTION',
      phone: '+91 98257 89012',
      schoolId: schoolRoyal.id,
      branchId: branchAlkapuri.id,
    },
    {
      email: 'student.aarav@nobleedu.in',
      username: 'student_aarav',
      firstName: 'Aarav',
      lastName: 'Patel',
      role: 'STUDENT',
      phone: '+91 98258 90123',
      schoolId: schoolRoyal.id,
      branchId: branchAlkapuri.id,
    },
    {
      email: 'parent.patel@nobleedu.in',
      username: 'parent_patel',
      firstName: 'Mukeshbhai',
      lastName: 'Patel',
      role: 'PARENT',
      phone: '+91 98259 01234',
      schoolId: schoolRoyal.id,
      branchId: branchAlkapuri.id,
    },
    {
      email: 'transport@nobleedu.in',
      username: 'transport_manager',
      firstName: 'Rameshbhai',
      lastName: 'Baria',
      role: 'TRANSPORT',
      phone: '+91 98260 11223',
      schoolId: schoolRoyal.id,
      branchId: branchAlkapuri.id,
    },
    {
      email: 'librarian@nobleedu.in',
      username: 'librarian',
      firstName: 'Sudhaben',
      lastName: 'Vaidya',
      role: 'LIBRARIAN',
      phone: '+91 98261 22334',
      schoolId: schoolRoyal.id,
      branchId: branchAlkapuri.id,
    },
  ];

  for (const u of demoUsers) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {
        firstName: u.firstName,
        lastName: u.lastName,
        phone: u.phone,
        status: 'ACTIVE',
      },
      create: {
        email: u.email,
        username: u.username,
        passwordHash: defaultPasswordHash,
        firstName: u.firstName,
        lastName: u.lastName,
        phone: u.phone,
        status: 'ACTIVE',
      },
    });

    const roleObj = await prisma.role.findUnique({ where: { name: u.role } });
    if (roleObj) {
      await prisma.userRole.upsert({
        where: {
          userId_roleId_schoolId: {
            userId: user.id,
            roleId: roleObj.id,
            schoolId: u.schoolId ?? '',
          },
        },
        update: {},
        create: {
          userId: user.id,
          roleId: roleObj.id,
          branchId: u.branchId,
          schoolId: u.schoolId,
        },
      });
    }
  }

  // 8. Sample Classes & Divisions for Royal Eduworld School
  const classesData = [
    { name: 'Grade 8', gradeNumber: 8 },
    { name: 'Grade 9', gradeNumber: 9 },
    { name: 'Grade 10', gradeNumber: 10 },
    { name: 'Grade 11 Science', gradeNumber: 11 },
    { name: 'Grade 12 Science', gradeNumber: 12 },
  ];

  for (const c of classesData) {
    const classObj = await prisma.class.upsert({
      where: { id: `class_${c.gradeNumber}_royal` },
      update: {},
      create: {
        id: `class_${c.gradeNumber}_royal`,
        name: c.name,
        gradeNumber: c.gradeNumber,
        schoolId: schoolRoyal.id,
      },
    });

    // Add Divisions A and B
    await prisma.division.upsert({
      where: { id: `div_${c.gradeNumber}_A` },
      update: {},
      create: {
        id: `div_${c.gradeNumber}_A`,
        name: 'Division A',
        classId: classObj.id,
        capacity: 40,
      },
    });

    await prisma.division.upsert({
      where: { id: `div_${c.gradeNumber}_B` },
      update: {},
      create: {
        id: `div_${c.gradeNumber}_B`,
        name: 'Division B',
        classId: classObj.id,
        capacity: 40,
      },
    });

    // Subjects
    const subjects = [
      { name: 'Mathematics', code: `MATH-${c.gradeNumber}` },
      { name: 'Physics', code: `PHY-${c.gradeNumber}` },
      { name: 'Chemistry', code: `CHEM-${c.gradeNumber}` },
      { name: 'English', code: `ENG-${c.gradeNumber}` },
      { name: 'Computer Science', code: `CS-${c.gradeNumber}` },
    ];

    for (const sub of subjects) {
      await prisma.subject.upsert({
        where: { id: `sub_${sub.code}` },
        update: {},
        create: {
          id: `sub_${sub.code}`,
          name: sub.name,
          code: sub.code,
          classId: classObj.id,
          isPractical: sub.name.includes('Physics') || sub.name.includes('Chemistry') || sub.name.includes('Computer'),
        },
      });
    }
  }

  // 9. Coaching Courses for Noble Education Coaching
  const coachingCourses = [
    { name: 'JEE Main & Advanced 2-Year Integrated', code: 'JEE-INT-2YR', type: 'JEE', durationMonths: 24 },
    { name: 'NEET Medical Achiever Course', code: 'NEET-ACH-1YR', type: 'NEET', durationMonths: 12 },
    { name: 'GUJCET Engineering & Pharmacy Crash', code: 'GUJCET-CRASH', type: 'GUJCET', durationMonths: 3 },
    { name: 'DDCET Diploma to Degree Engineering', code: 'DDCET-BOOSTER', type: 'DDCET', durationMonths: 6 },
  ];

  for (const crs of coachingCourses) {
    await prisma.course.upsert({
      where: { code: crs.code },
      update: {},
      create: {
        name: crs.name,
        code: crs.code,
        type: crs.type,
        schoolId: schoolCoaching.id,
        durationMonths: crs.durationMonths,
      },
    });
  }

  // 10. Sample Student Profile (Aarav Patel)
  const studentUser = await prisma.user.findUnique({ where: { username: 'student_aarav' } });
  if (studentUser) {
    const student = await prisma.student.upsert({
      where: { admissionNumber: 'NOBLE/2025/1001' },
      update: {},
      create: {
        userId: studentUser.id,
        admissionNumber: 'NOBLE/2025/1001',
        rollNumber: '10A-01',
        firstName: 'Aarav',
        middleName: 'Mukeshbhai',
        lastName: 'Patel',
        gender: 'MALE',
        dob: new Date('2010-08-15'),
        bloodGroup: 'B+',
        mobile: '+91 98258 90123',
        email: 'student.aarav@nobleedu.in',
        address: 'B-42, Gokul Dham Society, Vasna Road',
        city: 'Vadodara',
        state: 'Gujarat',
        pincode: '390015',
        aadhaarNumber: '7845-9012-3456',
        previousSchool: 'Baroda High School',
        admissionDate: new Date('2025-06-15'),
        status: 'ACTIVE',
        stream: 'SCIENCE',
        examPrep: 'JEE',
        schoolId: schoolRoyal.id,
        branchId: branchAlkapuri.id,
        academicYearId: academicYear.id,
        classId: 'class_10_royal',
        divisionId: 'div_10_A',
      },
    });

    // Parent Profile (Mukeshbhai Patel)
    const parentUser = await prisma.user.findUnique({ where: { username: 'parent_patel' } });
    if (parentUser) {
      const parent = await prisma.parent.upsert({
        where: { userId: parentUser.id },
        update: {},
        create: {
          userId: parentUser.id,
          fatherName: 'Mukeshbhai Patel',
          fatherMobile: '+91 98259 01234',
          fatherOccupation: 'Chemical Engineer (GSFC)',
          motherName: 'Meenaben Patel',
          motherMobile: '+91 98259 56789',
          motherOccupation: 'Home Maker',
          email: 'parent.patel@nobleedu.in',
          address: 'B-42, Gokul Dham Society, Vasna Road, Vadodara',
          city: 'Vadodara',
        },
      });

      // Link Parent to Student
      await prisma.parentStudent.upsert({
        where: {
          parentId_studentId: {
            parentId: parent.id,
            studentId: student.id,
          },
        },
        update: {},
        create: {
          parentId: parent.id,
          studentId: student.id,
          relationship: 'FATHER',
        },
      });
    }

    // Fee Structure & Payment for Aarav
    const feeStructure = await prisma.feeStructure.upsert({
      where: { id: 'fee_g10_sci_2025' },
      update: {},
      create: {
        id: 'fee_g10_sci_2025',
        name: 'Grade 10 Science Annual Fee 2025-26',
        classId: 'class_10_royal',
        academicYearId: academicYear.id,
        schoolId: schoolRoyal.id,
        totalAmount: 68000,
      },
    });

    const inst1 = await prisma.feeInstallment.upsert({
      where: { id: 'inst_term1_g10' },
      update: {},
      create: {
        id: 'inst_term1_g10',
        feeStructureId: feeStructure.id,
        name: 'Term 1 Installment',
        dueDate: new Date('2025-07-15'),
        amount: 34000,
      },
    });

    await prisma.feePayment.upsert({
      where: { receiptNumber: 'REC-2025-00109' },
      update: {},
      create: {
        receiptNumber: 'REC-2025-00109',
        studentId: student.id,
        feeInstallmentId: inst1.id,
        amountPaid: 34000,
        paymentDate: new Date('2025-07-10'),
        paymentMode: 'UPI',
        transactionRef: 'UPI/HDFC/20250710-98421',
        remarks: 'Term 1 Tuition Fee Paid On Time',
        status: 'COMPLETED',
      },
    });
  }

  // 11. Sample Department, Designation & Employee Profile (Teacher Rajesh)
  const deptAcademic = await prisma.department.upsert({
    where: { id: 'dept_academic' },
    update: {},
    create: { id: 'dept_academic', name: 'Academic & Science Faculty', code: 'ACAD' },
  });

  const desigPGT = await prisma.designation.upsert({
    where: { id: 'desig_pgt_math' },
    update: {},
    create: { id: 'desig_pgt_math', title: 'Senior PGT Mathematics Faculty' },
  });

  const teacherUser = await prisma.user.findUnique({ where: { username: 'teacher_rajesh' } });
  if (teacherUser) {
    const employee = await prisma.employee.upsert({
      where: { employeeCode: 'EMP-NOBLE-0104' },
      update: {},
      create: {
        userId: teacherUser.id,
        employeeCode: 'EMP-NOBLE-0104',
        firstName: 'Rajesh',
        lastName: 'Panchal',
        gender: 'MALE',
        mobile: '+91 98254 56789',
        email: 'teacher.rajesh@nobleedu.in',
        joiningDate: new Date('2021-06-10'),
        qualification: 'M.Sc. Mathematics, B.Ed. (MSU Vadodara)',
        experienceYears: 9,
        basicSalary: 48000,
        status: 'ACTIVE',
        schoolId: schoolRoyal.id,
        branchId: branchAlkapuri.id,
        departmentId: deptAcademic.id,
        designationId: desigPGT.id,
      },
    });

    await prisma.teacher.upsert({
      where: { employeeId: employee.id },
      update: {},
      create: {
        employeeId: employee.id,
        specialization: 'Higher Mathematics & JEE Coordinate Geometry',
        isClassTeacher: true,
      },
    });
  }

  // 12. Sample Admission Inquiries
  const sampleInquiries = [
    {
      inquiryNumber: 'INQ-2026-0041',
      studentName: 'Diya Sharma',
      parentName: 'Sanjay Sharma',
      mobile: '+91 98765 43210',
      email: 'sanjay.sharma@gmail.com',
      course: 'Grade 11 Science (PCM + JEE)',
      source: 'WALK_IN',
      status: 'INTERESTED',
      notes: 'Parent visited Alkapuri campus inquiring about JEE integrated batch.',
    },
    {
      inquiryNumber: 'INQ-2026-0042',
      studentName: 'Kavya Dave',
      parentName: 'Nitin Dave',
      mobile: '+91 98765 11223',
      email: 'nitin.dave@outlook.com',
      course: 'NEET Medical Achiever Course',
      source: 'WEBSITE',
      status: 'VISIT_SCHEDULED',
      notes: 'Counseling scheduled for Saturday 11:00 AM.',
    },
    {
      inquiryNumber: 'INQ-2026-0043',
      studentName: 'Harshil Shah',
      parentName: 'Paresh Shah',
      mobile: '+91 98765 33445',
      email: 'paresh.shah@yahoo.co.in',
      course: 'DDCET Diploma to Degree Coaching',
      source: 'REFERRAL',
      status: 'ADMITTED',
      notes: 'Fee token deposited. Admission confirmed.',
    },
  ];

  for (const inq of sampleInquiries) {
    await prisma.admissionInquiry.upsert({
      where: { inquiryNumber: inq.inquiryNumber },
      update: {},
      create: {
        inquiryNumber: inq.inquiryNumber,
        studentName: inq.studentName,
        parentName: inq.parentName,
        mobile: inq.mobile,
        email: inq.email,
        course: inq.course,
        source: inq.source,
        status: inq.status,
        notes: inq.notes,
        schoolId: schoolRoyal.id,
        branchId: branchAlkapuri.id,
      },
    });
  }

  console.log('✅ Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
