"use client";

import { useMemo, useState } from "react";
import type { AiRecommendationsResponse, AiRecommendationFilters } from "@/lib/aiRecommendationsTypes";
import { BOARD_CATEGORY_COLORS } from "@/lib/aiRecommendationsTypes";
import { ZoneShell, Paginator, usePagination } from "@/components/ai/AiParts";
import {
  aggregateCategoryPriorities,
  BoardAnalyticsCard,
  BoardCategoryGapChart,
  BoardCategoryKpiStrip,
  BoardCategoryPriorityChart,
  BoardCategoryShareChart,
  BoardWorkforceCompareChart,
} from "@/components/ai/charts/BoardZoneCharts";

const PAGE_SIZE = 4;

interface Props {
  data: AiRecommendationsResponse;
  onFilterChange: (next: Partial<AiRecommendationFilters>) => void;
  onGoInitiatives: () => void;
}

export default function AiBoardsZone({ data, onFilterChange, onGoInitiatives }: Props) {
  const categories = data.summary.byBoardCategory;
  const [activeCat, setActiveCat] = useState(categories[0]?.name ?? "");
  const [page, setPage] = useState(1);

  const activeCategory = categories.find((c) => c.name === activeCat) ?? categories[0];
  const departments = activeCategory?.departments ?? [];
  const { pageItems, totalPages, safePage } = usePagination(departments, PAGE_SIZE, page);

  const catColor = BOARD_CATEGORY_COLORS[activeCategory?.name ?? ""] || "#64748b";

  const priorityData = useMemo(() => {
    if (!activeCategory) return [];
    return aggregateCategoryPriorities(
      data.recommendations,
      activeCategory.departments.map((d) => d.name)
    );
  }, [activeCategory, data.recommendations]);

  const categoryAvgGapPct = useMemo(() => {
    if (!departments.length) return 0;
    return departments.reduce((s, d) => s + d.avgGapPercent, 0) / departments.length;
  }, [departments]);

  const selectBoard = (deptName: string) => {
    onFilterChange({ department: deptName, boardCategory: "" });
    onGoInitiatives();
  };

  return (
    <ZoneShell compact>
      <div className="flex h-full min-h-0 flex-col gap-2.5">
        <div className="flex shrink-0 gap-1.5 overflow-x-auto pb-0.5">
          {categories.map((cat) => {
            const color = BOARD_CATEGORY_COLORS[cat.name] || "#64748b";
            const active = cat.name === activeCategory?.name;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  setActiveCat(cat.name);
                  setPage(1);
                }}
                className={`shrink-0 rounded-lg px-3 py-1.5 text-left transition ${active ? "ring-2 ring-offset-1" : "opacity-80 hover:opacity-100"}`}
                style={{
                  backgroundColor: active ? `${color}20` : `${color}10`,
                  color,
                  ...(active ? { boxShadow: `0 0 0 2px ${color}` } : {}),
                }}
              >
                <span className="block text-[11px] font-bold">{cat.name}</span>
                <span className="text-[9px] opacity-80">
                  {cat.count} · {cat.departments.length} boards
                </span>
              </button>
            );
          })}
        </div>

        {activeCategory && (
          <>
            <BoardCategoryKpiStrip category={activeCategory} accent={catColor} />

            <div className="grid shrink-0 grid-cols-2 gap-2 xl:grid-cols-4">
              <BoardCategoryGapChart
                departments={departments}
                accent={catColor}
                height={108}
                onSelect={selectBoard}
              />
              <BoardCategoryPriorityChart priorityData={priorityData} height={108} />
              <BoardCategoryShareChart
                departments={departments}
                categoryName={activeCategory.name}
                height={108}
              />
              <BoardWorkforceCompareChart departments={departments} accent={catColor} height={108} />
            </div>

            <div className="flex shrink-0 items-center justify-between gap-2 px-0.5">
              <p className="text-[11px] font-semibold text-bi-title">Board drill-down</p>
              <button
                type="button"
                className="btn-primary px-3 py-1 text-[10px]"
                onClick={() => onFilterChange({ boardCategory: activeCategory.name })}
              >
                Filter all in category
              </button>
            </div>

            <div className="grid min-h-0 flex-1 grid-cols-2 gap-2 lg:grid-cols-4">
              {pageItems.map((dept) => (
                <BoardAnalyticsCard
                  key={dept.id}
                  dept={dept}
                  recommendations={data.recommendations}
                  accent={catColor}
                  categoryAvgGapPct={categoryAvgGapPct}
                  onClick={() => selectBoard(dept.name)}
                />
              ))}
            </div>

            <Paginator page={safePage} totalPages={totalPages} onPage={setPage} />
          </>
        )}
      </div>
    </ZoneShell>
  );
}
