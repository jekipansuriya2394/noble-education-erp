import { Request, Response } from 'express';
import prisma from '../utils/prisma';

export const getAuditLogs = async (req: Request, res: Response): Promise<void> => {
  try {
    const { module, action, userId, page = '1', limit = '20' } = req.query;

    const pageNum = parseInt(String(page), 10);
    const take = parseInt(String(limit), 10);
    const skip = (pageNum - 1) * take;

    const where: any = {};
    if (module && module !== 'ALL') where.module = String(module);
    if (action && action !== 'ALL') where.action = String(action);
    if (userId) where.userId = String(userId);

    const [total, logs] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      }),
    ]);

    res.json({
      success: true,
      logs,
      pagination: {
        total,
        page: pageNum,
        limit: take,
        totalPages: Math.ceil(total / take),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Error fetching audit logs.' });
  }
};
