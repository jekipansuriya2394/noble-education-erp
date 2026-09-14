import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { logAudit } from '../utils/audit';

// Indian Grading Standard
const calculateGrade = (percentage: number): string => {
  if (percentage >= 91) return 'A1';
  if (percentage >= 81) return 'A2';
  if (percentage >= 71) return 'B1';
  if (percentage >= 61) return 'B2';
  if (percentage >= 51) return 'C1';
  if (percentage >= 41) return 'C2';
  if (percentage >= 33) return 'D';
  return 'E (Needs Improvement)';
};

export const getExams = async (req: Request, res: Response): Promise<void> => {
  try {
    const { schoolId } = req.query;
    const where = schoolId ? { schoolId: String(schoolId) } : {};

    const exams = await prisma.exam.findMany({
      where,
      include: {
        schedules: {
          include: {
            class: true,
            subject: true,
            _count: { select: { marks: true } },
          },
        },
      },
      orderBy: { startDate: 'desc' },
    });

    res.json({ success: true, count: exams.length, exams });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Error fetching exams.' });
  }
};

export const createExam = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, examType, startDate, endDate, schoolId, schedules } = req.body;
    const targetSchoolId = schoolId || req.user?.schoolId;

    const currentAY = await prisma.academicYear.findFirst({ where: { isCurrent: true } });
    if (!currentAY) {
      res.status(400).json({ success: false, error: 'No active academic year configured.' });
      return;
    }

    const exam = await prisma.exam.create({
      data: {
        name,
        examType: examType || 'UNIT_TEST',
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        academicYearId: currentAY.id,
        schoolId: targetSchoolId,
        status: 'UPCOMING',
      },
    });

    if (schedules && Array.isArray(schedules)) {
      for (const s of schedules) {
        await prisma.examSchedule.create({
          data: {
            examId: exam.id,
            classId: s.classId,
            subjectId: s.subjectId,
            examDate: new Date(s.examDate),
            startTime: s.startTime || '09:00',
            endTime: s.endTime || '12:00',
            maxMarks: parseFloat(s.maxMarks || 100),
            passingMarks: parseFloat(s.passingMarks || 35),
          },
        });
      }
    }

    res.status(201).json({ success: true, exam });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Error creating exam.' });
  }
};

export const saveMarks = async (req: Request, res: Response): Promise<void> => {
  try {
    const { examScheduleId, marks } = req.body;
    // marks: Array of { studentId: string, marksObtained: number, remarks?: string }

    if (!examScheduleId || !marks || !Array.isArray(marks)) {
      res.status(400).json({ success: false, error: 'examScheduleId and marks array required.' });
      return;
    }

    const schedule = await prisma.examSchedule.findUnique({ where: { id: examScheduleId } });
    if (!schedule) {
      res.status(404).json({ success: false, error: 'Exam schedule not found.' });
      return;
    }

    const promises = marks.map((m: any) => {
      const marksObtained = parseFloat(m.marksObtained);
      const pct = (marksObtained / schedule.maxMarks) * 100;
      const grade = calculateGrade(pct);

      return prisma.mark.upsert({
        where: {
          examScheduleId_studentId: {
            examScheduleId,
            studentId: m.studentId,
          },
        },
        update: {
          marksObtained,
          grade,
          remarks: m.remarks,
          teacherId: req.user?.id,
        },
        create: {
          examScheduleId,
          studentId: m.studentId,
          marksObtained,
          grade,
          remarks: m.remarks,
          teacherId: req.user?.id,
        },
      });
    });

    await Promise.all(promises);

    await logAudit({
      userId: req.user?.id,
      action: 'UPDATE',
      module: 'EXAMS',
      recordId: examScheduleId,
      details: { count: marks.length },
    });

    res.json({ success: true, message: `Successfully saved marks for ${marks.length} students.` });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Error saving marks.' });
  }
};
