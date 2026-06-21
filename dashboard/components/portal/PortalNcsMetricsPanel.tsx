"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { NcsRanking, NcsStats } from "@/lib/ncsJobTypes";
import type { NcsDashboardFilters } from "@/lib/ncsJobTypes";
import { formatCount } from "@/lib/jobAnalytics";
import { getNcsStats } from "@/lib/ncsJobsApi";
import NcsDrillChartFrame from "./NcsDrillChartFrame";
import { NCS_FRAME_IDS } from "@/lib/ncsAnalyticsTypes";
import type { NcsAnalyticsDimension, NcsAnalyticsFilter, NcsFrameId } from "@/lib/ncsAnalyticsTypes";
import {
  clearDrillDimensionPatch,
  clearDrillStackDashboardPatch,
  drillDimensionToDashboardPatch,
  frameDrillStackFromDashboard,
  hasNcsScopeFilters,
  isGlobalDrillDimension,
  isLocalDrillDimension,
  mergeLocalDrillKey,
  ncsDashboardToScopeFilters,
  serializeNcsScopeKey,
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
  appliedFilters,
  onApplyDrillFilter,
}: Props) {
  const [frameLocalDrills, setFrameLocalDrills] = useState<
    Partial<Record<NcsFrameId | "geography", NcsAnalyticsFilter[]>>
  >({});

  const scopeKey = useMemo(() => serializeNcsScopeKey(appliedFilters), [appliedFilters]);
  const scopeFilters = useMemo(
    () => ncsDashboardToScopeFilters(appliedFilters),
    [scopeKey]
  );

  const frameQueryKeys = useMemo(() => {
    const keys: Partial<Record<NcsFrameId | "geography", string>> = {
      geography: mergeLocalDrillKey(scopeKey, frameLocalDrills.geography ?? []),
    };
    for (const frameId of NCS_FRAME_IDS) {
      keys[frameId] = mergeLocalDrillKey(scopeKey, frameLocalDrills[frameId] ?? []);
    }
    return keys;
  }, [scopeKey, frameLocalDrills]);

  const [kpiStats, setKpiStats] = useState<NcsStats | null>(stats);

  useEffect(() => {
    if (!hasNcsScopeFilters(appliedFilters)) {
      setKpiStats(stats);
    }
  }, [stats, scopeKey]);

  useEffect(() => {
    if (!hasNcsScopeFilters(appliedFilters)) return;

    let cancelled = false;
    const timer = window.setTimeout(() => {
      getNcsStats(appliedFilters)
        .then((data) => {
          if (!cancelled) setKpiStats(data);
        })
        .catch(() => {
          if (!cancelled) setKpiStats(stats);
        });
    }, 150);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [scopeKey, appliedFilters, stats]);

  const handleDrill = useCallback(
    (frameId: NcsFrameId | "geography", dimension: string, value: string) => {
      const dim = dimension as NcsAnalyticsDimension;

      if (isGlobalDrillDimension(dim)) {
        onApplyDrillFilter?.(drillDimensionToDashboardPatch(dim, value));
        return;
      }

      if (isLocalDrillDimension(dim)) {
        setFrameLocalDrills((prev) => ({
          ...prev,
          [frameId]: [...(prev[frameId] ?? []), { dimension: dim, value }],
        }));
      }
    },
    [onApplyDrillFilter]
  );

  const handleDrillBack = useCallback(
    (frameId: NcsFrameId | "geography") => {
      const local = frameLocalDrills[frameId] ?? [];
      if (local.length > 0) {
        setFrameLocalDrills((prev) => ({
          ...prev,
          [frameId]: local.slice(0, -1),
        }));
        return;
      }

      const globalStack = frameDrillStackFromDashboard(frameId as NcsFrameId, appliedFilters);
      if (globalStack.length === 0) return;
      const removed = globalStack[globalStack.length - 1];
      onApplyDrillFilter?.(clearDrillDimensionPatch(removed.dimension));
    },
    [frameLocalDrills, appliedFilters, onApplyDrillFilter]
  );

  const handleDrillToLevel = useCallback(
    (frameId: NcsFrameId | "geography", level: number) => {
      const local = frameLocalDrills[frameId] ?? [];
      const globalStack = frameDrillStackFromDashboard(frameId as NcsFrameId, appliedFilters);
      const totalDepth = local.length + globalStack.length;
      if (level >= totalDepth) return;

      if (level < globalStack.length) {
        const removed = globalStack.slice(level);
        setFrameLocalDrills((prev) => ({ ...prev, [frameId]: [] }));
        if (removed.length > 0) {
          onApplyDrillFilter?.(clearDrillStackDashboardPatch(removed));
        }
        return;
      }

      const localTarget = level - globalStack.length;
      setFrameLocalDrills((prev) => ({
        ...prev,
        [frameId]: local.slice(0, localTarget),
      }));
    },
    [frameLocalDrills, appliedFilters, onApplyDrillFilter]
  );

  const handleDrillReset = useCallback(
    (frameId: NcsFrameId | "geography") => {
      const local = frameLocalDrills[frameId] ?? [];
      const globalStack = frameDrillStackFromDashboard(frameId as NcsFrameId, appliedFilters);
      if (local.length === 0 && globalStack.length === 0) return;

      setFrameLocalDrills((prev) => ({ ...prev, [frameId]: [] }));
      if (globalStack.length > 0) {
        onApplyDrillFilter?.(clearDrillStackDashboardPatch(globalStack));
      }
    },
    [frameLocalDrills, appliedFilters, onApplyDrillFilter]
  );

  const isFiltered = hasNcsScopeFilters(appliedFilters);
  const postings = kpiStats?.totalPostings ?? kpiStats?.total ?? 0;
  const vacancies = kpiStats?.totalVacancies ?? 0;
  const applicants = kpiStats?.totalApplicants ?? 0;
  const states = kpiStats?.statesCovered ?? 0;
  const newWeek = kpiStats?.newThisWeek ?? 0;

  const kpiCards = [
    {
      id: "vacancies",
      label: isFiltered ? "Vacancies" : "Total Vacancies",
      value: formatCount(vacancies),
      delta: isFiltered ? "In current selection" : "Open positions nationally",
      deltaClass: "text-violet-600",
      tooltipTitle: "Top 5 industry sectors by vacancies",
      rankings: kpiStats?.topIndustriesByVacancies ?? [],
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
      rankings: kpiStats?.topIndustriesByPostings ?? [],
      metricLabel: "Postings",
      groupLabel: "industry",
    },
    {
      id: "applicants",
      label: isFiltered ? "Applicants" : "Total Applicants",
      value: formatCount(applicants),
      delta: isFiltered
        ? `${formatCount(kpiStats?.employers ?? 0)} employers in selection`
        : `${formatCount(kpiStats?.employers ?? 0)} employers`,
      deltaClass: "text-slate-500",
      tooltipTitle: "Top 5 industry sectors by applicants",
      rankings: kpiStats?.topIndustriesByApplicants ?? [],
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
      rankings: kpiStats?.topStatesByVacancies ?? [],
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
          queryKey={frameQueryKeys.geography ?? scopeKey}
          drillFilters={frameLocalDrills.geography ?? []}
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
              queryKey={frameQueryKeys[frameId] ?? scopeKey}
              drillFilters={frameLocalDrills[frameId] ?? []}
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
