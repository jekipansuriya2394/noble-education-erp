import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { logAudit } from '../utils/audit';

// --- LIBRARY ---
export const getBooks = async (req: Request, res: Response): Promise<void> => {
  try {
    const { search, category, schoolId } = req.query;
    const where: any = {};
    if (schoolId) where.schoolId = String(schoolId);
    if (category && category !== 'ALL') where.category = String(category);
    if (search) {
      const q = String(search).trim();
      where.OR = [
        { title: { contains: q } },
        { author: { contains: q } },
        { isbn: { contains: q } },
      ];
    }

    const books = await prisma.book.findMany({
      where,
      include: {
        _count: { select: { issues: { where: { status: 'ISSUED' } } } },
      },
      orderBy: { title: 'asc' },
    });

    res.json({ success: true, count: books.length, books });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Error loading library books.' });
  }
};

export const issueBook = async (req: Request, res: Response): Promise<void> => {
  try {
    const { bookId, studentId, employeeId, dueDate } = req.body;

    const book = await prisma.book.findUnique({ where: { id: bookId } });
    if (!book || book.availableCopies <= 0) {
      res.status(400).json({ success: false, error: 'Book is currently out of stock.' });
      return;
    }

    const issue = await prisma.bookIssue.create({
      data: {
        bookId,
        studentId: studentId || null,
        employeeId: employeeId || null,
        dueDate: new Date(dueDate || Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days default
        status: 'ISSUED',
      },
    });

    await prisma.book.update({
      where: { id: bookId },
      data: { availableCopies: { decrement: 1 } },
    });

    res.status(201).json({ success: true, message: 'Book issued successfully.', issue });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Error issuing book.' });
  }
};

// --- TRANSPORT ---
export const getVehiclesAndRoutes = async (req: Request, res: Response): Promise<void> => {
  try {
    const { schoolId } = req.query;
    const where = schoolId ? { schoolId: String(schoolId) } : {};

    const [vehicles, routes] = await Promise.all([
      prisma.vehicle.findMany({ where }),
      prisma.route.findMany({
        where,
        include: {
          vehicle: true,
          stops: { orderBy: { stopOrder: 'asc' } },
        },
      }),
    ]);

    res.json({ success: true, vehicles, routes });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Error loading transport fleet & routes.' });
  }
};

// --- ANNOUNCEMENTS ---
export const getAnnouncements = async (req: Request, res: Response): Promise<void> => {
  try {
    const announcements = await prisma.announcement.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
    res.json({ success: true, announcements });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Error loading announcements.' });
  }
};

export const createAnnouncement = async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, content, targetScope = 'ORGANIZATION', priority = 'NORMAL', schoolId } = req.body;

    const announcement = await prisma.announcement.create({
      data: {
        title,
        content,
        targetScope,
        priority,
        schoolId,
        publishedById: req.user?.id,
      },
    });

    res.status(201).json({ success: true, announcement });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Error creating announcement.' });
  }
};

// --- NOTIFICATIONS ---
export const getUserNotifications = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthenticated.' });
      return;
    }

    const notifications = await prisma.notification.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      take: 30,
    });

    const unreadCount = notifications.filter((n) => !n.isRead).length;

    res.json({ success: true, unreadCount, notifications });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Error fetching notifications.' });
  }
};
