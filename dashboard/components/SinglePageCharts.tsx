"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  RadialBar,
  RadialBarChart,
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
import MiniChart from "@/components/MiniChart";
import AnalyticsTooltip from "@/components/charts/AnalyticsTooltip";
import type { SliceItem } from "@/components/charts/ChartParts";

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

function MiniDonut({
  data,
  dimension,
  onDrillDown,
}: {
  data: SliceItem[];
  dimension: string;
  onDrillDown: Props["onDrillDown"];
}) {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) {
    return <p className="flex h-full items-center justify-center text-[10px] text-slate-400">No data</p>;
  }
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          innerRadius="45%"
          outerRadius="75%"
          paddingAngle={1}
          cursor="pointer"
          onClick={(_, i) => data[i] && onDrillDown(dimension, data[i].key)}
        >
          {data.map((d) => (
            <Cell key={d.key} fill={d.fill} stroke="#fff" strokeWidth={1} />
          ))}
        </Pie>
        <Tooltip
          formatter={(v: number, name: string) => [
            `${formatCount(v)} (${Math.round((v / total) * 100)}%)`,
            name,
          ]}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

export default function SinglePageCharts({ analytics, onDrillDown }: Props) {
  const labourPie: SliceItem[] = analytics.labourChartData.map((item, i) => ({
    key: item.key,
    name: item.name,
    value: item.vacancies,
    fill: LABOUR_COLORS[item.key as keyof typeof LABOUR_COLORS] || PIE_PALETTE[i % PIE_PALETTE.length],
  }));

  const categoryPie: SliceItem[] = analytics.byCategory.map((item, i) => ({
    key: item.key,
    name: truncateLabel(item.label, 10),
    value: item.vacancies,
    fill: PIE_PALETTE[i % PIE_PALETTE.length],
  }));

  const educationPie: SliceItem[] = analytics.educationBars.map((item, i) => ({
    key: item.key,
    name: truncateLabel(item.name, 8),
    value: item.vacancies,
    fill: EDUCATION_COLORS[i % EDUCATION_COLORS.length],
  }));

  const applicationPie: SliceItem[] = analytics.applicationBars.map((item, i) => ({
    key: item.key,
    name: item.name,
    value: item.vacancies,
    fill: PIE_PALETTE[(i + 3) % PIE_PALETTE.length],
  }));

  const boardBars = analytics.boardVacancyBars.slice(0, 6).map((b) => ({
    key: b.key,
    name: truncateLabel(b.name, 12),
    skilled: b.skilled,
    unskilled: b.unskilled,
  }));

  const qualRadial = analytics.qualDemandBars.slice(0, 6).map((q, i) => ({
    key: q.key,
    name: truncateLabel(q.name, 10),
    vacancies: q.vacancies,
    fill: PIE_PALETTE[i % PIE_PALETTE.length],
  }));

  const categoryLabour = analytics.categoryLabourStack.slice(0, 5).map((c) => ({
    name: truncateLabel(c.name, 8),
    key: c.key,
    skilled: c.skilled,
    unskilled: c.unskilled,
  }));

  const cityArea = analytics.byCity.slice(0, 8).map((c) => ({
    key: c.key,
    name: truncateLabel(c.name, 8),
    vacancies: c.vacancies,
  }));

  return (
    <>
      <MiniChart title="Labour mix" className="col-span-2">
        <MiniDonut data={labourPie} dimension="labourType" onDrillDown={onDrillDown} />
      </MiniChart>
      <MiniChart title="Sectors" className="col-span-2">
        <MiniDonut data={categoryPie} dimension="postCategory" onDrillDown={onDrillDown} />
      </MiniChart>
      <MiniChart title="Education" className="col-span-2">
        <MiniDonut data={educationPie} dimension="educationTier" onDrillDown={onDrillDown} />
      </MiniChart>
      <MiniChart title="Application" className="col-span-2">
        <MiniDonut data={applicationPie} dimension="applicationType" onDrillDown={onDrillDown} />
      </MiniChart>

      <MiniChart title="Top boards" className="col-span-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={boardBars} layout="vertical" margin={{ left: 0, right: 4 }}>
            <XAxis type="number" hide tickFormatter={formatAxisNumber} />
            <YAxis type="category" dataKey="name" width={72} tick={{ fontSize: 8 }} />
            <Tooltip content={<AnalyticsTooltip valueLabel="Vacancies" />} />
            <Bar dataKey="skilled" stackId="b" fill={LABOUR_COLORS.skilled} cursor="pointer" onClick={(d) => clickBar(onDrillDown, "board", d)} />
            <Bar dataKey="unskilled" stackId="b" fill={LABOUR_COLORS.unskilled} radius={[0, 2, 2, 0]} cursor="pointer" onClick={(d) => clickBar(onDrillDown, "board", d)} />
          </BarChart>
        </ResponsiveContainer>
      </MiniChart>

      <MiniChart title="Qualifications" className="col-span-4">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart cx="50%" cy="50%" innerRadius="15%" outerRadius="90%" data={qualRadial} startAngle={90} endAngle={-270}>
            <RadialBar dataKey="vacancies" cornerRadius={4} cursor="pointer" onClick={(d) => clickBar(onDrillDown, "qualification", d)}>
              {qualRadial.map((e) => (
                <Cell key={e.key} fill={e.fill} />
              ))}
            </RadialBar>
            <Tooltip formatter={(v: number) => formatCount(v)} />
          </RadialBarChart>
        </ResponsiveContainer>
      </MiniChart>

      <MiniChart title="Category × labour" className="col-span-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={categoryLabour} margin={{ bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
            <XAxis dataKey="name" tick={{ fontSize: 8 }} interval={0} />
            <YAxis tick={{ fontSize: 8 }} tickFormatter={formatAxisNumber} />
            <Tooltip content={<AnalyticsTooltip valueLabel="Vacancies" />} />
            <Bar dataKey="skilled" stackId="s" fill={LABOUR_COLORS.skilled} cursor="pointer" onClick={(d) => clickBar(onDrillDown, "postCategory", d)} />
            <Bar dataKey="unskilled" stackId="s" fill={LABOUR_COLORS.unskilled} radius={[2, 2, 0, 0]} cursor="pointer" onClick={(d) => clickBar(onDrillDown, "postCategory", d)} />
          </BarChart>
        </ResponsiveContainer>
      </MiniChart>

      <MiniChart title="City vacancies" className="col-span-4">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={cityArea}>
            <defs>
              <linearGradient id="cityGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0284c7" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#0284c7" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="name" tick={{ fontSize: 8 }} />
            <YAxis tick={{ fontSize: 8 }} tickFormatter={formatAxisNumber} />
            <Tooltip content={<AnalyticsTooltip valueLabel="Vacancies" />} />
            <Area type="monotone" dataKey="vacancies" stroke="#0284c7" fill="url(#cityGrad)" cursor="pointer" onClick={(d) => clickBar(onDrillDown, "city", d)} />
          </AreaChart>
        </ResponsiveContainer>
      </MiniChart>
    </>
  );
}
