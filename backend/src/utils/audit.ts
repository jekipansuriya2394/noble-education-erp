import prisma from './prisma';

export interface AuditParams {
  userId?: string | null;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'APPROVE' | 'REJECT' | 'EXPORT';
  module: string;
  recordId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  details?: Record<string, any> | string;
}

export const logAudit = async (params: AuditParams): Promise<void> => {
  try {
    const detailsStr = typeof params.details === 'object' ? JSON.stringify(params.details) : params.details;
    await prisma.auditLog.create({
      data: {
        userId: params.userId ?? null,
        action: params.action,
        module: params.module,
        recordId: params.recordId ?? null,
        ipAddress: params.ipAddress ?? null,
        userAgent: params.userAgent ?? null,
        details: detailsStr ?? null,
      },
    });
  } catch (err) {
    console.error('Failed to write audit log:', err);
  }
};
