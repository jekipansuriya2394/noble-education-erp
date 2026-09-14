import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { logAudit } from '../utils/audit';

export const getOrganization = async (req: Request, res: Response): Promise<void> => {
  try {
    const org = await prisma.organization.findFirst({
      include: {
        branches: {
          include: {
            schools: true,
          },
        },
      },
    });

    res.json({ success: true, organization: org });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Error fetching organization info.' });
  }
};

export const getBranches = async (req: Request, res: Response): Promise<void> => {
  try {
    const branches = await prisma.branch.findMany({
      include: {
        schools: true,
        _count: {
          select: { students: true, employees: true },
        },
      },
    });
    res.json({ success: true, branches });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Error fetching branches.' });
  }
};

export const getSchools = async (req: Request, res: Response): Promise<void> => {
  try {
    const { branchId } = req.query;
    const whereClause = branchId ? { branchId: String(branchId) } : {};

    const schools = await prisma.school.findMany({
      where: whereClause,
      include: {
        branch: true,
        _count: {
          select: { students: true, employees: true, classes: true },
        },
      },
    });
    res.json({ success: true, schools });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Error fetching schools.' });
  }
};

export const getAcademicYears = async (req: Request, res: Response): Promise<void> => {
  try {
    const years = await prisma.academicYear.findMany({
      orderBy: { startDate: 'desc' },
    });
    res.json({ success: true, academicYears: years });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Error fetching academic years.' });
  }
};

export const createSchool = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, code, type, branchId, tagline, email, phone } = req.body;
    const org = await prisma.organization.findFirst();

    if (!org) {
      res.status(400).json({ success: false, error: 'Organization not initialized.' });
      return;
    }

    const school = await prisma.school.create({
      data: {
        organizationId: org.id,
        branchId,
        name,
        code,
        type,
        tagline,
        email,
        phone,
      },
    });

    await logAudit({
      userId: req.user?.id,
      action: 'CREATE',
      module: 'ORGANIZATION',
      recordId: school.id,
      details: { schoolName: name, code },
    });

    res.status(201).json({ success: true, school });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Error creating school.' });
  }
};
