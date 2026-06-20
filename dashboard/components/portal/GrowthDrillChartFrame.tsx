"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { InvestmentPredictionsResponse } from "@/lib/investmentTypes";
import {
  getGrowthFrameView,
  type GrowthDrillFilter,
  type GrowthDrillRow,
  type GrowthFrameId,
  type GrowthFrameView,
} from "@/lib/growthDrillAnalytics";
import { formatIndianCount, formatInvestmentCr } from "@/lib/growthFormatters";
import { CHART_COLORS, truncateLabel } from "@/lib/chartTheme";

const IndiaStateHeatMap = dynamic(() => import("@/components/map/IndiaStateHeatMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center text-sm text-slate-500">Loading map…</div>
  ),
});

interface Props {
  frameId: GrowthFrameId;
  data: InvestmentPredictionsResponse;
  defaultTitle: string;
  defaultHint?: string;
  size?: "default" | "fill";
}

function metricKey(frameId: GrowthFrameId): "openRoles" | "jobs" | "gap" | "investmentCr" {
  if (frameId === "sectors") return "openRoles";
  if (frameId === "vacancyGap") return "gap";
  if (frameId === "forecast") return "jobs";
  return "jobs";
}

function metricLabel(frameId: GrowthFrameId): string {
  if (frameId === "sectors") return "Open roles";
  if (frameId === "vacancyGap") return "Net gap";
  if (frameId === "forecast") return "12M jobs";
  if (frameId === "geography") return "Pipeline jobs";
  if (frameId === "heatmap") return "Intensity";
  return "Value";
}

function rowMetric(row: GrowthDrillRow, frameId: GrowthFrameId): number {
  const key = metricKey(frameId);
  return row[key] || row.jobs || row.openRoles || row.gap || row.investmentCr || 0;
}

export default function GrowthDrillChartFrame({
  frameId,
  data,
  defaultTitle,
  defaultHint,
  size = "default",
}: Props) {
  const [filters, setFilters] = useState<GrowthDrillFilter[]>([]);
  const [slideKey, setSlideKey] = useState(0);
  const [filterOpen, setFilterOpen] = useState(false);

  const view = useMemo(
    () => getGrowthFrameView(data, frameId, filters),
    [data, frameId, filters]
  );

  const drillInto = (key: string, label: string) => {
    if (!view.drillable || !view.dimension) return;
    setFilterOpen(false);
    setFilters((prev) => [...prev, { dimension: view.dimension!, value: key, label }]);
    setSlideKey((k) => k + 1);
  };

  const goToLevel = (level: number) => {
    setFilterOpen(false);
    setFilters((prev) => prev.slice(0, level));
    setSlideKey((k) => k + 1);
  };

  const goBack = () => {
    if (filters.length === 0) return;
    goToLevel(filters.length - 1);
  };

  const reset = () => {
    setFilterOpen(false);
    setFilters([]);
    setSlideKey((k) => k + 1);
  };

  const isDrilled = filters.length > 0;
  const dataKey = metricKey(frameId);
  const chartData = view.rows.map((row) => ({
    ...row,
    value: row[dataKey] || row.jobs || row.openRoles || row.gap || row.investmentCr,
    shortLabel: truncateLabel(row.label, 18),
    fill: CHART_COLORS.vacancies,
  }));

  const heightClass = size === "fill" ? "min-h-[792px]" : "min-h-[380px]";
  const title = view.title || defaultTitle;
  const showHint = view.chartType === "horizontalBar" && view.hint;

  return (
    <div className={`portal-panel flex flex-col overflow-hidden ${heightClass}`}>
      <div className="portal-panel-header shrink-0 gap-2">
        <div className="min-w-0 flex-1">
          <h2 className="portal-panel-title truncate">{title}</h2>
          {showHint && <p className="text-[10px] text-slate-500">{view.hint || defaultHint}</p>}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {view.pickerOptions && view.pickerOptions.length > 0 && view.drillable && (
            <FrameFilterMenu
              open={filterOpen}
              onOpenChange={setFilterOpen}
              options={view.pickerOptions}
              frameId={frameId}
              onPick={(row) => drillInto(row.meta || row.key, row.label)}
            />
          )}
          {filters.length > 0 && (
            <button type="button" onClick={goBack} className="portal-btn-ghost px-2 py-1 text-[11px]">
              ← Back
            </button>
          )}
          <button
            type="button"
            onClick={reset}
            className={`portal-btn-ghost px-2 py-1 text-[11px] ${isDrilled ? "text-blue-700" : "text-slate-500"}`}
            disabled={!isDrilled}
          >
            Reset
          </button>
        </div>
      </div>

      {view.breadcrumb.length > 1 && (
        <div className="flex shrink-0 flex-wrap items-center gap-1 border-b border-slate-100 px-3 py-2">
          {view.breadcrumb.map((crumb, i) => (
            <span key={crumb.level} className="flex items-center gap-1">
              {i > 0 && <span className="text-slate-300">/</span>}
              <button
                type="button"
                onClick={() => goToLevel(crumb.level)}
                className={`text-[11px] font-medium ${
                  i === view.breadcrumb.length - 1
                    ? "text-blue-700"
                    : "text-slate-500 hover:text-blue-600"
                }`}
              >
                {crumb.label}
              </button>
            </span>
          ))}
        </div>
      )}

      <FrameSummary view={view} frameId={frameId} />

      <div className="relative min-h-0 flex-1 p-2">
        <div key={slideKey} className="drill-down-enter h-full w-full">
          {view.chartType === "detail" ? (
            <DetailPanel view={view} />
          ) : view.chartType === "map" && view.mapData ? (
            <IndiaStateHeatMap
              data={view.mapData.map((r) => ({
                key: r.key,
                label: r.label,
                postings: r.postings,
                vacancies: r.vacancies,
                applicants: r.applicants,
              }))}
              metric="vacancies"
              onStateClick={(state) => drillInto(state, state)}
            />
          ) : view.chartType === "heatmap" && view.heatmap ? (
            <HeatmapGrid
              heatmap={view.heatmap}
              onCellClick={(state, sector) =>
                drillInto(`${state}|${sector}`, `${sector} · ${state}`)
              }
            />
          ) : chartData.length === 0 ? (
            <p className="flex h-full items-center justify-center text-sm text-slate-500">
              No data for this view
            </p>
          ) : (
            <ResponsiveContainer width="100%" height="100%" minHeight={240}>
              <BarChart
                data={[...chartData].sort((a, b) => b.value - a.value)}
                layout="vertical"
                margin={{ left: 4, right: 12, top: 4, bottom: 4 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 9, fill: CHART_COLORS.axis }} />
                <YAxis
                  type="category"
                  dataKey="shortLabel"
                  tick={{ fontSize: 9, fill: CHART_COLORS.axis }}
                  width={92}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const row = payload[0].payload as { label: string; value: number; yoyPct?: number };
                    return (
                      <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-md">
                        <p className="font-semibold text-slate-800">{row.label}</p>
                        <p className="mt-0.5 text-slate-600">
                          {metricLabel(frameId)}: {formatIndianCount(row.value)}
                        </p>
                        {row.yoyPct ? (
                          <p className="mt-0.5 text-slate-600">YoY: {row.yoyPct}%</p>
                        ) : null}
                      </div>
                    );
                  }}
                />
                <Bar
                  dataKey="value"
                  name={metricLabel(frameId)}
                  fill={CHART_COLORS.vacancies}
                  radius={[0, 4, 4, 0]}
                  cursor={view.drillable ? "pointer" : "default"}
                  onClick={(bar) => {
                    const row = (bar as { payload?: { key?: string; label?: string; meta?: string } })
                      .payload;
                    const key = row?.meta || row?.key;
                    if (key && row?.label) drillInto(key, row.label);
                  }}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}

function FrameFilterMenu({
  open,
  onOpenChange,
  options,
  frameId,
  onPick,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  options: GrowthDrillRow[];
  frameId: GrowthFrameId;
  onPick: (row: GrowthDrillRow) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const top5 = options.slice(0, 5);
  const rest = options.slice(5);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onOpenChange(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open, onOpenChange]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => onOpenChange(!open)}
        className="portal-btn-ghost flex h-7 w-7 items-center justify-center p-0"
        aria-label="Filter and drill options"
        title="Pick sector / state to drill"
      >
        <svg className="h-4 w-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
          />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full z-30 mt-1 max-h-[320px] w-[min(300px,calc(100vw-2rem))] overflow-y-auto rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
          <FilterSection title="Top 5 · chart" rows={top5} frameId={frameId} onPick={onPick} />
          {rest.length > 0 && (
            <FilterSection title={`All others (${rest.length})`} rows={rest} frameId={frameId} onPick={onPick} />
          )}
        </div>
      )}
    </div>
  );
}

function FilterSection({
  title,
  rows,
  frameId,
  onPick,
}: {
  title: string;
  rows: GrowthDrillRow[];
  frameId: GrowthFrameId;
  onPick: (row: GrowthDrillRow) => void;
}) {
  if (!rows.length) return null;
  return (
    <div className="border-b border-slate-100 last:border-b-0">
      <p className="sticky top-0 bg-slate-50 px-3 py-1.5 text-[9px] font-bold uppercase tracking-wide text-slate-500">
        {title}
      </p>
      <ul>
        {rows.map((row) => (
          <li key={row.key}>
            <button
              type="button"
              onClick={() => onPick(row)}
              className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-[11px] hover:bg-blue-50"
            >
              <span className="min-w-0 flex-1 truncate font-medium text-slate-800" title={row.label}>
                {row.label}
              </span>
              <span className="shrink-0 tabular-nums text-slate-500">
                {formatIndianCount(rowMetric(row, frameId))}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function FrameSummary({ view, frameId }: { view: GrowthFrameView; frameId: GrowthFrameId }) {
  if (view.chartType === "heatmap" || view.chartType === "map") return null;

  const { summary } = view;

  if (view.chartType === "detail") {
    const stats =
      frameId === "heatmap"
        ? [
            { label: "Intensity", value: String(Math.round(summary.openRoles)) },
            { label: "Projects", value: String(summary.projects) },
          ]
        : frameId === "vacancyGap"
          ? [
              { label: "Net gap", value: formatIndianCount(summary.gap) },
              { label: "Demand", value: formatIndianCount(summary.jobs) },
              { label: "Vacancies", value: formatIndianCount(summary.openRoles) },
            ]
          : [
              { label: "Pipeline jobs", value: formatIndianCount(summary.jobs) },
              { label: "Investment", value: formatInvestmentCr(summary.investmentCr) },
              { label: "Projects", value: String(summary.projects) },
            ];
    return (
      <div className={`grid shrink-0 gap-2 border-b border-slate-100 px-3 py-2 ${stats.length === 2 ? "grid-cols-2" : "grid-cols-3"}`}>
        {stats.map((s) => (
          <MiniStat key={s.label} label={s.label} value={s.value} />
        ))}
      </div>
    );
  }

  const stats =
    frameId === "sectors"
      ? [
          { label: "Open roles", value: formatIndianCount(summary.openRoles) },
          { label: "Sectors", value: String(summary.projects) },
          { label: "Pipeline jobs", value: formatIndianCount(summary.jobs) },
        ]
      : frameId === "vacancyGap"
        ? [
            { label: "Net gap", value: formatIndianCount(summary.gap) },
            { label: "Demand", value: formatIndianCount(summary.jobs) },
            { label: "Rows", value: String(summary.projects) },
          ]
        : frameId === "forecast"
          ? [
              { label: "12M jobs", value: formatIndianCount(summary.jobs) },
              { label: "Investment", value: formatInvestmentCr(summary.investmentCr) },
              { label: "Entries", value: String(summary.projects) },
            ]
          : [
              { label: "Pipeline jobs", value: formatIndianCount(summary.jobs) },
              { label: "Investment", value: formatInvestmentCr(summary.investmentCr) },
              { label: "Projects", value: String(summary.projects) },
            ];

  return (
    <div className="grid shrink-0 grid-cols-3 gap-2 border-b border-slate-100 px-3 py-2">
      {stats.map((s) => (
        <MiniStat key={s.label} label={s.label} value={s.value} />
      ))}
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-slate-50 px-2 py-1.5 text-center">
      <p className="text-[9px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="truncate text-sm font-bold text-slate-900" title={value}>
        {value}
      </p>
    </div>
  );
}

function DetailPanel({ view }: { view: GrowthFrameView }) {
  const detail = view.detail;
  if (!detail) return null;

  return (
    <div className="h-full overflow-y-auto px-1 py-1">
      {detail.kpis.length > 0 && (
        <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {detail.kpis.map((k) => (
            <div key={k.label} className="rounded-lg border border-slate-100 bg-slate-50 px-2 py-2">
              <p className="text-[9px] font-semibold uppercase text-slate-500">{k.label}</p>
              <p className="mt-0.5 text-sm font-bold text-slate-900">{k.value}</p>
            </div>
          ))}
        </div>
      )}
      {detail.insight && (
        <p className="mb-3 rounded-lg border border-blue-100 bg-blue-50/60 px-3 py-2 text-xs text-blue-900">
          {detail.insight}
        </p>
      )}
      {detail.projects.length > 0 && (
        <div>
          <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-slate-500">
            Pipeline projects
          </p>
          <ul className="space-y-2">
            {detail.projects.map((p, i) => (
              <li
                key={`${p.name}-${i}`}
                className="rounded-lg border border-slate-100 bg-white px-3 py-2 shadow-sm"
              >
                <p className="text-xs font-semibold text-slate-800">{p.name}</p>
                <div className="mt-1 flex flex-wrap gap-3 text-[10px] text-slate-500">
                  <span>{p.state}</span>
                  <span>{formatInvestmentCr(p.investmentCr)}</span>
                  <span>{formatIndianCount(p.jobs)} jobs</span>
                  {p.stage && <span className="text-blue-600">{p.stage}</span>}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function HeatmapGrid({
  heatmap,
  onCellClick,
}: {
  heatmap: { states: string[]; sectors: string[]; matrix: number[][] };
  onCellClick: (state: string, sectorKey: string) => void;
}) {
  const flat = heatmap.matrix.flat();
  const max = Math.max(...flat, 1);

  const short = (s: string) => (s.length > 14 ? `${s.slice(0, 13)}…` : s);

  return (
    <div className="h-full overflow-auto p-1">
      <table className="w-full min-w-[640px] border-collapse text-[10px]">
        <thead>
          <tr>
            <th className="sticky left-0 bg-white p-1 text-left font-bold text-slate-600">State</th>
            {heatmap.sectors.map((s) => (
              <th key={s} className="p-1 font-semibold text-slate-500" title={s}>
                {short(s)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {heatmap.states.map((state, ri) => (
            <tr key={state}>
              <td className="sticky left-0 bg-white p-1 font-semibold text-slate-700">{state}</td>
              {heatmap.matrix[ri]?.map((val, ci) => {
                const sectorKey = heatmap.sectors[ci];
                return (
                  <td
                    key={ci}
                    className="cursor-pointer p-1 text-center font-bold tabular-nums text-slate-800 transition hover:ring-2 hover:ring-blue-400"
                    style={{
                      backgroundColor: `rgba(37, 99, 235, ${0.12 + (val / max) * 0.78})`,
                    }}
                    title={`${state} · ${sectorKey}: ${val}`}
                    onClick={() => onCellClick(state, sectorKey)}
                  >
                    {Math.round(val)}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
