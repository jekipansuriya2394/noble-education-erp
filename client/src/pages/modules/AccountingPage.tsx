import React, { useState, useEffect } from 'react';
import { DollarSign, PlusCircle, TrendingUp, TrendingDown, Receipt, FileText } from 'lucide-react';
import DataTable, { Column } from '../../components/common/DataTable';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import { apiRequest } from '../../api/client';
import { useTenant } from '../../context/TenantContext';

export const AccountingPage: React.FC = () => {
  const { activeSchool } = useTenant();
  const [expenses, setExpenses] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [form, setForm] = useState({
    category: 'LAB_EQUIPMENT',
    amount: '18500',
    paymentMode: 'BANK_TRANSFER',
    payeeName: 'Baroda Scientific Supplies',
    description: 'Purchase of Optics prism sets and chemicals for Physics/Chemistry Lab',
  });

  const loadAccounting = async () => {
    const [expRes, sumRes] = await Promise.all([
      apiRequest('/accounting/expenses', { params: { schoolId: activeSchool?.id } }),
      apiRequest('/accounting/summary', { params: { schoolId: activeSchool?.id } }),
    ]);

    if (expRes.success) setExpenses(expRes.expenses || []);
    if (sumRes.success) setSummary(sumRes.summary);
  };

  useEffect(() => {
    loadAccounting();
  }, [activeSchool]);

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await apiRequest('/accounting/expenses', {
      method: 'POST',
      body: JSON.stringify({ ...form, schoolId: activeSchool?.id }),
    });

    if (res.success) {
      alert(`Expense Voucher ${res.expense.voucherNumber} created!`);
      setIsModalOpen(false);
      loadAccounting();
    } else {
      alert(res.error || 'Failed to record expense');
    }
  };

  const columns: Column<any>[] = [
    {
      key: 'voucherNumber',
      header: 'Voucher No',
      sortable: true,
      render: (e) => <span className="font-mono text-xs text-brand-red-light font-bold">{e.voucherNumber}</span>,
    },
    {
      key: 'payeeName',
      header: 'Payee / Vendor',
      sortable: true,
      render: (e) => (
        <div>
          <p className="font-semibold text-white">{e.payeeName}</p>
          <p className="text-[11px] text-slate-400">{e.description}</p>
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Category',
      render: (e) => <Badge variant="neutral">{e.category}</Badge>,
    },
    {
      key: 'amount',
      header: 'Amount (₹)',
      sortable: true,
      render: (e) => <span className="font-bold text-rose-400 font-mono">₹{e.amount.toLocaleString('en-IN')}</span>,
    },
    {
      key: 'paymentDate',
      header: 'Payment Date',
      render: (e) => <span className="text-xs text-slate-400">{new Date(e.paymentDate).toLocaleDateString()}</span>,
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Institutional Accounts & P&L Ledger</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Operational expenses, supplier vouchers, fee revenues, and net balance statement
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-red hover:bg-brand-red-dark text-white text-xs font-bold shadow-md glow-red-sm transition-all"
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Expense Voucher</span>
        </button>
      </div>

      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-[#0f172a] border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Total Fee & Other Revenue</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <h3 className="text-2xl font-bold text-emerald-400 mt-2">
            ₹{(summary?.totalRevenue || 0).toLocaleString('en-IN')}
          </h3>
        </div>

        <div className="p-5 rounded-2xl bg-[#0f172a] border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Total Operational Expenses</span>
            <TrendingDown className="w-4 h-4 text-rose-400" />
          </div>
          <h3 className="text-2xl font-bold text-rose-400 mt-2">
            ₹{(summary?.totalExpense || 0).toLocaleString('en-IN')}
          </h3>
        </div>

        <div className="p-5 rounded-2xl bg-[#0f172a] border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Net Operating Margin</span>
            <Badge variant="success">{summary?.profitMarginPct || 0}%</Badge>
          </div>
          <h3 className="text-2xl font-bold text-white mt-2">
            ₹{(summary?.netProfit || 0).toLocaleString('en-IN')}
          </h3>
        </div>
      </div>

      {/* Expense Vouchers Table */}
      <DataTable
        columns={columns}
        data={expenses}
        searchPlaceholder="Search expense vouchers by payee, category..."
        searchKey="payeeName"
      />

      {/* New Expense Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Record Institutional Expense Voucher"
        subtitle="Vouchers require bursar approval and are logged into audit ledger"
      >
        <form onSubmit={handleCreateExpense} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300">Expense Category</label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="mt-1 w-full bg-[#1e293b] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
            >
              <option value="LAB_EQUIPMENT">Laboratory Equipment & Chemicals</option>
              <option value="SALARIES">Faculty & Staff Compensation</option>
              <option value="UTILITIES">Electricity & Campus Utilities</option>
              <option value="REPAIRS">Building & Classroom Maintenance</option>
              <option value="STATIONERY">Printing & Examination Stationery</option>
              <option value="EVENTS">Annual Sports & Cultural Events</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300">Amount (₹) *</label>
              <input
                type="number"
                required
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                className="mt-1 w-full bg-[#1e293b] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300">Payment Mode</label>
              <select
                value={form.paymentMode}
                onChange={(e) => setForm({ ...form, paymentMode: e.target.value })}
                className="mt-1 w-full bg-[#1e293b] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
              >
                <option value="BANK_TRANSFER">NEFT / Bank Transfer</option>
                <option value="CHEQUE">Bank Cheque</option>
                <option value="UPI">UPI Payment</option>
                <option value="CASH">Petty Cash</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300">Payee / Supplier Name *</label>
            <input
              type="text"
              required
              value={form.payeeName}
              onChange={(e) => setForm({ ...form, payeeName: e.target.value })}
              className="mt-1 w-full bg-[#1e293b] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300">Voucher Description</label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="mt-1 w-full bg-[#1e293b] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-3.5 py-1.5 rounded-lg bg-[#1e293b] hover:bg-slate-700 text-xs text-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg bg-brand-red hover:bg-brand-red-dark text-xs font-bold text-white shadow-md glow-red-sm"
            >
              Authorize & Save Voucher
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AccountingPage;
