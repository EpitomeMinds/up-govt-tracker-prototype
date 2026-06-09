"use client";

import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { InvestmentPredictionsResponse } from "@/lib/investmentTypes";
import {
  buildSectorJobData,
  buildTrendData,
} from "@/lib/investmentPortalAnalytics";

interface Props {
  data: InvestmentPredictionsResponse;
  compact?: boolean;
}

export default function PortalGrowthCharts({ data, compact }: Props) {
  const trendData = useMemo(() => buildTrendData(data), [data]);
  const sectorData = useMemo(() => buildSectorJobData(data), [data]);
  const chartHeight = compact ? 210 : 280;

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <div className="portal-panel">
        <div className="portal-panel-header">
          <h2 className="portal-panel-title">Investment vs Job Creation Trend</h2>
          <select className="portal-select text-xs" defaultValue="12m">
            <option value="12m">Last 12 Months</option>
          </select>
        </div>
        <div className="px-2 pb-4" style={{ height: chartHeight }}>
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <LineChart data={trendData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#64748b" }} />
              <YAxis
                yAxisId="left"
                tick={{ fontSize: 10, fill: "#64748b" }}
                tickFormatter={(v) => `${v}`}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                tick={{ fontSize: 10, fill: "#64748b" }}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: 8,
                  border: "1px solid #e2e8f0",
                  fontSize: 12,
                }}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="investment"
                name="Investment (Rs Cr)"
                stroke="#f97316"
                strokeWidth={2.5}
                dot={{ r: 3, fill: "#f97316" }}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="jobs"
                name="Jobs Created"
                stroke="#2563eb"
                strokeWidth={2.5}
                dot={{ r: 3, fill: "#2563eb" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="portal-panel">
        <div className="portal-panel-header">
          <h2 className="portal-panel-title">Sector-wise Job Distribution</h2>
          <select className="portal-select text-xs" defaultValue="2026">
            <option value="2026">2026</option>
          </select>
        </div>
        <div className="px-2 pb-4" style={{ height: chartHeight }}>
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <BarChart data={sectorData} margin={{ top: 8, right: 8, left: -12, bottom: 48 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 10, fill: "#64748b" }}
                angle={-35}
                textAnchor="end"
                interval={0}
                height={56}
              />
              <YAxis tick={{ fontSize: 10, fill: "#64748b" }} />
              <Tooltip
                contentStyle={{
                  borderRadius: 8,
                  border: "1px solid #e2e8f0",
                  fontSize: 12,
                }}
                formatter={(value: number) => [value.toLocaleString("en-IN"), "Jobs"]}
                labelFormatter={(_, payload) =>
                  (payload?.[0]?.payload as { fullName?: string })?.fullName ?? ""
                }
              />
              <Bar dataKey="jobs" radius={[6, 6, 0, 0]} maxBarSize={48}>
                {sectorData.map((entry) => (
                  <Cell key={entry.fullName} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
