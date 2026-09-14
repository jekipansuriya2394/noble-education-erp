import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { logAudit } from '../utils/audit';

export const getInquiries = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, schoolId, search, source } = req.query;

    const where: any = {};
    if (status && status !== 'ALL') where.status = String(status);
    if (source && source !== 'ALL') where.source = String(source);
    if (schoolId) {
      where.schoolId = String(schoolId);
    } else if (req.user?.schoolId && !req.user.roles.includes('SUPER_ADMIN')) {
      where.schoolId = req.user.schoolId;
    }

    if (search) {
      const q = String(search).trim();
      where.OR = [
        { studentName: { contains: q } },
        { parentName: { contains: q } },
        { mobile: { contains: q } },
        { inquiryNumber: { contains: q } },
      ];
    }

    const inquiries = await prisma.admissionInquiry.findMany({
      where,
      include: {
        school: { select: { id: true, name: true } },
        branch: { select: { id: true, name: true } },
        followUps: { orderBy: { followUpDate: 'desc' } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, count: inquiries.length, inquiries });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Error fetching admission inquiries.' });
  }
};

export const createInquiry = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      studentName,
      parentName,
      mobile,
      email,
      course,
      classApplied,
      source = 'WALK_IN',
      schoolId,
      branchId,
      notes,
    } = req.body;

    const targetSchoolId = schoolId || req.user?.schoolId;
    const targetBranchId = branchId || req.user?.branchId;

    if (!targetSchoolId || !targetBranchId) {
      res.status(400).json({ success: false, error: 'School and Branch assignment are required.' });
      return;
    }

    const count = await prisma.admissionInquiry.count();
    const inquiryNumber = `INQ-${new Date().getFullYear()}-${1000 + count + 1}`;

    const inquiry = await prisma.admissionInquiry.create({
      data: {
        inquiryNumber,
        studentName,
        parentName,
        mobile,
        email,
        course,
        classApplied,
        source,
        status: 'NEW',
        notes,
        schoolId: targetSchoolId,
        branchId: targetBranchId,
      },
    });

    await logAudit({
      userId: req.user?.id,
      action: 'CREATE',
      module: 'ADMISSIONS',
      recordId: inquiry.id,
      details: { inquiryNumber, studentName, course },
    });

    res.status(201).json({ success: true, inquiry });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Error creating admission inquiry.' });
  }
};

export const updateInquiryStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, followUpDate, notes, counselorId } = req.body;

    const updated = await prisma.admissionInquiry.update({
      where: { id },
      data: {
        status,
        followUpDate: followUpDate ? new Date(followUpDate) : undefined,
        notes,
        counselorId,
      },
    });

    await logAudit({
      userId: req.user?.id,
      action: 'UPDATE',
      module: 'ADMISSIONS',
      recordId: id,
      details: { newStatus: status, notes },
    });

    res.json({ success: true, inquiry: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Error updating inquiry status.' });
  }
};

export const addFollowUp = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { responseNotes, nextFollowUpDate, status } = req.body;

    const followUp = await prisma.inquiryFollowUp.create({
      data: {
        inquiryId: id,
        counselorId: req.user?.id,
        responseNotes,
        nextFollowUpDate: nextFollowUpDate ? new Date(nextFollowUpDate) : null,
        status,
      },
    });

    // Also update main inquiry status
    await prisma.admissionInquiry.update({
      where: { id },
      data: {
        status,
        followUpDate: nextFollowUpDate ? new Date(nextFollowUpDate) : undefined,
      },
    });

    res.status(201).json({ success: true, followUp });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Error adding follow-up record.' });
  }
};

export const getAdmissionFunnelMetrics = async (req: Request, res: Response): Promise<void> => {
  try {
    const { schoolId } = req.query;
    const where: any = {};
    if (schoolId) where.schoolId = String(schoolId);

    const inquiries = await prisma.admissionInquiry.findMany({ where });

    const stageCounts: Record<string, number> = {
      NEW: 0,
      CONTACTED: 0,
      INTERESTED: 0,
      FOLLOW_UP: 0,
      VISIT_SCHEDULED: 0,
      ADMISSION_STARTED: 0,
      ADMITTED: 0,
      NOT_INTERESTED: 0,
      LOST: 0,
    };

    const sourceCounts: Record<string, number> = {};

    inquiries.forEach((inq) => {
      if (stageCounts[inq.status] !== undefined) {
        stageCounts[inq.status]++;
      }
      sourceCounts[inq.source] = (sourceCounts[inq.source] || 0) + 1;
    });

    const total = inquiries.length;
    const admitted = stageCounts.ADMITTED || 0;
    const conversionRate = total > 0 ? Math.round((admitted / total) * 100) : 0;

    res.json({
      success: true,
      totalInquiries: total,
      conversionRate,
      stageBreakdown: stageCounts,
      sourceBreakdown: sourceCounts,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Error calculating funnel metrics.' });
  }
};
