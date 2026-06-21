"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import PortalSidebar, { type PortalNavId } from "./PortalSidebar";
import PortalHeader from "./PortalHeader";
import PortalLoginModal from "./PortalLoginModal";
import { clearPortalSession, getPortalSession, type PortalSession } from "@/lib/portalAuth";
import PortalKpiRow from "./PortalKpiRow";
import PortalFilterBar from "./PortalFilterBar";
import PortalVacancyList from "./PortalVacancyList";
import PortalNcsVacancyList from "./PortalNcsVacancyList";
import PortalNcsFilterBar from "./PortalNcsFilterBar";
import PortalNcsMetricsPanel from "./PortalNcsMetricsPanel";
import PortalAnalyticsPanel from "./PortalAnalyticsPanel";
import PortalGrowthDashboard from "./PortalGrowthDashboard";
import PortalUserManagement from "./PortalUserManagement";
import type { ExtendedAnalytics, DashboardFilters, JobEnriched } from "@/lib/jobAnalytics";
import type { NcsDashboardFilters, NcsFacetsResponse, NcsJob, NcsStats } from "@/lib/ncsJobTypes";
import { DEFAULT_NCS_FILTERS } from "@/lib/ncsJobAnalytics";
import type { Stats } from "@/lib/types";
import type { InvestmentPredictionsResponse } from "@/lib/investmentTypes";
import type { AiRecommendationsResponse } from "@/lib/aiRecommendationsTypes";
import type { LiveDataSourcesResponse } from "@/lib/liveDataTypes";
import type { GrowthDrillNavigation } from "@/lib/portalGrowthNavigation";

function PortalAnalysisSkeleton() {
  return (
    <div className="flex flex-1 items-center justify-center py-24">
      <div className="text-center">
        <div className="portal-spinner mx-auto mb-4" />
        <p className="text-sm font-semibold text-slate-700">Loading analysis…</p>
      </div>
    </div>
  );
}

function PortalDashboardSkeleton() {
  return (
    <div className="animate-pulse space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="portal-kpi-card h-28 bg-slate-100" />
        ))}
      </div>
      <div className="portal-filter-card h-16 bg-slate-100" />
      <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="portal-panel h-[480px] bg-slate-100" />
        <div className="portal-panel h-[480px] bg-slate-100" />
      </div>
    </div>
  );
}

const PortalDetailedAnalysis = dynamic(() => import("./PortalDetailedAnalysis"), {
  loading: () => <PortalAnalysisSkeleton />,
});

const PortalGrowthDetailedAnalysis = dynamic(
  () => import("./PortalGrowthDetailedAnalysis"),
  { loading: () => <PortalAnalysisSkeleton /> }
);

interface Props {
  analytics: ExtendedAnalytics;
  filtered: JobEnriched[];
  enriched: JobEnriched[];
  filters: DashboardFilters;
  boards: string[];
  cities: { key: string; name: string }[];
  qualTags: string[];
  stateCode: string;
  stateName: string;
  stats: Stats | null;
  investmentJobs: number;
  lastSync?: string | null;
  loading?: boolean;
  error?: string;
  investmentData?: InvestmentPredictionsResponse | null;
  investmentLoading?: boolean;
  investmentSyncing?: boolean;
  onInvestmentSync?: () => void;
  aiData?: AiRecommendationsResponse | null;
  liveData?: LiveDataSourcesResponse | null;
  liveDataLoading?: boolean;
  liveDataError?: string;
  activeNav: PortalNavId;
  onNavChange: (id: PortalNavId) => void;
  onFilterChange: (next: Partial<DashboardFilters>) => void;
  onFilterReset: () => void;
  onDrillDown: (dimension: string, key: string) => void;
  onSync: () => void;
  syncing?: boolean;
  ncsJobs?: NcsJob[];
  ncsFiltered?: NcsJob[];
  ncsFilters?: NcsDashboardFilters;
  ncsAppliedFilters?: NcsDashboardFilters;
  ncsDrillKey?: number;
  ncsFacets?: NcsFacetsResponse["facets"] | null;
  ncsStats?: NcsStats | null;
  ncsMatchTotal?: number;
  ncsLoading?: boolean;
  ncsSyncing?: boolean;
  onNcsFilterChange?: (next: Partial<NcsDashboardFilters>) => void;
  onNcsFilterApply?: () => void;
  onNcsFilterReset?: () => void;
  onNcsDrillFilter?: (next: Partial<NcsDashboardFilters>) => void;
  onNcsSync?: () => void;
}

export default function PortalDashboard({
  analytics,
  filtered,
  enriched,
  filters,
  boards,
  cities,
  qualTags,
  stateCode,
  stateName,
  stats,
  investmentJobs,
  lastSync,
  loading,
  error,
  investmentData,
  investmentLoading,
  investmentSyncing,
  onInvestmentSync,
  aiData,
  liveData,
  liveDataLoading,
  liveDataError,
  activeNav,
  onNavChange,
  onFilterChange,
  onFilterReset,
  onDrillDown,
  onSync,
  syncing,
  ncsJobs = [],
  ncsFiltered = [],
  ncsFilters,
  ncsAppliedFilters,
  ncsDrillKey = 0,
  ncsFacets,
  ncsStats,
  ncsMatchTotal = 0,
  ncsLoading,
  ncsSyncing,
  onNcsFilterChange,
  onNcsFilterApply,
  onNcsFilterReset,
  onNcsDrillFilter,
  onNcsSync,
}: Props) {
  const [showDetailedAnalysis, setShowDetailedAnalysis] = useState(false);
  const [showGrowthDetailedAnalysis, setShowGrowthDetailedAnalysis] = useState(false);
  const [growthInitialNav, setGrowthInitialNav] = useState<GrowthDrillNavigation | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [session, setSession] = useState<PortalSession | null>(null);
  const isAuthenticated = session !== null;

  useEffect(() => {
    setSession(getPortalSession());
    setAuthReady(true);
  }, []);

  const handleLogin = (nextSession: PortalSession) => {
    setSession(nextSession);
  };

  const handleLogout = () => {
    clearPortalSession();
    setSession(null);
    setShowDetailedAnalysis(false);
    setShowGrowthDetailedAnalysis(false);
  };
  const showInvestment = activeNav === "investment" || activeNav === "dashboard";
  const showUsers = activeNav === "users";
  const showVacancy = activeNav === "vacancy";
  const showMap = filters.state === "UP";

  const handleNavChange = (id: PortalNavId) => {
    setShowDetailedAnalysis(false);
    setShowGrowthDetailedAnalysis(false);
    setGrowthInitialNav(null);
    onNavChange(id);
  };

  const openGrowthDetailed = (nav?: GrowthDrillNavigation) => {
    setGrowthInitialNav(nav ?? null);
    setShowGrowthDetailedAnalysis(true);
  };

  const sidebarActive: PortalNavId = showDetailedAnalysis || showGrowthDetailedAnalysis
    ? "investment"
    : activeNav === "dashboard"
      ? "investment"
      : activeNav;
  const showInitialLoader = loading && filtered.length === 0;
  const locked = !authReady || !isAuthenticated;
  const showLoginModal = authReady && !isAuthenticated;

  return (
    <div className="portal-app">
      <div className={locked ? "portal-app-locked flex min-w-0 flex-1" : "flex min-w-0 flex-1"}>
        <PortalSidebar
          active={sidebarActive}
          onChange={handleNavChange}
          lastSync={lastSync}
          isAuthenticated={isAuthenticated}
          onLogout={handleLogout}
        />

        <div className="portal-main">
          <PortalHeader
            onSync={showVacancy ? onNcsSync : onSync}
            syncing={showVacancy ? ncsSyncing : syncing}
            session={session}
          />

        <div className="portal-content">
          {error && (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {showDetailedAnalysis ? (
            <PortalDetailedAnalysis
              analytics={analytics}
              filtered={filtered}
              enriched={enriched}
              stateCode={stateCode}
              stateName={stateName}
              showMap={showMap}
              selectedCityId={filters.city}
              selectedDistrict={filters.district}
              onSelectCity={(cityId) =>
                onFilterChange({
                  city: filters.city === cityId ? "" : cityId,
                  district: cityId ? "" : filters.district,
                })
              }
              onSelectDistrict={(district) =>
                onFilterChange({
                  district: filters.district === district ? "" : district,
                  city: district ? "" : filters.city,
                })
              }
              onDrillDown={onDrillDown}
              onBack={() => setShowDetailedAnalysis(false)}
            />
          ) : showUsers ? (
            <PortalUserManagement />
          ) : showInvestment ? (
            investmentLoading || !investmentData ? (
              <div className="flex flex-1 flex-col items-center justify-center py-24">
                <div className="portal-spinner mb-4" />
                <p className="text-sm font-semibold text-slate-700">Loading investment data…</p>
              </div>
            ) : showGrowthDetailedAnalysis ? (
              <PortalGrowthDetailedAnalysis
                data={investmentData}
                initialNav={growthInitialNav}
                onBack={() => {
                  setShowGrowthDetailedAnalysis(false);
                  setGrowthInitialNav(null);
                }}
              />
            ) : (
              <PortalGrowthDashboard
                data={investmentData}
                aiData={aiData}
                liveData={liveData}
                liveDataLoading={liveDataLoading}
                liveDataError={liveDataError}
                syncing={investmentSyncing ?? false}
                onSync={onInvestmentSync}
                onOpenDetailedAnalysis={openGrowthDetailed}
              />
            )
          ) : showVacancy ? (
            ncsLoading && ncsFiltered.length === 0 ? (
              <PortalDashboardSkeleton />
            ) : (
              <>
                <PortalNcsMetricsPanel
                  key={ncsDrillKey}
                  stats={ncsStats ?? null}
                  matchTotal={ncsMatchTotal}
                  appliedFilters={ncsAppliedFilters ?? ncsFilters ?? DEFAULT_NCS_FILTERS}
                  onApplyDrillFilter={onNcsDrillFilter}
                />

                <div className="mt-5">
                {ncsFilters && onNcsFilterChange && onNcsFilterApply && onNcsFilterReset && (
                  <PortalNcsFilterBar
                    filters={ncsFilters}
                    facets={ncsFacets ?? null}
                    totalAvailable={ncsStats?.total}
                    onChange={onNcsFilterChange}
                    onApply={onNcsFilterApply}
                    onReset={onNcsFilterReset}
                  />
                )}
                </div>

                <div className="mt-5 grid gap-5">
                  <PortalNcsVacancyList
                    jobs={ncsFiltered}
                    totalCount={ncsMatchTotal || ncsStats?.total}
                  />
                </div>
              </>
            )
          ) : showInitialLoader ? (
            <PortalDashboardSkeleton />
          ) : (
            <>
              <PortalKpiRow
                activeVacancies={analytics.totalVacancies}
                newThisWeek={stats?.newThisWeek ?? 0}
                departmentCount={analytics.boardVacancyBars.length}
                investmentJobs={investmentJobs}
                applicationsToday={stats?.newThisWeek ?? analytics.closingSoon}
              />

              <div className="mt-5">
                <PortalFilterBar
                  filters={filters}
                  boards={boards}
                  cities={cities}
                  qualTags={qualTags}
                  onChange={onFilterChange}
                  onApply={() => {}}
                  onReset={onFilterReset}
                />
              </div>

              <div className="mt-5 grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
                <PortalVacancyList jobs={filtered} />
                <PortalAnalyticsPanel
                  analytics={analytics}
                  onOpenDetailedAnalysis={() => setShowDetailedAnalysis(true)}
                />
              </div>
            </>
          )}
        </div>
        </div>
      </div>

      {showLoginModal && <PortalLoginModal onLogin={handleLogin} />}
    </div>
  );
}
