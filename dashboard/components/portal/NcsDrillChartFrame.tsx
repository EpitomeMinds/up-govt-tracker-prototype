"use client";

import { useCallback, useEffect, useState } from "react";
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
  onApplyFilter?: (filters: Partial<{
    state: string;
    city: string;
    functionalArea: string;
    jobType: string;
    q: string;
  }>) => void;
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
    payload?: { postings?: number; vacancies?: number };
  }[];
  label?: string;
  drillable?: boolean;
}) {
  if (!active || !payload?.length) return null;
  const row = payload[0]?.payload;
  const postings = row?.postings;
  const vacancies = row?.vacancies ?? payload[0]?.value;

  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-md">
      <p className="font-semibold text-slate-800">{label}</p>
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
      {drillable && <p className="mt-1 text-[10px] text-blue-600">Click to drill down</p>}
    </div>
  );
}

export default function NcsDrillChartFrame({
  frameId,
  defaultTitle,
  defaultHint,
  size = "default",
  onApplyFilter,
}: Props) {
  const [filters, setFilters] = useState<NcsAnalyticsFilter[]>([]);
  const [analytics, setAnalytics] = useState<NcsFrameAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [slideKey, setSlideKey] = useState(0);

  const load = useCallback(async (activeFilters: NcsAnalyticsFilter[]) => {
    setLoading(true);
    try {
      const data = await getNcsFrameAnalytics(frameId, activeFilters);
      setAnalytics(data);
      setSlideKey((k) => k + 1);
    } catch {
      setAnalytics(null);
    } finally {
      setLoading(false);
    }
  }, [frameId]);

  useEffect(() => {
    load(filters);
  }, [filters, load]);

  const drillInto = (key: string) => {
    if (!analytics?.drillable || !analytics.dimension) return;
    const next = [...filters, { dimension: analytics.dimension, value: key }];
    setFilters(next);
    syncListFilters(next);
  };

  const syncListFilters = (stack: NcsAnalyticsFilter[]) => {
    if (!onApplyFilter) return;
    const patch: Partial<{ state: string; city: string; functionalArea: string; jobType: string; q: string }> = {
      state: "",
      city: "",
      functionalArea: "",
      jobType: "",
      q: "",
    };
    for (const f of stack) {
      if (f.dimension === "state") patch.state = f.value;
      if (f.dimension === "city") patch.city = f.value;
      if (f.dimension === "functionalArea") patch.functionalArea = f.value;
      if (f.dimension === "jobType") patch.jobType = f.value;
      if (f.dimension === "functionalRole" || f.dimension === "jobTitle") patch.q = f.value;
      if (f.dimension === "organization") patch.q = f.value;
    }
    onApplyFilter(patch);
  };

  const goToLevel = (level: number) => {
    const next = filters.slice(0, level);
    setFilters(next);
    syncListFilters(next);
  };

  const goBack = () => {
    if (filters.length === 0) return;
    goToLevel(filters.length - 1);
  };

  const reset = () => {
    setFilters([]);
    onApplyFilter?.({});
  };

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
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {filters.length > 0 && (
            <>
              <button type="button" onClick={goBack} className="portal-btn-ghost px-2 py-1 text-[11px]">
                ← Back
              </button>
              <button type="button" onClick={reset} className="portal-btn-ghost px-2 py-1 text-[11px]">
                Reset
              </button>
            </>
          )}
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
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/70">
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
        <Tooltip formatter={(v: number) => [v.toLocaleString("en-IN"), "Postings"]} />
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
