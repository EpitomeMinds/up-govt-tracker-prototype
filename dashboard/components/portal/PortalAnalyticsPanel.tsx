"use client";

import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ExtendedAnalytics } from "@/lib/jobAnalytics";
import { LABOUR_COLORS, PIE_PALETTE, truncateLabel } from "@/lib/chartTheme";

interface Props {
  analytics: ExtendedAnalytics;
  onOpenDetailedAnalysis: () => void;
}

const DEPT_COLORS = [
  "#2563eb",
  "#06b6d4",
  "#10b981",
  "#eab308",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#f97316",
];

function SkillTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { name: string; value: number; payload: { name: string; value: number } }[];
}) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-md">
      <p className="font-semibold text-slate-800">{item.name}</p>
      <p className="mt-0.5 text-slate-600">{item.value.toLocaleString("en-IN")} openings</p>
    </div>
  );
}

export default function PortalAnalyticsPanel({ analytics, onOpenDetailedAnalysis }: Props) {
  const deptData = analytics.boardVacancyBars.slice(0, 8).map((row, i) => ({
    name: truncateLabel(row.name, 12),
    fullName: row.name,
    value: row.vacancies,
    fill: DEPT_COLORS[i % DEPT_COLORS.length],
  }));

  const skillData = analytics.labourChartData
    .filter((r) => r.vacancies > 0)
    .map((row, i) => ({
      name: row.name,
      value: row.vacancies,
      fill:
        LABOUR_COLORS[row.key as keyof typeof LABOUR_COLORS] ||
        PIE_PALETTE[i % PIE_PALETTE.length],
    }));

  return (
    <div className="flex flex-col gap-4">
      <div className="portal-panel">
        <div className="portal-panel-header">
          <h2 className="portal-panel-title">Jobs by Department</h2>
        </div>
        <div className="h-[280px] w-full px-2 pb-2">
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={200}>
            <BarChart data={deptData} margin={{ top: 8, right: 8, left: -16, bottom: 48 }}>
              <XAxis
                dataKey="name"
                tick={{ fontSize: 10, fill: "#64748b" }}
                angle={-40}
                textAnchor="end"
                interval={0}
                height={60}
              />
              <YAxis tick={{ fontSize: 10, fill: "#64748b" }} />
              <Tooltip
                contentStyle={{
                  borderRadius: 8,
                  border: "1px solid #e2e8f0",
                  fontSize: 12,
                }}
                formatter={(value: number) => [value.toLocaleString("en-IN"), "Vacancies"]}
                labelFormatter={(_, payload) =>
                  payload?.[0]?.payload?.fullName || ""
                }
              />
              <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={42}>
                {deptData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="portal-panel">
        <div className="portal-panel-header">
          <h2 className="portal-panel-title">Skill Distribution</h2>
        </div>
        <div className="flex h-[220px] items-center justify-center px-4 pb-4">
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={180}>
            <PieChart>
              <Pie
                data={skillData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={52}
                outerRadius={78}
                paddingAngle={3}
              >
                {skillData.map((entry, index) => (
                  <Cell key={`skill-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip content={<SkillTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="ml-2 hidden min-w-[100px] flex-col gap-2 sm:flex">
            {skillData.map((s) => (
              <div key={s.name} className="flex items-center gap-2 text-xs text-slate-600">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: s.fill }} />
                {s.name}
              </div>
            ))}
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={onOpenDetailedAnalysis}
        className="portal-btn-primary portal-btn-blinker w-full justify-center py-3"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        Get Detailed Analysis
      </button>
    </div>
  );
}
