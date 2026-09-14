import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { logAudit } from '../utils/audit';

export const getEmployees = async (req: Request, res: Response): Promise<void> => {
  try {
    const { schoolId, status } = req.query;
    const where: any = {};
    if (schoolId) where.schoolId = String(schoolId);
    if (status && status !== 'ALL') where.status = String(status);

    const employees = await prisma.employee.findMany({
      where,
      include: {
        department: true,
        designation: true,
        school: { select: { id: true, name: true } },
      },
      orderBy: { employeeCode: 'asc' },
    });

    res.json({ success: true, count: employees.length, employees });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Error fetching employees.' });
  }
};

export const getLeaveRequests = async (req: Request, res: Response): Promise<void> => {
  try {
    const { employeeId, status } = req.query;
    const where: any = {};
    if (employeeId) where.employeeId = String(employeeId);
    if (status && status !== 'ALL') where.status = String(status);

    const leaves = await prisma.leaveRequest.findMany({
      where,
      include: {
        employee: {
          select: {
            id: true,
            employeeCode: true,
            firstName: true,
            lastName: true,
            designation: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, count: leaves.length, leaveRequests: leaves });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Error loading leave requests.' });
  }
};

export const applyLeave = async (req: Request, res: Response): Promise<void> => {
  try {
    const { employeeId, leaveType, startDate, endDate, totalDays, reason } = req.body;

    let targetEmpId = employeeId;
    if (!targetEmpId && req.user) {
      const emp = await prisma.employee.findUnique({ where: { userId: req.user.id } });
      targetEmpId = emp?.id;
    }

    if (!targetEmpId) {
      res.status(400).json({ success: false, error: 'Employee ID is required.' });
      return;
    }

    const leave = await prisma.leaveRequest.create({
      data: {
        employeeId: targetEmpId,
        leaveType,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        totalDays: parseInt(totalDays, 10),
        reason,
        status: 'PENDING',
      },
    });

    res.status(201).json({ success: true, message: 'Leave applied successfully.', leave });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Error submitting leave request.' });
  }
};

export const reviewLeave = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, reviewComments } = req.body; // APPROVED or REJECTED

    const updated = await prisma.leaveRequest.update({
      where: { id },
      data: {
        status,
        reviewComments,
        approvedById: req.user?.id,
      },
    });

    await logAudit({
      userId: req.user?.id,
      action: status === 'APPROVED' ? 'APPROVE' : 'REJECT',
      module: 'HR_LEAVE',
      recordId: id,
      details: { status, reviewComments },
    });

    res.json({ success: true, message: `Leave request ${status.toLowerCase()}.`, leave: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Error reviewing leave request.' });
  }
};

export const generatePayrollRun = async (req: Request, res: Response): Promise<void> => {
  try {
    const { month, year, schoolId } = req.body;
    const targetSchoolId = schoolId || req.user?.schoolId;

    if (!month || !year || !targetSchoolId) {
      res.status(400).json({ success: false, error: 'Month, Year, and School ID are required.' });
      return;
    }

    // Check if run already exists
    const existing = await prisma.payrollRun.findUnique({
      where: {
        month_year_schoolId: {
          month: parseInt(month, 10),
          year: parseInt(year, 10),
          schoolId: targetSchoolId,
        },
      },
    });

    if (existing) {
      res.status(409).json({ success: false, error: 'Payroll run already exists for this month/year.' });
      return;
    }

    // Fetch active employees
    const employees = await prisma.employee.findMany({
      where: { schoolId: targetSchoolId, status: 'ACTIVE' },
    });

    let totalGross = 0;
    let totalDeductions = 0;
    let totalNet = 0;

    const payrollRun = await prisma.payrollRun.create({
      data: {
        month: parseInt(month, 10),
        year: parseInt(year, 10),
        schoolId: targetSchoolId,
        totalEmployees: employees.length,
        status: 'CALCULATED',
      },
    });

    // Create payslips with statutory calculations
    for (const emp of employees) {
      const basic = emp.basicSalary;
      const hra = Math.round(basic * 0.40); // 40% HRA
      const da = Math.round(basic * 0.10);  // 10% DA
      const conveyance = 1600;
      const otherAllowances = 2000;
      const gross = basic + hra + da + conveyance + otherAllowances;

      const pf = Math.round(basic * 0.12); // 12% PF
      const esi = gross < 21000 ? Math.round(gross * 0.0075) : 0;
      const pt = 200; // Gujarat standard PT
      const tds = gross > 50000 ? Math.round(gross * 0.05) : 0;
      const deductions = pf + esi + pt + tds;
      const net = gross - deductions;

      totalGross += gross;
      totalDeductions += deductions;
      totalNet += net;

      await prisma.payslip.create({
        data: {
          payrollRunId: payrollRun.id,
          employeeId: emp.id,
          month: parseInt(month, 10),
          year: parseInt(year, 10),
          basicSalary: basic,
          hra,
          da,
          conveyance,
          otherAllowances,
          grossSalary: gross,
          pfDeduction: pf,
          esiDeduction: esi,
          profTax: pt,
          tdsDeduction: tds,
          totalDeductions: deductions,
          netSalary: net,
          workingDays: 30,
          presentDays: 28,
          leaveDays: 2,
          paymentStatus: 'PENDING',
        },
      });
    }

    // Update totals on run
    const finalizedRun = await prisma.payrollRun.update({
      where: { id: payrollRun.id },
      data: { totalGross, totalDeductions, totalNet },
      include: {
        payslips: {
          include: {
            employee: { select: { employeeCode: true, firstName: true, lastName: true } },
          },
        },
      },
    });

    await logAudit({
      userId: req.user?.id,
      action: 'CREATE',
      module: 'PAYROLL',
      recordId: payrollRun.id,
      details: { month, year, totalEmployees: employees.length, totalNet },
    });

    res.status(201).json({ success: true, payrollRun: finalizedRun });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Error executing payroll calculations.' });
  }
};

export const getPayrollRuns = async (req: Request, res: Response): Promise<void> => {
  try {
    const { schoolId } = req.query;
    const where = schoolId ? { schoolId: String(schoolId) } : {};

    const runs = await prisma.payrollRun.findMany({
      where,
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
      include: {
        payslips: {
          include: {
            employee: {
              select: {
                id: true,
                employeeCode: true,
                firstName: true,
                lastName: true,
                designation: true,
              },
            },
          },
        },
      },
    });

    res.json({ success: true, count: runs.length, payrollRuns: runs });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Error fetching payroll runs.' });
  }
};
