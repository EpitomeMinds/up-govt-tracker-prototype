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
import type { AiBoardCategoryRow, AiDepartmentRow, AiRecommendation } from "@/lib/aiRecommendationsTypes";
import { PRIORITY_COLORS, formatBudgetCr, formatWorkforce } from "@/lib/aiRecommendationsApi";
import { BOARD_CATEGORY_COLORS } from "@/lib/aiRecommendationsTypes";
import ChartCard from "@/components/charts/ChartCard";
import { AI_WORKFORCE_COLORS } from "@/components/ai/charts/AiChartComponents";

const PRIORITIES = ["Critical", "High", "Medium", "Low"] as const;

export function aggregateCategoryPriorities(
  recommendations: AiRecommendation[],
  departmentNames: string[]
) {
  const names = new Set(departmentNames);
  const items = recommendations.filter((r) => names.has(r.department));
  return PRIORITIES.map((p) => ({
    name: p,
    count: items.filter((r) => r.priority === p).length,
    gap: items.filter((r) => r.priority === p).reduce((s, r) => s + r.skillGap, 0),
    fill: PRIORITY_COLORS[p] || "#64748b",
  }));
}

export function BoardCategoryGapChart({
  departments,
  accent,
  height = 130,
  onSelect,
}: {
  departments: AiDepartmentRow[];
  accent: string;
  height?: number;
  onSelect?: (name: string) => void;
}) {
  const chartData = [...departments]
    .sort((a, b) => b.gap - a.gap)
    .slice(0, 8)
    .map((d) => ({
      name: d.name.length > 16 ? `${d.name.slice(0, 15)}…` : d.name,
      fullName: d.name,
      Gap: d.gap,
      Required: d.required,
    }));

  return (
    <ChartCard title="Gap by industry" height={height}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 8, left: 0, bottom: 0 }}>
          <XAxis type="number" tick={{ fontSize: 8, fill: "#94a3b8" }} tickFormatter={formatWorkforce} />
          <YAxis type="category" dataKey="name" tick={{ fontSize: 8, fill: "#475569" }} width={96} />
          <Tooltip formatter={(v: number, n: string) => [formatWorkforce(v), n]} />
          <Bar
            dataKey="Gap"
            fill={accent}
            radius={[0, 3, 3, 0]}
            cursor="pointer"
            onClick={(d) => {
              const n = (d as { fullName?: string; payload?: { fullName?: string } }).fullName ?? (d as { payload?: { fullName?: string } }).payload?.fullName;
              if (n && onSelect) onSelect(String(n));
            }}
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function BoardCategoryPriorityChart({
  priorityData,
  height = 130,
}: {
  priorityData: { name: string; count: number; gap: number; fill: string }[];
  height?: number;
}) {
  return (
    <ChartCard title="Priority mix" height={height}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={priorityData} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
          <XAxis dataKey="name" tick={{ fontSize: 9, fill: "#64748b" }} />
          <YAxis tick={{ fontSize: 8, fill: "#94a3b8" }} allowDecimals={false} />
          <Tooltip
            formatter={(v: number, _n, p) => [
              `${v} projects · ${formatWorkforce((p.payload as { gap: number }).gap)} gap`,
              "Count",
            ]}
          />
          <Bar dataKey="count" radius={[4, 4, 0, 0]}>
            {priorityData.map((p) => (
              <Cell key={p.name} fill={p.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function BoardCategoryShareChart({
  departments,
  categoryName,
  height = 130,
}: {
  departments: AiDepartmentRow[];
  categoryName: string;
  height?: number;
}) {
  const accent = BOARD_CATEGORY_COLORS[categoryName] || "#64748b";
  const sorted = [...departments].sort((a, b) => b.gap - a.gap);
  const top = sorted.slice(0, 5);
  const otherGap = sorted.slice(5).reduce((s, d) => s + d.gap, 0);
  const pieData = [
    ...top.map((d, i) => ({
      name: d.name.length > 14 ? `${d.name.slice(0, 13)}…` : d.name,
      value: d.gap,
      fill: adjustColor(accent, i * 0.12),
    })),
    ...(otherGap > 0 ? [{ name: "Others", value: otherGap, fill: "#cbd5e1" }] : []),
  ];

  return (
    <ChartCard title="Gap share" height={height}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={pieData}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius="38%"
            outerRadius="72%"
            paddingAngle={2}
          >
            {pieData.map((e) => (
              <Cell key={e.name} fill={e.fill} />
            ))}
          </Pie>
          <Tooltip formatter={(v: number) => [formatWorkforce(v), "Gap"]} />
        </PieChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function BoardWorkforceCompareChart({
  departments,
  accent,
  height = 130,
}: {
  departments: AiDepartmentRow[];
  accent: string;
  height?: number;
}) {
  const chartData = [...departments]
    .sort((a, b) => b.required - a.required)
    .slice(0, 6)
    .map((d) => ({
      name: d.name.length > 10 ? `${d.name.slice(0, 9)}…` : d.name,
      Required: d.required,
      Available: d.available,
      Gap: d.gap,
    }));

  return (
    <ChartCard title="Vacancy balance" height={height}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <XAxis dataKey="name" tick={{ fontSize: 7, fill: "#64748b" }} interval={0} angle={-18} textAnchor="end" height={36} />
          <YAxis tick={{ fontSize: 8, fill: "#94a3b8" }} tickFormatter={formatWorkforce} />
          <Tooltip content={({ active, payload, label }) => {
            if (!active || !payload?.length) return null;
            return (
              <div className="rounded-lg border border-bi-border bg-white px-2 py-1.5 text-[10px] shadow-widget">
                <p className="font-bold text-bi-title">{label}</p>
                {payload.map((p) => (
                  <p key={p.name} style={{ color: p.color }}>{p.name}: {formatWorkforce(Number(p.value))}</p>
                ))}
              </div>
            );
          }} />
          <Bar dataKey="Required" fill={AI_WORKFORCE_COLORS.required} radius={[2, 2, 0, 0]} />
          <Bar dataKey="Available" fill={AI_WORKFORCE_COLORS.available} radius={[2, 2, 0, 0]} />
          <Bar dataKey="Gap" fill={accent} radius={[2, 2, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

function adjustColor(hex: string, amount: number): string {
  const num = parseInt(hex.replace("#", ""), 16);
  const r = Math.min(255, ((num >> 16) & 0xff) + Math.round(255 * amount));
  const g = Math.min(255, ((num >> 8) & 0xff) + Math.round(255 * amount * 0.6));
  const b = Math.min(255, (num & 0xff) + Math.round(255 * amount * 0.3));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

export function BoardAnalyticsCard({
  dept,
  recommendations,
  accent,
  categoryAvgGapPct,
  onClick,
}: {
  dept: AiDepartmentRow;
  recommendations: AiRecommendation[];
  accent: string;
  categoryAvgGapPct: number;
  onClick: () => void;
}) {
  const deptRecs = recommendations.filter((r) => r.department === dept.name);
  const priorityMix = PRIORITIES.map((p) => ({
    p,
    count: deptRecs.filter((r) => r.priority === p).length,
    color: PRIORITY_COLORS[p],
  }));
  const fillRate = dept.required > 0 ? Math.round((dept.available / dept.required) * 100) : 0;
  const vsCategory = dept.avgGapPercent - categoryAvgGapPct;
  const miniBars = [
    { label: "Req", value: dept.required, color: AI_WORKFORCE_COLORS.required },
    { label: "Avail", value: dept.available, color: AI_WORKFORCE_COLORS.available },
    { label: "Gap", value: dept.gap, color: "#ff6b6b" },
  ];
  const maxBar = Math.max(...miniBars.map((b) => b.value), 1);

  return (
    <button
      type="button"
      onClick={onClick}
      className="bi-widget flex flex-col overflow-hidden text-left transition hover:shadow-widget-hover"
      style={{ borderTop: `3px solid ${accent}` }}
    >
      <div className="border-b border-bi-border/50 px-3 py-2.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="line-clamp-2 text-xs font-bold text-bi-title">{dept.name}</p>
            <p className="mt-0.5 text-[10px] text-bi-muted">{dept.count} projects</p>
          </div>
          <span
            className="shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold tabular-nums"
            style={{ backgroundColor: `${accent}18`, color: accent }}
          >
            {dept.avgGapPercent}% gap
          </span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-1 border-b border-bi-border/40 px-3 py-2">
        {miniBars.map((b) => (
          <div key={b.label} className="text-center">
            <p className="text-[8px] font-bold uppercase text-bi-muted">{b.label}</p>
            <p className="text-[11px] font-extrabold tabular-nums text-bi-title">{formatWorkforce(b.value)}</p>
          </div>
        ))}
      </div>

      <div className="px-3 py-2">
        <div className="mb-1 flex h-14 items-end gap-1">
          {miniBars.map((b) => (
            <div key={b.label} className="flex flex-1 flex-col items-center gap-0.5">
              <div
                className="w-full rounded-t-sm transition-all"
                style={{
                  height: `${Math.max(8, (b.value / maxBar) * 100)}%`,
                  backgroundColor: b.color,
                  opacity: b.label === "Gap" ? 1 : 0.85,
                }}
              />
              <span className="text-[8px] text-bi-muted">{b.label}</span>
            </div>
          ))}
        </div>

        <div className="mb-2">
          <div className="mb-0.5 flex justify-between text-[9px]">
            <span className="text-bi-muted">Capacity filled</span>
            <span className="font-bold tabular-nums text-bi-teal">{fillRate}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-bi-canvas">
            <div
              className="h-full rounded-full bg-bi-teal"
              style={{ width: `${Math.min(100, fillRate)}%` }}
            />
          </div>
        </div>

        <div className="mb-2 flex h-3 overflow-hidden rounded-full">
          {priorityMix.map(({ p, count, color }) =>
            count > 0 ? (
              <div
                key={p}
                title={`${p}: ${count}`}
                style={{
                  width: `${(count / deptRecs.length) * 100}%`,
                  backgroundColor: color,
                  minWidth: count > 0 ? 4 : 0,
                }}
              />
            ) : null
          )}
        </div>
        <div className="flex flex-wrap gap-1">
          {priorityMix
            .filter((x) => x.count > 0)
            .map(({ p, count, color }) => (
              <span
                key={p}
                className="rounded px-1.5 py-0.5 text-[8px] font-bold"
                style={{ backgroundColor: `${color}18`, color }}
              >
                {p.slice(0, 1)}:{count}
              </span>
            ))}
        </div>
      </div>

      <div className="mt-auto grid grid-cols-3 gap-1 border-t border-bi-border/40 bg-bi-canvas/40 px-3 py-2">
        <MetricChip label="Investment" value={formatBudgetCr(dept.budgetCr)} />
        <MetricChip label="Confidence" value={`${dept.avgConfidence}%`} />
        <MetricChip
          label="vs cluster"
          value={`${vsCategory >= 0 ? "+" : ""}${vsCategory.toFixed(0)}%`}
          highlight={vsCategory > 5}
        />
      </div>
    </button>
  );
}

function MetricChip({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="text-center">
      <p className="text-[8px] font-bold uppercase text-bi-muted">{label}</p>
      <p className={`text-[10px] font-extrabold tabular-nums ${highlight ? "text-bi-coral" : "text-bi-title"}`}>
        {value}
      </p>
    </div>
  );
}

export function BoardCategoryKpiStrip({
  category,
  accent,
}: {
  category: AiBoardCategoryRow;
  accent: string;
}) {
  const fillRate =
    category.required > 0 ? Math.round((category.required - category.gap) / category.required * 100) : 0;

  return (
    <div className="bi-widget shrink-0 px-4 py-3" style={{ borderLeft: `4px solid ${accent}` }}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-bi-title">{category.name}</h3>
          <p className="text-[11px] text-bi-muted">
            {category.count} projects · {category.departments.length} industries
          </p>
        </div>
        <div className="flex flex-wrap gap-4">
          <KpiPill label="Skill gap" value={formatWorkforce(category.gap)} color="#ff6b6b" />
          <KpiPill label="Vacancies" value={formatWorkforce(category.required)} color={AI_WORKFORCE_COLORS.required} />
          <KpiPill label="Investment" value={formatBudgetCr(category.budgetCr)} color="#6c5ce7" />
          <KpiPill label="Fill rate" value={`${fillRate}%`} color="#00a896" />
        </div>
      </div>
    </div>
  );
}

function KpiPill({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="text-center">
      <p className="text-[9px] font-bold uppercase text-bi-muted">{label}</p>
      <p className="text-sm font-extrabold tabular-nums" style={{ color }}>
        {value}
      </p>
    </div>
  );
}
