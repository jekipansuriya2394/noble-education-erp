import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../utils/prisma';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from '../utils/jwt';
import { logAudit } from '../utils/audit';
import { config } from '../config';

// Map role to primary dashboard portal
export const ROLE_PORTAL_MAP: Record<string, string> = {
  SUPER_ADMIN: '/portal/super-admin',
  BRANCH_ADMIN: '/portal/branch-admin',
  SCHOOL_ADMIN: '/portal/school-admin',
  ACADEMIC_COORDINATOR: '/portal/academics',
  TEACHER: '/portal/teacher',
  ACCOUNTANT: '/portal/accountant',
  HR: '/portal/hr',
  RECEPTION: '/portal/reception',
  STUDENT: '/portal/student',
  PARENT: '/portal/parent',
  TRANSPORT: '/portal/transport',
  LIBRARIAN: '/portal/librarian',
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { identifier, password, portal } = req.body;

    if (!identifier || !password) {
      res.status(400).json({ success: false, error: 'Email/Username and password are required.' });
      return;
    }

    // Find user by email or username
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: identifier.toLowerCase().trim() },
          { username: identifier.trim() },
        ],
      },
      include: {
        roles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
            school: true,
            branch: true,
          },
        },
      },
    });

    if (!user) {
      res.status(401).json({ success: false, error: 'Invalid credentials or user does not exist.' });
      return;
    }

    // Check account lockout
    if (user.lockoutUntil && new Date(user.lockoutUntil) > new Date()) {
      const remainingMin = Math.ceil(
        (new Date(user.lockoutUntil).getTime() - Date.now()) / (1000 * 60)
      );
      res.status(423).json({
        success: false,
        error: `Account temporarily locked due to multiple failed login attempts. Please retry in ${remainingMin} minute(s).`,
      });
      return;
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.passwordHash);

    if (!isMatch) {
      const failedCount = user.failedLoginAttempts + 1;
      let lockoutDate: Date | null = null;

      if (failedCount >= config.MAX_LOGIN_ATTEMPTS) {
        lockoutDate = new Date(Date.now() + config.LOCKOUT_DURATION_MINUTES * 60 * 1000);
      }

      await prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: failedCount,
          lockoutUntil: lockoutDate,
        },
      });

      await logAudit({
        userId: user.id,
        action: 'LOGIN',
        module: 'AUTH',
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        details: { status: 'FAILED_PASSWORD', attempts: failedCount },
      });

      if (lockoutDate) {
        res.status(423).json({
          success: false,
          error: `Maximum login attempts exceeded. Account locked for ${config.LOCKOUT_DURATION_MINUTES} minutes.`,
        });
        return;
      }

      res.status(401).json({
        success: false,
        error: `Invalid credentials. (${config.MAX_LOGIN_ATTEMPTS - failedCount} attempts remaining before lockout)`,
      });
      return;
    }

    // Check account status
    if (user.status !== 'ACTIVE') {
      res.status(403).json({
        success: false,
        error: `Your account is ${user.status.toLowerCase()}. Please contact Noble Education support.`,
      });
      return;
    }

    // Reset failed attempts on success
    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: 0,
        lockoutUntil: null,
        lastLoginAt: new Date(),
      },
    });

    const roles = user.roles.map((r) => r.role.name);
    const primaryRole = roles[0] || 'GUEST';

    // Verify requested portal matches user role if specific portal was chosen
    if (portal && portal !== 'COMMON') {
      const roleMatchesPortal = user.roles.some(
        (r) => r.role.name === portal || r.role.name === 'SUPER_ADMIN'
      );
      if (!roleMatchesPortal) {
        res.status(403).json({
          success: false,
          error: `Access Denied: Your account does not have permission to access the ${portal} portal.`,
        });
        return;
      }
    }

    // Gather permissions
    const permissionSet = new Set<string>();
    user.roles.forEach((ur) => {
      ur.role.permissions.forEach((rp) => {
        permissionSet.add(rp.permission.name);
      });
    });

    const activeSchool = user.roles[0]?.school;
    const activeBranch = user.roles[0]?.branch;

    const tokenPayload = {
      userId: user.id,
      username: user.username,
      email: user.email,
      role: primaryRole,
      schoolId: activeSchool?.id ?? null,
      branchId: activeBranch?.id ?? null,
      permissions: Array.from(permissionSet),
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    // Save session in database
    await prisma.userSession.create({
      data: {
        userId: user.id,
        refreshToken,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    // Set secure HTTP-only cookies
    const isProd = config.NODE_ENV === 'production';
    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000, // 15 mins
    });

    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Determine redirect URL
    const targetRole = portal && portal !== 'COMMON' ? portal : primaryRole;
    const redirectUrl = ROLE_PORTAL_MAP[targetRole] || '/portal/dashboard';

    await logAudit({
      userId: user.id,
      action: 'LOGIN',
      module: 'AUTH',
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      details: { role: primaryRole, targetPortal: targetRole },
    });

    res.json({
      success: true,
      message: `Welcome back, ${user.firstName}!`,
      accessToken,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        avatar: user.avatar,
        role: primaryRole,
        roles,
        permissions: Array.from(permissionSet),
        school: activeSchool ? { id: activeSchool.id, name: activeSchool.name, code: activeSchool.code } : null,
        branch: activeBranch ? { id: activeBranch.id, name: activeBranch.name, code: activeBranch.code } : null,
      },
      redirectUrl,
    });
  } catch (err: any) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, error: 'Internal server error during authentication.' });
  }
};

export const refreshToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const token = req.cookies?.refresh_token || req.body?.refreshToken;

    if (!token) {
      res.status(401).json({ success: false, error: 'No refresh token provided.' });
      return;
    }

    const decoded = verifyRefreshToken(token);

    const session = await prisma.userSession.findFirst({
      where: {
        refreshToken: token,
        userId: decoded.userId,
        isActive: true,
        expiresAt: { gt: new Date() },
      },
    });

    if (!session) {
      res.status(401).json({ success: false, error: 'Session expired or invalidated. Please re-login.' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        roles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user || user.status !== 'ACTIVE') {
      res.status(401).json({ success: false, error: 'User is inactive or deleted.' });
      return;
    }

    const permissionSet = new Set<string>();
    user.roles.forEach((ur) => {
      ur.role.permissions.forEach((rp) => {
        permissionSet.add(rp.permission.name);
      });
    });

    const newAccessToken = generateAccessToken({
      userId: user.id,
      username: user.username,
      email: user.email,
      role: user.roles[0]?.role.name || 'GUEST',
      schoolId: user.roles[0]?.schoolId ?? null,
      branchId: user.roles[0]?.branchId ?? null,
      permissions: Array.from(permissionSet),
    });

    res.cookie('access_token', newAccessToken, {
      httpOnly: true,
      secure: config.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000,
    });

    res.json({
      success: true,
      accessToken: newAccessToken,
    });
  } catch (err) {
    res.status(401).json({ success: false, error: 'Invalid or expired refresh token.' });
  }
};

export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    const token = req.cookies?.refresh_token;
    if (token) {
      await prisma.userSession.updateMany({
        where: { refreshToken: token },
        data: { isActive: false },
      });
    }

    if (req.user) {
      await logAudit({
        userId: req.user.id,
        action: 'LOGOUT',
        module: 'AUTH',
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      });
    }

    res.clearCookie('access_token');
    res.clearCookie('refresh_token');

    res.json({ success: true, message: 'Logged out successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Error during logout.' });
  }
};

export const me = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthenticated.' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        roles: {
          include: {
            role: true,
            school: true,
            branch: true,
          },
        },
      },
    });

    if (!user) {
      res.status(404).json({ success: false, error: 'User not found.' });
      return;
    }

    const primaryRole = req.user.role;

    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        avatar: user.avatar,
        role: primaryRole,
        roles: req.user.roles,
        permissions: req.user.permissions,
        school: user.roles[0]?.school ?? null,
        branch: user.roles[0]?.branch ?? null,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Error fetching profile.' });
  }
};

export const getDemoCredentials = async (req: Request, res: Response): Promise<void> => {
  res.json({
    success: true,
    commonPassword: 'Noble@2026',
    portals: [
      { role: 'SUPER_ADMIN', name: 'Super Administrator', email: 'superadmin@nobleedu.in', path: '/login/super-admin' },
      { role: 'BRANCH_ADMIN', name: 'Branch Administrator (Alkapuri)', email: 'admin.alkapuri@nobleedu.in', path: '/login/branch-admin' },
      { role: 'SCHOOL_ADMIN', name: 'School Administrator (Royal Eduworld)', email: 'admin.royal@nobleedu.in', path: '/login/school-admin' },
      { role: 'ACADEMIC_COORDINATOR', name: 'Academic Coordinator', email: 'coordinator@nobleedu.in', path: '/login/academic-coordinator' },
      { role: 'TEACHER', name: 'Faculty (Rajesh Panchal)', email: 'teacher.rajesh@nobleedu.in', path: '/login/teacher' },
      { role: 'ACCOUNTANT', name: 'Accountant (Dharmesh Trivedi)', email: 'accountant@nobleedu.in', path: '/login/accountant' },
      { role: 'HR', name: 'HR Manager (Pooja Joshi)', email: 'hr@nobleedu.in', path: '/login/hr' },
      { role: 'RECEPTION', name: 'Front Desk / Admissions Desk', email: 'reception@nobleedu.in', path: '/login/reception' },
      { role: 'STUDENT', name: 'Student (Aarav Patel)', email: 'student.aarav@nobleedu.in', path: '/login/student' },
      { role: 'PARENT', name: 'Parent (Mukeshbhai Patel)', email: 'parent.patel@nobleedu.in', path: '/login/parent' },
      { role: 'TRANSPORT', name: 'Transport Manager', email: 'transport@nobleedu.in', path: '/login/transport' },
      { role: 'LIBRARIAN', name: 'Librarian (Sudhaben Vaidya)', email: 'librarian@nobleedu.in', path: '/login/librarian' },
    ],
  });
};
