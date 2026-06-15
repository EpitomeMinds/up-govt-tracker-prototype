"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { InvestmentPredictionsResponse } from "@/lib/investmentTypes";
import {
  buildSectorJobData,
  buildTrendData,
  type SectorJobRow,
  type TrendPoint,
} from "@/lib/investmentPortalAnalytics";
import StableChartContainer from "@/components/charts/StableChartContainer";

interface Props {
  data: InvestmentPredictionsResponse;
  compact?: boolean;
  trendData?: TrendPoint[];
  sectorData?: SectorJobRow[];
  onSectorClick?: (sector: string) => void;
  onYearClick?: (year: string) => void;
}

export default function PortalGrowthCharts({
  data,
  compact,
  trendData: trendOverride,
  sectorData: sectorOverride,
  onSectorClick,
  onYearClick,
}: Props) {
  const trendData = trendOverride ?? buildTrendData(data);
  const sectorData = sectorOverride ?? buildSectorJobData(data);
  const chartHeight = compact ? 210 : 280;

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <div className="portal-panel">
        <div className="portal-panel-header">
          <h2 className="portal-panel-title">Investment vs Job Projection Timeline</h2>
          <select className="portal-select text-xs" defaultValue="12m">
            <option value="12m">Workbook Years</option>
          </select>
        </div>
        <StableChartContainer height={chartHeight} className="px-2 pb-4">
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
                dot={{ r: 3, fill: "#f97316", cursor: onYearClick ? "pointer" : "default" }}
                activeDot={{ r: 5, cursor: onYearClick ? "pointer" : "default" }}
                onClick={(point) => {
                  const year = String((point as { month?: string }).month ?? "");
                  if (year && onYearClick) onYearClick(year);
                }}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="jobs"
                name="Projected Jobs"
                stroke="#2563eb"
                strokeWidth={2.5}
                dot={{ r: 3, fill: "#2563eb", cursor: onYearClick ? "pointer" : "default" }}
                activeDot={{ r: 5, cursor: onYearClick ? "pointer" : "default" }}
                onClick={(point) => {
                  const year = String((point as { month?: string }).month ?? "");
                  if (year && onYearClick) onYearClick(year);
                }}
              />
            </LineChart>
        </StableChartContainer>
      </div>

      <div className="portal-panel">
        <div className="portal-panel-header">
          <h2 className="portal-panel-title">Industry-wise Job Distribution</h2>
          {onSectorClick && (
            <span className="text-[10px] font-medium text-slate-500">Click a bar to drill down</span>
          )}
          <select className="portal-select text-xs" defaultValue="2035">
            <option value="2035">2026-2035</option>
          </select>
        </div>
        <StableChartContainer height={chartHeight} className="px-2 pb-4">
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
              <Bar
                dataKey="jobs"
                radius={[6, 6, 0, 0]}
                maxBarSize={48}
                cursor={onSectorClick ? "pointer" : "default"}
                onClick={(payload) => {
                  const fullName = String(
                    (payload as { fullName?: string; payload?: { fullName?: string } }).fullName ??
                      (payload as { payload?: { fullName?: string } }).payload?.fullName ??
                      ""
                  );
                  if (fullName && onSectorClick) onSectorClick(fullName);
                }}
              >
                {sectorData.map((entry) => (
                  <Cell key={entry.fullName} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
        </StableChartContainer>
      </div>
    </div>
  );
}
