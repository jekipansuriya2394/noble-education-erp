import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { logAudit } from '../utils/audit';

export const getClassAttendance = async (req: Request, res: Response): Promise<void> => {
  try {
    const { divisionId, date } = req.query;

    if (!divisionId) {
      res.status(400).json({ success: false, error: 'divisionId is required.' });
      return;
    }

    const targetDate = date ? new Date(String(date)) : new Date();
    // Normalize to midnight UTC
    targetDate.setHours(0, 0, 0, 0);

    const students = await prisma.student.findMany({
      where: { divisionId: String(divisionId), status: 'ACTIVE' },
      select: { id: true, firstName: true, lastName: true, rollNumber: true, admissionNumber: true },
      orderBy: { rollNumber: 'asc' },
    });

    const attendances = await prisma.attendance.findMany({
      where: {
        divisionId: String(divisionId),
        date: targetDate,
      },
    });

    const attendanceMap = new Map(attendances.map((a) => [a.studentId, a]));

    const rosterWithStatus = students.map((s) => {
      const record = attendanceMap.get(s.id);
      return {
        studentId: s.id,
        rollNumber: s.rollNumber,
        name: `${s.firstName} ${s.lastName}`,
        admissionNumber: s.admissionNumber,
        status: record ? record.status : 'NOT_MARKED',
        remarks: record?.remarks || null,
        attendanceId: record?.id || null,
      };
    });

    const totalStudents = students.length;
    const presentCount = rosterWithStatus.filter((r) => r.status === 'PRESENT').length;
    const absentCount = rosterWithStatus.filter((r) => r.status === 'ABSENT').length;
    const presentPct = totalStudents > 0 ? Math.round((presentCount / totalStudents) * 100) : 0;

    res.json({
      success: true,
      date: targetDate.toISOString().split('T')[0],
      totalStudents,
      presentCount,
      absentCount,
      presentPercentage: presentPct,
      roster: rosterWithStatus,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Error fetching class attendance.' });
  }
};

export const markBulkAttendance = async (req: Request, res: Response): Promise<void> => {
  try {
    const { divisionId, date, records } = req.body;
    // records: Array of { studentId: string, status: 'PRESENT' | 'ABSENT' | 'LATE' | 'HALF_DAY', remarks?: string }

    if (!divisionId || !records || !Array.isArray(records)) {
      res.status(400).json({ success: false, error: 'divisionId and valid records array required.' });
      return;
    }

    const targetDate = date ? new Date(date) : new Date();
    targetDate.setHours(0, 0, 0, 0);

    const upsertPromises = records.map((r: any) =>
      prisma.attendance.upsert({
        where: {
          date_studentId: {
            date: targetDate,
            studentId: r.studentId,
          },
        },
        update: {
          status: r.status,
          remarks: r.remarks,
        },
        create: {
          date: targetDate,
          studentId: r.studentId,
          divisionId,
          status: r.status,
          remarks: r.remarks,
        },
      })
    );

    await Promise.all(upsertPromises);

    await logAudit({
      userId: req.user?.id,
      action: 'UPDATE',
      module: 'ATTENDANCE',
      details: { divisionId, date: targetDate.toISOString().split('T')[0], count: records.length },
    });

    res.json({
      success: true,
      message: `Attendance marked successfully for ${records.length} students.`,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Error recording attendance.' });
  }
};

export const getStudentAttendanceHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { studentId } = req.params;

    const attendances = await prisma.attendance.findMany({
      where: { studentId },
      orderBy: { date: 'desc' },
      take: 60,
    });

    const totalDays = attendances.length;
    const presentDays = attendances.filter((a) => a.status === 'PRESENT').length;
    const absentDays = attendances.filter((a) => a.status === 'ABSENT').length;
    const rate = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 100;

    res.json({
      success: true,
      totalDays,
      presentDays,
      absentDays,
      attendancePercentage: rate,
      isLowAttendance: rate < 75,
      records: attendances,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Error fetching student attendance history.' });
  }
};
