"use client";

import React from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { AttendanceDataPoint } from "../../lib/types";
import { TrendingDown, Users, AlertTriangle } from "lucide-react";

interface Props {
  title: string;
  data: AttendanceDataPoint[];
}

export const AttendanceChartWidget: React.FC<Props> = ({ title, data }) => {
  const currentRate = data.length > 0 ? data[data.length - 1].attendanceRate : 0;
  const avgRate =
    data.length > 0
      ? Math.round(
          data.reduce((acc, curr) => acc + curr.attendanceRate, 0) / data.length
        )
      : 0;

  return (
    <div className="w-full my-3 rounded-xl border border-border bg-card text-card-foreground shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-4 bg-muted/40 border-b border-border flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <TrendingDown className="w-4 h-4" />
            </span>
            <h4 className="font-semibold text-sm tracking-tight">{title}</h4>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Rolling 30-Day Attendance % (Red dashed line: 85% Academic Benchmark)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-2.5 py-1 rounded-md bg-background border border-border text-xs">
            <span className="text-muted-foreground">Current: </span>
            <span
              className={`font-semibold ${
                currentRate < 85
                  ? "text-rose-600 dark:text-rose-400"
                  : "text-emerald-600 dark:text-emerald-400"
              }`}
            >
              {currentRate}%
            </span>
          </div>
          <div className="px-2.5 py-1 rounded-md bg-background border border-border text-xs">
            <span className="text-muted-foreground">30d Avg: </span>
            <span className="font-semibold text-foreground">{avgRate}%</span>
          </div>
        </div>
      </div>

      {/* Chart container */}
      <div className="p-4 pt-6">
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 10, right: 20, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="attGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                className="stroke-border/60"
                vertical={false}
              />
              <XAxis
                dataKey="day"
                tick={{ fontSize: 11 }}
                className="text-muted-foreground"
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                domain={[40, 100]}
                tick={{ fontSize: 11 }}
                className="text-muted-foreground"
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => `${val}%`}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const d = payload[0].payload as AttendanceDataPoint;
                    return (
                      <div className="p-2.5 rounded-lg border border-border bg-popover text-popover-foreground shadow-md text-xs space-y-1">
                        <div className="font-semibold">{label}</div>
                        <div className="flex items-center justify-between gap-4 text-primary font-medium">
                          <span>Attendance Rate:</span>
                          <span>{d.attendanceRate}%</span>
                        </div>
                        <div className="text-[11px] text-muted-foreground flex items-center justify-between gap-4">
                          <span>Present / Absent:</span>
                          <span>
                            {d.presentCount} / {d.absentCount}
                          </span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              {/* Benchmark Reference Line at 85% */}
              <ReferenceLine
                y={85}
                stroke="#ef4444"
                strokeDasharray="4 4"
                label={{
                  value: "85% Warning Threshold",
                  fill: "#ef4444",
                  fontSize: 10,
                  position: "insideTopRight",
                }}
              />
              <Area
                type="monotone"
                dataKey="attendanceRate"
                stroke="#3b82f6"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#attGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Warning Callout if below benchmark */}
        {currentRate < 85 && (
          <div className="mt-3 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
            <span>
              Attendance has dropped below the 85% institutional threshold.
              Automated interventions have been notified to class counselors.
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
