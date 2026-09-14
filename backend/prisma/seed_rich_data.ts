import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('?? Enhancing database with rich final-year demonstration records...');

  const passwordHash = await bcrypt.hash('Noble@2026', 10);
  const org = await prisma.organization.findUnique({ where: { code: 'NOBLE_EDU' } });
  const schoolRoyal = await prisma.school.findUnique({ where: { code: 'ROYAL_EDUWORLD' } });
  const branchAlkapuri = await prisma.branch.findUnique({ where: { code: 'BR_ALKAPURI' } });
  const academicYear = await prisma.academicYear.findFirst({ where: { isCurrent: true } });
  const studentRole = await prisma.role.findUnique({ where: { name: 'STUDENT' } });
  const teacherRole = await prisma.role.findUnique({ where: { name: 'TEACHER' } });

  if (!org || !schoolRoyal || !branchAlkapuri || !academicYear || !studentRole || !teacherRole) {
    console.error('Base seed missing. Run seed.ts first.');
    return;
  }

  // 1. Extra Students
  const extraStudents = [
    {
      username: 'student_ananya',
      admissionNumber: 'NOBLE/2025/1002',
      rollNumber: '10A-02',
      firstName: 'Ananya',
      middleName: 'Nilesh',
      lastName: 'Desai',
      gender: 'FEMALE',
      dob: new Date('2010-03-22'),
      bloodGroup: 'O+',
      mobile: '+91 98258 90124',
      email: 'ananya.desai@gmail.com',
      address: '14, Shalin Bungalows, Alkapuri',
      city: 'Vadodara',
      classId: 'class_10_royal',
      divisionId: 'div_10_A',
      stream: 'SCIENCE',
      examPrep: 'NEET',
    },
    {
      username: 'student_dev',
      admissionNumber: 'NOBLE/2025/1003',
      rollNumber: '10A-03',
      firstName: 'Dev',
      middleName: 'Hitesh',
      lastName: 'Shah',
      gender: 'MALE',
      dob: new Date('2010-11-05'),
      bloodGroup: 'A+',
      mobile: '+91 98258 90125',
      email: 'dev.shah@gmail.com',
      address: 'A-201, Samarpan Towers, Manjalpur',
      city: 'Vadodara',
      classId: 'class_10_royal',
      divisionId: 'div_10_A',
      stream: 'COMMERCE',
      examPrep: 'FOUNDATION',
    },
    {
      username: 'student_krisha',
      admissionNumber: 'NOBLE/2025/1004',
      rollNumber: '10A-04',
      firstName: 'Krisha',
      middleName: 'Rajesh',
      lastName: 'Vaidya',
      gender: 'FEMALE',
      dob: new Date('2009-07-19'),
      bloodGroup: 'AB+',
      mobile: '+91 98258 90126',
      email: 'krisha.v@gmail.com',
      address: '32, Radha Krishna Township, Karelibaug',
      city: 'Vadodara',
      classId: 'class_10_royal',
      divisionId: 'div_10_A',
      stream: 'SCIENCE',
      examPrep: 'JEE',
    },
    {
      username: 'student_rohan',
      admissionNumber: 'NOBLE/2025/1005',
      rollNumber: '10A-05',
      firstName: 'Rohan',
      middleName: 'Suresh',
      lastName: 'Prajapati',
      gender: 'MALE',
      dob: new Date('2009-02-14'),
      bloodGroup: 'B-',
      mobile: '+91 98258 90127',
      email: 'rohan.p@gmail.com',
      address: '7, Nilkanth Residency, Gotri',
      city: 'Vadodara',
      classId: 'class_10_royal',
      divisionId: 'div_10_A',
      stream: 'SCIENCE',
      examPrep: 'GUJCET',
    },
  ];

  const createdStudents = [];
  for (const s of extraStudents) {
    const user = await prisma.user.upsert({
      where: { username: s.username },
      update: {},
      create: {
        username: s.username,
        email: s.email,
        passwordHash,
        firstName: s.firstName,
        lastName: s.lastName,
        phone: s.mobile,
      },
    });

    await prisma.userRole.upsert({
      where: {
        userId_roleId_schoolId: {
          userId: user.id,
          roleId: studentRole.id,
          schoolId: schoolRoyal.id,
        },
      },
      update: {},
      create: {
        userId: user.id,
        roleId: studentRole.id,
        schoolId: schoolRoyal.id,
        branchId: branchAlkapuri.id,
      },
    });

    const student = await prisma.student.upsert({
      where: { admissionNumber: s.admissionNumber },
      update: {},
      create: {
        userId: user.id,
        admissionNumber: s.admissionNumber,
        rollNumber: s.rollNumber,
        firstName: s.firstName,
        middleName: s.middleName,
        lastName: s.lastName,
        gender: s.gender,
        dob: s.dob,
        bloodGroup: s.bloodGroup,
        mobile: s.mobile,
        email: s.email,
        address: s.address,
        city: s.city,
        state: 'Gujarat',
        pincode: '390015',
        admissionDate: new Date('2025-06-15'),
        status: 'ACTIVE',
        stream: s.stream,
        examPrep: s.examPrep,
        schoolId: schoolRoyal.id,
        branchId: branchAlkapuri.id,
        academicYearId: academicYear.id,
        classId: s.classId,
        divisionId: s.divisionId,
      },
    });
    createdStudents.push(student);
  }

  // 2. Extra Faculty
  const dept = await prisma.department.findFirst();
  const desig = await prisma.designation.findFirst();

  const extraFaculty = [
    {
      username: 'teacher_vikram',
      code: 'EMP-NOBLE-0105',
      firstName: 'Vikram',
      lastName: 'Pandya',
      mobile: '+91 98254 99001',
      email: 'vikram.pandya@nobleedu.in',
      basicSalary: 56000,
      qualification: 'Ph.D. Physics (IIT Bombay)',
      specialization: 'Quantum Mechanics & JEE Advanced Physics',
    },
    {
      username: 'teacher_neha',
      code: 'EMP-NOBLE-0106',
      firstName: 'Neha',
      lastName: 'Mehta',
      mobile: '+91 98254 99002',
      email: 'neha.mehta@nobleedu.in',
      basicSalary: 49000,
      qualification: 'M.Sc. Organic Chemistry, B.Ed.',
      specialization: 'Organic Synthesis & Reaction Mechanisms',
    },
    {
      username: 'teacher_amit',
      code: 'EMP-NOBLE-0107',
      firstName: 'Amit',
      lastName: 'Chauhan',
      mobile: '+91 98254 99003',
      email: 'amit.chauhan@nobleedu.in',
      basicSalary: 45000,
      qualification: 'M.Sc. Botany & Biotechnology, B.Ed.',
      specialization: 'NEET Cell Biology & Genetics',
    },
  ];

  for (const f of extraFaculty) {
    const user = await prisma.user.upsert({
      where: { username: f.username },
      update: {},
      create: {
        username: f.username,
        email: f.email,
        passwordHash,
        firstName: f.firstName,
        lastName: f.lastName,
        phone: f.mobile,
      },
    });

    await prisma.userRole.upsert({
      where: {
        userId_roleId_schoolId: {
          userId: user.id,
          roleId: teacherRole.id,
          schoolId: schoolRoyal.id,
        },
      },
      update: {},
      create: {
        userId: user.id,
        roleId: teacherRole.id,
        schoolId: schoolRoyal.id,
        branchId: branchAlkapuri.id,
      },
    });

    const emp = await prisma.employee.upsert({
      where: { employeeCode: f.code },
      update: {},
      create: {
        userId: user.id,
        employeeCode: f.code,
        firstName: f.firstName,
        lastName: f.lastName,
        gender: 'MALE',
        mobile: f.mobile,
        email: f.email,
        joiningDate: new Date('2022-07-01'),
        qualification: f.qualification,
        experienceYears: 7,
        basicSalary: f.basicSalary,
        status: 'ACTIVE',
        schoolId: schoolRoyal.id,
        branchId: branchAlkapuri.id,
        departmentId: dept?.id || null,
        designationId: desig?.id || null,
      },
    });

    await prisma.teacher.upsert({
      where: { employeeId: emp.id },
      update: {},
      create: {
        employeeId: emp.id,
        specialization: f.specialization,
        isClassTeacher: false,
      },
    });
  }

  // 3. Fee Installments & Receipts
  const feeStructure = await prisma.feeStructure.findFirst({
    where: { classId: 'class_10_royal' },
  });

  if (feeStructure) {
    const installments = await prisma.feeInstallment.findMany({
      where: { feeStructureId: feeStructure.id },
    });

    if (installments.length > 0) {
      const inst = installments[0];
      for (let i = 0; i < createdStudents.length; i++) {
        const receiptNo = `REC-2025-0011${i + 1}`;
        await prisma.feePayment.upsert({
          where: { receiptNumber: receiptNo },
          update: {},
          create: {
            receiptNumber: receiptNo,
            studentId: createdStudents[i].id,
            feeInstallmentId: inst.id,
            amountPaid: 34000,
            paymentDate: new Date('2025-07-15'),
            paymentMode: i % 2 === 0 ? 'UPI' : 'NET_BANKING',
            transactionRef: `REF-HDFC-9920${i + 1}`,
            remarks: 'Term 1 Tuition Fee Paid On Time',
            status: 'COMPLETED',
          },
        });
      }
    }
  }

  // 4. Accounting Expenses & Incomes
  const expenses = [
    { voucherNumber: 'VCH-2025-00101', payeeName: 'MGVCL Vadodara', description: 'September Campus Electricity', amount: 42500, category: 'UTILITIES', paymentMode: 'BANK_TRANSFER' },
    { voucherNumber: 'VCH-2025-00102', payeeName: 'Baroda Scientific Chemicals', description: 'Lab reagents and glassware', amount: 18400, category: 'LAB_EQUIPMENT', paymentMode: 'CHEQUE' },
    { voucherNumber: 'VCH-2025-00103', payeeName: 'Airtel Enterprise Leased Line', description: 'Fiber internet 300 Mbps', amount: 12000, category: 'UTILITIES', paymentMode: 'ONLINE' },
    { voucherNumber: 'VCH-2025-00104', payeeName: 'Navneet Publications Vadodara', description: 'Library reference manuals', amount: 25000, category: 'STATIONERY', paymentMode: 'BANK_TRANSFER' },
    { voucherNumber: 'VCH-2025-00105', payeeName: 'Indian Oil Petrol Pump Karelibaug', description: 'Bus fleet diesel fuel', amount: 38000, category: 'REPAIRS', paymentMode: 'CASH' },
  ];

  for (const exp of expenses) {
    await prisma.expense.upsert({
      where: { voucherNumber: exp.voucherNumber },
      update: {},
      create: {
        voucherNumber: exp.voucherNumber,
        category: exp.category,
        amount: exp.amount,
        paymentMode: exp.paymentMode,
        paymentDate: new Date('2025-09-20'),
        payeeName: exp.payeeName,
        description: exp.description,
        schoolId: schoolRoyal.id,
      },
    });
  }

  // 5. Library Books
  const books = [
    { isbn: '978-0132350884', title: 'Concepts of Physics (Vol 1 & 2)', author: 'Dr. H.C. Verma', category: 'Physics', copies: 30 },
    { isbn: '978-8120340076', title: 'Higher Engineering Mathematics', author: 'Dr. B.S. Grewal', category: 'Mathematics', copies: 20 },
    { isbn: '978-0199464654', title: 'Organic Chemistry for JEE', author: 'O.P. Tandon', category: 'Chemistry', copies: 25 },
    { isbn: '978-9389167234', title: 'NCERT Exemplar Class 10 Mathematics', author: 'NCERT Council', category: 'General', copies: 50 },
    { isbn: '978-9351761891', title: 'Biology for NEET (Vol 1 & 2)', author: 'Dr. Ali & Dr. Sharma', category: 'Biology', copies: 35 },
  ];

  for (const b of books) {
    await prisma.book.upsert({
      where: { isbn: b.isbn },
      update: {},
      create: {
        isbn: b.isbn,
        title: b.title,
        author: b.author,
        category: b.category,
        totalCopies: b.copies,
        availableCopies: b.copies - 4,
        schoolId: schoolRoyal.id,
      },
    });
  }

  // 6. Transport Vehicle & Route
  const vehicle = await prisma.vehicle.upsert({
    where: { vehicleNumber: 'GJ-06-AZ-4412' },
    update: {},
    create: {
      vehicleNumber: 'GJ-06-AZ-4412',
      model: 'TATA Starbus 40 Seater',
      capacity: 40,
      driverName: 'Sureshbhai Solanki',
      driverPhone: '+91 98760 55443',
      schoolId: schoolRoyal.id,
    },
  });

  const route1 = await prisma.route.create({
    data: {
      name: 'Route 1: Alkapuri - Vasna - Sun Pharma Road',
      vehicleId: vehicle.id,
      startPoint: 'RC Dutt Road, Alkapuri',
      endPoint: 'Sun Pharma Road, Vadodara',
      schoolId: schoolRoyal.id,
      stops: {
        create: [
          { stopName: 'Alkapuri Hub Gate', stopTime: '07:00 AM', stopOrder: 1, feeAmount: 1200 },
          { stopName: 'Gokul Dham Society, Vasna', stopTime: '07:20 AM', stopOrder: 2, feeAmount: 1500 },
          { stopName: 'Sun Pharma Circle', stopTime: '07:35 AM', stopOrder: 3, feeAmount: 1800 },
        ],
      },
    },
  });

  // 7. Announcements
  await prisma.announcement.upsert({
    where: { id: 'ann_midterm_schedule' },
    update: {},
    create: {
      id: 'ann_midterm_schedule',
      title: 'Mid-Term Examination Schedule & Hall Tickets Published',
      content: 'All students of Grades 8 to 12 can now download their revised examination timetable and venue hall tickets from the student portal.',
      targetScope: 'ALL',
      priority: 'HIGH',
      
      schoolId: schoolRoyal.id,
    },
  });

  await prisma.announcement.upsert({
    where: { id: 'ann_science_fair' },
    update: {},
    create: {
      id: 'ann_science_fair',
      title: 'Vadodara District Science & Innovation Olympiad 2026',
      content: 'Noble Education Alkapuri Campus will host the annual inter-school innovation fair on Saturday, October 25. Registration is open.',
      targetScope: 'STUDENT',
      priority: 'NORMAL',
      
      schoolId: schoolRoyal.id,
    },
  });

  console.log('? Rich final-year evaluation dataset populated successfully!');
}

main()
  .catch((e) => {
    console.error('Error seeding rich dataset:', e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


