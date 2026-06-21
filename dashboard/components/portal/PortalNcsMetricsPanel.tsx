"use client";

import { useCallback, useMemo, useState } from "react";
import type { NcsRanking, NcsStats } from "@/lib/ncsJobTypes";
import type { NcsDashboardFilters } from "@/lib/ncsJobTypes";
import { formatCount } from "@/lib/jobAnalytics";
import NcsDrillChartFrame from "./NcsDrillChartFrame";
import { NCS_FRAME_IDS } from "@/lib/ncsAnalyticsTypes";
import type { NcsAnalyticsDimension, NcsAnalyticsFilter, NcsFrameId } from "@/lib/ncsAnalyticsTypes";
import {
  clearDrillDimensionPatch,
  clearDrillStackDashboardPatch,
  drillDimensionToDashboardPatch,
  hasNcsScopeFilters,
  NCS_GLOBAL_DRILL_DIMENSIONS,
  ncsDashboardToScopeFilters,
} from "@/lib/ncsAnalyticsFilters";

const FRAME_LABELS: Record<
  (typeof NCS_FRAME_IDS)[number],
  { title: string; hint: string }
> = {
  employers: { title: "Top 5 employers", hint: "Employer → sectors → cities" },
  employment: { title: "Top 5 industry sectors", hint: "Manufacturing → sub-sector → role → openings" },
  salary: { title: "Compensation", hint: "Click salary band → sectors → cities" },
  experience: { title: "Experience", hint: "Click level → sectors → job types" },
};

interface Props {
  stats: NcsStats | null;
  matchTotal?: number;
  appliedFilters: NcsDashboardFilters;
  onApplyDrillFilter?: (patch: Partial<NcsDashboardFilters>) => void;
}

export default function PortalNcsMetricsPanel({
  stats,
  matchTotal,
  appliedFilters,
  onApplyDrillFilter,
}: Props) {
  const [frameDrillFilters, setFrameDrillFilters] = useState<
    Partial<Record<NcsFrameId, NcsAnalyticsFilter[]>>
  >({});

  const scopeFilters = useMemo(
    () => ncsDashboardToScopeFilters(appliedFilters),
    [appliedFilters]
  );

  const handleDrill = useCallback(
    (frameId: NcsFrameId, dimension: string, value: string) => {
      const dim = dimension as NcsAnalyticsDimension;
      const entry: NcsAnalyticsFilter = { dimension: dim, value };

      setFrameDrillFilters((prev) => ({
        ...prev,
        [frameId]: [...(prev[frameId] ?? []), entry],
      }));

      if (NCS_GLOBAL_DRILL_DIMENSIONS.has(dim) || dim === "functionalRole" || dim === "jobTitle") {
        onApplyDrillFilter?.(drillDimensionToDashboardPatch(dim, value));
      }
    },
    [onApplyDrillFilter]
  );

  const handleDrillBack = useCallback(
    (frameId: NcsFrameId) => {
      const local = frameDrillFilters[frameId] ?? [];
      if (local.length === 0) return;

      const removed = local[local.length - 1];
      const next = local.slice(0, -1);
      setFrameDrillFilters((prev) => ({ ...prev, [frameId]: next }));

      if (
        NCS_GLOBAL_DRILL_DIMENSIONS.has(removed.dimension) ||
        removed.dimension === "functionalRole" ||
        removed.dimension === "jobTitle"
      ) {
        onApplyDrillFilter?.(clearDrillDimensionPatch(removed.dimension));
      }
    },
    [frameDrillFilters, onApplyDrillFilter]
  );

  const handleDrillToLevel = useCallback(
    (frameId: NcsFrameId, level: number) => {
      const local = frameDrillFilters[frameId] ?? [];
      if (level >= local.length) return;

      const removed = local.slice(level);
      const next = local.slice(0, level);
      setFrameDrillFilters((prev) => ({ ...prev, [frameId]: next }));

      if (removed.length > 0) {
        onApplyDrillFilter?.(clearDrillStackDashboardPatch(removed));
      }
    },
    [frameDrillFilters, onApplyDrillFilter]
  );

  const handleDrillReset = useCallback(
    (frameId: NcsFrameId) => {
      const local = frameDrillFilters[frameId] ?? [];
      if (local.length === 0) return;

      setFrameDrillFilters((prev) => ({ ...prev, [frameId]: [] }));
      onApplyDrillFilter?.(clearDrillStackDashboardPatch(local));
    },
    [frameDrillFilters, onApplyDrillFilter]
  );

  const isFiltered = hasNcsScopeFilters(appliedFilters);
  const postings = stats?.totalPostings ?? stats?.total ?? 0;
  const vacancies = stats?.totalVacancies ?? 0;
  const applicants = stats?.totalApplicants ?? 0;
  const states = stats?.statesCovered ?? 0;
  const newWeek = stats?.newThisWeek ?? 0;

  const kpiCards = [
    {
      id: "vacancies",
      label: isFiltered ? "Vacancies" : "Total Vacancies",
      value: formatCount(vacancies),
      delta: isFiltered ? "In current selection" : "Open positions nationally",
      deltaClass: "text-violet-600",
      tooltipTitle: "Top 5 industry sectors by vacancies",
      rankings: stats?.topIndustriesByVacancies ?? [],
      metricLabel: "Vacancies",
      groupLabel: "industry",
    },
    {
      id: "postings",
      label: isFiltered ? "Postings" : "Total Postings",
      value: formatCount(postings),
      delta: isFiltered
        ? `+${formatCount(newWeek)} new this week in selection`
        : `+${formatCount(newWeek)} new this week`,
      deltaClass: "text-emerald-600",
      tooltipTitle: "Top 5 industry sectors by postings",
      rankings: stats?.topIndustriesByPostings ?? [],
      metricLabel: "Postings",
      groupLabel: "industry",
    },
    {
      id: "applicants",
      label: isFiltered ? "Applicants" : "Total Applicants",
      value: formatCount(applicants),
      delta: isFiltered
        ? `${formatCount(stats?.employers ?? 0)} employers in selection`
        : `${formatCount(stats?.employers ?? 0)} employers`,
      deltaClass: "text-slate-500",
      tooltipTitle: "Top 5 industry sectors by applicants",
      rankings: stats?.topIndustriesByApplicants ?? [],
      metricLabel: "Applicants",
      groupLabel: "industry",
    },
    {
      id: "states",
      label: isFiltered ? "States & UTs" : "States & UTs Covered",
      value: String(states),
      delta: isFiltered
        ? "States in current selection"
        : "Indian states & union territories with jobs",
      deltaClass: "text-slate-500",
      tooltipTitle: "Top 5 states by vacancies",
      rankings: stats?.topStatesByVacancies ?? [],
      metricLabel: "Vacancies",
      groupLabel: "by state",
    },
  ];

  return (
    <div className="-mt-1 space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpiCards.map((card) => (
          <NcsKpiCard key={card.id} {...card} />
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-2 xl:items-stretch">
        <NcsDrillChartFrame
          frameId="geography"
          defaultTitle="Geography"
          defaultHint="Heat map · click state → top 5 cities → sectors"
          size="fill"
          drillFilters={frameDrillFilters.geography ?? []}
          scopeFilters={scopeFilters}
          onDrill={(dimension, value) => handleDrill("geography", dimension, value)}
          onDrillBack={() => handleDrillBack("geography")}
          onDrillReset={() => handleDrillReset("geography")}
          onDrillToLevel={(level) => handleDrillToLevel("geography", level)}
        />

        <div className="grid min-h-[792px] grid-cols-1 gap-4 sm:grid-cols-2">
          {NCS_FRAME_IDS.map((frameId) => (
            <NcsDrillChartFrame
              key={frameId}
              frameId={frameId}
              defaultTitle={FRAME_LABELS[frameId].title}
              defaultHint={FRAME_LABELS[frameId].hint}
              drillFilters={frameDrillFilters[frameId] ?? []}
              scopeFilters={scopeFilters}
              onDrill={(dimension, value) => handleDrill(frameId, dimension, value)}
              onDrillBack={() => handleDrillBack(frameId)}
              onDrillReset={() => handleDrillReset(frameId)}
              onDrillToLevel={(level) => handleDrillToLevel(frameId, level)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function NcsKpiCard({
  label,
  value,
  delta,
  deltaClass,
  tooltipTitle,
  rankings,
  metricLabel,
  groupLabel,
}: {
  label: string;
  value: string;
  delta: string;
  deltaClass: string;
  tooltipTitle: string;
  rankings: NcsRanking[];
  metricLabel: string;
  groupLabel: string;
}) {
  return (
    <div className="group relative">
      <div className="portal-kpi-card cursor-default transition-shadow group-hover:shadow-md">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <p className="mt-1 text-3xl font-bold tracking-tight text-slate-900">{value}</p>
        <p className={`mt-1 text-xs font-medium ${deltaClass}`}>{delta}</p>
      </div>

      {rankings.length > 0 && (
        <div className="pointer-events-none absolute left-0 top-full z-30 mt-2 hidden w-72 rounded-xl border border-slate-200 bg-white p-3 shadow-lg group-hover:block">
          <p className="text-[11px] font-semibold text-slate-800">{tooltipTitle}</p>
          <ul className="mt-2 space-y-1.5">
            {rankings.map((row, i) => (
              <li key={row.name} className="flex items-center justify-between gap-2 text-[11px]">
                <span className="flex min-w-0 items-center gap-1.5 text-slate-700">
                  <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-blue-50 text-[9px] font-bold text-blue-700">
                    {i + 1}
                  </span>
                  <span className="truncate" title={row.name}>
                    {row.name}
                  </span>
                </span>
                <span className="shrink-0 font-semibold text-slate-900">
                  {formatCount(row.value)}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-[10px] text-slate-400">{metricLabel} · {groupLabel}</p>
        </div>
      )}
    </div>
  );
}
