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
import type { CityDetailStats } from "@/lib/upCities";
import { formatCount } from "@/lib/jobAnalytics";
import { EDUCATION_COLORS, LABOUR_COLORS, PIE_PALETTE } from "@/lib/chartTheme";
import AnalyticsTooltip from "@/components/charts/AnalyticsTooltip";

interface Props {
  detail: CityDetailStats;
  label?: string;
  onClear: () => void;
  onFilterLabour: (type: string) => void;
  onFilterCategory: (cat: string) => void;
  onFilterEducation?: (tier: string) => void;
}

export default function CityDetailPanel({
  detail,
  label = "Location drill-down",
  onClear,
  onFilterLabour,
  onFilterCategory,
  onFilterEducation,
}: Props) {
  const labourPie = detail.byLabour.map((l, i) => ({
    key: l.key,
    name: l.label,
    value: l.vacancies,
    fill:
      LABOUR_COLORS[l.key as keyof typeof LABOUR_COLORS] ||
      PIE_PALETTE[i % PIE_PALETTE.length],
  }));

  const categoryPie = detail.byCategory.map((c, i) => ({
    key: c.key,
    name: c.label.length > 12 ? `${c.label.slice(0, 11)}…` : c.label,
    value: c.vacancies,
    fill: PIE_PALETTE[i % PIE_PALETTE.length],
  }));

  const educationPie = detail.byEducation.map((e, i) => ({
    key: e.key,
    name: e.label.length > 10 ? `${e.label.slice(0, 9)}…` : e.label,
    value: e.vacancies,
    fill: EDUCATION_COLORS[i % EDUCATION_COLORS.length],
  }));

  const boardBars = detail.topBoards.slice(0, 6).map((b) => ({
    name: b.board.length > 14 ? `${b.board.slice(0, 13)}…` : b.board,
    vacancies: b.vacancies,
  }));

  return (
    <div className="card flex h-full max-h-[340px] flex-col overflow-hidden border-orange-200">
      <div className="border-b border-orange-100 bg-gradient-to-r from-orange-50 to-white px-4 py-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-orange-600">
              {label}
            </p>
            <h3 className="text-lg font-bold text-slate-900">{detail.cityName}</h3>
          </div>
          <button
            type="button"
            onClick={onClear}
            className="rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50"
          >
            ×
          </button>
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <MiniStat label="Vacancies" value={formatCount(detail.vacancies)} />
          <MiniStat label="Listings" value={String(detail.listings)} />
          <MiniStat label="Skilled" value={formatCount(detail.skilledVacancies)} accent="text-emerald-700" />
          <MiniStat label="Unskilled" value={formatCount(detail.unskilledVacancies)} accent="text-red-700" />
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-3">
        <div className="grid grid-cols-3 gap-1">
          <PieBlock
            title="Labour"
            data={labourPie}
            onSlice={(key) => onFilterLabour(key)}
          />
          <PieBlock
            title="Category"
            data={categoryPie}
            onSlice={(key) => onFilterCategory(key)}
          />
          {onFilterEducation && educationPie.length > 0 ? (
            <PieBlock
              title="Education"
              data={educationPie}
              onSlice={(key) => onFilterEducation(key)}
            />
          ) : null}
        </div>

        {boardBars.length > 0 && (
          <div>
            <p className="mb-1 text-[10px] font-semibold uppercase text-slate-400">
              Top boards
            </p>
            <ResponsiveContainer width="100%" height={120}>
              <BarChart data={boardBars} layout="vertical" margin={{ left: 0, right: 4 }}>
                <XAxis type="number" tick={{ fontSize: 9 }} hide />
                <YAxis type="category" dataKey="name" width={72} tick={{ fontSize: 8 }} />
                <Tooltip content={<AnalyticsTooltip />} />
                <Bar dataKey="vacancies" name="Vacancies" fill="#2563eb" radius={[0, 3, 3, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {detail.topQualifications.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {detail.topQualifications.slice(0, 6).map((q) => (
              <span
                key={q.qual}
                className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-800"
              >
                {q.qual}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function MiniStat({
  label,
  value,
  accent = "text-slate-900",
}: {
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <div className="rounded-lg bg-white px-2 py-1 ring-1 ring-slate-200/80">
      <p className="text-[9px] text-slate-500">{label}</p>
      <p className={`text-sm font-bold tabular-nums ${accent}`}>{value}</p>
    </div>
  );
}

function PieBlock({
  title,
  data,
  onSlice,
}: {
  title: string;
  data: { key: string; name: string; value: number; fill: string }[];
  onSlice: (key: string) => void;
}) {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) return null;

  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50/50 p-1">
      <p className="text-center text-[10px] font-semibold text-slate-600">{title}</p>
      <ResponsiveContainer width="100%" height={100}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            cx="50%"
            cy="50%"
            innerRadius={22}
            outerRadius={38}
            paddingAngle={1}
            cursor="pointer"
            onClick={(_, i) => data[i] && onSlice(data[i].key)}
          >
            {data.map((d) => (
              <Cell key={d.key} fill={d.fill} stroke="#fff" strokeWidth={1} />
            ))}
          </Pie>
          <Tooltip formatter={(v: number) => formatCount(v)} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
