import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { logAudit } from '../utils/audit';

export const getClasses = async (req: Request, res: Response): Promise<void> => {
  try {
    const { schoolId } = req.query;
    const where: any = {};
    if (schoolId) {
      where.schoolId = String(schoolId);
    } else if (req.user?.schoolId && !req.user.roles.includes('SUPER_ADMIN')) {
      where.schoolId = req.user.schoolId;
    }

    const classes = await prisma.class.findMany({
      where,
      include: {
        divisions: {
          include: {
            _count: { select: { students: true } },
          },
        },
        subjects: true,
        _count: { select: { students: true } },
      },
      orderBy: { gradeNumber: 'asc' },
    });

    res.json({ success: true, count: classes.length, classes });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Error fetching classes.' });
  }
};

export const createClass = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, gradeNumber, schoolId } = req.body;
    const targetSchoolId = schoolId || req.user?.schoolId;

    if (!targetSchoolId) {
      res.status(400).json({ success: false, error: 'School ID is required.' });
      return;
    }

    const newClass = await prisma.class.create({
      data: {
        name,
        gradeNumber: parseInt(gradeNumber, 10),
        schoolId: targetSchoolId,
      },
    });

    res.status(201).json({ success: true, class: newClass });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Error creating class.' });
  }
};

export const getSubjects = async (req: Request, res: Response): Promise<void> => {
  try {
    const { classId } = req.query;
    const where = classId ? { classId: String(classId) } : {};

    const subjects = await prisma.subject.findMany({
      where,
      include: { class: true },
      orderBy: { name: 'asc' },
    });
    res.json({ success: true, subjects });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Error fetching subjects.' });
  }
};

export const getCourses = async (req: Request, res: Response): Promise<void> => {
  try {
    const { schoolId } = req.query;
    const where = schoolId ? { schoolId: String(schoolId) } : {};

    const courses = await prisma.course.findMany({
      where,
      include: {
        school: { select: { id: true, name: true } },
        batches: true,
      },
      orderBy: { name: 'asc' },
    });
    res.json({ success: true, count: courses.length, courses });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Error fetching courses.' });
  }
};

export const getRooms = async (req: Request, res: Response): Promise<void> => {
  try {
    const { schoolId } = req.query;
    const where = schoolId ? { schoolId: String(schoolId) } : {};

    const rooms = await prisma.room.findMany({
      where,
      orderBy: { roomNumber: 'asc' },
    });
    res.json({ success: true, rooms });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Error fetching campus rooms.' });
  }
};
