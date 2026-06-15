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
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { InvestmentPredictionsResponse, SectorPrediction } from "@/lib/investmentTypes";
import KpiCard from "@/components/KpiCard";
import ChartCard from "@/components/charts/ChartCard";
import { PIE_PALETTE } from "@/lib/chartTheme";

interface Props {
  data: InvestmentPredictionsResponse;
  selectedId: string | null;
  onSelectSector: (id: string | null) => void;
  syncing: boolean;
  onSync: () => void;
}

const SIGNAL_COLORS = {
  high: "#0078e8",
  medium: "#f5a623",
  low: "#8b95ad",
};

function formatN(n: number) {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
}

export default function InvestmentForecastDashboard({
  data,
  selectedId,
  onSelectSector,
  syncing,
  onSync,
}: Props) {
  const selected =
    data.sectors.find((s) => s.id === selectedId) ?? data.sectors[0] ?? null;

  const barData = data.sectors.slice(0, 12).map((s) => ({
    name: s.name.length > 16 ? `${s.name.slice(0, 15)}…` : s.name,
    fullName: s.name,
    id: s.id,
    predicted: s.predictedOpenings12m,
    confidence: s.confidence,
    signal: s.investmentSignal,
  }));

  const eduData = selected
    ? Object.entries(selected.educationDemand).map(([key, value], i) => ({
        key,
        name: key.replace(/_/g, " "),
        value,
        fill: PIE_PALETTE[i % PIE_PALETTE.length],
      }))
    : [];

  return (
    <div className="space-y-5 pb-8">
      <header className="bi-zone-header">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <span className="bi-zone-badge mb-2 inline-block">Workbook Growth Report</span>
            <h2 className="bi-zone-title">UP &amp; Delhi NCR Jobs Investment Projection</h2>
            <p className="bi-zone-desc">
              Projections are loaded from the workbook across investment projects, skills,
              opportunities, district forecasts, employment rankings, and assumptions.
            </p>
          </div>
          <button type="button" className="btn-primary text-xs" onClick={onSync} disabled={syncing}>
            {syncing ? "Refreshing…" : "Refresh workbook data"}
          </button>
        </div>
        <p className="mt-2 text-[10px] text-bi-muted">
          Model: {data.model} · Generated {new Date(data.generatedAt).toLocaleString("en-IN")}
          {data.meta.lastSync?.synced_at &&
            ` · Sectors synced ${new Date(data.meta.lastSync.synced_at).toLocaleString("en-IN")}`}
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Industries tracked"
          value={String(data.summary.sectorCount)}
          delta={`${data.summary.highGrowthSectors} high-growth`}
          accent="blue"
          icon={
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          }
        />
        <KpiCard
          label="Projected (6 months)"
          value={formatN(data.summary.totalPredicted6m)}
          delta="Across all sectors"
          accent="teal"
          icon={
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          }
        />
        <KpiCard
          label="Projected (2026-2035)"
          value={formatN(data.summary.totalPredicted12m)}
          delta={`${data.summary.avgConfidence}% avg confidence`}
          accent="violet"
          icon={
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          }
        />
        <KpiCard
          label="Top sector"
          value={data.summary.topSectors[0]?.name.slice(0, 20) ?? "—"}
          delta={
            data.summary.topSectors[0]
              ? `${formatN(data.summary.topSectors[0].predicted12m)} openings forecast`
              : "—"
          }
          accent="amber"
          small
          icon={
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
          }
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-12">
        <div className="xl:col-span-4">
          <SectorList
            sectors={data.sectors}
            selectedId={selected?.id ?? null}
            onSelect={onSelectSector}
          />
        </div>
        <div className="xl:col-span-8">
          {selected ? (
            <SectorDrillDown sector={selected} onClose={() => onSelectSector(null)} />
          ) : (
            <div className="bi-widget flex h-full min-h-[320px] items-center justify-center p-8 text-center">
              <p className="text-sm text-bi-muted">
                Select a sector from the list to drill down into predictions, roles, and AI
                rationale.
              </p>
            </div>
          )}
        </div>
      </div>

      <ChartCard
        title="Projected jobs by industry"
        height={340}
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={barData} margin={{ bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e8ebf2" />
            <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-35} textAnchor="end" height={70} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip
              formatter={(v: number) => [formatN(v), "Predicted openings"]}
              labelFormatter={(_, payload) =>
                (payload?.[0]?.payload as { fullName?: string })?.fullName ?? ""
              }
            />
            <Bar
              dataKey="predicted"
              radius={[4, 4, 0, 0]}
              cursor="pointer"
              onClick={(d) => {
                const id = d?.id ?? d?.payload?.id;
                if (id) onSelectSector(String(id));
              }}
            >
              {barData.map((entry) => (
                <Cell
                  key={entry.id}
                  fill={SIGNAL_COLORS[entry.signal as keyof typeof SIGNAL_COLORS] || "#0078e8"}
                  opacity={selected?.id === entry.id ? 1 : 0.75}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {selected && (
        <div className="grid gap-4 lg:grid-cols-2">
          <ChartCard
            title={`${selected.name} — monthly forecast`}
            height={280}
          >
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={selected.timeline}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e8ebf2" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: number) => [v, "Openings"]} />
                <Area
                  type="monotone"
                  dataKey="predicted"
                  stroke="#0078e8"
                  fill="#0078e8"
                  fillOpacity={0.15}
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard
            title="Role demand breakdown"
            height={280}
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={selected.typicalRoles}
                layout="vertical"
                margin={{ left: 8, right: 16 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e8ebf2" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis
                  type="category"
                  dataKey="role"
                  tick={{ fontSize: 9 }}
                  width={120}
                />
                <Tooltip formatter={(v: number) => [v, "Openings"]} />
                <Bar dataKey="predictedOpenings" fill="#6c5ce7" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard
            title="Education demand mix"
            height={280}
          >
            {eduData.length === 0 ? (
              <p className="flex h-full items-center justify-center text-xs text-bi-muted">
                No education breakdown
              </p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={eduData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius="45%"
                    outerRadius="70%"
                    paddingAngle={2}
                  >
                    {eduData.map((entry) => (
                      <Cell key={entry.key} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number, name: string) => [`${v}%`, name]} />
                  <Legend wrapperStyle={{ fontSize: 10 }} iconSize={8} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          <ChartCard
            title="District hotspots"
            height={280}
          >
            <div className="flex h-full flex-col justify-center gap-3 px-4">
              {selected.districtHotspots.map((d, i) => (
                <div key={d} className="flex items-center gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-bi-accentSoft text-[10px] font-bold text-bi-accent">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-bi-title">{d}</p>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-bi-canvas">
                      <div
                        className="h-full rounded-full bg-bi-accent"
                        style={{ width: `${100 - i * 12}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ChartCard>
        </div>
      )}

      <p className="text-[10px] text-bi-muted">{data.modelNote}</p>
    </div>
  );
}

function SectorList({
  sectors,
  selectedId,
  onSelect,
}: {
  sectors: SectorPrediction[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="bi-widget flex max-h-[520px] flex-col overflow-hidden">
      <div className="bi-widget-header shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <span className="bi-widget-dot" />
            <h3 className="bi-widget-title">Investment sectors</h3>
          </div>
        </div>
      </div>
      <div className="overflow-y-auto">
        {sectors.map((sector) => {
          const active = sector.id === selectedId;
          return (
            <button
              key={sector.id}
              type="button"
              onClick={() => onSelect(sector.id)}
              className={`flex w-full items-center gap-3 border-b border-bi-border/50 px-4 py-3 text-left transition ${
                active ? "bg-bi-accentSoft" : "hover:bg-bi-canvas/80"
              }`}
            >
              <div
                className="h-10 w-1 shrink-0 rounded-full"
                style={{
                  backgroundColor:
                    SIGNAL_COLORS[sector.investmentSignal] || SIGNAL_COLORS.medium,
                }}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-bold text-bi-title">{sector.name}</p>
                <p className="text-[10px] text-bi-muted">
                  Score {sector.investmentScore} · {sector.confidence}% confidence
                </p>
                <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-bi-canvas">
                  <div
                    className="h-full rounded-full bg-bi-accent"
                    style={{ width: `${Math.min(100, sector.investmentScore)}%` }}
                  />
                </div>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-sm font-extrabold tabular-nums text-bi-accent">
                  {formatN(sector.predictedOpenings12m)}
                </p>
                <p className="text-[9px] text-bi-muted">12mo</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function SectorDrillDown({
  sector,
  onClose,
}: {
  sector: SectorPrediction;
  onClose: () => void;
}) {
  return (
    <div className="bi-widget overflow-hidden">
      <div className="bi-widget-header">
        <div>
          <div className="flex items-center gap-2">
            <span
              className="rounded-full px-2 py-0.5 text-[9px] font-bold uppercase"
              style={{
                backgroundColor: `${SIGNAL_COLORS[sector.investmentSignal]}20`,
                color: SIGNAL_COLORS[sector.investmentSignal],
              }}
            >
              {sector.investmentSignal} investment
            </span>
            <h3 className="bi-widget-title">{sector.name}</h3>
          </div>
        </div>
        <button type="button" className="btn-ghost" onClick={onClose}>
          Clear
        </button>
      </div>

      <div className="space-y-4 p-5">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "6-month forecast", value: formatN(sector.predictedOpenings6m) },
            { label: "12-month forecast", value: formatN(sector.predictedOpenings12m) },
            { label: "Current baseline", value: `${sector.baseline.vacancies} posts` },
            { label: "Growth rate", value: `+${sector.growthRate}%` },
          ].map((m) => (
            <div key={m.label} className="rounded-lg bg-bi-canvas/80 px-3 py-2.5">
              <p className="text-[9px] font-bold uppercase tracking-wide text-bi-muted">
                {m.label}
              </p>
              <p className="mt-0.5 text-lg font-extrabold tabular-nums text-bi-title">
                {m.value}
              </p>
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-bi-accent/20 bg-gradient-to-br from-bi-accentSoft/80 to-white p-4">
          <p className="mb-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-bi-accent">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            AI prediction rationale
          </p>
          <p className="text-sm leading-relaxed text-bi-label">{sector.aiRationale}</p>
        </div>

        <div>
          <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-bi-muted">
            Typical roles
          </p>
          <div className="flex flex-wrap gap-1.5">
            {sector.typicalRoles.map((r) => (
              <span
                key={r.role}
                className="rounded-full bg-bi-canvas px-2.5 py-1 text-[11px] font-medium text-bi-title ring-1 ring-bi-border"
              >
                {r.role}{" "}
                <span className="text-bi-muted">({r.predictedOpenings})</span>
              </span>
            ))}
          </div>
        </div>

        {sector.sourceUrl && (
          <a
            href={sector.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex text-xs font-semibold text-bi-accent hover:underline"
          >
            View on Invest UP →
          </a>
        )}
      </div>
    </div>
  );
}
