"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
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
import { getNcsFrameAnalytics } from "@/lib/ncsAnalyticsApi";
import type {
  NcsAnalyticsDatum,
  NcsAnalyticsFilter,
  NcsFrameAnalytics,
  NcsFrameId,
} from "@/lib/ncsAnalyticsTypes";
import { CHART_COLORS, PIE_PALETTE, truncateLabel } from "@/lib/chartTheme";
import { formatCount } from "@/lib/jobAnalytics";

const IndiaStateHeatMap = dynamic(() => import("@/components/map/IndiaStateHeatMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center text-sm text-slate-500">
      Loading map…
    </div>
  ),
});

interface Props {
  frameId: NcsFrameId;
  defaultTitle: string;
  defaultHint?: string;
  size?: "default" | "large" | "fill";
  queryKey: string;
  drillFilters: NcsAnalyticsFilter[];
  scopeFilters?: NcsAnalyticsFilter[];
  onDrill: (dimension: string, value: string) => void;
  onDrillBack: () => void;
  onDrillReset: () => void;
  onDrillToLevel: (level: number) => void;
}

function ChartTooltip({
  active,
  payload,
  label,
  drillable,
}: {
  active?: boolean;
  payload?: {
    name: string;
    value: number;
    payload?: { label?: string; postings?: number; vacancies?: number; applicants?: number };
  }[];
  label?: string;
  drillable?: boolean;
}) {
  if (!active || !payload?.length) return null;
  const point = payload[0];
  const row = (point?.payload ?? point) as {
    label?: string;
    postings?: number;
    vacancies?: number;
    applicants?: number;
  };
  const title = row?.label || point?.name || label;
  const postings = row?.postings;
  const vacancies = row?.vacancies;
  const applicants = row?.applicants;

  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-md">
      {title && <p className="font-semibold text-slate-800">{title}</p>}
      {postings != null && (
        <p className="mt-0.5 text-slate-600">
          Postings: {Number(postings).toLocaleString("en-IN")}
        </p>
      )}
      {vacancies != null && (
        <p className="mt-0.5 text-slate-600">
          Vacancies: {Number(vacancies).toLocaleString("en-IN")}
        </p>
      )}
      {applicants != null && (
        <p className="mt-0.5 text-slate-600">
          Applicants: {Number(applicants).toLocaleString("en-IN")}
        </p>
      )}
      {drillable && <p className="mt-1 text-[10px] text-blue-600">Click to drill down</p>}
    </div>
  );
}

export default function NcsDrillChartFrame({
  frameId,
  defaultTitle,
  defaultHint,
  size = "default",
  queryKey,
  drillFilters,
  scopeFilters = [],
  onDrill,
  onDrillBack,
  onDrillReset,
  onDrillToLevel,
}: Props) {
  const [analytics, setAnalytics] = useState<NcsFrameAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [slideKey, setSlideKey] = useState(0);
  const [filterOpen, setFilterOpen] = useState(false);
  const scopeFiltersRef = useRef(scopeFilters);
  const drillFiltersRef = useRef(drillFilters);
  scopeFiltersRef.current = scopeFilters;
  drillFiltersRef.current = drillFilters;

  const load = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    try {
      const data = await getNcsFrameAnalytics(
        frameId,
        drillFiltersRef.current,
        scopeFiltersRef.current,
        signal
      );
      if (signal?.aborted) return;
      setAnalytics(data);
      setSlideKey((k) => k + 1);
    } catch (err) {
      if (signal?.aborted || (err instanceof DOMException && err.name === "AbortError")) return;
      setAnalytics(null);
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [frameId]);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      void load(controller.signal);
    }, 120);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [queryKey, load]);

  const isDrilled = (analytics?.filters?.length ?? 0) > 0;

  const drillInto = (key: string) => {
    if (!analytics?.drillable || !analytics.dimension) return;
    setFilterOpen(false);
    onDrill(analytics.dimension, key);
  };

  const goToLevel = (level: number) => {
    setFilterOpen(false);
    onDrillToLevel(level);
  };

  const goBack = () => {
    if (!isDrilled) return;
    onDrillBack();
  };

  const reset = () => {
    setFilterOpen(false);
    onDrillReset();
  };

  const pickerOptions = analytics?.pickerOptions ?? [];

  const chartData = (analytics?.data ?? []).map((row, i) => ({
    ...row,
    shortLabel: truncateLabel(row.label, analytics?.chartType === "horizontalBar" ? 18 : 12),
    fill: PIE_PALETTE[i % PIE_PALETTE.length],
  }));

  const title = analytics?.title || defaultTitle;

  const frameHeight =
    size === "fill"
      ? "h-full min-h-[792px]"
      : size === "large"
        ? "h-[560px]"
        : "h-[380px]";

  return (
    <div className={`portal-panel flex ${frameHeight} flex-col overflow-hidden`}>
      <div className="portal-panel-header shrink-0 gap-2">
        <div className="min-w-0 flex-1">
          <h2 className="portal-panel-title truncate">{title}</h2>
          {!isDrilled && defaultHint && (
            <p className="truncate text-[10px] text-slate-500">{defaultHint}</p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {analytics?.drillable && pickerOptions.length > 0 && (
            <FrameFilterMenu
              open={filterOpen}
              onOpenChange={setFilterOpen}
              options={pickerOptions}
              onPick={(row) => drillInto(row.key)}
            />
          )}
          {isDrilled && (
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

      {analytics && analytics.breadcrumb.length > 1 && (
        <div className="flex shrink-0 flex-wrap items-center gap-1 border-b border-slate-100 px-3 py-2">
          {analytics.breadcrumb.map((crumb, i) => (
            <span key={crumb.level} className="flex items-center gap-1">
              {i > 0 && <span className="text-slate-300">/</span>}
              <button
                type="button"
                onClick={() => goToLevel(crumb.level)}
                className={`text-[11px] font-medium ${
                  i === analytics.breadcrumb.length - 1
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

      {analytics && (
        <div className="grid shrink-0 grid-cols-3 gap-2 border-b border-slate-100 px-3 py-2">
          <MiniStat label="Postings" value={formatCount(analytics.summary.postings)} />
          <MiniStat label="Vacancies" value={formatCount(analytics.summary.vacancies)} />
          <MiniStat label="Applicants" value={formatCount(analytics.summary.applicants)} />
        </div>
      )}

      <div className="relative min-h-0 flex-1 px-2 pb-3 pt-1">
        {loading && (
          <div
            className={`absolute inset-0 z-10 flex items-center justify-center ${
              analytics ? "bg-white/40" : "bg-white/70"
            }`}
          >
            <div className="portal-spinner" />
          </div>
        )}

        {!loading && chartData.length === 0 && analytics?.chartType !== "map" ? (
          <p className="flex h-full items-center justify-center text-sm text-slate-500">
            No data for this view
          </p>
        ) : analytics?.chartType === "map" ? (
          <div key={slideKey} className="ncs-frame-chart h-full w-full">
            <IndiaStateHeatMap
              data={chartData}
              metric="vacancies"
              onStateClick={(stateName) => drillInto(stateName)}
            />
          </div>
        ) : analytics?.chartType === "openings" ? (
          <div key={slideKey} className="ncs-frame-chart h-full w-full overflow-y-auto px-1">
            <OpeningsList data={chartData} />
          </div>
        ) : (
          <div key={slideKey} className="ncs-frame-chart h-full w-full">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={180}>
              {renderChart(analytics, chartData, drillInto)}
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-slate-50 px-2 py-1.5 text-center">
      <p className="text-[9px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="text-sm font-bold text-slate-900">{value}</p>
    </div>
  );
}

function OpeningsList({
  data,
}: {
  data: Array<{
    key: string;
    label: string;
    postings: number;
    vacancies: number;
    applicants: number;
  }>;
}) {
  const maxVacancies = Math.max(...data.map((d) => d.vacancies), 1);

  return (
    <ul className="space-y-2 py-1">
      {data.map((row, i) => {
        const widthPct = Math.max(8, Math.round((row.vacancies / maxVacancies) * 100));
        return (
          <li
            key={row.key}
            className="rounded-lg border border-slate-100 bg-white px-3 py-2 shadow-sm"
          >
            <div className="flex items-start gap-2">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-50 text-[10px] font-bold text-blue-700">
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold leading-snug text-slate-800" title={row.label}>
                  {row.label}
                </p>
                <div className="mt-1.5 flex items-center gap-3 text-[10px] text-slate-500">
                  <span>
                    <span className="font-semibold text-violet-700">{formatCount(row.vacancies)}</span>{" "}
                    openings
                  </span>
                  <span>{formatCount(row.postings)} postings</span>
                  <span>{formatCount(row.applicants)} applicants</span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-violet-500 transition-all"
                    style={{ width: `${widthPct}%` }}
                  />
                </div>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function renderChart(
  analytics: NcsFrameAnalytics | null,
  chartData: Array<{
    key: string;
    label: string;
    shortLabel: string;
    postings: number;
    vacancies: number;
    applicants: number;
    fill: string;
  }>,
  drillInto: (key: string) => void
) {
  const type = analytics?.chartType ?? "bar";
  const drillable = analytics?.drillable ?? false;
  const cursor = drillable ? "pointer" : "default";

  const barData =
    type === "horizontalBar"
      ? [...chartData].sort((a, b) => b.vacancies - a.vacancies)
      : type === "bar"
        ? [...chartData].sort((a, b) => b.vacancies - a.vacancies)
        : chartData;

  if (type === "line") {
    return (
      <LineChart data={chartData} margin={{ top: 8, right: 8, left: -8, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
        <XAxis dataKey="shortLabel" tick={{ fontSize: 9, fill: CHART_COLORS.axis }} />
        <YAxis tick={{ fontSize: 9, fill: CHART_COLORS.axis }} width={36} />
        <Tooltip content={<ChartTooltip drillable={drillable} />} />
        <Legend wrapperStyle={{ fontSize: 10 }} />
        <Line
          type="monotone"
          dataKey="postings"
          name="Postings"
          stroke={CHART_COLORS.listings}
          strokeWidth={2}
          dot={{ r: 4, cursor }}
          activeDot={{
            r: 6,
            cursor,
            onClick: (_e, payload) => {
              const p = payload as { payload?: { key?: string } };
              if (p.payload?.key) drillInto(p.payload.key);
            },
          }}
        />
        <Line
          type="monotone"
          dataKey="vacancies"
          name="Vacancies"
          stroke={CHART_COLORS.vacancies}
          strokeWidth={2}
          dot={{ r: 3, cursor }}
        />
      </LineChart>
    );
  }

  if (type === "pie") {
    return (
      <PieChart>
        <Pie
          data={chartData}
          dataKey="postings"
          nameKey="shortLabel"
          cx="50%"
          cy="50%"
          innerRadius="42%"
          outerRadius="72%"
          paddingAngle={2}
          cursor={cursor}
          onClick={(_entry, index) => {
            const row = chartData[index];
            if (row?.key) drillInto(row.key);
          }}
        >
          {chartData.map((entry) => (
            <Cell key={entry.key} fill={entry.fill} />
          ))}
        </Pie>
        <Tooltip content={<ChartTooltip drillable={drillable} />} />
        <Legend wrapperStyle={{ fontSize: 9 }} />
      </PieChart>
    );
  }

  if (type === "horizontalBar") {
    return (
      <BarChart data={barData} layout="vertical" margin={{ left: 4, right: 12, top: 4, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} horizontal={false} />
        <XAxis type="number" tick={{ fontSize: 9, fill: CHART_COLORS.axis }} />
        <YAxis type="category" dataKey="shortLabel" tick={{ fontSize: 9, fill: CHART_COLORS.axis }} width={88} />
        <Tooltip content={<ChartTooltip drillable={drillable} />} />
        <Bar
          dataKey="vacancies"
          name="Vacancies"
          fill={CHART_COLORS.vacancies}
          radius={[0, 4, 4, 0]}
          cursor={cursor}
          onClick={(barData) => {
            const key = (barData as { payload?: { key?: string } }).payload?.key;
            if (key) drillInto(key);
          }}
        />
      </BarChart>
    );
  }

  return (
    <BarChart data={barData} margin={{ top: 8, right: 8, left: -12, bottom: 40 }}>
      <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} vertical={false} />
      <XAxis
        dataKey="shortLabel"
        tick={{ fontSize: 9, fill: CHART_COLORS.axis }}
        angle={-30}
        textAnchor="end"
        height={48}
        interval={0}
      />
      <YAxis tick={{ fontSize: 9, fill: CHART_COLORS.axis }} width={36} />
      <Tooltip content={<ChartTooltip drillable={drillable} />} />
      <Bar
        dataKey="vacancies"
        name="Vacancies"
        fill={CHART_COLORS.vacancies}
        radius={[4, 4, 0, 0]}
        cursor={cursor}
        onClick={(barData) => {
          const key = (barData as { payload?: { key?: string } }).payload?.key;
          if (key) drillInto(key);
        }}
      />
    </BarChart>
  );
}

function FrameFilterMenu({
  open,
  onOpenChange,
  options,
  onPick,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  options: NcsAnalyticsDatum[];
  onPick: (row: NcsAnalyticsDatum) => void;
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
        title="Pick option to drill down"
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
          <FilterSection title={`Top 5 · chart`} rows={top5} onPick={onPick} />
          {rest.length > 0 && (
            <FilterSection title={`All others (${rest.length})`} rows={rest} onPick={onPick} />
          )}
        </div>
      )}
    </div>
  );
}

function FilterSection({
  title,
  rows,
  onPick,
}: {
  title: string;
  rows: NcsAnalyticsDatum[];
  onPick: (row: NcsAnalyticsDatum) => void;
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
                {formatCount(row.vacancies)}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
