import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { logAudit } from '../utils/audit';

export const getFeeStructures = async (req: Request, res: Response): Promise<void> => {
  try {
    const { schoolId, classId } = req.query;
    const where: any = {};
    if (schoolId) where.schoolId = String(schoolId);
    if (classId) where.classId = String(classId);

    const structures = await prisma.feeStructure.findMany({
      where,
      include: {
        class: true,
        academicYear: true,
        installments: true,
        school: { select: { id: true, name: true } },
      },
    });

    res.json({ success: true, count: structures.length, feeStructures: structures });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Error loading fee structures.' });
  }
};

export const collectFeePayment = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      studentId,
      feeInstallmentId,
      amountPaid,
      discount = 0,
      lateFee = 0,
      paymentMode = 'UPI',
      transactionRef,
      remarks,
    } = req.body;

    if (!studentId || !amountPaid) {
      res.status(400).json({ success: false, error: 'studentId and amountPaid are required.' });
      return;
    }

    const count = await prisma.feePayment.count();
    const receiptNumber = `REC-${new Date().getFullYear()}-${1000 + count + 1}`;

    const payment = await prisma.feePayment.create({
      data: {
        receiptNumber,
        studentId,
        feeInstallmentId,
        amountPaid: parseFloat(amountPaid),
        discount: parseFloat(discount),
        lateFee: parseFloat(lateFee),
        paymentMode,
        transactionRef,
        remarks,
        collectedById: req.user?.id,
        status: 'COMPLETED',
      },
      include: {
        student: {
          include: {
            class: true,
            school: true,
          },
        },
        feeInstallment: true,
      },
    });

    await logAudit({
      userId: req.user?.id,
      action: 'CREATE',
      module: 'FEES',
      recordId: payment.id,
      details: { receiptNumber, studentId, amountPaid, paymentMode },
    });

    res.status(201).json({
      success: true,
      message: `Fee payment of ₹${amountPaid} collected successfully. Receipt: ${receiptNumber}`,
      payment,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Error collecting fee payment.' });
  }
};

export const getStudentFeeStatement = async (req: Request, res: Response): Promise<void> => {
  try {
    const { studentId } = req.params;

    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        class: true,
        academicYear: true,
        feePayments: {
          orderBy: { paymentDate: 'desc' },
          include: { feeInstallment: true },
        },
      },
    });

    if (!student) {
      res.status(404).json({ success: false, error: 'Student not found.' });
      return;
    }

    // Find applicable fee structure
    let feeStructure = null;
    if (student.classId && student.academicYearId) {
      feeStructure = await prisma.feeStructure.findFirst({
        where: {
          classId: student.classId,
          academicYearId: student.academicYearId,
        },
        include: { installments: true },
      });
    }

    const totalBilled = feeStructure ? feeStructure.totalAmount : 0;
    const totalPaid = student.feePayments.reduce((acc, p) => acc + p.amountPaid, 0);
    const balanceDue = Math.max(0, totalBilled - totalPaid);

    res.json({
      success: true,
      statement: {
        studentId: student.id,
        name: `${student.firstName} ${student.lastName}`,
        admissionNumber: student.admissionNumber,
        className: student.class?.name || 'Unassigned',
        totalBilled,
        totalPaid,
        balanceDue,
        status: balanceDue === 0 ? 'PAID' : totalPaid > 0 ? 'PARTIAL' : 'PENDING',
        feeStructure,
        paymentHistory: student.feePayments,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Error generating fee statement.' });
  }
};

export const getFeePayments = async (req: Request, res: Response): Promise<void> => {
  try {
    const { schoolId, limit = '20' } = req.query;

    const payments = await prisma.feePayment.findMany({
      take: parseInt(String(limit), 10),
      orderBy: { paymentDate: 'desc' },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            admissionNumber: true,
            class: true,
          },
        },
        feeInstallment: true,
      },
    });

    const totalCollected = payments.reduce((acc, p) => acc + p.amountPaid, 0);

    res.json({
      success: true,
      totalCollected,
      payments,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Error fetching fee transactions.' });
  }
};
