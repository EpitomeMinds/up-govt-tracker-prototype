"use client";

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
import type { ExtendedAnalytics } from "@/lib/jobAnalytics";
import { formatCount } from "@/lib/jobAnalytics";
import {
  CHART_COLORS,
  EDUCATION_COLORS,
  formatAxisNumber,
  LABOUR_COLORS,
  PIE_PALETTE,
  truncateLabel,
} from "@/lib/chartTheme";
import ChartCard from "@/components/charts/ChartCard";

export const VACANCY_CHART_COLORS = {
  listings: CHART_COLORS.listings,
  vacancies: CHART_COLORS.vacancies,
  skilled: LABOUR_COLORS.skilled,
  unskilled: LABOUR_COLORS.unskilled,
  accent: "#2563eb",
} as const;

const TICK = { fontSize: 11, fill: "#475569" };
const TICK_AXIS = { fontSize: 10, fill: "#64748b" };
const MARGIN = { top: 8, right: 12, left: 8, bottom: 4 };
const MARGIN_DUAL = { top: 8, right: 36, left: 36, bottom: 4 };
const MARGIN_H = { top: 4, right: 16, left: 4, bottom: 4 };

function VacancyTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-bi-border/60 bg-white/95 px-3.5 py-2.5 text-xs shadow-widget backdrop-blur-sm">
      {label && <p className="mb-1.5 font-bold text-bi-title">{label}</p>}
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: {formatCount(p.value)}
        </p>
      ))}
    </div>
  );
}

export function VacancyKpiStrip({
  items,
  accent = "#2563eb",
}: {
  items: { label: string; value: string; hint?: string; color?: string }[];
  accent?: string;
}) {
  return (
    <div className="bi-stat-strip" style={{ borderLeftColor: accent }}>
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
        {items.map((item) => (
          <div key={item.label} className="bi-stat-strip-item">
            <span className="bi-stat-strip-label">{item.label}</span>
            <span className="bi-stat-strip-value" style={{ color: item.color || accent }}>
              {item.value}
            </span>
            {item.hint && <span className="bi-stat-strip-hint">({item.hint})</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

export function LabourClusteredChart({
  data,
  height = 240,
  fill = false,
  onClick,
}: {
  data: { key: string; name: string; listings: number; vacancies: number }[];
  height?: number;
  fill?: boolean;
  onClick?: (key: string) => void;
}) {
  const maxListings = Math.max(...data.map((d) => d.listings), 1);
  const maxVacancies = Math.max(...data.map((d) => d.vacancies), 1);

  return (
    <ChartCard title="Listings vs vacancies" height={height} fill={fill}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={MARGIN_DUAL} barGap={4} barCategoryGap="20%">
          <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} vertical={false} />
          <XAxis dataKey="name" tick={TICK} />
          <YAxis
            yAxisId="listings"
            orientation="left"
            tick={TICK_AXIS}
            tickFormatter={formatAxisNumber}
            width={40}
            domain={[0, Math.ceil(maxListings * 1.15)]}
            stroke={VACANCY_CHART_COLORS.listings}
            tickLine={{ stroke: VACANCY_CHART_COLORS.listings }}
            axisLine={{ stroke: VACANCY_CHART_COLORS.listings }}
          />
          <YAxis
            yAxisId="vacancies"
            orientation="right"
            tick={TICK_AXIS}
            tickFormatter={formatAxisNumber}
            width={44}
            domain={[0, Math.ceil(maxVacancies * 1.1)]}
            stroke={VACANCY_CHART_COLORS.vacancies}
            tickLine={{ stroke: VACANCY_CHART_COLORS.vacancies }}
            axisLine={{ stroke: VACANCY_CHART_COLORS.vacancies }}
          />
          <Tooltip content={<VacancyTooltip />} />
          <Legend wrapperStyle={{ fontSize: 11, paddingTop: 4 }} iconSize={10} />
          <Bar
            yAxisId="listings"
            dataKey="listings"
            name="Listings"
            fill={VACANCY_CHART_COLORS.listings}
            radius={[4, 4, 0, 0]}
            maxBarSize={28}
            cursor="pointer"
            onClick={(d) => {
              const k =
                (d as { key?: string; payload?: { key?: string } }).key ??
                (d as { payload?: { key?: string } }).payload?.key;
              if (k && onClick) onClick(String(k));
            }}
          />
          <Bar
            yAxisId="vacancies"
            dataKey="vacancies"
            name="Vacancies"
            fill={VACANCY_CHART_COLORS.vacancies}
            radius={[4, 4, 0, 0]}
            maxBarSize={28}
            cursor="pointer"
            onClick={(d) => {
              const k =
                (d as { key?: string; payload?: { key?: string } }).key ??
                (d as { payload?: { key?: string } }).payload?.key;
              if (k && onClick) onClick(String(k));
            }}
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function HorizontalVacancyChart({
  title,
  data,
  dataKey = "vacancies",
  fill = VACANCY_CHART_COLORS.accent,
  height = 240,
  fillHeight = false,
  maxItems,
  onClick,
}: {
  title: string;
  data: { key: string; name: string; vacancies: number; listings?: number }[];
  dataKey?: string;
  fill?: string;
  height?: number;
  fillHeight?: boolean;
  maxItems?: number;
  onClick?: (key: string) => void;
}) {
  const chartData = (maxItems ? data.slice(0, maxItems) : data).map((d) => ({
    ...d,
    label: truncateLabel(d.name, 24),
  }));

  const rowHeight = 26;
  const scrollHeight = Math.max(160, chartData.length * rowHeight + 32);
  const barSize = chartData.length > 12 ? 14 : 16;

  const chart = (
    <ResponsiveContainer width="100%" height={fillHeight ? scrollHeight : height}>
      <BarChart
        data={chartData}
        layout="vertical"
        margin={{ ...MARGIN_H, left: 8 }}
        barSize={barSize}
      >
        <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} horizontal={false} />
        <XAxis type="number" tick={TICK_AXIS} tickFormatter={formatAxisNumber} />
        <YAxis type="category" dataKey="label" tick={TICK} width={120} interval={0} />
        <Tooltip formatter={(v: number) => [formatCount(v), "Vacancies"]} />
        <Bar
          dataKey={dataKey}
          fill={fill}
          radius={[0, 4, 4, 0]}
          cursor="pointer"
          onClick={(d) => {
            const k =
              (d as { key?: string; payload?: { key?: string } }).key ??
              (d as { payload?: { key?: string } }).payload?.key;
            if (k && onClick) onClick(String(k));
          }}
        />
      </BarChart>
    </ResponsiveContainer>
  );

  return (
    <ChartCard title={title} height={height} fill={fillHeight}>
      {fillHeight && chartData.length > 8 ? (
        <div className="h-full min-h-0 overflow-y-auto overflow-x-hidden pr-1">{chart}</div>
      ) : (
        chart
      )}
    </ChartCard>
  );
}

export function ShareDonutChart({
  title,
  data,
  height = 240,
  fill = false,
  onClick,
}: {
  title: string;
  data: { key: string; name: string; value: number; fill: string }[];
  height?: number;
  fill?: boolean;
  onClick?: (key: string) => void;
}) {
  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <ChartCard title={title} height={height} fill={fill}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="42%"
            cy="50%"
            innerRadius="48%"
            outerRadius="78%"
            paddingAngle={2}
            cursor="pointer"
            onClick={(_, i) => { const item = data[i]; if (item && onClick) onClick(item.key); }}
          >
            {data.map((e) => (
              <Cell key={e.key} fill={e.fill} stroke="#fff" strokeWidth={2} />
            ))}
          </Pie>
          <Tooltip formatter={(v: number, n: string) => [`${formatCount(v)} (${total ? Math.round((v / total) * 100) : 0}%)`, n]} />
          <Legend layout="vertical" align="right" verticalAlign="middle" wrapperStyle={{ fontSize: 11, paddingLeft: 8 }} iconSize={9} />
        </PieChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function StackedLabourChart({
  data,
  height = 240,
  fill = false,
  onClick,
}: {
  data: { key: string; name: string; skilled: number; semi_skilled: number; unskilled: number; general: number }[];
  height?: number;
  fill?: boolean;
  onClick?: (key: string) => void;
}) {
  const chartData = data.slice(0, 6).map((d) => ({ ...d, label: truncateLabel(d.name, 14) }));

  return (
    <ChartCard title="Labour mix by sector" height={height} fill={fill}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ ...MARGIN, bottom: 28 }} barSize={28}>
          <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} vertical={false} />
          <XAxis dataKey="label" tick={TICK_AXIS} interval={0} angle={-20} textAnchor="end" height={44} />
          <YAxis tick={TICK_AXIS} tickFormatter={formatAxisNumber} width={48} />
          <Tooltip content={<VacancyTooltip />} />
          <Legend wrapperStyle={{ fontSize: 11 }} iconSize={9} />
          <Bar dataKey="skilled" name="Skilled" stackId="s" fill={LABOUR_COLORS.skilled} cursor="pointer" onClick={(d) => { const k = (d as { key?: string; payload?: { key?: string } }).key ?? (d as { payload?: { key?: string } }).payload?.key; if (k && onClick) onClick(String(k)); }} />
          <Bar dataKey="semi_skilled" name="Semi-skilled" stackId="s" fill={LABOUR_COLORS.semi_skilled} />
          <Bar dataKey="unskilled" name="Unskilled" stackId="s" fill={LABOUR_COLORS.unskilled} />
          <Bar dataKey="general" name="General" stackId="s" fill={LABOUR_COLORS.general} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function CityShareDonutChart({
  data,
  fill = false,
  onClick,
}: {
  data: { key: string; name: string; vacancies: number; listings?: number }[];
  fill?: boolean;
  onClick?: (key: string) => void;
}) {
  const sorted = [...data].sort((a, b) => b.vacancies - a.vacancies);
  const top = sorted.slice(0, 6);
  const otherVac = sorted.slice(6).reduce((s, c) => s + c.vacancies, 0);
  const CYAN_SHADES = ["#0891b2", "#06b6d4", "#22d3ee", "#67e8f9", "#155e75", "#0e7490"];

  const pieData = [
    ...top.map((c, i) => ({
      key: c.key,
      name: truncateLabel(c.name, 14),
      value: c.vacancies,
      fill: CYAN_SHADES[i % CYAN_SHADES.length],
    })),
    ...(otherVac > 0 ? [{ key: "__other__", name: "Others", value: otherVac, fill: "#cbd5e1" }] : []),
  ];

  return (
    <ShareDonutChart
      title="City vacancy share"
      data={pieData}
      fill={fill}
      onClick={(key) => { if (key !== "__other__" && onClick) onClick(key); }}
    />
  );
}

export function CityRankingPanel({
  cities,
  selectedCityId,
  onSelect,
}: {
  cities: { key: string; name: string; vacancies: number; listings?: number }[];
  selectedCityId: string;
  onSelect: (key: string) => void;
}) {
  const sorted = [...cities].sort((a, b) => b.vacancies - a.vacancies);
  const maxVac = sorted[0]?.vacancies ?? 1;
  const totalVac = sorted.reduce((s, c) => s + c.vacancies, 0);

  return (
    <div className="bi-widget flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="shrink-0 border-b border-bi-border px-3 py-2">
        <p className="text-xs font-bold text-bi-title">City ranking</p>
        <p className="text-[10px] text-bi-muted">Share of {formatCount(totalVac)} vacancies</p>
      </div>
      <div className="min-h-0 flex-1 space-y-1 overflow-hidden p-2">
        {sorted.slice(0, 10).map((c, i) => {
          const pct = totalVac > 0 ? Math.round((c.vacancies / totalVac) * 100) : 0;
          const barPct = Math.round((c.vacancies / maxVac) * 100);
          const active = selectedCityId === c.key;
          return (
            <button
              key={c.key}
              type="button"
              onClick={() => onSelect(c.key)}
              className={`w-full rounded-lg px-2 py-2 text-left transition hover:bg-bi-canvas ${active ? "bg-bi-accentSoft ring-1 ring-bi-accent/30" : ""}`}
            >
              <div className="mb-1 flex items-center gap-2">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-cyan-500/15 text-[10px] font-bold text-cyan-700">{i + 1}</span>
                <span className="min-w-0 flex-1 truncate text-xs font-semibold text-bi-title">{c.name}</span>
                <span className="shrink-0 text-xs font-bold tabular-nums text-cyan-700">{formatCount(c.vacancies)}</span>
                <span className="shrink-0 text-[10px] tabular-nums text-bi-muted">{pct}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-bi-canvas">
                <div className="h-full rounded-full bg-gradient-to-r from-cyan-600 to-cyan-400" style={{ width: `${barPct}%` }} />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function EducationTrendChart({
  data,
  height = 240,
  fill = false,
  onClick,
}: {
  data: { key: string; name: string; vacancies: number }[];
  height?: number;
  fill?: boolean;
  onClick?: (key: string) => void;
}) {
  const chartData = [...data].sort((a, b) => b.vacancies - a.vacancies);

  return (
    <ChartCard title="Education demand" height={height} fill={fill}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ ...MARGIN, bottom: 32 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
          <XAxis dataKey="name" tick={TICK_AXIS} interval={0} angle={-18} textAnchor="end" height={40} />
          <YAxis tick={TICK_AXIS} tickFormatter={formatAxisNumber} width={48} />
          <Tooltip formatter={(v: number) => [formatCount(v), "Vacancies"]} />
          <Line type="monotone" dataKey="vacancies" stroke="#6b8e23" strokeWidth={3} dot={{ r: 4, fill: "#6b8e23", strokeWidth: 0 }} activeDot={{ r: 6, cursor: "pointer" }} onClick={(d) => { const k = (d as { key?: string; payload?: { key?: string } }).key ?? (d as { payload?: { key?: string } }).payload?.key; if (k && onClick) onClick(String(k)); }} />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

function MetricChip({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="text-center">
      <p className="text-[8px] font-bold uppercase text-bi-muted">{label}</p>
      <p className={`text-[10px] font-extrabold tabular-nums ${highlight ? "text-bi-coral" : "text-bi-title"}`}>{value}</p>
    </div>
  );
}

export function BoardRecruiterCard({
  board,
  listings,
  accent,
  avgSkilledPct,
  onClick,
}: {
  board: { key: string; name: string; vacancies: number; skilled: number; unskilled: number };
  listings: number;
  accent: string;
  avgSkilledPct: number;
  onClick: () => void;
}) {
  const total = board.skilled + board.unskilled || board.vacancies || 1;
  const skilledPct = Math.round((board.skilled / total) * 100);
  const unskilledPct = Math.round((board.unskilled / total) * 100);
  const vsAvg = skilledPct - avgSkilledPct;
  const miniBars = [
    { label: "Posts", value: board.vacancies, color: VACANCY_CHART_COLORS.vacancies },
    { label: "Skilled", value: board.skilled, color: LABOUR_COLORS.skilled },
    { label: "Unskilled", value: board.unskilled, color: LABOUR_COLORS.unskilled },
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
            <p className="line-clamp-2 text-xs font-bold text-bi-title">{board.name}</p>
            <p className="mt-0.5 text-[10px] text-bi-muted">{listings} listings</p>
          </div>
          <span className="shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold tabular-nums" style={{ backgroundColor: `${accent}18`, color: accent }}>
            {formatCount(board.vacancies)} posts
          </span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-1 border-b border-bi-border/40 px-3 py-2">
        {miniBars.map((b) => (
          <div key={b.label} className="text-center">
            <p className="text-[8px] font-bold uppercase text-bi-muted">{b.label}</p>
            <p className="text-[11px] font-extrabold tabular-nums text-bi-title">{formatCount(b.value)}</p>
          </div>
        ))}
      </div>

      <div className="px-3 py-2">
        <div className="mb-1 flex h-12 items-end gap-1">
          {miniBars.map((b) => (
            <div key={b.label} className="flex flex-1 flex-col items-center gap-0.5">
              <div
                className="w-full rounded-t-sm"
                style={{ height: `${Math.max(8, (b.value / maxBar) * 100)}%`, backgroundColor: b.color, opacity: 0.9 }}
              />
              <span className="text-[8px] text-bi-muted">{b.label}</span>
            </div>
          ))}
        </div>
        <div className="mb-2 flex h-3 overflow-hidden rounded-full">
          {skilledPct > 0 && <div style={{ width: `${skilledPct}%`, backgroundColor: LABOUR_COLORS.skilled }} title={`Skilled ${skilledPct}%`} />}
          {unskilledPct > 0 && <div style={{ width: `${unskilledPct}%`, backgroundColor: LABOUR_COLORS.unskilled }} title={`Unskilled ${unskilledPct}%`} />}
        </div>
      </div>

      <div className="mt-auto grid grid-cols-3 gap-1 border-t border-bi-border/40 bg-bi-canvas/40 px-3 py-2">
        <MetricChip label="Skilled" value={`${skilledPct}%`} />
        <MetricChip label="Unskilled" value={`${unskilledPct}%`} />
        <MetricChip label="vs avg" value={`${vsAvg >= 0 ? "+" : ""}${vsAvg}%`} highlight={vsAvg > 10} />
      </div>
    </button>
  );
}

export function LabourTypeCard({
  item,
  totalVacancies,
  onClick,
}: {
  item: { key: string; name: string; listings: number; vacancies: number };
  totalVacancies: number;
  onClick: () => void;
}) {
  const color = LABOUR_COLORS[item.key as keyof typeof LABOUR_COLORS] || "#64748b";
  const share = totalVacancies > 0 ? Math.round((item.vacancies / totalVacancies) * 100) : 0;
  const ratio = item.listings > 0 ? (item.vacancies / item.listings).toFixed(1) : "—";

  return (
    <button
      type="button"
      onClick={onClick}
      className="bi-widget flex flex-col overflow-hidden p-3 text-left transition hover:shadow-widget-hover"
      style={{ borderTop: `3px solid ${color}` }}
    >
      <p className="text-xs font-bold text-bi-title">{item.name}</p>
      <p className="mt-1 text-2xl font-extrabold tabular-nums" style={{ color }}>{formatCount(item.vacancies)}</p>
      <p className="text-[10px] text-bi-muted">{share}% of total demand</p>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-bi-canvas">
        <div className="h-full rounded-full" style={{ width: `${share}%`, backgroundColor: color }} />
      </div>
      <div className="mt-auto grid grid-cols-2 gap-2 pt-3">
        <MetricChip label="Listings" value={formatCount(item.listings)} />
        <MetricChip label="Posts/listing" value={String(ratio)} />
      </div>
    </button>
  );
}

export function QualDemandCard({
  item,
  rank,
  maxVacancies,
  onClick,
}: {
  item: { key: string; name: string; listings: number; vacancies: number };
  rank: number;
  maxVacancies: number;
  onClick: () => void;
}) {
  const pct = maxVacancies > 0 ? Math.round((item.vacancies / maxVacancies) * 100) : 0;

  return (
    <button
      type="button"
      onClick={onClick}
      className="bi-widget flex flex-col overflow-hidden p-3 text-left transition hover:shadow-widget-hover"
      style={{ borderTop: "3px solid #6c5ce7" }}
    >
      <div className="flex items-start gap-2">
        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-bi-violet/15 text-[9px] font-bold text-bi-violet">{rank}</span>
        <p className="line-clamp-2 text-xs font-bold text-bi-title">{item.name}</p>
      </div>
      <p className="mt-2 text-xl font-extrabold tabular-nums text-bi-violet">{formatCount(item.vacancies)}</p>
      <p className="text-[10px] text-bi-muted">{item.listings} listings</p>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-bi-canvas">
        <div className="h-full rounded-full bg-bi-violet" style={{ width: `${pct}%` }} />
      </div>
    </button>
  );
}

export function collapseToTopWithOther<
  T extends { key: string; name: string; vacancies: number },
>(rows: T[], topN = 12): T[] {
  if (rows.length <= topN) return rows;
  const top = rows.slice(0, topN);
  const rest = rows.slice(topN);
  const otherVacancies = rest.reduce((s, r) => s + r.vacancies, 0);
  return [
    ...top,
    {
      key: "__other__",
      name: `Other (${rest.length} boards)`,
      vacancies: otherVacancies,
    } as T,
  ];
}

export function buildOverviewCharts(analytics: ExtendedAnalytics) {
  const labourPie = analytics.labourChartData.map((item, i) => ({
    key: item.key,
    name: item.name,
    value: item.vacancies,
    fill: LABOUR_COLORS[item.key as keyof typeof LABOUR_COLORS] || PIE_PALETTE[i % PIE_PALETTE.length],
  }));

  const categoryBars = analytics.byCategory.map((c) => ({
    key: c.key,
    name: c.label,
    vacancies: c.vacancies,
    listings: c.count,
  }));

  const applicationPie = analytics.applicationBars.map((item, i) => ({
    key: item.key,
    name: item.name,
    value: item.vacancies,
    fill: PIE_PALETTE[(i + 2) % PIE_PALETTE.length],
  }));

  const educationPie = analytics.educationBars.map((item, i) => ({
    key: item.key,
    name: item.name,
    value: item.vacancies,
    fill: EDUCATION_COLORS[i % EDUCATION_COLORS.length],
  }));

  const boardBars = analytics.boardVacancyBars.map((b) => ({
    key: b.key,
    name: b.name,
    vacancies: b.vacancies,
    listings: 0,
  }));

  return { labourPie, categoryBars, applicationPie, educationPie, boardBars };
}
