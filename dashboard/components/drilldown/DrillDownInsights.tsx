"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
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
  LABOUR_COLORS,
  PIE_PALETTE,
  truncateLabel,
} from "@/lib/chartTheme";
import AnalyticsTooltip from "@/components/charts/AnalyticsTooltip";

interface PieItem {
  key: string;
  name: string;
  value: number;
  fill: string;
}

interface Props {
  title: string;
  analytics: ExtendedAnalytics;
  totalInState: number;
  onDrillDown: (dimension: string, key: string) => void;
  onClear: () => void;
}

export default function DrillDownInsights({
  title,
  analytics,
  totalInState,
  onDrillDown,
  onClear,
}: Props) {
  const labourPie: PieItem[] = analytics.byLabour.map((item, i) => ({
    key: item.key,
    name: item.label,
    value: item.vacancies,
    fill:
      LABOUR_COLORS[item.key as keyof typeof LABOUR_COLORS] ||
      PIE_PALETTE[i % PIE_PALETTE.length],
  }));

  const categoryPie: PieItem[] = analytics.byCategory.map((item, i) => ({
    key: item.key,
    name: item.label,
    value: item.vacancies,
    fill: PIE_PALETTE[i % PIE_PALETTE.length],
  }));

  const educationPie: PieItem[] = analytics.byEducation.map((item, i) => ({
    key: item.key,
    name: item.label,
    value: item.vacancies,
    fill: EDUCATION_COLORS[i % EDUCATION_COLORS.length],
  }));

  const applicationPie: PieItem[] = analytics.byApplication.map((item, i) => ({
    key: item.key,
    name: item.label,
    value: item.vacancies,
    fill: PIE_PALETTE[(i + 2) % PIE_PALETTE.length],
  }));

  const sharePct =
    totalInState > 0
      ? Math.round((analytics.totalVacancies / totalInState) * 100)
      : 0;

  const boardBars = analytics.boardVacancyBars.slice(0, 8).map((b) => ({
    key: b.key,
    name: truncateLabel(b.name, 18),
    skilled: b.skilled,
    unskilled: b.unskilled,
    total: b.vacancies,
  }));

  const qualBars = analytics.qualDemandBars.slice(0, 8).map((q) => ({
    key: q.key,
    name: truncateLabel(q.name, 14),
    vacancies: q.vacancies,
    listings: q.listings,
  }));

  const categoryLabour = analytics.categoryLabourStack.slice(0, 6).map((c) => ({
    name: truncateLabel(c.name, 12),
    key: c.key,
    skilled: c.skilled,
    semi_skilled: c.semi_skilled,
    unskilled: c.unskilled,
    general: c.general,
  }));

  return (
    <section className="overflow-hidden rounded-2xl border-2 border-orange-200 bg-gradient-to-br from-orange-50/80 via-white to-sky-50/50 shadow-md">
      <div className="flex flex-col gap-3 border-b border-orange-100 bg-white/70 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-orange-600">
            Drill-down analysis
          </p>
          <h2 className="text-lg font-bold text-slate-900 sm:text-xl">{title}</h2>
          <p className="mt-0.5 text-sm text-slate-500">
            {formatCount(analytics.totalListings)} listings ·{" "}
            {formatCount(analytics.totalVacancies)} vacancies
            {sharePct > 0 && sharePct < 100 && (
              <> · {sharePct}% of state total</>
            )}
          </p>
        </div>
        <button
          type="button"
          onClick={onClear}
          className="shrink-0 rounded-lg border border-orange-200 bg-white px-4 py-2 text-sm font-semibold text-orange-700 shadow-sm hover:bg-orange-50"
        >
          Exit drill-down ×
        </button>
      </div>

      <div className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-4">
        <DonutCard
          title="Labour type mix"
          data={labourPie}
          dimension="labourType"
          onDrillDown={onDrillDown}
        />
        <DonutCard
          title="Job category mix"
          data={categoryPie}
          dimension="postCategory"
          onDrillDown={onDrillDown}
        />
        <DonutCard
          title="Education requirement"
          data={educationPie}
          dimension="educationTier"
          onDrillDown={onDrillDown}
        />
        <DonutCard
          title="Application mode"
          data={applicationPie}
          dimension="applicationType"
          onDrillDown={onDrillDown}
        />
      </div>

      <div className="grid gap-3 px-4 pb-4 xl:grid-cols-2">
        <ChartBox title="Top recruiters">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={boardBars} layout="vertical" margin={{ left: 8, right: 12 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10 }} />
              <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 9 }} />
              <Tooltip content={<AnalyticsTooltip valueLabel="Vacancies" />} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar
                dataKey="skilled"
                name="Skilled"
                stackId="b"
                fill={LABOUR_COLORS.skilled}
                cursor="pointer"
                onClick={(d) => clickBar(onDrillDown, "board", d)}
              />
              <Bar
                dataKey="unskilled"
                name="Unskilled"
                stackId="b"
                fill={LABOUR_COLORS.unskilled}
                radius={[0, 4, 4, 0]}
                cursor="pointer"
                onClick={(d) => clickBar(onDrillDown, "board", d)}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartBox>

        <ChartBox title="Qualification demand">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={qualBars} margin={{ bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 9 }} interval={0} angle={-25} textAnchor="end" height={50} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip content={<AnalyticsTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar
                dataKey="vacancies"
                name="Vacancies"
                fill={CHART_COLORS.primary}
                radius={[4, 4, 0, 0]}
                cursor="pointer"
                onClick={(d) => clickBar(onDrillDown, "qualification", d)}
              />
              <Bar
                dataKey="listings"
                name="Listings"
                fill={CHART_COLORS.listings}
                radius={[4, 4, 0, 0]}
                cursor="pointer"
                onClick={(d) => clickBar(onDrillDown, "qualification", d)}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartBox>
      </div>

      <div className="px-4 pb-4">
        <ChartBox
          title="Category × labour composition"
        >
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={categoryLabour} margin={{ bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 9 }} interval={0} angle={-20} textAnchor="end" height={45} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip content={<AnalyticsTooltip valueLabel="Vacancies" />} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="skilled" name="Skilled" stackId="s" fill={LABOUR_COLORS.skilled} cursor="pointer" onClick={(d) => clickBar(onDrillDown, "postCategory", d)} />
              <Bar dataKey="semi_skilled" name="Semi-skilled" stackId="s" fill={LABOUR_COLORS.semi_skilled} cursor="pointer" onClick={(d) => clickBar(onDrillDown, "postCategory", d)} />
              <Bar dataKey="unskilled" name="Unskilled" stackId="s" fill={LABOUR_COLORS.unskilled} cursor="pointer" onClick={(d) => clickBar(onDrillDown, "postCategory", d)} />
              <Bar dataKey="general" name="General" stackId="s" fill={LABOUR_COLORS.general} radius={[4, 4, 0, 0]} cursor="pointer" onClick={(d) => clickBar(onDrillDown, "postCategory", d)} />
            </BarChart>
          </ResponsiveContainer>
        </ChartBox>
      </div>
    </section>
  );
}

function DonutCard({
  title,
  data,
  dimension,
  onDrillDown,
}: {
  title: string;
  data: PieItem[];
  dimension: string;
  onDrillDown: (dimension: string, key: string) => void;
}) {
  const total = data.reduce((s, d) => s + d.value, 0);

  if (total === 0) {
    return (
      <ChartBox title={title}>
        <p className="flex h-[200px] items-center justify-center text-xs text-slate-400">
          No data in this slice
        </p>
      </ChartBox>
    );
  }

  return (
    <ChartBox title={title}>
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={48}
            outerRadius={72}
            paddingAngle={2}
            cursor="pointer"
            onClick={(_, index) => {
              const item = data[index];
              if (item) onDrillDown(dimension, item.key);
            }}
          >
            {data.map((entry) => (
              <Cell key={entry.key} fill={entry.fill} stroke="#fff" strokeWidth={2} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number, name: string) => [
              `${formatCount(value)} (${Math.round((value / total) * 100)}%)`,
              name,
            ]}
          />
          <Legend wrapperStyle={{ fontSize: 10 }} />
        </PieChart>
      </ResponsiveContainer>
    </ChartBox>
  );
}

function ChartBox({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-200/80 bg-white p-3 shadow-sm">
      <p className="text-sm font-semibold text-slate-800">{title}</p>
      <div className="mt-2">{children}</div>
    </div>
  );
}

function clickBar(
  onDrillDown: (dimension: string, key: string) => void,
  dimension: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any
) {
  const key = data?.key ?? data?.payload?.key;
  if (key) onDrillDown(dimension, String(key));
}
