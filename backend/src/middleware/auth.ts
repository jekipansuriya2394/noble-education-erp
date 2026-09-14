import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, TokenPayload } from '../utils/jwt';
import prisma from '../utils/prisma';

export interface AuthenticatedUser extends TokenPayload {
  id: string;
  firstName: string;
  lastName: string;
  status: string;
  roles: string[];
  permissions: string[];
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export const authenticateUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let token: string | undefined;

    // 1. Check HTTP-only cookie
    if (req.cookies && req.cookies.access_token) {
      token = req.cookies.access_token;
    }
    // 2. Fallback to Authorization Header
    else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      res.status(401).json({
        success: false,
        error: 'Authentication required. Please log in to access this resource.',
      });
      return;
    }

    const decoded = verifyAccessToken(token);

    // Verify user exists and is active in database
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

    if (!user) {
      res.status(401).json({ success: false, error: 'User account no longer exists.' });
      return;
    }

    if (user.status !== 'ACTIVE') {
      res.status(403).json({
        success: false,
        error: `Account is ${user.status.toLowerCase()}. Contact Noble Education administration.`,
      });
      return;
    }

    // Aggregate user roles and permissions
    const userRoles = user.roles.map((ur) => ur.role.name);
    const permissionSet = new Set<string>();
    user.roles.forEach((ur) => {
      ur.role.permissions.forEach((rp) => {
        permissionSet.add(rp.permission.name);
      });
    });

    const activeSchoolId = user.roles[0]?.schoolId ?? null;
    const activeBranchId = user.roles[0]?.branchId ?? null;

    req.user = {
      id: user.id,
      userId: user.id,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      status: user.status,
      role: userRoles[0] || 'GUEST',
      roles: userRoles,
      schoolId: activeSchoolId,
      branchId: activeBranchId,
      permissions: Array.from(permissionSet),
    };

    next();
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      res.status(401).json({
        success: false,
        code: 'TOKEN_EXPIRED',
        error: 'Session expired. Please refresh your session or log in again.',
      });
      return;
    }
    res.status(401).json({ success: false, error: 'Invalid authentication token.' });
  }
};

export const requireRole = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthenticated request.' });
      return;
    }

    const hasRole = req.user.roles.some(
      (r) => allowedRoles.includes(r) || r === 'SUPER_ADMIN'
    );

    if (!hasRole) {
      res.status(403).json({
        success: false,
        error: `Forbidden. Requires one of roles: [${allowedRoles.join(', ')}].`,
      });
      return;
    }

    next();
  };
};

export const requirePermission = (...requiredPermissions: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthenticated request.' });
      return;
    }

    // Super Admin has all permissions automatically
    if (req.user.roles.includes('SUPER_ADMIN')) {
      return next();
    }

    const hasAll = requiredPermissions.every((perm) =>
      req.user!.permissions.includes(perm)
    );

    if (!hasAll) {
      res.status(403).json({
        success: false,
        error: `Permission denied. Missing required privileges: [${requiredPermissions.join(', ')}].`,
      });
      return;
    }

    next();
  };
};

export const requireSchoolAccess = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({ success: false, error: 'Unauthenticated request.' });
    return;
  }

  // Super Admin can access all schools
  if (req.user.roles.includes('SUPER_ADMIN')) {
    return next();
  }

  const targetSchoolId =
    req.params.schoolId || req.body.schoolId || req.query.schoolId;

  // If request is explicitly scoped to a school, verify user has access
  if (targetSchoolId && req.user.schoolId && req.user.schoolId !== targetSchoolId) {
    res.status(403).json({
      success: false,
      error: 'Tenant isolation violation: Access denied to records from another school.',
    });
    return;
  }

  next();
};
