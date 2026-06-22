"use client";

import { useMemo, useState } from "react";
import type { InvestmentPredictionsResponse } from "@/lib/investmentTypes";
import type { AiRecommendationsResponse } from "@/lib/aiRecommendationsTypes";
import { DEFAULT_AI_FILTERS } from "@/lib/aiRecommendationsTypes";
import type { GrowthDrillNavigation } from "@/lib/portalGrowthNavigation";
import {
  applyGrowthFilters,
  DEFAULT_GROWTH_FILTERS,
  extractGrowthFacets,
  recommendationMatchesGrowthSectorFilters,
  recommendationMatchesState,
  type GrowthFilters,
} from "@/lib/portalGrowthFilters";
import { applyAiFilters } from "@/lib/portalAiFilters";
import PortalGrowthMetricsPanel from "./PortalGrowthMetricsPanel";
import PortalGrowthRecommendationsFilterBar from "./PortalGrowthRecommendationsFilterBar";
import PortalRecommendationsDashboard from "./PortalRecommendationsDashboard";
import PortalLiveDataBlock from "./PortalLiveDataBlock";
import PortalGrowthProjectList from "./PortalGrowthProjectList";
import type { LiveDataSourcesResponse } from "@/lib/liveDataTypes";

type ViewTab = "overview" | "live";

interface Props {
  data: InvestmentPredictionsResponse;
  aiData?: AiRecommendationsResponse | null;
  liveData?: LiveDataSourcesResponse | null;
  liveDataLoading?: boolean;
  liveDataError?: string;
  onOpenDetailedAnalysis: (nav?: GrowthDrillNavigation) => void;
  syncing?: boolean;
  onSync?: () => void;
}

export default function PortalGrowthDashboard({
  data,
  aiData,
  liveData,
  liveDataLoading,
  liveDataError,
  onOpenDetailedAnalysis,
  syncing,
  onSync,
}: Props) {
  const [view, setView] = useState<ViewTab>("overview");
  const [growthFilters, setGrowthFilters] = useState<GrowthFilters>(DEFAULT_GROWTH_FILTERS);

  const growthFacets = useMemo(() => extractGrowthFacets(data), [data]);
  const growthView = useMemo(
    () => applyGrowthFilters(data, growthFilters),
    [data, growthFilters]
  );

  const filteredAiData = useMemo(() => {
    if (!aiData) return null;
    let recs = aiData.recommendations.filter((r) =>
      recommendationMatchesGrowthSectorFilters(
        r as unknown as Record<string, unknown>,
        growthFilters,
        growthFacets
      )
    );
    if (growthFilters.q) {
      const q = growthFilters.q.toLowerCase();
      recs = recs.filter((r) => {
        const hay = [r.title, r.sector, r.subSector, r.location, r.keySkillsRequired]
          .map((v) => String(v ?? "").toLowerCase())
          .join(" ");
        return hay.includes(q);
      });
    }
    if (growthFilters.state) {
      recs = recs.filter((r) => recommendationMatchesState(r, growthFilters.state));
    }
    if (growthFilters.skillType) {
      recs = recs.filter((r) => r.actionType === growthFilters.skillType);
    }
    if (growthFilters.confidence) {
      recs = recs.filter((r) => r.status === growthFilters.confidence);
    }
    return applyAiFilters({ ...aiData, recommendations: recs }, DEFAULT_AI_FILTERS);
  }, [aiData, growthFilters, growthFacets]);

  const growthTotal = growthView.totalCount;
  const growthResult = growthView.resultCount;
  const projectRows = growthView.rows ?? [];
  const recCount = filteredAiData?.recommendations.length ?? 0;
  const recTotal = aiData?.recommendations.length ?? 0;

  const openDetailed = (nav?: GrowthDrillNavigation) => {
    onOpenDetailedAnalysis({
      ...nav,
      state: growthFilters.state || nav?.state,
    });
  };

  return (
    <div className="space-y-5 pb-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="portal-analysis-tabs min-w-0 flex-1">
          <button
            type="button"
            className={`portal-analysis-tab ${view === "overview" ? "portal-analysis-tab-active" : ""}`}
            onClick={() => setView("overview")}
          >
            Growth &amp; Recommendations
            {aiData && aiData.summary.criticalCount > 0 && (
              <span className="ml-1.5 rounded-full bg-orange-100 px-1.5 py-0.5 text-[9px] font-bold text-orange-700">
                {aiData.summary.criticalCount} critical
              </span>
            )}
          </button>
          <button
            type="button"
            className={`portal-analysis-tab ${view === "live" ? "portal-analysis-tab-active" : ""}`}
            onClick={() => setView("live")}
          >
            Live Data
          </button>
        </div>
        {onSync && (
          <button
            type="button"
            className="portal-btn-primary shrink-0 text-xs"
            onClick={onSync}
            disabled={syncing}
          >
            {syncing ? "Refreshing…" : "Refresh data"}
          </button>
        )}
      </div>

      {view === "overview" ? (
        <>
          <PortalGrowthMetricsPanel
            data={data}
            criticalCount={filteredAiData?.summary.criticalCount ?? aiData?.summary.criticalCount}
            aiSummary={filteredAiData?.summary ?? aiData?.summary ?? null}
            aiLoading={aiData === null}
          />

          <PortalGrowthRecommendationsFilterBar
            mode="growth"
            growthFilters={growthFilters}
            growthFacets={growthFacets}
            resultCount={growthResult}
            totalCount={growthTotal}
            recommendationCount={recCount}
            recommendationTotal={recTotal}
            onChange={(next) => setGrowthFilters((prev) => ({ ...prev, ...next }))}
            onReset={() => setGrowthFilters(DEFAULT_GROWTH_FILTERS)}
          />

          <PortalGrowthProjectList
            rows={projectRows}
            onOpenDetailed={() => openDetailed()}
          />

          {growthResult === 0 && (
            <div className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              No projects match the current filters. Try resetting or broadening your selection.
            </div>
          )}

          {filteredAiData ? (
            <PortalRecommendationsDashboard
              key={JSON.stringify(growthFilters)}
              data={filteredAiData}
              listOnly
              growthFacets={growthFacets}
              appliedState={growthFilters.state}
              onOpenDetailed={() => openDetailed({ section: "recommendations" })}
            />
          ) : aiData === null ? (
            <div className="portal-panel flex flex-col items-center justify-center py-12 text-center">
              <div className="portal-spinner mb-4" />
              <p className="text-sm font-semibold text-slate-700">Loading recommendations…</p>
            </div>
          ) : null}

          <button
            type="button"
            onClick={() => openDetailed()}
            className="portal-btn-primary portal-btn-blinker w-full justify-center py-3"
          >
            Get Detailed Growth Analysis
          </button>
        </>
      ) : liveDataLoading ? (
        <div className="portal-panel flex flex-col items-center justify-center gap-3 py-16 text-center">
          <div className="portal-spinner mb-1" />
          <p className="text-sm font-semibold text-slate-700">Loading live data…</p>
        </div>
      ) : liveData ? (
        <PortalLiveDataBlock data={liveData} onRefresh={onSync} refreshing={syncing} />
      ) : (
        <div className="portal-panel flex flex-col items-center justify-center gap-3 py-16 text-center">
          <p className="text-sm font-semibold text-slate-700">Live data unavailable</p>
          <p className="max-w-sm text-xs text-slate-500">{liveDataError || "Could not reach the API."}</p>
        </div>
      )}
    </div>
  );
}
