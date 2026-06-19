"use client";

import { useMemo, useState } from "react";
import type { InvestmentPredictionsResponse } from "@/lib/investmentTypes";
import type { AiRecommendationsResponse } from "@/lib/aiRecommendationsTypes";
import { DEFAULT_AI_FILTERS } from "@/lib/aiRecommendationsTypes";
import type { GrowthDrillNavigation } from "@/lib/portalGrowthNavigation";
import {
  buildDistrictRows,
  computeGrowthKpis,
} from "@/lib/investmentPortalAnalytics";
import {
  applyGrowthFilters,
  DEFAULT_GROWTH_FILTERS,
  extractGrowthFacets,
  type GrowthFilters,
} from "@/lib/portalGrowthFilters";
import { applyAiFilters } from "@/lib/portalAiFilters";
import {
  districtDrillNav,
  sectorDrillNav,
  yearDrillNav,
} from "@/lib/portalGrowthNavigation";
import PortalGrowthKpiRow from "./PortalGrowthKpiRow";
import PortalGrowthCharts from "./PortalGrowthCharts";
import PortalDistrictTable from "./PortalDistrictTable";
import PortalRecommendationsDashboard from "./PortalRecommendationsDashboard";
import PortalLiveDataBlock from "./PortalLiveDataBlock";
import PortalGrowthRecommendationsFilterBar from "./PortalGrowthRecommendationsFilterBar";
import type { LiveDataSourcesResponse } from "@/lib/liveDataTypes";

type ViewTab = "growth" | "recommendations" | "live";

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
  const [view, setView] = useState<ViewTab>("growth");
  const [growthFilters, setGrowthFilters] = useState<GrowthFilters>(DEFAULT_GROWTH_FILTERS);
  const [aiFilters, setAiFilters] = useState(DEFAULT_AI_FILTERS);

  const growthFacets = useMemo(() => extractGrowthFacets(data), [data]);
  const growthView = useMemo(() => applyGrowthFilters(data, growthFilters), [data, growthFilters]);

  const filteredAiData = useMemo(
    () => (aiData ? applyAiFilters(aiData, aiFilters) : null),
    [aiData, aiFilters]
  );

  const kpis = growthView.kpis ?? computeGrowthKpis(data);
  const districtRows = growthView.districtRows ?? buildDistrictRows(data);
  const growthTotal = growthView.totalCount;
  const growthResult = growthView.resultCount;

  return (
    <div className="space-y-5 pb-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Growth &amp; Recommendations</h2>
        </div>
        {onSync && (
          <button
            type="button"
            className="portal-btn-primary text-xs"
            onClick={onSync}
            disabled={syncing}
          >
            {syncing ? "Refreshing…" : "Refresh from official sources"}
          </button>
        )}
      </div>

      <div className="portal-analysis-tabs">
        <button
          type="button"
          className={`portal-analysis-tab ${view === "growth" ? "portal-analysis-tab-active" : ""}`}
          onClick={() => setView("growth")}
        >
          Investment Growth
        </button>
        <button
          type="button"
          className={`portal-analysis-tab ${view === "recommendations" ? "portal-analysis-tab-active" : ""}`}
          onClick={() => setView("recommendations")}
        >
          AI Recommendations
          {aiData && (
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
          {liveData && (
            <span className="ml-1.5 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[9px] font-bold text-emerald-700">
              {liveData.upsidaProjects.length} UPSIDA
            </span>
          )}
        </button>
      </div>

      {view === "growth" ? (
        <PortalGrowthRecommendationsFilterBar
          mode="growth"
          growthFilters={growthFilters}
          growthFacets={growthFacets}
          resultCount={growthResult}
          totalCount={growthTotal}
          onChange={(next) => setGrowthFilters((prev) => ({ ...prev, ...next }))}
          onReset={() => setGrowthFilters(DEFAULT_GROWTH_FILTERS)}
        />
      ) : view === "recommendations" && aiData ? (
        <PortalGrowthRecommendationsFilterBar
          mode="recommendations"
          aiFilters={aiFilters}
          aiFacets={aiData.facets}
          resultCount={filteredAiData?.recommendations.length ?? 0}
          totalCount={aiData.recommendations.length}
          onChange={(next) => setAiFilters((prev) => ({ ...prev, ...next }))}
          onReset={() => setAiFilters(DEFAULT_AI_FILTERS)}
        />
      ) : null}

      {view === "growth" ? (
        <>
          <PortalGrowthKpiRow kpis={kpis} />

          <PortalGrowthCharts
            data={data}
            trendData={growthView.trendData}
            sectorData={growthView.sectorData}
            onSectorClick={(sector) => onOpenDetailedAnalysis(sectorDrillNav(sector))}
            onYearClick={(year) => onOpenDetailedAnalysis(yearDrillNav(year))}
          />

          <PortalDistrictTable
            rows={districtRows}
            onDistrictClick={(district) => onOpenDetailedAnalysis(districtDrillNav(district))}
          />

          {growthResult === 0 && (
            <div className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              No projects match the current filters. Try resetting or broadening your selection.
            </div>
          )}

          <button
            type="button"
            onClick={() => onOpenDetailedAnalysis()}
            className="portal-btn-primary portal-btn-blinker w-full justify-center py-3"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Get Detailed Growth Analysis
          </button>
        </>
      ) : view === "live" ? (
        liveDataLoading ? (
          <div className="portal-panel flex flex-col items-center justify-center gap-3 py-16 text-center">
            <div className="portal-spinner mb-1" />
            <p className="text-sm font-semibold text-slate-700">Loading live data…</p>
          </div>
        ) : liveData ? (
          <PortalLiveDataBlock data={liveData} onRefresh={onSync} refreshing={syncing} />
        ) : (
          <div className="portal-panel flex flex-col items-center justify-center gap-3 py-16 text-center">
            <p className="text-sm font-semibold text-slate-700">Live data unavailable</p>
            <p className="max-w-sm text-xs text-slate-500">
              {liveDataError ||
                "Could not reach the API. Ensure the backend is running on port 3000, then refresh."}
            </p>
            {onSync && (
              <button type="button" className="portal-btn-primary text-xs" onClick={onSync} disabled={syncing}>
                {syncing ? "Refreshing…" : "Refresh live data"}
              </button>
            )}
          </div>
        )
      ) : filteredAiData ? (
        <PortalRecommendationsDashboard
          key={JSON.stringify(aiFilters)}
          data={filteredAiData}
          onOpenDetailed={() => onOpenDetailedAnalysis({ section: "recommendations" })}
        />
      ) : (
        <div className="portal-panel flex flex-col items-center justify-center py-16 text-center">
          <div className="portal-spinner mb-4" />
          <p className="text-sm font-semibold text-slate-700">Loading recommendations…</p>
        </div>
      )}
    </div>
  );
}
