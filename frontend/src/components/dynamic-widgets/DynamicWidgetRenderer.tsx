"use client";

import React from "react";
import { WidgetPayload } from "../../lib/types";
import { FeeStatusTableWidget } from "./FeeStatusTableWidget";
import { AttendanceChartWidget } from "./AttendanceChartWidget";
import { CounselorBriefingWidget } from "./CounselorBriefingWidget";
import { FinancialMetricsWidget } from "./FinancialMetricsWidget";

interface Props {
  widget: WidgetPayload;
}

export const DynamicWidgetRenderer: React.FC<Props> = ({ widget }) => {
  switch (widget.type) {
    case "fee_table":
      return <FeeStatusTableWidget title={widget.title} data={widget.data} />;

    case "attendance_chart":
      return (
        <AttendanceChartWidget title={widget.title} data={widget.data} />
      );

    case "counselor_briefing":
      return (
        <CounselorBriefingWidget title={widget.title} data={widget.data} />
      );

    case "financial_metrics":
      return (
        <FinancialMetricsWidget title={widget.title} data={widget.data} />
      );

    default:
      return (
        <div className="my-2 p-3 rounded-lg border border-border bg-muted/20 text-xs font-mono overflow-x-auto">
          <div className="font-semibold text-muted-foreground mb-1">
            {widget.title}
          </div>
          <pre>{JSON.stringify(widget.data, null, 2)}</pre>
        </div>
      );
  }
};
