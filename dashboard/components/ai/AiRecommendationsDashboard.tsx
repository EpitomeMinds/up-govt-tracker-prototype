"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
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
import KpiCard from "@/components/KpiCard";
import ChartCard from "@/components/charts/ChartCard";
import { PIE_PALETTE } from "@/lib/chartTheme";

interface Props {
  data: AiRecommendationsResponse;
  onFilterChange: (next: Partial<AiRecommendationFilters>) => void;
  selectedId: number | null;
  onSelect: (id: number | null) => void;
  drillSector: string | null;
  onDrillSector: (sector: string | null) => void;
}

export default function AiRecommendationsDashboard({
  data,
  onFilterChange,
  selectedId,
  onSelect,
  drillSector,
  onDrillSector,
}: Props) {
  const selected =
    data.recommendations.find((r) => r.id === selectedId) ??
    data.recommendations[0] ??
    null;

  const sectorDrill = drillSector
    ? data.summary.bySector.find((s) => s.name === drillSector)
    : null;

  const priorityPie = data.summary.byPriority
    .filter((p) => p.count > 0)
    .map((p) => ({
      name: p.name,
      value: p.count,
      fill: PRIORITY_COLORS[p.name] || "#64748b",
    }));

  const sectorBar = data.summary.bySector.slice(0, 12).map((s) => ({
    name: s.name.length > 14 ? `${s.name.slice(0, 13)}…` : s.name,
    fullName: s.name,
    gap: s.gap,
    required: s.required,
  }));

  const regionBar = data.summary.byRegion.slice(0, 10).map((r) => ({
    name: r.name,
    gap: r.gap,
    required: r.required,
  }));

  const yearBar = data.summary.byStartYear.map((y) => ({
    name: String(y.name),
    gap: y.gap,
    count: y.count,
    budget: y.budgetCr,
  }));

  const scatterData = data.recommendations.slice(0, 80).map((r) => ({
    id: r.id,
    x: r.aiConfidence,
    y: r.impactScore,
    z: r.skillGap,
    name: r.title,
    priority: r.priority,
  }));

  return (
    <div className="space-y-5 pb-8">
      <header className="bi-zone-header">
        <span className="bi-zone-badge mb-2 inline-block">UP Workforce Intelligence</span>
        <h2 className="bi-zone-title">AI Recommendations Dashboard</h2>
        <p className="bi-zone-desc">
          {data.meta.totalRecords} workforce recommendations across {data.summary.sectorCount}{" "}
          sectors and {data.summary.regionCount} regions — sourced from{" "}
          <span className="font-medium text-bi-title">{data.meta.source}</span>
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <KpiCard
          label="Recommendations"
          value={String(data.summary.totalRecommendations)}
          delta={`${data.summary.criticalCount} critical priority`}
          accent="blue"
          icon={<IconChart />}
        />
        <KpiCard
          label="Workforce required"
          value={formatWorkforce(data.summary.totalRequired)}
          delta={`${formatWorkforce(data.summary.totalAvailable)} available`}
          accent="teal"
          icon={<IconUsers />}
        />
        <KpiCard
          label="Skill gap"
          value={formatWorkforce(data.summary.totalSkillGap)}
          delta={`${data.summary.avgGapPercent}% avg gap`}
          accent="coral"
          icon={<IconGap />}
        />
        <KpiCard
          label="Total budget"
          value={formatBudgetCr(data.summary.totalBudgetCr)}
          delta="Across all initiatives"
          accent="violet"
          icon={<IconBudget />}
        />
        <KpiCard
          label="AI confidence"
          value={`${data.summary.avgConfidence}%`}
          delta="Model certainty score"
          accent="amber"
          icon={<IconAi />}
        />
        <KpiCard
          label="Impact score"
          value={String(data.summary.avgImpact)}
          delta="Avg expected impact"
          accent="slate"
          icon={<IconImpact />}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-12">
        <div className="xl:col-span-4">
          <RecommendationList
            items={data.recommendations}
            selectedId={selected?.id ?? null}
            onSelect={onSelect}
          />
        </div>
        <div className="xl:col-span-8">
          {sectorDrill ? (
            <SectorDrillPanel
              sector={sectorDrill}
              items={data.recommendations.filter((r) => r.sector === drillSector)}
              onClose={() => onDrillSector(null)}
              onSelect={onSelect}
            />
          ) : selected ? (
            <RecommendationDetail rec={selected} onDrillSector={onDrillSector} />
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        <ChartCard title="By priority" height={260}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={priorityPie}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius="45%"
                outerRadius="70%"
                paddingAngle={2}
                cursor="pointer"
                onClick={(_, i) => {
                  const p = priorityPie[i];
                  if (p) onFilterChange({ priority: p.name });
                }}
              >
                {priorityPie.map((e) => (
                  <Cell key={e.name} fill={e.fill} />
                ))}
              </Pie>
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 10 }} iconSize={8} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Skill gap by sector"
          height={260}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={sectorBar} layout="vertical" margin={{ left: 4, right: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e8ebf2" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 9 }} tickFormatter={formatWorkforce} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 9 }} width={90} />
              <Tooltip
                formatter={(v: number) => [formatWorkforce(v), "Skill gap"]}
                labelFormatter={(_, p) => (p?.[0]?.payload as { fullName?: string })?.fullName}
              />
              <Bar
                dataKey="gap"
                fill="#0078e8"
                radius={[0, 4, 4, 0]}
                cursor="pointer"
                onClick={(d) => {
                  const payload = d as { fullName?: string; payload?: { fullName?: string } };
                  const name = payload.fullName ?? payload.payload?.fullName;
                  if (name) onDrillSector(String(name));
                }}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="By region" height={260}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={regionBar}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e8ebf2" />
              <XAxis dataKey="name" tick={{ fontSize: 9 }} angle={-25} textAnchor="end" height={50} />
              <YAxis tick={{ fontSize: 9 }} tickFormatter={formatWorkforce} />
              <Tooltip formatter={(v: number) => [formatWorkforce(v), "Required"]} />
              <Bar
                dataKey="required"
                fill="#6c5ce7"
                radius={[4, 4, 0, 0]}
                cursor="pointer"
                onClick={(d) => {
                  const name = d?.name ?? d?.payload?.name;
                  if (name) onFilterChange({ region: String(name) });
                }}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Start year pipeline" height={260}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={yearBar}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e8ebf2" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 9 }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              <Bar
                dataKey="count"
                name="Initiatives"
                fill="#0078e8"
                radius={[4, 4, 0, 0]}
                cursor="pointer"
                onClick={(d) => {
                  const y = d?.name ?? d?.payload?.name;
                  if (y) onFilterChange({ startYear: String(y) });
                }}
              />
              <Bar dataKey="budget" name="Budget (Cr)" fill="#f5a623" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Action types" height={260}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data.summary.byActionType.slice(0, 8)}
              layout="vertical"
              margin={{ left: 4 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e8ebf2" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 9 }} />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 8 }}
                width={100}
              />
              <Tooltip />
              <Bar
                dataKey="count"
                cursor="pointer"
                radius={[0, 4, 4, 0]}
                onClick={(d) => {
                  const name = d?.name ?? d?.payload?.name;
                  if (name) onFilterChange({ actionType: String(name) });
                }}
              >
                {data.summary.byActionType.slice(0, 8).map((_, i) => (
                  <Cell key={i} fill={PIE_PALETTE[i % PIE_PALETTE.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Confidence vs impact"
          height={260}
        >
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e8ebf2" />
              <XAxis
                type="number"
                dataKey="x"
                name="Confidence"
                domain={[40, 100]}
                tick={{ fontSize: 9 }}
                label={{ value: "AI Confidence %", position: "bottom", fontSize: 9, offset: -4 }}
              />
              <YAxis
                type="number"
                dataKey="y"
                name="Impact"
                domain={[40, 100]}
                tick={{ fontSize: 9 }}
                label={{ value: "Impact", angle: -90, position: "insideLeft", fontSize: 9 }}
              />
              <ZAxis type="number" dataKey="z" range={[20, 400]} />
              <Tooltip
                cursor={{ strokeDasharray: "3 3" }}
                content={({ payload }) => {
                  if (!payload?.[0]) return null;
                  const p = payload[0].payload as (typeof scatterData)[0];
                  return (
                    <div className="rounded-lg border border-bi-border bg-white px-3 py-2 text-xs shadow-widget">
                      <p className="max-w-[180px] font-semibold text-bi-title">{p.name}</p>
                      <p className="text-bi-muted">
                        Confidence {p.x}% · Impact {p.y} · Gap {formatWorkforce(p.z)}
                      </p>
                    </div>
                  );
                }}
              />
              <Scatter
                data={scatterData}
                cursor="pointer"
                onClick={(d) => {
                  const payload = d as { id?: number; payload?: { id?: number } };
                  const id = payload.id ?? payload.payload?.id;
                  if (id) onSelect(Number(id));
                }}
              >
                {scatterData.map((entry) => (
                  <Cell
                    key={entry.id}
                    fill={PRIORITY_COLORS[entry.priority] || "#64748b"}
                    fillOpacity={0.75}
                  />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <StatusBreakdown byStatus={data.summary.byStatus} onFilter={onFilterChange} />
    </div>
  );
}

function RecommendationList({
  items,
  selectedId,
  onSelect,
}: {
  items: AiRecommendation[];
  selectedId: number | null;
  onSelect: (id: number) => void;
}) {
  return (
    <div className="bi-widget flex max-h-[560px] flex-col overflow-hidden">
      <div className="bi-widget-header shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <span className="bi-widget-dot" />
            <h3 className="bi-widget-title">Recommendations</h3>
          </div>
        </div>
      </div>
      <div className="overflow-y-auto">
        {items.map((rec) => (
          <button
            key={rec.id}
            type="button"
            onClick={() => onSelect(rec.id)}
            className={`flex w-full gap-3 border-b border-bi-border/50 px-4 py-3 text-left transition ${
              selectedId === rec.id ? "bg-bi-accentSoft" : "hover:bg-bi-canvas/80"
            }`}
          >
            <div
              className="mt-1 h-8 w-1 shrink-0 rounded-full"
              style={{ backgroundColor: PRIORITY_COLORS[rec.priority] }}
            />
            <div className="min-w-0 flex-1">
              <p className="line-clamp-2 text-xs font-bold text-bi-title">{rec.title}</p>
              <p className="mt-0.5 text-[10px] text-bi-muted">
                {rec.sector} · {rec.region}
              </p>
              <div className="mt-1.5 flex flex-wrap gap-1">
                <Badge label={rec.priority} color={PRIORITY_COLORS[rec.priority]} />
                <Badge label={rec.status} color={STATUS_COLORS[rec.status] || "#8b95ad"} />
              </div>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-xs font-bold tabular-nums text-bi-coral">
                {formatWorkforce(rec.skillGap)}
              </p>
              <p className="text-[9px] text-bi-muted">gap</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function RecommendationDetail({
  rec,
  onDrillSector,
}: {
  rec: AiRecommendation;
  onDrillSector: (s: string) => void;
}) {
  return (
    <div className="bi-widget overflow-hidden">
      <div className="bi-widget-header">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge label={rec.priority} color={PRIORITY_COLORS[rec.priority]} />
            <Badge label={rec.status} color={STATUS_COLORS[rec.status] || "#8b95ad"} />
          </div>
          <h3 className="bi-widget-title mt-2">{rec.title}</h3>
        </div>
      </div>
      <div className="space-y-4 p-5">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Required", value: formatWorkforce(rec.requiredWorkforce) },
            { label: "Available", value: formatWorkforce(rec.currentlyAvailable) },
            { label: "Skill gap", value: `${formatWorkforce(rec.skillGap)} (${rec.gapPercent}%)` },
            { label: "Budget", value: formatBudgetCr(rec.budgetCr) },
            { label: "Duration", value: `${rec.durationMonths} months` },
            { label: "Start year", value: String(rec.startYear) },
            { label: "AI confidence", value: `${rec.aiConfidence}%` },
            { label: "Impact score", value: String(rec.impactScore) },
          ].map((m) => (
            <div key={m.label} className="rounded-lg bg-bi-canvas/80 px-3 py-2.5">
              <p className="text-[9px] font-bold uppercase tracking-wide text-bi-muted">
                {m.label}
              </p>
              <p className="mt-0.5 text-sm font-extrabold tabular-nums text-bi-title">
                {m.value}
              </p>
            </div>
          ))}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <InfoRow label="Sector">
            <button
              type="button"
              className="font-semibold text-bi-accent hover:underline"
              onClick={() => onDrillSector(rec.sector)}
            >
              {rec.sector} →
            </button>
          </InfoRow>
          <InfoRow label="Region">{rec.region}</InfoRow>
          <InfoRow label="Action type">{rec.actionType}</InfoRow>
          <InfoRow label="Institutions">{rec.institutionsInvolved}</InfoRow>
        </div>

        <div className="rounded-xl border border-bi-accent/20 bg-gradient-to-br from-bi-accentSoft/80 to-white p-4">
          <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-bi-accent">
            Initiative summary
          </p>
          <p className="text-sm leading-relaxed text-bi-label">
            {rec.actionType} initiative under {rec.department} targeting{" "}
            {formatWorkforce(rec.skillGap)} workforce gap in {rec.sector} ({rec.region}). Planned
            for {rec.horizon} with {rec.institutionsInvolved} institutions involved. AI model
            confidence: {rec.aiConfidence}%, expected impact: {rec.impactScore}/100.
          </p>
        </div>
      </div>
    </div>
  );
}

function SectorDrillPanel({
  sector,
  items,
  onClose,
  onSelect,
}: {
  sector: { name: string; count: number; required: number; gap: number; budgetCr: number; avgConfidence: number };
  items: AiRecommendation[];
  onClose: () => void;
  onSelect: (id: number) => void;
}) {
  return (
    <div className="bi-widget overflow-hidden">
      <div className="bi-widget-header">
        <div>
          <h3 className="bi-widget-title">{sector.name}</h3>
        </div>
        <button type="button" className="btn-ghost" onClick={onClose}>
          Close
        </button>
      </div>
      <div className="grid grid-cols-4 gap-2 border-b border-bi-border p-4">
        {[
          { l: "Required", v: formatWorkforce(sector.required) },
          { l: "Gap", v: formatWorkforce(sector.gap) },
          { l: "Budget", v: formatBudgetCr(sector.budgetCr) },
          { l: "Confidence", v: `${sector.avgConfidence}%` },
        ].map((x) => (
          <div key={x.l} className="rounded-lg bg-bi-canvas px-2 py-2 text-center">
            <p className="text-[9px] text-bi-muted">{x.l}</p>
            <p className="text-sm font-bold text-bi-title">{x.v}</p>
          </div>
        ))}
      </div>
      <div className="max-h-[360px] overflow-y-auto">
        {items.map((rec) => (
          <button
            key={rec.id}
            type="button"
            onClick={() => onSelect(rec.id)}
            className="flex w-full items-center justify-between border-b border-bi-border/40 px-4 py-2.5 text-left hover:bg-bi-canvas/80"
          >
            <div className="min-w-0 pr-3">
              <p className="truncate text-xs font-semibold text-bi-title">{rec.title}</p>
              <p className="text-[10px] text-bi-muted">
                {rec.region} · {rec.priority} · {rec.status}
              </p>
            </div>
            <span className="shrink-0 text-xs font-bold text-bi-coral">
              {formatWorkforce(rec.skillGap)}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function StatusBreakdown({
  byStatus,
  onFilter,
}: {
  byStatus: AiRecommendationsResponse["summary"]["byStatus"];
  onFilter: (f: Partial<AiRecommendationFilters>) => void;
}) {
  return (
    <div className="bi-widget p-4">
      <p className="mb-3 text-xs font-bold uppercase tracking-wide text-bi-muted">
        Status pipeline
      </p>
      <div className="flex flex-wrap gap-2">
        {byStatus.map((s) => (
          <button
            key={s.name}
            type="button"
            onClick={() => onFilter({ status: s.name })}
            className="flex items-center gap-2 rounded-lg border border-bi-border bg-white px-3 py-2 transition hover:border-bi-accent/40 hover:bg-bi-accentSoft/30"
          >
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: STATUS_COLORS[s.name] || "#8b95ad" }}
            />
            <span className="text-xs font-semibold text-bi-title">{s.name}</span>
            <span className="text-xs tabular-nums text-bi-muted">{s.count}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span
      className="rounded-full px-2 py-0.5 text-[9px] font-bold uppercase"
      style={{ backgroundColor: `${color}18`, color }}
    >
      {label}
    </span>
  );
}

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg bg-bi-canvas/60 px-3 py-2">
      <p className="text-[9px] font-bold uppercase text-bi-muted">{label}</p>
      <p className="text-sm font-medium text-bi-title">{children}</p>
    </div>
  );
}

function IconChart() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  );
}
function IconUsers() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}
function IconGap() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  );
}
function IconBudget() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}
function IconAi() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
  );
}
function IconImpact() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  );
}
