import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { logAudit } from '../utils/audit';

export const getAssignments = async (req: Request, res: Response): Promise<void> => {
  try {
    const { classId, divisionId, teacherId } = req.query;
    const where: any = {};
    if (classId) where.classId = String(classId);
    if (divisionId) where.divisionId = String(divisionId);
    if (teacherId) where.teacherId = String(teacherId);

    const assignments = await prisma.assignment.findMany({
      where,
      include: {
        class: true,
        subject: true,
        teacher: { include: { employee: true } },
        submissions: {
          include: {
            student: { select: { id: true, firstName: true, lastName: true, rollNumber: true } },
          },
        },
      },
      orderBy: { dueDate: 'desc' },
    });

    res.json({ success: true, count: assignments.length, assignments });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Error loading assignments.' });
  }
};

export const createAssignment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, description, classId, divisionId, subjectId, dueDate, fileUrl } = req.body;

    // Find teacher record for user
    let teacher = null;
    if (req.user) {
      const emp = await prisma.employee.findUnique({
        where: { userId: req.user.id },
        include: { teacherProfile: true },
      });
      teacher = emp?.teacherProfile;
    }

    if (!teacher) {
      // Find default or first teacher for testing
      teacher = await prisma.teacher.findFirst();
    }

    if (!teacher) {
      res.status(400).json({ success: false, error: 'No active teacher profile found.' });
      return;
    }

    const assignment = await prisma.assignment.create({
      data: {
        title,
        description,
        classId,
        divisionId: divisionId || null,
        subjectId,
        teacherId: teacher.id,
        dueDate: new Date(dueDate),
        fileUrl,
      },
    });

    res.status(201).json({ success: true, assignment });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Error creating assignment.' });
  }
};

export const submitAssignment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { assignmentId, studentId, fileUrl, remarks } = req.body;

    let targetStudentId = studentId;
    if (!targetStudentId && req.user) {
      const stu = await prisma.student.findUnique({ where: { userId: req.user.id } });
      targetStudentId = stu?.id;
    }

    if (!targetStudentId) {
      res.status(400).json({ success: false, error: 'Student ID required.' });
      return;
    }

    const submission = await prisma.assignmentSubmission.upsert({
      where: {
        assignmentId_studentId: {
          assignmentId,
          studentId: targetStudentId,
        },
      },
      update: {
        fileUrl,
        remarks,
        submissionDate: new Date(),
      },
      create: {
        assignmentId,
        studentId: targetStudentId,
        fileUrl,
        remarks,
      },
    });

    res.json({ success: true, message: 'Assignment submitted successfully.', submission });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Error submitting assignment.' });
  }
};
