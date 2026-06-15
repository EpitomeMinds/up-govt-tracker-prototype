"use client";

import { useState } from "react";
import type { AiRecommendation, AiRecommendationFilters } from "@/lib/aiRecommendationsTypes";
import { formatWorkforce } from "@/lib/aiRecommendationsApi";
import { PriorityBadge, RecommendationDetail, ZoneShell, Paginator, usePagination } from "@/components/ai/AiParts";

const PAGE_SIZE = 7;

interface Props {
  recommendations: AiRecommendation[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  onFilterChange: (next: Partial<AiRecommendationFilters>) => void;
}

export default function AiInitiativesZone({
  recommendations,
  selectedId,
  onSelect,
  onFilterChange,
}: Props) {
  const [page, setPage] = useState(1);
  const { pageItems, totalPages, safePage } = usePagination(recommendations, PAGE_SIZE, page);
  const selected = recommendations.find((r) => r.id === selectedId) ?? pageItems[0] ?? null;

  return (
    <ZoneShell compact>
      <div className="grid h-full min-h-0 grid-cols-12 gap-3">
        <div className="bi-widget col-span-5 flex min-h-0 flex-col overflow-hidden">
          <div className="shrink-0 border-b border-bi-border px-3 py-2">
            <p className="text-xs font-bold text-bi-title">Investment projects</p>
          </div>
          <div className="min-h-0 flex-1">
            {pageItems.map((rec) => (
              <button
                key={rec.id}
                type="button"
                onClick={() => onSelect(rec.id)}
                className={`flex w-full gap-2 border-b border-bi-border/40 px-3 py-2 text-left ${selected?.id === rec.id ? "bg-bi-accentSoft" : "hover:bg-bi-canvas/80"}`}
              >
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-1 text-[11px] font-bold text-bi-title">{rec.title}</p>
                  <p className="truncate text-[9px] text-bi-muted">{rec.department}</p>
                  <div className="mt-0.5 flex gap-1">
                    <PriorityBadge priority={rec.priority} />
                  </div>
                </div>
                <span className="shrink-0 text-[10px] font-bold text-bi-coral">{formatWorkforce(rec.skillGap)}</span>
              </button>
            ))}
          </div>
          <Paginator page={safePage} totalPages={totalPages} onPage={setPage} />
        </div>
        <div className="col-span-7 min-h-0 overflow-hidden">
          {selected ? (
            <RecommendationDetail
              rec={selected}
              onDrillSector={(s) => onFilterChange({ sector: s })}
              onDrillBoard={(d) => onFilterChange({ department: d })}
            />
          ) : (
            <div className="bi-widget flex h-full items-center justify-center text-sm text-bi-muted">
              No projects match filters
            </div>
          )}
        </div>
      </div>
    </ZoneShell>
  );
}
