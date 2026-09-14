import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../utils/prisma';
import { logAudit } from '../utils/audit';

export const getStudents = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      search,
      schoolId,
      branchId,
      classId,
      status = 'ACTIVE',
      page = '1',
      limit = '10',
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const pageNum = parseInt(String(page), 10);
    const take = parseInt(String(limit), 10);
    const skip = (pageNum - 1) * take;

    const where: any = {};

    // Multi-tenant school filter
    if (schoolId) {
      where.schoolId = String(schoolId);
    } else if (req.user?.schoolId && !req.user.roles.includes('SUPER_ADMIN')) {
      where.schoolId = req.user.schoolId;
    }

    if (branchId) where.branchId = String(branchId);
    if (classId) where.classId = String(classId);
    if (status && status !== 'ALL') where.status = String(status);

    if (search) {
      const q = String(search).trim();
      where.OR = [
        { firstName: { contains: q } },
        { lastName: { contains: q } },
        { admissionNumber: { contains: q } },
        { rollNumber: { contains: q } },
        { mobile: { contains: q } },
      ];
    }

    const [total, students] = await Promise.all([
      prisma.student.count({ where }),
      prisma.student.findMany({
        where,
        skip,
        take,
        orderBy: { [String(sortBy)]: sortOrder === 'asc' ? 'asc' : 'desc' },
        include: {
          class: true,
          division: true,
          school: { select: { id: true, name: true, code: true } },
          branch: { select: { id: true, name: true } },
          parents: {
            include: {
              parent: true,
            },
          },
        },
      }),
    ]);

    res.json({
      success: true,
      data: students,
      pagination: {
        total,
        page: pageNum,
        limit: take,
        totalPages: Math.ceil(total / take),
      },
    });
  } catch (err: any) {
    console.error('Error fetching students:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch student records.' });
  }
};

export const getStudentById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const student = await prisma.student.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, email: true, username: true, status: true, lastLoginAt: true } },
        school: true,
        branch: true,
        academicYear: true,
        class: {
          include: {
            subjects: true,
          },
        },
        division: true,
        parents: {
          include: {
            parent: true,
          },
        },
        attendances: {
          orderBy: { date: 'desc' },
          take: 30,
        },
        feePayments: {
          orderBy: { paymentDate: 'desc' },
          include: { feeInstallment: true },
        },
        marks: {
          include: {
            examSchedule: {
              include: {
                exam: true,
                subject: true,
              },
            },
          },
        },
        submissions: {
          include: {
            assignment: {
              include: { subject: true },
            },
          },
        },
        bookIssues: {
          include: { book: true },
        },
        documents: true,
      },
    });

    if (!student) {
      res.status(404).json({ success: false, error: 'Student record not found.' });
      return;
    }

    // Role-based data isolation: If user is PARENT, verify student is linked
    if (req.user?.role === 'PARENT') {
      const isLinked = student.parents.some((p) => p.parent.userId === req.user?.id);
      if (!isLinked) {
        res.status(403).json({ success: false, error: 'Forbidden: You can only view your own children.' });
        return;
      }
    }

    // If user is STUDENT, verify it is their own profile
    if (req.user?.role === 'STUDENT' && student.userId !== req.user.id) {
      res.status(403).json({ success: false, error: 'Forbidden: You can only view your own academic profile.' });
      return;
    }

    // Compute attendance statistics
    const totalAttendances = student.attendances.length;
    const presentCount = student.attendances.filter((a) => a.status === 'PRESENT').length;
    const attendancePct = totalAttendances > 0 ? Math.round((presentCount / totalAttendances) * 100) : 100;

    // Compute fee totals
    const totalFeesPaid = student.feePayments.reduce((acc, p) => acc + p.amountPaid, 0);

    res.json({
      success: true,
      student,
      metrics: {
        attendancePercentage: attendancePct,
        totalFeesPaid,
        totalExamsTaken: student.marks.length,
        pendingAssignments: 0,
      },
    });
  } catch (err: any) {
    console.error('Error fetching student profile:', err);
    res.status(500).json({ success: false, error: 'Failed to load student details.' });
  }
};

export const createStudent = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      firstName,
      middleName,
      lastName,
      gender,
      dob,
      bloodGroup,
      mobile,
      email,
      address,
      city = 'Vadodara',
      state = 'Gujarat',
      pincode,
      schoolId,
      branchId,
      academicYearId,
      classId,
      divisionId,
      stream,
      examPrep,
      parentDetails,
    } = req.body;

    const targetSchoolId = schoolId || req.user?.schoolId;
    const targetBranchId = branchId || req.user?.branchId;

    if (!targetSchoolId || !targetBranchId) {
      res.status(400).json({ success: false, error: 'School and Branch assignment is required.' });
      return;
    }

    // Auto-generate Admission Number
    const count = await prisma.student.count();
    const admissionNumber = `NOBLE/${new Date().getFullYear()}/${1000 + count + 1}`;
    const username = `student_${firstName.toLowerCase().replace(/\s+/g, '')}_${1000 + count + 1}`;
    const studentEmail = email || `${username}@nobleedu.in`;

    // Create User Account for Student
    const defaultPasswordHash = await bcrypt.hash('Noble@2026', 10);
    const user = await prisma.user.create({
      data: {
        username,
        email: studentEmail,
        passwordHash: defaultPasswordHash,
        firstName,
        lastName,
        phone: mobile,
        status: 'ACTIVE',
      },
    });

    const studentRole = await prisma.role.findUnique({ where: { name: 'STUDENT' } });
    if (studentRole) {
      await prisma.userRole.create({
        data: {
          userId: user.id,
          roleId: studentRole.id,
          schoolId: targetSchoolId,
          branchId: targetBranchId,
        },
      });
    }

    // Find current academic year if not provided
    let ayId = academicYearId;
    if (!ayId) {
      const currentAY = await prisma.academicYear.findFirst({ where: { isCurrent: true } });
      ayId = currentAY?.id;
    }

    // Create Student Profile
    const student = await prisma.student.create({
      data: {
        userId: user.id,
        admissionNumber,
        firstName,
        middleName,
        lastName,
        gender,
        dob: new Date(dob || '2010-01-01'),
        bloodGroup,
        mobile,
        email: studentEmail,
        address,
        city,
        state,
        pincode,
        schoolId: targetSchoolId,
        branchId: targetBranchId,
        academicYearId: ayId,
        classId,
        divisionId,
        stream,
        examPrep,
        status: 'ACTIVE',
      },
    });

    // Create or Link Parent if details provided
    if (parentDetails && (parentDetails.fatherName || parentDetails.guardianName)) {
      const pUsername = `parent_${firstName.toLowerCase()}_${1000 + count + 1}`;
      const pEmail = parentDetails.email || `${pUsername}@nobleedu.in`;

      const parentUser = await prisma.user.create({
        data: {
          username: pUsername,
          email: pEmail,
          passwordHash: defaultPasswordHash,
          firstName: parentDetails.fatherName ? parentDetails.fatherName.split(' ')[0] : 'Parent',
          lastName: lastName,
          phone: parentDetails.fatherMobile || mobile,
          status: 'ACTIVE',
        },
      });

      const parentRole = await prisma.role.findUnique({ where: { name: 'PARENT' } });
      if (parentRole) {
        await prisma.userRole.create({
          data: {
            userId: parentUser.id,
            roleId: parentRole.id,
            schoolId: targetSchoolId,
            branchId: targetBranchId,
          },
        });
      }

      const parent = await prisma.parent.create({
        data: {
          userId: parentUser.id,
          fatherName: parentDetails.fatherName,
          fatherMobile: parentDetails.fatherMobile,
          fatherOccupation: parentDetails.fatherOccupation,
          motherName: parentDetails.motherName,
          motherMobile: parentDetails.motherMobile,
          email: pEmail,
          address: address,
          city: city,
        },
      });

      await prisma.parentStudent.create({
        data: {
          parentId: parent.id,
          studentId: student.id,
          relationship: parentDetails.fatherName ? 'FATHER' : 'GUARDIAN',
        },
      });
    }

    await logAudit({
      userId: req.user?.id,
      action: 'CREATE',
      module: 'STUDENTS',
      recordId: student.id,
      ipAddress: req.ip,
      details: { admissionNumber, name: `${firstName} ${lastName}`, classId },
    });

    res.status(201).json({
      success: true,
      message: `Student admitted successfully with Admission No: ${admissionNumber}`,
      student,
      loginCredentials: {
        username,
        initialPassword: 'Noble@2026',
      },
    });
  } catch (err: any) {
    console.error('Error admitting student:', err);
    res.status(500).json({ success: false, error: err.message || 'Error admitting student.' });
  }
};

export const updateStudent = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const student = await prisma.student.update({
      where: { id },
      data: {
        firstName: updates.firstName,
        lastName: updates.lastName,
        mobile: updates.mobile,
        address: updates.address,
        classId: updates.classId,
        divisionId: updates.divisionId,
        rollNumber: updates.rollNumber,
        status: updates.status,
        stream: updates.stream,
        examPrep: updates.examPrep,
      },
    });

    await logAudit({
      userId: req.user?.id,
      action: 'UPDATE',
      module: 'STUDENTS',
      recordId: id,
      details: updates,
    });

    res.json({ success: true, student });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Error updating student record.' });
  }
};
