import React, { useState, useEffect } from 'react';
import { Receipt, PlusCircle, Search, CreditCard, Download, CheckCircle2, DollarSign } from 'lucide-react';
import DataTable, { Column } from '../../components/common/DataTable';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import { FeePayment } from '../../types';
import { apiRequest } from '../../api/client';
import { useTenant } from '../../context/TenantContext';

export const FeesPage: React.FC = () => {
  const { activeSchool } = useTenant();
  const [payments, setPayments] = useState<FeePayment[]>([]);
  const [structures, setStructures] = useState<any[]>([]);
  const [totalCollected, setTotalCollected] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Collection Form State
  const [collectForm, setCollectForm] = useState({
    studentId: '',
    amountPaid: '34000',
    paymentMode: 'UPI',
    transactionRef: 'UPI/HDFC/' + Math.floor(100000 + Math.random() * 900000),
    remarks: 'Term Tuition Fee',
  });

  const [studentsList, setStudentsList] = useState<any[]>([]);

  const loadFeeData = async () => {
    const [payRes, strRes, stuRes] = await Promise.all([
      apiRequest('/fees/payments'),
      apiRequest('/fees/structures', { params: { schoolId: activeSchool?.id } }),
      apiRequest('/students', { params: { schoolId: activeSchool?.id } }),
    ]);

    if (payRes.success) {
      setPayments(payRes.payments || []);
      setTotalCollected(payRes.totalCollected || 0);
    }
    if (strRes.success) {
      setStructures(strRes.feeStructures || []);
    }
    if (stuRes.success && stuRes.data) {
      setStudentsList(stuRes.data);
      if (stuRes.data.length > 0) {
        setCollectForm((prev) => ({ ...prev, studentId: stuRes.data[0].id }));
      }
    }
  };

  useEffect(() => {
    loadFeeData();
  }, [activeSchool]);

  const handleCollectFee = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await apiRequest('/fees/collect', {
      method: 'POST',
      body: JSON.stringify(collectForm),
    });

    if (res.success) {
      alert(`Fee collected successfully!\nReceipt No: ${res.payment.receiptNumber}\nAmount: ₹${res.payment.amountPaid}`);
      setIsModalOpen(false);
      loadFeeData();
    } else {
      alert(res.error || 'Failed to collect fee');
    }
  };

  const columns: Column<FeePayment>[] = [
    {
      key: 'receiptNumber',
      header: 'Receipt No',
      sortable: true,
      render: (p) => <span className="font-mono text-xs text-brand-red-light font-bold">{p.receiptNumber}</span>,
    },
    {
      key: 'student',
      header: 'Student Name',
      sortable: true,
      render: (p) => (
        <div>
          <p className="font-semibold text-white">{p.student?.firstName} {p.student?.lastName}</p>
          <p className="text-[11px] text-slate-400 font-mono">{p.student?.admissionNumber}</p>
        </div>
      ),
    },
    {
      key: 'amountPaid',
      header: 'Amount Paid',
      sortable: true,
      render: (p) => <span className="font-bold text-white font-mono">₹{p.amountPaid.toLocaleString('en-IN')}</span>,
    },
    {
      key: 'paymentMode',
      header: 'Payment Mode',
      render: (p) => <Badge variant={p.paymentMode === 'UPI' ? 'info' : 'neutral'}>{p.paymentMode}</Badge>,
    },
    {
      key: 'paymentDate',
      header: 'Date',
      render: (p) => <span className="text-xs text-slate-400">{new Date(p.paymentDate).toLocaleDateString()}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (p) => <Badge variant="success">{p.status}</Badge>,
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Tuition Fees & Collection Desk</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Collect installments, generate official school receipts, and manage outstanding balances
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-red hover:bg-brand-red-dark text-white text-xs font-bold shadow-md glow-red-sm transition-all"
        >
          <CreditCard className="w-4 h-4" />
          <span>Collect Fee Payment</span>
        </button>
      </div>

      {/* Fee Structure Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-[#0f172a] border border-slate-800">
          <p className="text-xs text-slate-400 font-medium">Total Fees Collected (Term)</p>
          <h3 className="text-2xl font-bold text-emerald-400 mt-1">₹{totalCollected.toLocaleString('en-IN')}</h3>
          <p className="text-xs text-slate-500 mt-1">Across all registered receipts</p>
        </div>
        <div className="p-5 rounded-2xl bg-[#0f172a] border border-slate-800">
          <p className="text-xs text-slate-400 font-medium">Active Fee Structures</p>
          <h3 className="text-2xl font-bold text-white mt-1">{structures.length} Plans</h3>
          <p className="text-xs text-slate-500 mt-1">K-12 & Coaching Integrated</p>
        </div>
        <div className="p-5 rounded-2xl bg-[#0f172a] border border-slate-800">
          <p className="text-xs text-slate-400 font-medium">Default Mode</p>
          <h3 className="text-2xl font-bold text-blue-400 mt-1">UPI & Bank Transfer</h3>
          <p className="text-xs text-slate-500 mt-1">Direct to Noble Education A/C</p>
        </div>
      </div>

      {/* Payment Receipts DataTable */}
      <DataTable
        columns={columns}
        data={payments}
        searchPlaceholder="Search receipts by student or receipt number..."
        searchKey="receiptNumber"
      />

      {/* Fee Collection Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Collect Tuition Fee Installment"
        subtitle="Generates an official Noble Education receipt with transactional record"
      >
        <form onSubmit={handleCollectFee} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300">Select Student</label>
            <select
              value={collectForm.studentId}
              onChange={(e) => setCollectForm({ ...collectForm, studentId: e.target.value })}
              className="mt-1 w-full bg-[#1e293b] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
            >
              {studentsList.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.firstName} {s.lastName} ({s.admissionNumber}) - {s.class?.name || 'Class 10'}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300">Amount Paid (₹) *</label>
              <input
                type="number"
                required
                value={collectForm.amountPaid}
                onChange={(e) => setCollectForm({ ...collectForm, amountPaid: e.target.value })}
                className="mt-1 w-full bg-[#1e293b] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300">Payment Mode</label>
              <select
                value={collectForm.paymentMode}
                onChange={(e) => setCollectForm({ ...collectForm, paymentMode: e.target.value })}
                className="mt-1 w-full bg-[#1e293b] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
              >
                <option value="UPI">UPI (Google Pay / PhonePe / Paytm)</option>
                <option value="CASH">Cash (Front Desk Counter)</option>
                <option value="BANK_TRANSFER">NEFT / RTGS Bank Transfer</option>
                <option value="CHEQUE">Cheque</option>
                <option value="ONLINE">Online Net Banking</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300">Transaction Reference / UTR</label>
            <input
              type="text"
              value={collectForm.transactionRef}
              onChange={(e) => setCollectForm({ ...collectForm, transactionRef: e.target.value })}
              className="mt-1 w-full bg-[#1e293b] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300">Remarks</label>
            <input
              type="text"
              value={collectForm.remarks}
              onChange={(e) => setCollectForm({ ...collectForm, remarks: e.target.value })}
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
              Generate Receipt & Collect
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default FeesPage;
