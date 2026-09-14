import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../utils/prisma';
import { logAudit } from '../utils/audit';

export const getTeachers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { schoolId, branchId, departmentId, search } = req.query;

    const where: any = {};
    if (schoolId) where.schoolId = String(schoolId);
    if (branchId) where.branchId = String(branchId);
    if (departmentId) where.departmentId = String(departmentId);

    if (search) {
      const q = String(search).trim();
      where.OR = [
        { firstName: { contains: q } },
        { lastName: { contains: q } },
        { employeeCode: { contains: q } },
        { mobile: { contains: q } },
      ];
    }

    const employees = await prisma.employee.findMany({
      where,
      include: {
        department: true,
        designation: true,
        teacherProfile: {
          include: {
            timetableSlots: {
              include: {
                subject: true,
                room: true,
                timetable: {
                  include: { class: true, division: true },
                },
              },
            },
          },
        },
        school: { select: { id: true, name: true, code: true } },
        branch: { select: { id: true, name: true } },
      },
      orderBy: { employeeCode: 'asc' },
    });

    res.json({ success: true, count: employees.length, teachers: employees });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Error fetching faculty records.' });
  }
};

export const getTeacherById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const employee = await prisma.employee.findUnique({
      where: { id },
      include: {
        department: true,
        designation: true,
        school: true,
        branch: true,
        teacherProfile: {
          include: {
            timetableSlots: {
              include: {
                subject: true,
                room: true,
                timetable: {
                  include: { class: true, division: true },
                },
              },
            },
            assignments: {
              include: { class: true, subject: true },
            },
          },
        },
        leaveRequests: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        payslips: {
          orderBy: { year: 'desc' },
          take: 6,
        },
      },
    });

    if (!employee) {
      res.status(404).json({ success: false, error: 'Teacher record not found.' });
      return;
    }

    res.json({ success: true, teacher: employee });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Error loading teacher details.' });
  }
};

export const createTeacher = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      firstName,
      lastName,
      gender,
      mobile,
      email,
      qualification,
      experienceYears,
      basicSalary = 40000,
      specialization,
      isClassTeacher = false,
      departmentId,
      designationId,
      schoolId,
      branchId,
    } = req.body;

    const targetSchoolId = schoolId || req.user?.schoolId;
    const targetBranchId = branchId || req.user?.branchId;

    if (!targetSchoolId || !targetBranchId) {
      res.status(400).json({ success: false, error: 'School and Branch assignment are required.' });
      return;
    }

    const count = await prisma.employee.count();
    const employeeCode = `EMP-NOBLE-${1000 + count + 1}`;
    const username = `teacher_${firstName.toLowerCase()}_${1000 + count + 1}`;
    const teacherEmail = email || `${username}@nobleedu.in`;

    // Create User Account
    const defaultPasswordHash = await bcrypt.hash('Noble@2026', 10);
    const user = await prisma.user.create({
      data: {
        username,
        email: teacherEmail,
        passwordHash: defaultPasswordHash,
        firstName,
        lastName,
        phone: mobile,
        status: 'ACTIVE',
      },
    });

    const teacherRole = await prisma.role.findUnique({ where: { name: 'TEACHER' } });
    if (teacherRole) {
      await prisma.userRole.create({
        data: {
          userId: user.id,
          roleId: teacherRole.id,
          schoolId: targetSchoolId,
          branchId: targetBranchId,
        },
      });
    }

    // Create Employee record
    const employee = await prisma.employee.create({
      data: {
        userId: user.id,
        employeeCode,
        firstName,
        lastName,
        gender: gender || 'MALE',
        mobile,
        email: teacherEmail,
        joiningDate: new Date(),
        qualification,
        experienceYears: experienceYears ? parseInt(experienceYears, 10) : 0,
        basicSalary: parseFloat(basicSalary),
        status: 'ACTIVE',
        schoolId: targetSchoolId,
        branchId: targetBranchId,
        departmentId,
        designationId,
      },
    });

    // Create Teacher specialization profile
    const teacher = await prisma.teacher.create({
      data: {
        employeeId: employee.id,
        specialization,
        isClassTeacher,
      },
    });

    await logAudit({
      userId: req.user?.id,
      action: 'CREATE',
      module: 'TEACHERS',
      recordId: teacher.id,
      details: { employeeCode, name: `${firstName} ${lastName}` },
    });

    res.status(201).json({
      success: true,
      message: `Teacher created successfully (${employeeCode})`,
      teacher: { ...employee, teacherProfile: teacher },
      credentials: { username, password: 'Noble@2026' },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Error creating teacher.' });
  }
};
