import React, { useState, useEffect } from 'react';
import { Briefcase, PlusCircle, FileText, CheckCircle2, DollarSign, Download, Printer } from 'lucide-react';
import DataTable, { Column } from '../../components/common/DataTable';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import { apiRequest } from '../../api/client';
import { useTenant } from '../../context/TenantContext';

export const PayrollPage: React.FC = () => {
  const { activeSchool } = useTenant();
  const [runs, setRuns] = useState<any[]>([]);
  const [selectedPayslip, setSelectedPayslip] = useState<any>(null);
  const [isPayslipModalOpen, setIsPayslipModalOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const loadPayroll = async () => {
    const res = await apiRequest('/hr/payroll', { params: { schoolId: activeSchool?.id } });
    if (res.success && res.payrollRuns) {
      setRuns(res.payrollRuns);
    }
  };

  useEffect(() => {
    loadPayroll();
  }, [activeSchool]);

  const handleGeneratePayroll = async () => {
    setIsGenerating(true);
    const res = await apiRequest('/hr/payroll', {
      method: 'POST',
      body: JSON.stringify({
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
        schoolId: activeSchool?.id,
      }),
    });

    setIsGenerating(false);
    if (res.success) {
      alert(`Payroll Run Calculated Successfully!\nTotal Employees: ${res.payrollRun.totalEmployees}\nTotal Net Disbursed: ₹${res.payrollRun.totalNet.toLocaleString('en-IN')}`);
      loadPayroll();
    } else {
      alert(res.error || 'Failed to execute payroll run');
    }
  };

  // Flatten payslips from latest run
  const latestRun = runs[0];
  const payslips = latestRun?.payslips || [];

  const columns: Column<any>[] = [
    {
      key: 'employeeCode',
      header: 'Emp Code',
      sortable: true,
      render: (p) => <span className="font-mono text-xs text-brand-red-light font-bold">{p.employee?.employeeCode}</span>,
    },
    {
      key: 'employee',
      header: 'Employee Name',
      sortable: true,
      render: (p) => (
        <div>
          <p className="font-semibold text-white">{p.employee?.firstName} {p.employee?.lastName}</p>
          <p className="text-[11px] text-slate-400">{p.employee?.designation?.title || 'Faculty'}</p>
        </div>
      ),
    },
    {
      key: 'grossSalary',
      header: 'Gross Salary',
      sortable: true,
      render: (p) => <span className="font-mono font-bold text-white">₹{p.grossSalary.toLocaleString('en-IN')}</span>,
    },
    {
      key: 'totalDeductions',
      header: 'Deductions (PF/PT/TDS)',
      render: (p) => <span className="font-mono text-rose-400">₹{p.totalDeductions.toLocaleString('en-IN')}</span>,
    },
    {
      key: 'netSalary',
      header: 'Net Take-Home',
      sortable: true,
      render: (p) => <span className="font-mono font-bold text-emerald-400">₹{p.netSalary.toLocaleString('en-IN')}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (p) => <Badge variant={p.paymentStatus === 'PAID' ? 'success' : 'warning'}>{p.paymentStatus}</Badge>,
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Staff Payroll & Statutory Compensation</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Automated calculations with Indian statutory compliance (PF, ESI, Gujarat PT, TDS deductions)
          </p>
        </div>

        <button
          onClick={handleGeneratePayroll}
          disabled={isGenerating}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-red hover:bg-brand-red-dark text-white text-xs font-bold shadow-md glow-red-sm disabled:opacity-50 transition-all"
        >
          <DollarSign className="w-4 h-4" />
          <span>{isGenerating ? 'Calculating Run...' : 'Calculate Monthly Payroll'}</span>
        </button>
      </div>

      {/* Latest Run KPI Banner */}
      {latestRun && (
        <div className="p-5 rounded-2xl bg-[#0f172a] border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] uppercase font-bold text-brand-red-light tracking-wider">
              Active Run: Month {latestRun.month} / {latestRun.year}
            </span>
            <h3 className="text-lg font-bold text-white mt-0.5">
              Disbursement Cycle Status: <Badge variant="info">{latestRun.status}</Badge>
            </h3>
            <p className="text-xs text-slate-400 mt-1">Covering {latestRun.totalEmployees} faculty & administrative staff</p>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <span className="text-xs text-slate-400">Total Net Disbursed</span>
              <p className="text-xl font-bold text-emerald-400 font-mono">
                ₹{latestRun.totalNet.toLocaleString('en-IN')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Payslips Table */}
      <DataTable
        columns={columns}
        data={payslips}
        searchPlaceholder="Search payslips by employee..."
        actions={(p) => (
          <button
            onClick={() => {
              setSelectedPayslip(p);
              setIsPayslipModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-[#1e293b] hover:bg-slate-700 text-xs font-semibold text-slate-200"
          >
            <FileText className="w-3.5 h-3.5 text-brand-red-light" />
            <span>Payslip</span>
          </button>
        )}
      />

      {/* Professional Payslip Viewer Modal */}
      <Modal
        isOpen={isPayslipModalOpen}
        onClose={() => setIsPayslipModalOpen(false)}
        title="Noble Education - Monthly Salary Slip"
        subtitle="Official statutory employee pay statement"
      >
        {selectedPayslip && (
          <div className="space-y-4 text-xs font-sans">
            <div className="p-4 bg-[#131d31] border border-slate-800 rounded-xl flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-white">Noble Education</h4>
                <p className="text-[11px] text-slate-400">Vadodara, Gujarat • nobleedu.in</p>
              </div>
              <div className="text-right">
                <span className="font-mono text-xs font-bold text-brand-red-light">
                  {selectedPayslip.employee?.employeeCode}
                </span>
                <p className="text-[11px] text-slate-400">Month: {selectedPayslip.month}/{selectedPayslip.year}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 p-3 bg-slate-900/50 rounded-xl border border-slate-800">
              <div>
                <span className="text-slate-500">Employee Name:</span>
                <p className="font-bold text-white mt-0.5">{selectedPayslip.employee?.firstName} {selectedPayslip.employee?.lastName}</p>
              </div>
              <div>
                <span className="text-slate-500">Designation:</span>
                <p className="font-bold text-white mt-0.5">{selectedPayslip.employee?.designation?.title || 'Senior Faculty'}</p>
              </div>
            </div>

            {/* Earnings & Deductions Breakdown */}
            <div className="grid grid-cols-2 gap-4">
              {/* Earnings */}
              <div className="space-y-2 p-3 bg-slate-900/40 rounded-xl border border-slate-800">
                <h5 className="font-bold uppercase tracking-wider text-emerald-400 border-b border-slate-800 pb-1.5">
                  Earnings (₹)
                </h5>
                <div className="flex justify-between py-1 border-b border-slate-800/40">
                  <span className="text-slate-400">Basic Salary</span>
                  <span className="font-mono text-white">₹{selectedPayslip.basicSalary.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/40">
                  <span className="text-slate-400">HRA (40%)</span>
                  <span className="font-mono text-white">₹{selectedPayslip.hra.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/40">
                  <span className="text-slate-400">DA (10%)</span>
                  <span className="font-mono text-white">₹{selectedPayslip.da.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/40">
                  <span className="text-slate-400">Conveyance Allowance</span>
                  <span className="font-mono text-white">₹{selectedPayslip.conveyance.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between py-1.5 font-bold border-t border-slate-700">
                  <span className="text-white">Gross Salary</span>
                  <span className="font-mono text-emerald-400">₹{selectedPayslip.grossSalary.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Deductions */}
              <div className="space-y-2 p-3 bg-slate-900/40 rounded-xl border border-slate-800">
                <h5 className="font-bold uppercase tracking-wider text-rose-400 border-b border-slate-800 pb-1.5">
                  Deductions (₹)
                </h5>
                <div className="flex justify-between py-1 border-b border-slate-800/40">
                  <span className="text-slate-400">Provident Fund (12%)</span>
                  <span className="font-mono text-white">₹{selectedPayslip.pfDeduction.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/40">
                  <span className="text-slate-400">Professional Tax (PT Gujarat)</span>
                  <span className="font-mono text-white">₹{selectedPayslip.profTax.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/40">
                  <span className="text-slate-400">TDS / Income Tax</span>
                  <span className="font-mono text-white">₹{selectedPayslip.tdsDeduction.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between py-1.5 font-bold border-t border-slate-700">
                  <span className="text-white">Total Deductions</span>
                  <span className="font-mono text-rose-400">₹{selectedPayslip.totalDeductions.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            {/* Net Total */}
            <div className="p-4 bg-emerald-950/40 border border-emerald-800/60 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wide">Net Salary Disbursed</span>
                <p className="text-[11px] text-slate-400">Credited to registered salary account</p>
              </div>
              <span className="text-xl font-extrabold text-white font-mono">
                ₹{selectedPayslip.netSalary.toLocaleString('en-IN')}
              </span>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1e293b] hover:bg-slate-700 text-xs font-semibold text-white rounded-lg"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Payslip</span>
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default PayrollPage;
