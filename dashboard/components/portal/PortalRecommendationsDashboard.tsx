"use client";

import { useEffect, useMemo, useState } from "react";
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
  AiRecommendationsSummary,
} from "@/lib/aiRecommendationsTypes";
import {
  formatBudgetCr,
  formatWorkforce,
  PRIORITY_COLORS,
  STATUS_COLORS,
} from "@/lib/aiRecommendationsApi";
import type { GrowthFacets } from "@/lib/portalGrowthFilters";
import {
  rowMatchesMasterSubSector,
  subSectorsForIndustry,
  recommendationMatchesState,
} from "@/lib/portalGrowthFilters";

const CHART_COLORS = ["#2563eb", "#f97316", "#10b981", "#8b5cf6", "#ec4899", "#06b6d4", "#64748b"];

interface RecommendationPanelFilters {
  industry: string;
  subSector: string;
  state: string;
  location: string;
  region: string;
}

const DEFAULT_PANEL_FILTERS: RecommendationPanelFilters = {
  industry: "",
  subSector: "",
  state: "",
  location: "",
  region: "",
};

interface Props {
  data: AiRecommendationsResponse;
  onOpenDetailed?: (filters?: Partial<AiRecommendationFilters>) => void;
  embedded?: boolean;
  /** Show recommendation list only — no duplicate chart grid (merged growth tab). */
  listOnly?: boolean;
  growthFacets?: GrowthFacets;
  /** Sync state filter from growth dashboard filter bar. */
  appliedState?: string;
}

interface DrillState {
  label: string;
  value: string;
  dimension: keyof AiRecommendationFilters;
  items: AiRecommendation[];
}

function parentSectorForRec(rec: AiRecommendation, facets?: GrowthFacets): string {
  if (!facets) return rec.department || "—";
  for (const parent of facets.industries) {
    const subs = facets.subSectorsByIndustry[parent] ?? [];
    if (
      subs.some((sub) =>
        rowMatchesMasterSubSector(rec as unknown as Record<string, unknown>, sub)
      )
    ) {
      return parent;
    }
  }
  return rec.department || "—";
}

function recommendationDetailMetrics(rec: AiRecommendation, facets?: GrowthFacets) {
  return [
    { l: "Vacancies", v: formatWorkforce(rec.requiredWorkforce) },
    { l: "Skill gap", v: `${formatWorkforce(rec.skillGap)} (${rec.gapPercent}%)` },
    { l: "Sector", v: parentSectorForRec(rec, facets) },
    { l: "Sub-sector", v: rec.subSector ?? rec.sector ?? "—" },
    { l: "Location", v: rec.location ?? "—" },
    { l: "Region", v: rec.region ?? "—" },
    { l: "Hiring", v: rec.hiringPeriod ?? rec.horizon },
    { l: "Skills", v: rec.keySkillsRequired ?? rec.actionType },
  ];
}

function filterRecommendationsByPanel(
  recs: AiRecommendation[],
  filters: RecommendationPanelFilters,
  facets?: GrowthFacets
): AiRecommendation[] {
  return recs.filter((rec) => {
    if (filters.industry && facets) {
      const subs = facets.subSectorsByIndustry[filters.industry] ?? [];
      if (
        !subs.some((sub) =>
          rowMatchesMasterSubSector(rec as unknown as Record<string, unknown>, sub)
        )
      ) {
        return false;
      }
    }
    if (
      filters.subSector &&
      !rowMatchesMasterSubSector(rec as unknown as Record<string, unknown>, filters.subSector)
    ) {
      return false;
    }
    if (filters.state && !recommendationMatchesState(rec, filters.state)) return false;
    if (filters.location && rec.location !== filters.location) return false;
    if (filters.region && rec.region !== filters.region) return false;
    return true;
  });
}

function RecommendationDetailCard({
  rec,
  facets,
}: {
  rec: AiRecommendation;
  facets?: GrowthFacets;
}) {
  return (
    <div className="rounded-xl border border-slate-100 bg-white p-4">
      <div className="flex flex-wrap gap-2">
        <span
          className="rounded-full px-2 py-0.5 text-[9px] font-bold uppercase"
          style={{
            backgroundColor: `${PRIORITY_COLORS[rec.priority] ?? "#64748b"}18`,
            color: PRIORITY_COLORS[rec.priority] ?? "#64748b",
          }}
        >
          {rec.priority}
        </span>
        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-bold uppercase text-emerald-700">
          {rec.status} confidence
        </span>
      </div>
      <h4 className="mt-2 text-sm font-bold text-slate-900">{rec.title}</h4>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {recommendationDetailMetrics(rec, facets).map((m) => (
          <div key={m.l} className="rounded-lg bg-slate-50 px-2.5 py-2">
            <p className="text-[9px] font-bold uppercase text-slate-500">{m.l}</p>
            <p className="text-xs font-semibold text-slate-800">{m.v}</p>
          </div>
        ))}
      </div>
      {rec.additionalInsights && (
        <p className="mt-3 text-xs leading-relaxed text-slate-600">{rec.additionalInsights}</p>
      )}
      {rec.sourceReference && (
        <p className="mt-2 text-[10px] text-slate-500">Source: {rec.sourceReference}</p>
      )}
      <SourceLink rec={rec} />
    </div>
  );
}

function SourceLink({ rec }: { rec: AiRecommendation }) {
  const url = rec.sourceUrl;
  if (!url) return null;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="portal-btn-primary mt-3 inline-flex items-center gap-1.5 text-xs"
      onClick={(e) => e.stopPropagation()}
    >
      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
      </svg>
      View details
      {rec.sourceLabel && (
        <span className="font-normal opacity-80">· {rec.sourceLabel}</span>
      )}
    </a>
  );
}

export default function PortalRecommendationsDashboard({
  data,
  onOpenDetailed,
  embedded,
  listOnly,
  growthFacets,
  appliedState = "",
}: Props) {
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
    <div className={embedded || listOnly ? "space-y-4" : "space-y-5 pb-6"}>
      {!embedded && !listOnly && (
      <div>
        <h2 className="text-lg font-bold text-slate-900">AI Recommendations &amp; Skill Gaps</h2>
        {data.meta.sources && (
          <p className="mt-1 text-xs text-slate-500">
            Authentic data from {Array.isArray(data.meta.sources) ? data.meta.sources.length : 1} official
            sources · {data.recommendations.length} projects
            {typeof data.meta.workbookProjects === "number" && (
              <> ({data.meta.workbookProjects} pipeline + vacancy gap analysis)</>
            )}
          </p>
        )}
      </div>
      )}

      {!embedded && !listOnly && (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Skill gap" value={formatWorkforce(s.totalSkillGap)} sub={`${s.avgGapPercent}% avg gap`} tone="orange" />
        <KpiCard label="Vacancies" value={formatWorkforce(s.totalRequired)} sub={`${formatWorkforce(s.totalAvailable)} est. ready`} tone="blue" />
        <KpiCard label="Investment" value={formatBudgetCr(s.totalBudgetCr)} sub={`${s.criticalCount} critical`} tone="green" />
        <KpiCard label="Confidence" value={`${s.avgConfidence}%`} sub={`Impact score ${s.avgImpact}`} tone="purple" />
      </div>
      )}

      {data.recommendations.length === 0 && (
        <div className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          No recommendations match the current filters. Try resetting or broadening your selection.
        </div>
      )}

      {listOnly ? (
        <RecommendationsListPanel
          recommendations={data.recommendations}
          selectedId={selectedId}
          onSelect={setSelectedId}
          summary={s}
          growthFacets={growthFacets}
          appliedState={appliedState}
        />
      ) : (
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
      )}

      {drill && !listOnly && (
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

            {selected ? <RecommendationDetailCard rec={selected} facets={growthFacets} /> : null}
          </div>
        </div>
      )}

      {onOpenDetailed && !embedded && !listOnly && (
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

function RecommendationsListPanel({
  recommendations,
  selectedId,
  onSelect,
  summary,
  growthFacets,
  appliedState = "",
}: {
  recommendations: AiRecommendation[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  summary: AiRecommendationsSummary;
  growthFacets?: GrowthFacets;
  appliedState?: string;
}) {
  const [panelFilters, setPanelFilters] = useState<RecommendationPanelFilters>({
    ...DEFAULT_PANEL_FILTERS,
    state: appliedState,
  });

  useEffect(() => {
    setPanelFilters((prev) => ({ ...prev, state: appliedState }));
  }, [appliedState]);

  const stateOptions = useMemo(() => {
    if (growthFacets?.states?.length) return growthFacets.states;
    return [...new Set(recommendations.map((r) => r.region).filter(Boolean))].sort((a, b) =>
      a.localeCompare(b)
    );
  }, [growthFacets, recommendations]);

  const locationOptions = useMemo(
    () =>
      [...new Set(recommendations.map((r) => r.location).filter(Boolean) as string[])].sort((a, b) =>
        a.localeCompare(b)
      ),
    [recommendations]
  );

  const regionOptions = useMemo(
    () =>
      [...new Set(recommendations.map((r) => r.region).filter(Boolean))].sort((a, b) =>
        a.localeCompare(b)
      ),
    [recommendations]
  );

  const subSectorOptions = useMemo(
    () => (growthFacets ? subSectorsForIndustry(growthFacets, panelFilters.industry) : []),
    [growthFacets, panelFilters.industry]
  );

  const filteredRecommendations = useMemo(
    () => filterRecommendationsByPanel(recommendations, panelFilters, growthFacets),
    [recommendations, panelFilters, growthFacets]
  );

  const visibleSelected =
    filteredRecommendations.find((r) => r.id === selectedId) ??
    filteredRecommendations[0] ??
    null;

  const panelActiveCount = Object.values(panelFilters).filter(Boolean).length;

  const handlePanelFilterChange = (next: Partial<RecommendationPanelFilters>) => {
    setPanelFilters((prev) => {
      const merged = { ...prev, ...next };
      if (next.industry !== undefined && next.industry !== prev.industry) {
        merged.subSector = "";
      }
      return merged;
    });
  };

  return (
    <div className="portal-panel overflow-hidden">
      <div className="portal-panel-header">
        <div>
          <h2 className="portal-panel-title">AI Recommendations &amp; Skill Gaps</h2>
          <p className="text-[10px] text-slate-500">
            {filteredRecommendations.length} of {recommendations.length} recommendation(s) ·{" "}
            {formatWorkforce(summary.totalSkillGap)} total gap · {summary.criticalCount} critical
          </p>
        </div>
      </div>

      <div className="border-b border-slate-100 px-3 py-3">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
            Filter recommendations
            {panelActiveCount > 0 && (
              <span className="ml-2 rounded-full bg-blue-100 px-2 py-0.5 text-[9px] font-bold text-blue-700">
                {panelActiveCount} active
              </span>
            )}
          </span>
          {panelActiveCount > 0 && (
            <button
              type="button"
              className="portal-btn-ghost text-[10px]"
              onClick={() => setPanelFilters(DEFAULT_PANEL_FILTERS)}
            >
              Reset
            </button>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <PanelSelect
            value={panelFilters.industry}
            onChange={(industry) => handlePanelFilterChange({ industry })}
            label="Sector"
            options={growthFacets?.industries ?? []}
          />
          <PanelSelect
            value={panelFilters.subSector}
            onChange={(subSector) => handlePanelFilterChange({ subSector })}
            label={panelFilters.industry ? "Sub-sector" : "Sub-sector (pick sector first)"}
            options={subSectorOptions}
            disabled={!panelFilters.industry}
          />
          <PanelSelect
            value={panelFilters.state}
            onChange={(state) => handlePanelFilterChange({ state })}
            label="State"
            options={stateOptions}
          />
          <PanelSelect
            value={panelFilters.location}
            onChange={(location) => handlePanelFilterChange({ location })}
            label="Location"
            options={locationOptions}
          />
          <PanelSelect
            value={panelFilters.region}
            onChange={(region) => handlePanelFilterChange({ region })}
            label="Region"
            options={regionOptions}
          />
        </div>
      </div>

      {filteredRecommendations.length === 0 ? (
        <p className="px-4 py-10 text-center text-sm text-slate-500">No recommendations for current filters.</p>
      ) : (
        <div className="grid gap-4 p-3 xl:grid-cols-[1fr_1.2fr]">
          <div className="max-h-[420px] overflow-y-auto rounded-xl border border-slate-100 bg-white">
            {filteredRecommendations.map((rec) => (
              <button
                key={rec.id}
                type="button"
                onClick={() => onSelect(rec.id)}
                className={`flex w-full gap-2 border-b border-slate-100 px-3 py-2.5 text-left last:border-b-0 ${
                  visibleSelected?.id === rec.id ? "bg-blue-50" : "hover:bg-slate-50"
                }`}
              >
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-xs font-bold text-slate-900">{rec.title}</p>
                  <p className="mt-0.5 text-[10px] text-slate-500">
                    {rec.sector} · {rec.location ?? rec.region}
                  </p>
                </div>
                <span
                  className="shrink-0 self-start rounded-full px-2 py-0.5 text-[9px] font-bold uppercase"
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

          {visibleSelected ? (
            <RecommendationDetailCard rec={visibleSelected} facets={growthFacets} />
          ) : null}
        </div>
      )}
    </div>
  );
}

function PanelSelect({
  value,
  onChange,
  label,
  options,
  disabled,
}: {
  value: string;
  onChange: (value: string) => void;
  label: string;
  options: string[];
  disabled?: boolean;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="portal-select min-w-[130px] disabled:cursor-not-allowed disabled:opacity-50"
      aria-label={label}
      disabled={disabled}
    >
      <option value="">{label}</option>
      {options.map((opt) => (
        <option key={opt} value={opt} title={opt}>
          {opt.length > 42 ? `${opt.slice(0, 41)}…` : opt}
        </option>
      ))}
    </select>
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
