"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
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
import ChartCard from "./ChartCard";
import AnalyticsTooltip from "./AnalyticsTooltip";
import {
  DonutChartCard,
  PieChartCard,
  RadialRankChart,
  type SliceItem,
} from "./ChartParts";

interface Props {
  analytics: ExtendedAnalytics;
  onDrillDown: (dimension: string, key: string) => void;
}

function clickBar(
  onDrillDown: Props["onDrillDown"],
  dimension: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any
) {
  const key = data?.key ?? data?.payload?.key;
  if (key) onDrillDown(dimension, String(key));
}

function labourSlices(analytics: ExtendedAnalytics): SliceItem[] {
  return analytics.labourChartData.map((item, i) => ({
    key: item.key,
    name: item.name,
    value: item.vacancies,
    fill:
      LABOUR_COLORS[item.key as keyof typeof LABOUR_COLORS] ||
      PIE_PALETTE[i % PIE_PALETTE.length],
  }));
}

function categorySlices(analytics: ExtendedAnalytics): SliceItem[] {
  return analytics.byCategory.map((item, i) => ({
    key: item.key,
    name: truncateLabel(item.label, 14),
    value: item.vacancies,
    fill: PIE_PALETTE[i % PIE_PALETTE.length],
  }));
}

function applicationSlices(analytics: ExtendedAnalytics): SliceItem[] {
  return analytics.applicationBars.map((item, i) => ({
    key: item.key,
    name: item.name,
    value: item.vacancies,
    fill: PIE_PALETTE[(i + 3) % PIE_PALETTE.length],
  }));
}

function educationSlices(analytics: ExtendedAnalytics): SliceItem[] {
  return analytics.educationBars.map((item, i) => ({
    key: item.key,
    name: truncateLabel(item.name, 12),
    value: item.vacancies,
    fill: EDUCATION_COLORS[i % EDUCATION_COLORS.length],
  }));
}

export default function AnalyticsCharts({ analytics, onDrillDown }: Props) {
  const cityAreaData = analytics.byCity.slice(0, 12).map((c) => ({
    key: c.key,
    name: truncateLabel(c.name, 10),
    vacancies: c.vacancies,
    listings: c.listings,
  }));

  return (
    <div className="space-y-6">
      {/* Composition — donut overview */}
      <div>
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-slate-400">
          At a glance
        </p>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <DonutChartCard
            title="Workforce mix"
            data={labourSlices(analytics)}
            dimension="labourType"
            onDrillDown={onDrillDown}
            centerLabel={formatCount(analytics.totalVacancies)}
          />
          <DonutChartCard
            title="Sector composition"
            data={categorySlices(analytics)}
            dimension="postCategory"
            onDrillDown={onDrillDown}
            centerLabel={`${analytics.byCategory.length} sectors`}
          />
          <DonutChartCard
            title="Application channels"
            data={applicationSlices(analytics)}
            dimension="applicationType"
            onDrillDown={onDrillDown}
            centerLabel={`${analytics.applicationBars.length} modes`}
          />
        </div>
      </div>

      {/* Workforce comparison */}
      <div>
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-slate-400">
          Workforce depth
        </p>
        <div className="grid gap-4 xl:grid-cols-2">
          <ChartCard
            title="Listings vs vacancies by labour type"
            height={340}
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={analytics.labourChartData}
                margin={{ top: 8, right: 16, left: 0, bottom: 8 }}
                barGap={4}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: CHART_COLORS.axis }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: CHART_COLORS.axis }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={formatAxisNumber}
                />
                <Tooltip content={<AnalyticsTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar
                  dataKey="listings"
                  name="Listings"
                  fill={CHART_COLORS.listings}
                  radius={[4, 4, 0, 0]}
                  cursor="pointer"
                  onClick={(d) => clickBar(onDrillDown, "labourType", d)}
                />
                <Bar
                  dataKey="vacancies"
                  name="Vacancies"
                  fill={CHART_COLORS.vacancies}
                  radius={[4, 4, 0, 0]}
                  cursor="pointer"
                  onClick={(d) => clickBar(onDrillDown, "labourType", d)}
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard
            title="Labour mix by job category"
            height={340}
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={analytics.categoryLabourStack.map((r) => ({
                  ...r,
                  name: truncateLabel(r.name, 18),
                }))}
                layout="vertical"
                margin={{ top: 8, right: 16, left: 8, bottom: 8 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} horizontal={false} />
                <XAxis
                  type="number"
                  tick={{ fontSize: 11, fill: CHART_COLORS.axis }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={formatAxisNumber}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={120}
                  tick={{ fontSize: 10, fill: CHART_COLORS.axis }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<AnalyticsTooltip valueLabel="Vacancies" />} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar
                  dataKey="skilled"
                  name="Skilled"
                  stackId="labour"
                  fill={LABOUR_COLORS.skilled}
                  cursor="pointer"
                  onClick={(d) => clickBar(onDrillDown, "postCategory", d)}
                />
                <Bar
                  dataKey="semi_skilled"
                  name="Semi-skilled"
                  stackId="labour"
                  fill={LABOUR_COLORS.semi_skilled}
                  cursor="pointer"
                  onClick={(d) => clickBar(onDrillDown, "postCategory", d)}
                />
                <Bar
                  dataKey="unskilled"
                  name="Unskilled"
                  stackId="labour"
                  fill={LABOUR_COLORS.unskilled}
                  cursor="pointer"
                  onClick={(d) => clickBar(onDrillDown, "postCategory", d)}
                />
                <Bar
                  dataKey="general"
                  name="General"
                  stackId="labour"
                  fill={LABOUR_COLORS.general}
                  radius={[0, 4, 4, 0]}
                  cursor="pointer"
                  onClick={(d) => clickBar(onDrillDown, "postCategory", d)}
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      </div>

      {/* Education */}
      <div>
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-slate-400">
          Qualification landscape
        </p>
        <div className="grid gap-4 xl:grid-cols-2">
          <PieChartCard
            title="Education tier distribution"
            data={educationSlices(analytics)}
            height={360}
            dimension="educationTier"
            onDrillDown={onDrillDown}
          />

          <ChartCard
            title="Education × labour cross-analysis"
            height={360}
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={analytics.educationLabourGrouped}
                margin={{ top: 8, right: 16, left: 0, bottom: 48 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 10, fill: CHART_COLORS.axis }}
                  axisLine={false}
                  tickLine={false}
                  angle={-25}
                  textAnchor="end"
                  interval={0}
                  height={55}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: CHART_COLORS.axis }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={formatAxisNumber}
                />
                <Tooltip content={<AnalyticsTooltip valueLabel="Vacancies" />} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar
                  dataKey="skilled"
                  name="Skilled"
                  stackId="edu"
                  fill={LABOUR_COLORS.skilled}
                  cursor="pointer"
                  onClick={(d) => clickBar(onDrillDown, "educationTier", d)}
                />
                <Bar
                  dataKey="semi_skilled"
                  name="Semi-skilled"
                  stackId="edu"
                  fill={LABOUR_COLORS.semi_skilled}
                  cursor="pointer"
                  onClick={(d) => clickBar(onDrillDown, "educationTier", d)}
                />
                <Bar
                  dataKey="unskilled"
                  name="Unskilled"
                  stackId="edu"
                  fill={LABOUR_COLORS.unskilled}
                  cursor="pointer"
                  onClick={(d) => clickBar(onDrillDown, "educationTier", d)}
                />
                <Bar
                  dataKey="general"
                  name="General"
                  stackId="edu"
                  fill={LABOUR_COLORS.general}
                  radius={[4, 4, 0, 0]}
                  cursor="pointer"
                  onClick={(d) => clickBar(onDrillDown, "educationTier", d)}
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      </div>

      {/* Recruiters & skills */}
      <div>
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-slate-400">
          Recruiters &amp; credentials
        </p>
        <div className="grid gap-4 xl:grid-cols-2">
          <ChartCard
            title="Top recruitment boards"
            height={400}
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={analytics.boardVacancyBars.map((r) => ({
                  ...r,
                  name: truncateLabel(r.name, 20),
                }))}
                layout="vertical"
                margin={{ top: 8, right: 16, left: 8, bottom: 8 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} horizontal={false} />
                <XAxis
                  type="number"
                  tick={{ fontSize: 11, fill: CHART_COLORS.axis }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={formatAxisNumber}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={130}
                  tick={{ fontSize: 10, fill: CHART_COLORS.axis }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<AnalyticsTooltip valueLabel="Vacancies" />} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar
                  dataKey="skilled"
                  name="Skilled"
                  stackId="board"
                  fill={LABOUR_COLORS.skilled}
                  cursor="pointer"
                  onClick={(d) => clickBar(onDrillDown, "board", d)}
                />
                <Bar
                  dataKey="unskilled"
                  name="Unskilled"
                  stackId="board"
                  fill={LABOUR_COLORS.unskilled}
                  radius={[0, 4, 4, 0]}
                  cursor="pointer"
                  onClick={(d) => clickBar(onDrillDown, "board", d)}
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <RadialRankChart
            title="Qualification demand radar"
            data={analytics.qualDemandBars.map((q, i) => ({
              key: q.key,
              name: q.name,
              vacancies: q.vacancies,
              fill: PIE_PALETTE[i % PIE_PALETTE.length],
            }))}
            height={400}
            dimension="qualification"
            onDrillDown={onDrillDown}
          />
        </div>
      </div>

      {/* Geography */}
      {cityAreaData.length > 0 && (
        <div>
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-slate-400">
            Geographic spread
          </p>
          <div className="grid gap-4 xl:grid-cols-2">
            <ChartCard
              title="City vacancy curve"
              height={320}
            >
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={cityAreaData}
                  margin={{ top: 8, right: 16, left: 0, bottom: 8 }}
                >
                  <defs>
                    <linearGradient id="vacancyGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0284c7" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#0284c7" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 10, fill: CHART_COLORS.axis }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: CHART_COLORS.axis }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={formatAxisNumber}
                  />
                  <Tooltip content={<AnalyticsTooltip valueLabel="Vacancies" />} />
                  <Area
                    type="monotone"
                    dataKey="vacancies"
                    name="Vacancies"
                    stroke="#0284c7"
                    strokeWidth={2}
                    fill="url(#vacancyGrad)"
                    cursor="pointer"
                    onClick={(d) => clickBar(onDrillDown, "city", d)}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard
              title="City rankings"
              height={Math.min(380, cityAreaData.length * 32 + 80)}
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={cityAreaData}
                  layout="vertical"
                  margin={{ top: 8, right: 16, left: 8, bottom: 8 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} horizontal={false} />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 11, fill: CHART_COLORS.axis }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={formatAxisNumber}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={90}
                    tick={{ fontSize: 10, fill: CHART_COLORS.axis }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<AnalyticsTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar
                    dataKey="listings"
                    name="Listings"
                    fill="#38bdf8"
                    cursor="pointer"
                    onClick={(d) => clickBar(onDrillDown, "city", d)}
                  />
                  <Bar
                    dataKey="vacancies"
                    name="Vacancies"
                    fill="#0284c7"
                    radius={[0, 4, 4, 0]}
                    cursor="pointer"
                    onClick={(d) => clickBar(onDrillDown, "city", d)}
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
        </div>
      )}
    </div>
  );
}
