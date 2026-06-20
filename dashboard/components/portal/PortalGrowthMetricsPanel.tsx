"use client";

import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { InvestmentPredictionsResponse } from "@/lib/investmentTypes";
import type { AiRecommendationsSummary } from "@/lib/aiRecommendationsTypes";
import { buildGrowthDashboardKpis } from "@/lib/growthWorkbookAnalytics";
import { buildGrowthKpiSectorBreakdowns } from "@/lib/growthKpiSectorBreakdown";
import type { GrowthKpiSectorRanking } from "@/lib/growthKpiSectorBreakdown";
import {
  formatIndianCount,
  formatInvestmentCr,
  formatUsdBnAsInrCr,
} from "@/lib/growthFormatters";
import type { GrowthFrameId } from "@/lib/growthDrillAnalytics";
import GrowthDrillChartFrame from "./GrowthDrillChartFrame";

const GROWTH_FRAMES: GrowthFrameId[] = ["sectors", "forecast", "vacancyGap", "heatmap"];

const FRAME_LABELS: Record<GrowthFrameId, { title: string; hint: string }> = {
  geography: { title: "Geography", hint: "Heat map · click state → top 5 sectors" },
  sectors: { title: "Top 5 sectors", hint: "Click sector → top 5 sub-sectors → KPI detail" },
  forecast: { title: "Job forecast", hint: "Top 5 · 12-month point estimates" },
  vacancyGap: { title: "Vacancy gaps", hint: "Top 5 sectors → states → gap KPIs" },
  heatmap: { title: "Hiring heatmap", hint: "" },
};

interface Props {
  data: InvestmentPredictionsResponse;
  criticalCount?: number;
  aiSummary?: AiRecommendationsSummary | null;
  aiLoading?: boolean;
}

export default function PortalGrowthMetricsPanel({
  data,
  criticalCount,
  aiSummary,
  aiLoading,
}: Props) {
  const kpis = useMemo(() => buildGrowthDashboardKpis(data), [data]);
  const sectorBreakdowns = useMemo(
    () => buildGrowthKpiSectorBreakdowns(data, aiSummary),
    [data, aiSummary]
  );

  const kpiCards: Array<{
    id: string;
    label: string;
    value: string;
    delta?: string;
    tone?: string;
    tooltipTitle: string;
    metricLabel: string;
    groupLabel: string;
    rankings: GrowthKpiSectorRanking[];
    formatRanking: (value: number) => string;
  }> = [
    {
      id: "pli",
      label: "Total PLI Jobs Created (Cumulative)",
      value: formatIndianCount(kpis.pliJobs),
      tooltipTitle: "Top 5 sectors · PLI jobs (apportioned)",
      metricLabel: "Est. jobs",
      groupLabel: "PLI programmes",
      rankings: sectorBreakdowns.pli,
      formatRanking: formatIndianCount,
    },
    {
      id: "fdi",
      label: "FY25-26 FDI Inflow",
      value: formatUsdBnAsInrCr(kpis.fdiUsdBn),
      tooltipTitle: "Top 5 sectors · FY25-26 FDI inflow",
      metricLabel: "Sector share of FY26 total",
      groupLabel: "FDI inflow",
      rankings: sectorBreakdowns.fdi,
      formatRanking: (v) => formatUsdBnAsInrCr(v),
    },
    {
      id: "startup",
      label: "FY25-26 Startup Funding",
      value: formatUsdBnAsInrCr(kpis.startupFundingUsdBn),
      tooltipTitle: "Top 5 sectors · FY25-26 funding",
      metricLabel: "FY26 funding",
      groupLabel: "Startup funding",
      rankings: sectorBreakdowns.startup,
      formatRanking: (v) => formatUsdBnAsInrCr(v),
    },
    {
      id: "pipeline",
      label: "Tracked Pipeline Investment",
      value: formatInvestmentCr(kpis.pipelineInvestmentCr),
      delta:
        criticalCount != null && criticalCount > 0
          ? `Net vacancy gap ${formatIndianCount(kpis.totalSkillGap)} · ${criticalCount} critical`
          : `Net vacancy gap ${formatIndianCount(kpis.totalSkillGap)}`,
      tone: "text-orange-600",
      tooltipTitle: "Top 5 sectors · pipeline investment",
      metricLabel: "Investment",
      groupLabel: "Pipeline projects",
      rankings: sectorBreakdowns.pipeline,
      formatRanking: formatInvestmentCr,
    },
    {
      id: "ai-recommendations",
      label: "AI Recommendations · Skill Gap",
      value: aiSummary ? formatIndianCount(aiSummary.totalSkillGap) : aiLoading ? "…" : "—",
      delta: aiSummary
        ? `${aiSummary.totalRecommendations} recommendations · ${aiSummary.criticalCount} critical · ${aiSummary.avgGapPercent}% avg gap`
        : aiLoading
          ? "Loading vacancy gap analysis…"
          : "Vacancy gap analysis unavailable",
      tone: "text-rose-600",
      tooltipTitle: "Top 5 sectors · skill gap",
      metricLabel: "Skill gap",
      groupLabel: "AI Recommendations",
      rankings: sectorBreakdowns.aiRecommendations,
      formatRanking: formatIndianCount,
    },
  ];

  return (
    <div className="-mt-1 space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {kpiCards.map((card) => (
          <GrowthKpiCard key={card.id} {...card} />
        ))}
      </div>

      {kpis.forecastHorizons.length > 0 && (
        <div className="grid gap-4 xl:grid-cols-[1.4fr_0.6fr]">
          <DashboardHorizonChart horizons={kpis.forecastHorizons} />
          <TopStatesPanel states={kpis.topStates} />
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-2 xl:items-stretch">
        <GrowthDrillChartFrame
          frameId="geography"
          data={data}
          defaultTitle={FRAME_LABELS.geography.title}
          defaultHint={FRAME_LABELS.geography.hint}
          size="fill"
        />

        <div className="grid min-h-[792px] grid-cols-1 gap-4 sm:grid-cols-2">
          {GROWTH_FRAMES.map((frameId) => (
            <GrowthDrillChartFrame
              key={frameId}
              frameId={frameId}
              data={data}
              defaultTitle={FRAME_LABELS[frameId].title}
              defaultHint={FRAME_LABELS[frameId].hint}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function GrowthKpiCard({
  label,
  value,
  delta,
  tone,
  tooltipTitle,
  metricLabel,
  groupLabel,
  rankings,
  formatRanking,
}: {
  label: string;
  value: string;
  delta?: string;
  tone?: string;
  tooltipTitle: string;
  metricLabel: string;
  groupLabel: string;
  rankings: GrowthKpiSectorRanking[];
  formatRanking: (value: number) => string;
}) {
  return (
    <div className="group relative">
      <div className="portal-kpi-card cursor-default transition-shadow group-hover:shadow-md">
        <p className="text-sm font-medium text-slate-600">{label}</p>
        <p className="mt-1 text-2xl font-bold tracking-tight text-slate-900">{value}</p>
        {delta && tone ? (
          <p className={`mt-1 text-xs font-medium ${tone}`}>{delta}</p>
        ) : null}
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
                  {formatRanking(row.value)}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-[10px] text-slate-400">
            {metricLabel} · {groupLabel}
          </p>
        </div>
      )}
    </div>
  );
}

function DashboardHorizonChart({
  horizons,
}: {
  horizons: { horizon: string; jobs: number; low: number; high: number }[];
}) {
  return (
    <div className="portal-panel">
      <div className="portal-panel-header">
        <div>
          <h2 className="portal-panel-title">National Job-Creation Forecast by Horizon</h2>
          <p className="text-[10px] text-slate-500">
            Point estimates + 80% CI · tracked pipeline
          </p>
        </div>
      </div>
      <div className="h-[280px] px-2 pb-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={horizons} margin={{ top: 8, right: 12, left: 0, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
            <XAxis dataKey="horizon" tick={{ fontSize: 11, fill: "#64748b" }} />
            <YAxis tick={{ fontSize: 10, fill: "#64748b" }} tickFormatter={formatIndianCount} />
            <Tooltip
              formatter={(v: number, name: string) => [
                formatIndianCount(v),
                name === "jobs" ? "Point estimate" : name,
              ]}
            />
            <Legend wrapperStyle={{ fontSize: 10 }} />
            <Bar dataKey="jobs" name="Point estimate" fill="#2563eb" radius={[4, 4, 0, 0]} />
            <Bar dataKey="low" name="80% CI Low" fill="#93c5fd" radius={[4, 4, 0, 0]} />
            <Bar dataKey="high" name="80% CI High" fill="#1d4ed8" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function TopStatesPanel({
  states,
}: {
  states: { rank: number; state: string; intensity: number }[];
}) {
  return (
    <div className="portal-panel flex flex-col">
      <div className="portal-panel-header shrink-0">
        <div>
          <h2 className="portal-panel-title">Top States by Hiring Intensity</h2>
          <p className="text-[10px] text-slate-500">Avg. composite index · use Geography map to drill</p>
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="text-[10px] font-bold uppercase text-slate-500">
              <th className="pb-2 pr-2">Rank</th>
              <th className="pb-2 pr-2">State</th>
              <th className="pb-2 text-right">Index</th>
            </tr>
          </thead>
          <tbody>
            {states.map((row) => (
              <tr key={row.rank} className="border-t border-slate-100">
                <td className="py-2 pr-2 font-bold text-slate-700">{row.rank}</td>
                <td className="py-2 pr-2 font-semibold text-slate-800">{row.state}</td>
                <td className="py-2 text-right tabular-nums font-semibold text-slate-800">
                  {row.intensity.toFixed(1)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
