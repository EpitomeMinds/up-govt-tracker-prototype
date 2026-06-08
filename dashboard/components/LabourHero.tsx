"use client";

import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { ExtendedAnalytics } from "@/lib/jobAnalytics";
import { formatCount } from "@/lib/jobAnalytics";
import { LABOUR_COLORS, LABOUR_LABELS } from "@/lib/chartTheme";

interface Props {
  analytics: ExtendedAnalytics;
  onDrillDown: (dimension: string, key: string) => void;
}

export default function LabourHero({ analytics, onDrillDown }: Props) {
  const tiles = [
    {
      key: "skilled",
      label: "Skilled labour",
      color: "from-emerald-500 to-emerald-600",
      ring: "ring-emerald-200",
      metrics: analytics.labourMetrics.skilled,
      pct: analytics.skilledVacancyPct,
    },
    {
      key: "semi_skilled",
      label: "Semi-skilled",
      color: "from-amber-500 to-amber-600",
      ring: "ring-amber-200",
      metrics: analytics.labourMetrics.semi_skilled,
      pct: analytics.semiSkilledVacancyPct,
    },
    {
      key: "unskilled",
      label: "Unskilled labour",
      color: "from-red-500 to-red-600",
      ring: "ring-red-200",
      metrics: analytics.labourMetrics.unskilled,
      pct: analytics.unskilledVacancyPct,
    },
    {
      key: "general",
      label: "General / mixed",
      color: "from-slate-500 to-slate-600",
      ring: "ring-slate-200",
      metrics: analytics.labourMetrics.general,
      pct: Math.max(
        0,
        100 -
          analytics.skilledVacancyPct -
          analytics.unskilledVacancyPct -
          analytics.semiSkilledVacancyPct
      ),
    },
  ];

  const pieData = tiles.map((t) => ({
    key: t.key,
    name: t.label,
    value: t.metrics.vacancies,
    fill: LABOUR_COLORS[t.key as keyof typeof LABOUR_COLORS],
  }));

  const pieTotal = pieData.reduce((s, d) => s + d.value, 0);

  return (
    <section className="mb-6">
      <div className="mb-4 flex items-end justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
            Workforce intelligence
          </p>
          <h2 className="text-xl font-bold text-slate-900">
            Skilled vs unskilled labour analysis
          </h2>
        </div>
        <p className="hidden text-sm text-slate-500 sm:block">
          {formatCount(analytics.totalVacancies)} total vacancies ·{" "}
          {analytics.totalListings} listings
        </p>
      </div>

      <div className="grid gap-4 xl:grid-cols-5">
        <div className="grid gap-4 sm:grid-cols-2 xl:col-span-4 xl:grid-cols-4">
          {tiles.map((tile) => (
            <button
              key={tile.key}
              type="button"
              onClick={() => onDrillDown("labourType", tile.key)}
              className={`group relative overflow-hidden rounded-xl bg-gradient-to-br ${tile.color} p-5 text-left text-white shadow-md ring-2 ${tile.ring} transition hover:scale-[1.02] hover:shadow-lg`}
            >
              <p className="text-xs font-medium uppercase tracking-wide text-white/80">
                {tile.label}
              </p>
              <p className="mt-2 text-3xl font-bold tabular-nums">
                {formatCount(tile.metrics.vacancies)}
              </p>
              <p className="mt-1 text-sm text-white/90">
                vacancies · {tile.metrics.listings} listings
              </p>
              <div className="mt-3 flex items-center gap-2">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/25">
                  <div
                    className="h-full rounded-full bg-white"
                    style={{ width: `${Math.min(tile.pct, 100)}%` }}
                  />
                </div>
                <span className="text-xs font-semibold">{tile.pct}%</span>
              </div>
            </button>
          ))}
        </div>

        <div className="card flex flex-col p-4 xl:col-span-1">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            Vacancy split
          </p>
          <div className="relative flex-1 min-h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius="55%"
                  outerRadius="85%"
                  paddingAngle={2}
                  cursor="pointer"
                  onClick={(_, i) => pieData[i] && onDrillDown("labourType", pieData[i].key)}
                >
                  {pieData.map((d) => (
                    <Cell key={d.key} fill={d.fill} stroke="#fff" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number, name: string) => [
                    `${formatCount(value)} (${pieTotal ? Math.round((value / pieTotal) * 100) : 0}%)`,
                    name,
                  ]}
                />
                <Legend wrapperStyle={{ fontSize: 9 }} iconSize={7} />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute left-1/2 top-[42%] -translate-x-1/2 -translate-y-1/2 text-center">
              <p className="text-lg font-bold tabular-nums text-slate-800">
                {formatCount(pieTotal)}
              </p>
              <p className="text-[9px] text-slate-400">total</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-3 text-xs text-slate-500">
        {(Object.keys(LABOUR_COLORS) as Array<keyof typeof LABOUR_COLORS>).map(
          (k) => (
            <span key={k} className="flex items-center gap-1.5">
              <span
                className="h-2.5 w-2.5 rounded-sm"
                style={{ backgroundColor: LABOUR_COLORS[k] }}
              />
              {LABOUR_LABELS[k]}
            </span>
          )
        )}
      </div>
    </section>
  );
}
