import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { logAudit } from '../utils/audit';

export const getExpenses = async (req: Request, res: Response): Promise<void> => {
  try {
    const { schoolId, category } = req.query;
    const where: any = {};
    if (schoolId) where.schoolId = String(schoolId);
    if (category && category !== 'ALL') where.category = String(category);

    const expenses = await prisma.expense.findMany({
      where,
      orderBy: { paymentDate: 'desc' },
      include: { school: { select: { id: true, name: true } } },
    });

    const totalExpense = expenses.reduce((acc, e) => acc + e.amount, 0);

    res.json({ success: true, totalExpense, expenses });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Error fetching expenses.' });
  }
};

export const createExpense = async (req: Request, res: Response): Promise<void> => {
  try {
    const { category, amount, paymentMode = 'BANK_TRANSFER', payeeName, description, schoolId } = req.body;
    const targetSchoolId = schoolId || req.user?.schoolId;

    if (!targetSchoolId || !amount || !payeeName) {
      res.status(400).json({ success: false, error: 'Missing required expense fields.' });
      return;
    }

    const count = await prisma.expense.count();
    const voucherNumber = `VOUCH-${new Date().getFullYear()}-${1000 + count + 1}`;

    const expense = await prisma.expense.create({
      data: {
        voucherNumber,
        category,
        amount: parseFloat(amount),
        paymentMode,
        payeeName,
        description,
        approvedById: req.user?.id,
        schoolId: targetSchoolId,
      },
    });

    await logAudit({
      userId: req.user?.id,
      action: 'CREATE',
      module: 'ACCOUNTING',
      recordId: expense.id,
      details: { voucherNumber, amount, payeeName },
    });

    res.status(201).json({ success: true, expense });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Error creating expense voucher.' });
  }
};

export const getFinancialSummary = async (req: Request, res: Response): Promise<void> => {
  try {
    const { schoolId } = req.query;
    const where: any = {};
    if (schoolId) where.schoolId = String(schoolId);

    const [feePayments, directIncomes, expenses] = await Promise.all([
      prisma.feePayment.findMany({ where: { status: 'COMPLETED' } }),
      prisma.income.findMany({ where }),
      prisma.expense.findMany({ where }),
    ]);

    const totalFeeRevenue = feePayments.reduce((acc, p) => acc + p.amountPaid, 0);
    const totalDirectIncome = directIncomes.reduce((acc, i) => acc + i.amount, 0);
    const totalRevenue = totalFeeRevenue + totalDirectIncome;
    const totalExpense = expenses.reduce((acc, e) => acc + e.amount, 0);
    const netProfit = totalRevenue - totalExpense;

    // Monthly breakdown for chart
    res.json({
      success: true,
      summary: {
        totalRevenue,
        totalFeeRevenue,
        totalDirectIncome,
        totalExpense,
        netProfit,
        profitMarginPct: totalRevenue > 0 ? Math.round((netProfit / totalRevenue) * 100) : 0,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Error computing financial summary.' });
  }
};
