"use client";

import React from "react";
import { FinancialSummaryData } from "../../lib/types";
import { formatCurrency } from "../../lib/utils";
import { DollarSign, ArrowUpRight, ArrowDownRight, Wallet, Receipt } from "lucide-react";

interface Props {
  title: string;
  data: FinancialSummaryData;
}

export const FinancialMetricsWidget: React.FC<Props> = ({ title, data }) => {
  const billed = data.totalBilled || 12500;
  const collected = data.totalCollected || 6000;
  const outstanding = data.totalOutstanding || 6500;
  const rate = data.collectionRate || 48.0;

  return (
    <div className="w-full my-3 rounded-xl border border-border bg-card text-card-foreground shadow-sm overflow-hidden">
      <div className="p-3.5 bg-muted/40 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-primary/10 text-primary">
            <Wallet className="w-4 h-4" />
          </span>
          <h4 className="font-semibold text-xs tracking-tight">{title}</h4>
        </div>
        <span className="text-[11px] text-muted-foreground">Term: Fall 2026</span>
      </div>

      <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        {/* Total Billed */}
        <div className="p-3 rounded-lg bg-background border border-border space-y-1">
          <span className="text-muted-foreground text-[11px]">Total Billed</span>
          <div className="text-base font-bold text-foreground">
            {formatCurrency(billed)}
          </div>
          <div className="text-[10px] text-muted-foreground flex items-center gap-0.5">
            <Receipt className="w-3 h-3" />
            <span>Official Invoices</span>
          </div>
        </div>

        {/* Collected */}
        <div className="p-3 rounded-lg bg-background border border-border space-y-1">
          <span className="text-muted-foreground text-[11px]">Collected</span>
          <div className="text-base font-bold text-emerald-600 dark:text-emerald-400">
            {formatCurrency(collected)}
          </div>
          <div className="text-[10px] text-emerald-600 flex items-center gap-0.5">
            <ArrowUpRight className="w-3 h-3" />
            <span>Bank & Card Payments</span>
          </div>
        </div>

        {/* Outstanding */}
        <div className="p-3 rounded-lg bg-background border border-border space-y-1">
          <span className="text-muted-foreground text-[11px]">Outstanding</span>
          <div className="text-base font-bold text-rose-600 dark:text-rose-400">
            {formatCurrency(outstanding)}
          </div>
          <div className="text-[10px] text-rose-600 flex items-center gap-0.5">
            <ArrowDownRight className="w-3 h-3" />
            <span>Action Required</span>
          </div>
        </div>

        {/* Collection Rate */}
        <div className="p-3 rounded-lg bg-background border border-border space-y-1">
          <span className="text-muted-foreground text-[11px]">Collection Rate</span>
          <div className="text-base font-bold text-primary">{rate}%</div>
          {/* Mini progress bar */}
          <div className="w-full bg-muted rounded-full h-1.5 mt-1 overflow-hidden">
            <div
              className="bg-primary h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, rate)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
