"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { AiRecommendationsResponse, AiRecommendationFilters } from "@/lib/aiRecommendationsTypes";
import { formatWorkforce } from "@/lib/aiRecommendationsApi";
import ChartCard from "@/components/charts/ChartCard";
import { ZoneShell } from "@/components/ai/AiParts";

interface Props {
  data: AiRecommendationsResponse;
  onFilterChange: (next: Partial<AiRecommendationFilters>) => void;
}

export default function AiRegionsZone({ data, onFilterChange }: Props) {
  const barData = data.summary.byRegion.slice(0, 10).map((r) => ({
    name: r.name,
    required: r.required,
    gap: r.gap,
  }));

  return (
    <ZoneShell compact>
      <div className="grid h-full min-h-0 grid-cols-2 gap-3">
        <ChartCard title="Projected vacancies by region" height={280}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e8ebf2" />
              <XAxis dataKey="name" tick={{ fontSize: 9 }} angle={-25} textAnchor="end" height={48} />
              <YAxis tick={{ fontSize: 9 }} tickFormatter={formatWorkforce} />
              <Tooltip formatter={(v: number) => [formatWorkforce(v), "Vacancies"]} />
              <Bar dataKey="required" fill="#6c5ce7" radius={[4, 4, 0, 0]} cursor="pointer" onClick={(d) => { const n = (d as { name?: string; payload?: { name?: string } }).name ?? (d as { payload?: { name?: string } }).payload?.name; if (n) onFilterChange({ region: String(n) }); }} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <div className="bi-widget grid grid-cols-2 gap-2 p-3 content-start">
          {data.summary.byRegion.slice(0, 8).map((r) => (
            <button key={r.name} type="button" onClick={() => onFilterChange({ region: r.name })} className="rounded-lg border border-bi-border/60 bg-bi-canvas/50 p-2.5 text-left hover:border-bi-accent/40 hover:bg-bi-accentSoft/30">
              <p className="truncate text-[11px] font-bold text-bi-title">{r.name}</p>
              <p className="mt-1 text-lg font-extrabold tabular-nums text-bi-violet">{formatWorkforce(r.required)}</p>
              <p className="text-[9px] text-bi-muted">{r.count} projects · gap {formatWorkforce(r.gap)}</p>
            </button>
          ))}
        </div>
      </div>
    </ZoneShell>
  );
}
