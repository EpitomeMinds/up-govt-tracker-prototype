"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { AiAggregateRow } from "@/lib/aiRecommendationsTypes";
import { formatBudgetCr, formatWorkforce } from "@/lib/aiRecommendationsApi";
import { PIE_PALETTE } from "@/lib/chartTheme";
import ChartCard from "@/components/charts/ChartCard";

export const AI_WORKFORCE_COLORS = {
  required: "#1e40af",
  available: "#3b82f6",
  gap: "#94a3b8",
  sectorGap: "#b45309",
  trend: "#6b8e23",
} as const;

function WorkforceTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-bi-border bg-white px-3 py-2 text-xs shadow-widget">
      {label && <p className="mb-1 font-bold text-bi-title">{label}</p>}
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: {formatWorkforce(p.value)}
        </p>
      ))}
    </div>
  );
}

export function SkillGapByPriorityChart({
  data,
  onFilter,
  height = 260,
}: {
  data: AiAggregateRow[];
  onFilter?: (priority: string) => void;
  height?: number;
}) {
  const chartData = data
    .filter((p) => p.count > 0)
    .map((p) => ({
      name: p.name,
      Required: p.required,
      Available: p.available,
      Gap: p.gap,
    }));

  return (
    <ChartCard title="Vacancies and skill gap by priority" height={height}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e8ebf2" vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#64748b" }} />
          <YAxis
            tick={{ fontSize: 9, fill: "#64748b" }}
            tickFormatter={formatWorkforce}
            label={{ value: "Vacancies", angle: -90, position: "insideLeft", style: { fontSize: 10, fill: "#64748b" } }}
          />
          <Tooltip content={<WorkforceTooltip />} />
          <Legend wrapperStyle={{ fontSize: 10 }} iconSize={8} />
          <Bar
            dataKey="Required"
            fill={AI_WORKFORCE_COLORS.required}
            radius={[4, 4, 0, 0]}
            cursor="pointer"
            onClick={(d) => {
              const n = (d as { name?: string; payload?: { name?: string } }).name ?? (d as { payload?: { name?: string } }).payload?.name;
              if (n && onFilter) onFilter(String(n));
            }}
          />
          <Bar dataKey="Available" fill={AI_WORKFORCE_COLORS.available} radius={[4, 4, 0, 0]} />
          <Bar dataKey="Gap" fill={AI_WORKFORCE_COLORS.gap} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function SkillGapBySectorChart({
  data,
  onFilter,
  maxItems = 20,
  height = 420,
}: {
  data: AiAggregateRow[];
  onFilter?: (sector: string) => void;
  maxItems?: number;
  height?: number;
}) {
  const chartData = [...data]
    .sort((a, b) => a.gap - b.gap)
    .slice(-maxItems)
    .map((s) => ({
      name: s.name.length > 22 ? `${s.name.slice(0, 21)}…` : s.name,
      fullName: s.name,
      Gap: s.gap,
    }));

  return (
    <ChartCard title="Skill gap by industry" height={height}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} layout="vertical" margin={{ top: 4, right: 16, left: 4, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e8ebf2" horizontal={false} />
          <XAxis
            type="number"
            tick={{ fontSize: 9, fill: "#64748b" }}
            tickFormatter={formatWorkforce}
            label={{ value: "Gap", position: "insideBottom", offset: -2, style: { fontSize: 10, fill: "#64748b" } }}
          />
          <YAxis type="category" dataKey="name" tick={{ fontSize: 9, fill: "#475569" }} width={118} />
          <Tooltip formatter={(v: number) => [formatWorkforce(v), "Gap"]} />
          <Bar
            dataKey="Gap"
            fill={AI_WORKFORCE_COLORS.sectorGap}
            radius={[0, 4, 4, 0]}
            cursor="pointer"
            onClick={(d) => {
              const n = (d as { fullName?: string; payload?: { fullName?: string } }).fullName ?? (d as { payload?: { fullName?: string } }).payload?.fullName;
              if (n && onFilter) onFilter(String(n));
            }}
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function SkillGapTrendChart({
  data,
  onFilter,
  height = 260,
}: {
  data: AiAggregateRow[];
  onFilter?: (year: string) => void;
  height?: number;
}) {
  const chartData = [...data]
    .sort((a, b) => Number(a.name) - Number(b.name))
    .map((y) => ({ year: y.name, Gap: y.gap }));

  return (
    <ChartCard title="Skill gap trend by start year" height={height}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e8ebf2" />
          <XAxis dataKey="year" tick={{ fontSize: 10, fill: "#64748b" }} />
          <YAxis
            tick={{ fontSize: 9, fill: "#64748b" }}
            tickFormatter={formatWorkforce}
            label={{ value: "Gap", angle: -90, position: "insideLeft", style: { fontSize: 10, fill: "#64748b" } }}
          />
          <Tooltip formatter={(v: number) => [formatWorkforce(v), "Gap"]} />
          <Legend wrapperStyle={{ fontSize: 10 }} />
          <Line
            type="monotone"
            dataKey="Gap"
            name="Gap"
            stroke={AI_WORKFORCE_COLORS.trend}
            strokeWidth={3}
            dot={{ r: 4, fill: AI_WORKFORCE_COLORS.trend, strokeWidth: 0 }}
            activeDot={{ r: 6, cursor: "pointer" }}
            onClick={(d) => {
              const year = (d as { year?: string; payload?: { year?: string } }).year ?? (d as { payload?: { year?: string } }).payload?.year;
              if (year && onFilter) onFilter(String(year));
            }}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

function renderActionLabel({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  name,
  count,
  percent,
}: {
  cx: number;
  cy: number;
  midAngle: number;
  innerRadius: number;
  outerRadius: number;
  name: string;
  count: number;
  percent: number;
}) {
  const RAD = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 1.35;
  const x = cx + radius * Math.cos(-midAngle * RAD);
  const y = cy + radius * Math.sin(-midAngle * RAD);
  const short = name.length > 14 ? `${name.slice(0, 13)}…` : name;
  return (
    <text x={x} y={y} fill="#475569" textAnchor={x > cx ? "start" : "end"} dominantBaseline="central" fontSize={9}>
      {short} ({count}, {(percent * 100).toFixed(0)}%)
    </text>
  );
}

export function ActionTypePieChart({
  data,
  onFilter,
  height = 280,
}: {
  data: AiAggregateRow[];
  onFilter?: (action: string) => void;
  height?: number;
}) {
  const pieData = data.map((a, i) => ({
    name: a.name,
    value: a.count,
    budgetCr: a.budgetCr,
    fill: PIE_PALETTE[i % PIE_PALETTE.length],
  }));

  return (
    <div className="grid h-full min-h-0 grid-cols-12 gap-3">
      <div className="col-span-7 min-h-0">
        <ChartCard title="Projects by skill type" height={height}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                cx="42%"
                cy="50%"
                outerRadius="72%"
                paddingAngle={1}
                cursor="pointer"
                label={(props) =>
                  renderActionLabel({
                    cx: props.cx,
                    cy: props.cy,
                    midAngle: props.midAngle ?? 0,
                    innerRadius: props.innerRadius ?? 0,
                    outerRadius: props.outerRadius ?? 0,
                    name: String(props.name),
                    count: Number(props.value),
                    percent: props.percent ?? 0,
                  })
                }
                labelLine={{ stroke: "#cbd5e1", strokeWidth: 1 }}
                onClick={(_, i) => {
                  const item = pieData[i];
                  if (item && onFilter) onFilter(item.name);
                }}
              >
                {pieData.map((e) => (
                  <Cell key={e.name} fill={e.fill} />
                ))}
              </Pie>
              <Tooltip
                formatter={(v: number, _n, p) => [
                  `${v} projects · ${formatBudgetCr((p.payload as { budgetCr: number }).budgetCr)}`,
                  "Count",
                ]}
              />
              <Legend layout="vertical" align="right" verticalAlign="middle" wrapperStyle={{ fontSize: 9, paddingLeft: 8 }} iconSize={7} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
      <div className="bi-widget col-span-5 flex min-h-0 flex-col overflow-hidden">
        <div className="shrink-0 border-b border-bi-border px-3 py-2">
          <p className="text-xs font-bold text-bi-title">Skill type summary</p>
          <p className="text-[10px] text-bi-muted">Count &amp; budget (Cr)</p>
        </div>
        <div className="min-h-0 flex-1 overflow-hidden">
          <table className="w-full text-left text-[10px]">
            <thead className="sticky top-0 bg-white">
              <tr className="border-b border-bi-border text-bi-muted">
                <th className="px-3 py-1.5 font-semibold">Skill</th>
                <th className="px-2 py-1.5 font-semibold text-right">Count</th>
                <th className="px-3 py-1.5 font-semibold text-right">Budget</th>
              </tr>
            </thead>
            <tbody>
              {data.map((a) => (
                <tr
                  key={a.name}
                  className="cursor-pointer border-b border-bi-border/40 hover:bg-bi-accentSoft/40"
                  onClick={() => onFilter?.(a.name)}
                >
                  <td className="max-w-[120px] truncate px-3 py-1.5 font-medium text-bi-title">{a.name}</td>
                  <td className="px-2 py-1.5 text-right tabular-nums">{a.count}</td>
                  <td className="px-3 py-1.5 text-right tabular-nums text-bi-violet">{formatBudgetCr(a.budgetCr)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
