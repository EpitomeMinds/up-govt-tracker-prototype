"use client";

import { useMemo, useState } from "react";
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
import type {
  AiRecommendation,
  AiRecommendationFilters,
  AiRecommendationsResponse,
} from "@/lib/aiRecommendationsTypes";
import {
  formatBudgetCr,
  formatWorkforce,
  PRIORITY_COLORS,
  STATUS_COLORS,
} from "@/lib/aiRecommendationsApi";

const CHART_COLORS = ["#2563eb", "#f97316", "#10b981", "#8b5cf6", "#ec4899", "#06b6d4", "#64748b"];

interface Props {
  data: AiRecommendationsResponse;
  onOpenDetailed?: (filters?: Partial<AiRecommendationFilters>) => void;
}

interface DrillState {
  label: string;
  value: string;
  dimension: keyof AiRecommendationFilters;
  items: AiRecommendation[];
}

export default function PortalRecommendationsDashboard({ data, onOpenDetailed }: Props) {
  const [drill, setDrill] = useState<DrillState | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const s = data.summary;

  const priorityData = useMemo(
    () =>
      s.byPriority
        .filter((p) => p.count > 0)
        .map((p) => ({
          name: p.name,
          required: p.required,
          gap: p.gap,
          fill: PRIORITY_COLORS[p.name] ?? "#64748b",
        })),
    [s.byPriority]
  );

  const sectorData = useMemo(
    () =>
      [...s.bySector]
        .sort((a, b) => b.gap - a.gap)
        .slice(0, 10)
        .map((row) => ({
          name: row.name.length > 18 ? `${row.name.slice(0, 17)}…` : row.name,
          fullName: row.name,
          gap: row.gap,
        })),
    [s.bySector]
  );

  const yearData = useMemo(
    () =>
      [...s.byStartYear]
        .sort((a, b) => Number(a.name) - Number(b.name))
        .map((y) => ({ year: y.name, gap: y.gap })),
    [s.byStartYear]
  );

  const skillData = useMemo(
    () =>
      s.byActionType.map((a, i) => ({
        name: a.name,
        value: a.count,
        fill: CHART_COLORS[i % CHART_COLORS.length],
      })),
    [s.byActionType]
  );

  const confidenceData = useMemo(
    () =>
      s.byStatus.map((row, i) => ({
        name: row.name,
        value: row.count,
        fill: STATUS_COLORS[row.name] ?? CHART_COLORS[i % CHART_COLORS.length],
      })),
    [s.byStatus]
  );

  const drillItems = drill?.items ?? [];
  const selected =
    drillItems.find((r) => r.id === selectedId) ?? drillItems[0] ?? null;

  const openDrill = (
    label: string,
    value: string,
    dimension: keyof AiRecommendationFilters,
    items: AiRecommendation[]
  ) => {
    setDrill({ label, value, dimension, items });
    setSelectedId(items[0]?.id ?? null);
  };

  const handlePriorityClick = (priority: string) => {
    const items = data.recommendations.filter((r) => r.priority === priority);
    openDrill("Priority", priority, "priority", items);
  };

  const handleSectorClick = (sector: string) => {
    const items = data.recommendations.filter((r) => r.sector === sector);
    openDrill("Industry", sector, "sector", items);
  };

  const handleYearClick = (year: string) => {
    const items = data.recommendations.filter((r) => String(r.startYear) === year);
    openDrill("Start year", year, "startYear", items);
  };

  const handleSkillClick = (skill: string) => {
    const items = data.recommendations.filter((r) => r.actionType === skill);
    openDrill("Skill type", skill, "actionType", items);
  };

  const handleConfidenceClick = (status: string) => {
    const items = data.recommendations.filter((r) => r.status === status);
    openDrill("Confidence", status, "status", items);
  };

  return (
    <div className="space-y-5 pb-6">
      <div>
        <h2 className="text-lg font-bold text-slate-900">AI Recommendations &amp; Skill Gaps</h2>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Skill gap" value={formatWorkforce(s.totalSkillGap)} sub={`${s.avgGapPercent}% avg gap`} tone="orange" />
        <KpiCard label="Vacancies" value={formatWorkforce(s.totalRequired)} sub={`${formatWorkforce(s.totalAvailable)} est. ready`} tone="blue" />
        <KpiCard label="Investment" value={formatBudgetCr(s.totalBudgetCr)} sub={`${s.criticalCount} critical`} tone="green" />
        <KpiCard label="Confidence" value={`${s.avgConfidence}%`} sub={`Impact score ${s.avgImpact}`} tone="purple" />
      </div>

      {data.recommendations.length === 0 && (
        <div className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          No projects match the current filters. Try resetting or broadening your selection.
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-2">
        <ChartPanel title="Skill gap by priority" hint="Click a bar → project list">
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <BarChart data={priorityData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#64748b" }} />
              <YAxis tick={{ fontSize: 10, fill: "#64748b" }} tickFormatter={formatWorkforce} />
              <Tooltip formatter={(v: number) => [formatWorkforce(v), ""]} />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              <Bar
                dataKey="required"
                name="Required"
                fill="#2563eb"
                radius={[4, 4, 0, 0]}
                cursor="pointer"
                onClick={(d) => {
                  const name = String((d as { name?: string }).name ?? "");
                  if (name) handlePriorityClick(name);
                }}
              />
              <Bar dataKey="gap" name="Gap" fill="#f97316" radius={[4, 4, 0, 0]} cursor="pointer" onClick={(d) => {
                const name = String((d as { name?: string }).name ?? "");
                if (name) handlePriorityClick(name);
              }} />
            </BarChart>
          </ResponsiveContainer>
        </ChartPanel>

        <ChartPanel title="Skill gap by industry" hint="Top 10 industries · click bar">
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <BarChart data={sectorData} layout="vertical" margin={{ left: 8, right: 16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={formatWorkforce} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 9 }} width={120} />
              <Tooltip formatter={(v: number) => [formatWorkforce(v), "Gap"]} />
              <Bar
                dataKey="gap"
                fill="#b45309"
                radius={[0, 6, 6, 0]}
                cursor="pointer"
                onClick={(d) => {
                  const full = String((d as { fullName?: string; payload?: { fullName?: string } }).fullName ?? (d as { payload?: { fullName?: string } }).payload?.fullName ?? "");
                  if (full) handleSectorClick(full);
                }}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartPanel>

        <ChartPanel title="Gap trend by start year" hint="Click a point → year projects">
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <LineChart data={yearData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="year" tick={{ fontSize: 10, fill: "#64748b" }} />
              <YAxis tick={{ fontSize: 10, fill: "#64748b" }} tickFormatter={formatWorkforce} />
              <Tooltip formatter={(v: number) => [formatWorkforce(v), "Gap"]} />
              <Line
                type="monotone"
                dataKey="gap"
                stroke="#10b981"
                strokeWidth={2.5}
                dot={{ r: 4, fill: "#10b981", cursor: "pointer" }}
                activeDot={{
                  r: 6,
                  cursor: "pointer",
                  onClick: (_e, payload) => {
                    const year = String((payload as { payload?: { year?: string } }).payload?.year ?? "");
                    if (year) handleYearClick(year);
                  },
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartPanel>

        <div className="grid gap-4 sm:grid-cols-2">
          <ChartPanel title="Projects by skill type" hint="Click slice">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <PieChart>
                <Pie
                  data={skillData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius="40%"
                  outerRadius="70%"
                  paddingAngle={2}
                  cursor="pointer"
                  onClick={(_, i) => {
                    const item = skillData[i];
                    if (item) handleSkillClick(item.name);
                  }}
                >
                  {skillData.map((e) => (
                    <Cell key={e.name} fill={e.fill} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 9 }} />
              </PieChart>
            </ResponsiveContainer>
          </ChartPanel>

          <ChartPanel title="Confidence mix" hint="Click slice">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <PieChart>
                <Pie
                  data={confidenceData}
                  dataKey="value"
                  nameKey="name"
                  outerRadius="70%"
                  paddingAngle={2}
                  cursor="pointer"
                  onClick={(_, i) => {
                    const item = confidenceData[i];
                    if (item) handleConfidenceClick(item.name);
                  }}
                >
                  {confidenceData.map((e) => (
                    <Cell key={e.name} fill={e.fill} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 9 }} />
              </PieChart>
            </ResponsiveContainer>
          </ChartPanel>
        </div>
      </div>

      {drill && (
        <div className="rounded-xl border border-blue-100 bg-blue-50/40 p-4 drill-down-enter">
          <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wide text-blue-700">Recommendation drill-down</p>
              <h3 className="mt-0.5 text-base font-bold text-slate-900">
                {drill.label}: {drill.value}
              </h3>
              <p className="text-xs text-slate-500">{drill.items.length} matching project(s)</p>
            </div>
            <button type="button" className="portal-btn-ghost text-xs" onClick={() => setDrill(null)}>
              Clear drill-down
            </button>
          </div>

          <div className="mb-3 grid gap-2 sm:grid-cols-4">
            <Metric label="Projects" value={String(drill.items.length)} />
            <Metric
              label="Total gap"
              value={formatWorkforce(drill.items.reduce((sum, r) => sum + r.skillGap, 0))}
            />
            <Metric
              label="Investment"
              value={formatBudgetCr(drill.items.reduce((sum, r) => sum + r.budgetCr, 0))}
            />
            <Metric
              label="Avg confidence"
              value={`${Math.round(drill.items.reduce((sum, r) => sum + r.aiConfidence, 0) / Math.max(drill.items.length, 1))}%`}
            />
          </div>

          <div className="grid gap-4 xl:grid-cols-[1fr_1.2fr]">
            <div className="max-h-[360px] overflow-y-auto rounded-xl border border-slate-100 bg-white">
              {drill.items.map((rec) => (
                <button
                  key={rec.id}
                  type="button"
                  onClick={() => setSelectedId(rec.id)}
                  className={`flex w-full gap-2 border-b border-slate-100 px-3 py-2.5 text-left ${
                    selected?.id === rec.id ? "bg-blue-50" : "hover:bg-slate-50"
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-xs font-bold text-slate-900">{rec.title}</p>
                    <p className="mt-0.5 text-[10px] text-slate-500">{rec.location ?? rec.region}</p>
                  </div>
                  <span
                    className="shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase"
                    style={{
                      backgroundColor: `${PRIORITY_COLORS[rec.priority] ?? "#64748b"}18`,
                      color: PRIORITY_COLORS[rec.priority] ?? "#64748b",
                    }}
                  >
                    {rec.priority}
                  </span>
                </button>
              ))}
            </div>

            {selected ? (
              <div className="rounded-xl border border-slate-100 bg-white p-4">
                <div className="flex flex-wrap gap-2">
                  <span
                    className="rounded-full px-2 py-0.5 text-[9px] font-bold uppercase"
                    style={{
                      backgroundColor: `${PRIORITY_COLORS[selected.priority] ?? "#64748b"}18`,
                      color: PRIORITY_COLORS[selected.priority] ?? "#64748b",
                    }}
                  >
                    {selected.priority}
                  </span>
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-bold uppercase text-emerald-700">
                    {selected.status} confidence
                  </span>
                </div>
                <h4 className="mt-2 text-sm font-bold text-slate-900">{selected.title}</h4>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {[
                    { l: "Vacancies", v: formatWorkforce(selected.requiredWorkforce) },
                    { l: "Skill gap", v: `${formatWorkforce(selected.skillGap)} (${selected.gapPercent}%)` },
                    { l: "Investment", v: formatBudgetCr(selected.budgetCr) },
                    { l: "Hiring", v: selected.hiringPeriod ?? selected.horizon },
                    { l: "Location", v: selected.location ?? selected.region },
                    { l: "Skills", v: selected.keySkillsRequired ?? selected.actionType },
                  ].map((m) => (
                    <div key={m.l} className="rounded-lg bg-slate-50 px-2.5 py-2">
                      <p className="text-[9px] font-bold uppercase text-slate-500">{m.l}</p>
                      <p className="text-xs font-semibold text-slate-800">{m.v}</p>
                    </div>
                  ))}
                </div>
                {selected.additionalInsights && (
                  <p className="mt-3 text-xs leading-relaxed text-slate-600">{selected.additionalInsights}</p>
                )}
              </div>
            ) : null}
          </div>
        </div>
      )}

      {onOpenDetailed && (
        <button
          type="button"
          onClick={() => onOpenDetailed(drill ? { [drill.dimension]: drill.value } : undefined)}
          className="portal-btn-primary portal-btn-blinker w-full justify-center py-3"
        >
          Open full recommendations analysis
        </button>
      )}
    </div>
  );
}

function ChartPanel({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="portal-panel">
      <div className="portal-panel-header">
        <div>
          <h2 className="portal-panel-title">{title}</h2>
          {hint && <p className="text-[10px] text-slate-500">{hint}</p>}
        </div>
      </div>
      <div className="h-[260px] px-2 pb-4">{children}</div>
    </div>
  );
}

function KpiCard({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string;
  sub: string;
  tone: "orange" | "blue" | "green" | "purple";
}) {
  const tones = {
    orange: "portal-growth-kpi-orange",
    blue: "portal-growth-kpi-blue",
    green: "portal-growth-kpi-green",
    purple: "portal-growth-kpi-purple",
  };
  return (
    <div className={`portal-growth-kpi ${tones[tone]}`}>
      <p className="text-sm font-medium opacity-90">{label}</p>
      <p className="mt-1 text-2xl font-bold tracking-tight">{value}</p>
      <p className="mt-1 text-xs font-medium opacity-80">{sub}</p>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/80 bg-white px-3 py-2">
      <p className="text-[10px] font-bold uppercase text-slate-500">{label}</p>
      <p className="mt-0.5 text-lg font-extrabold tabular-nums text-slate-900">{value}</p>
    </div>
  );
}
