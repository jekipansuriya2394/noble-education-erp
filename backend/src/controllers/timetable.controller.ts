import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { logAudit } from '../utils/audit';

export const getTimetable = async (req: Request, res: Response): Promise<void> => {
  try {
    const { classId, divisionId, teacherId } = req.query;

    if (teacherId) {
      // Fetch teacher's weekly timetable
      const slots = await prisma.timetableSlot.findMany({
        where: { teacherId: String(teacherId) },
        include: {
          subject: true,
          room: true,
          timetable: {
            include: {
              class: true,
              division: true,
            },
          },
        },
        orderBy: [{ dayOfWeek: 'asc' }, { periodNumber: 'asc' }],
      });

      res.json({ success: true, mode: 'TEACHER', slots });
      return;
    }

    if (!classId || !divisionId) {
      res.status(400).json({ success: false, error: 'classId and divisionId are required.' });
      return;
    }

    let timetable = await prisma.timetable.findFirst({
      where: {
        classId: String(classId),
        divisionId: String(divisionId),
        status: 'ACTIVE',
      },
      include: {
        class: true,
        division: true,
        slots: {
          include: {
            subject: true,
            teacher: {
              include: {
                employee: true,
              },
            },
            room: true,
          },
          orderBy: [{ dayOfWeek: 'asc' }, { periodNumber: 'asc' }],
        },
      },
    });

    res.json({ success: true, timetable });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Error fetching timetable.' });
  }
};

export const createTimetableSlot = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      classId,
      divisionId,
      dayOfWeek,
      periodNumber,
      startTime = '08:00',
      endTime = '08:45',
      subjectId,
      teacherId,
      roomId,
    } = req.body;

    // 1. Conflict Check: Is Teacher already booked at this day and period?
    const existingTeacherSlot = await prisma.timetableSlot.findFirst({
      where: {
        dayOfWeek,
        periodNumber: parseInt(periodNumber, 10),
        teacherId,
      },
      include: {
        timetable: { include: { class: true, division: true } },
      },
    });

    if (existingTeacherSlot) {
      res.status(409).json({
        success: false,
        conflictType: 'TEACHER_CONFLICT',
        error: `Teacher Conflict: Teacher is already assigned to ${existingTeacherSlot.timetable.class.name} (${existingTeacherSlot.timetable.division.name}) during Period ${periodNumber} on ${dayOfWeek}.`,
      });
      return;
    }

    // 2. Conflict Check: Is Room already occupied?
    const existingRoomSlot = await prisma.timetableSlot.findFirst({
      where: {
        dayOfWeek,
        periodNumber: parseInt(periodNumber, 10),
        roomId,
      },
      include: {
        room: true,
        timetable: { include: { class: true, division: true } },
      },
    });

    if (existingRoomSlot) {
      res.status(409).json({
        success: false,
        conflictType: 'ROOM_CONFLICT',
        error: `Room Conflict: ${existingRoomSlot.room.roomNumber} is already in use by ${existingRoomSlot.timetable.class.name} (${existingRoomSlot.timetable.division.name}) during Period ${periodNumber}.`,
      });
      return;
    }

    // Find or create active Timetable container for this class/division
    const currentAY = await prisma.academicYear.findFirst({ where: { isCurrent: true } });
    if (!currentAY) {
      res.status(400).json({ success: false, error: 'Current Academic Year not configured.' });
      return;
    }

    let timetable = await prisma.timetable.findFirst({
      where: { classId, divisionId, academicYearId: currentAY.id },
    });

    if (!timetable) {
      timetable = await prisma.timetable.create({
        data: {
          classId,
          divisionId,
          academicYearId: currentAY.id,
          status: 'ACTIVE',
        },
      });
    }

    const slot = await prisma.timetableSlot.create({
      data: {
        timetableId: timetable.id,
        dayOfWeek,
        periodNumber: parseInt(periodNumber, 10),
        startTime,
        endTime,
        subjectId,
        teacherId,
        roomId,
      },
      include: {
        subject: true,
        room: true,
        teacher: { include: { employee: true } },
      },
    });

    await logAudit({
      userId: req.user?.id,
      action: 'CREATE',
      module: 'TIMETABLE',
      recordId: slot.id,
      details: { dayOfWeek, periodNumber, subjectId, teacherId },
    });

    res.status(201).json({ success: true, slot });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Error saving timetable slot.' });
  }
};
