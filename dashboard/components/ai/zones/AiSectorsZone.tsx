"use client";

import type { AiRecommendationsResponse, AiRecommendationFilters } from "@/lib/aiRecommendationsTypes";
import { formatWorkforce } from "@/lib/aiRecommendationsApi";
import { ZoneShell } from "@/components/ai/AiParts";
import { SkillGapBySectorChart } from "@/components/ai/charts/AiChartComponents";

interface Props {
  data: AiRecommendationsResponse;
  onFilterChange: (next: Partial<AiRecommendationFilters>) => void;
}

export default function AiSectorsZone({ data, onFilterChange }: Props) {
  const sectors = data.summary.bySector;

  return (
    <ZoneShell compact>
      <div className="grid h-full min-h-0 grid-cols-12 gap-3">
        <div className="col-span-8 min-h-0">
          <SkillGapBySectorChart
            data={sectors}
            maxItems={sectors.length}
            height={420}
            onFilter={(sector) => onFilterChange({ sector })}
          />
        </div>
        <div className="bi-widget col-span-4 flex min-h-0 flex-col overflow-hidden">
          <div className="shrink-0 border-b border-bi-border px-3 py-2">
            <p className="text-xs font-bold text-bi-title">Top industry gaps</p>
            <p className="text-[10px] text-bi-muted">Highest projected shortages</p>
          </div>
          <div className="min-h-0 flex-1 space-y-1 overflow-hidden p-2">
            {sectors.slice(0, 10).map((s, i) => (
              <button
                key={s.name}
                type="button"
                onClick={() => onFilterChange({ sector: s.name })}
                className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left hover:bg-bi-canvas"
              >
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-[#b45309]/15 text-[9px] font-bold text-[#b45309]">
                  {i + 1}
                </span>
                <span className="min-w-0 flex-1 truncate text-[11px] font-medium text-bi-title">{s.name}</span>
                <span className="shrink-0 text-[10px] font-bold tabular-nums text-[#b45309]">{formatWorkforce(s.gap)}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </ZoneShell>
  );
}
