"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import PortalDashboard from "@/components/portal/PortalDashboard";
import type { PortalNavId } from "@/components/portal/PortalSidebar";
import {
  getJobs,
  getStats,
  getInvestmentPredictions,
  triggerSync,
  triggerInvestmentSync,
  triggerAuthenticDataSync,
} from "@/lib/api";
import { getAiRecommendations } from "@/lib/aiRecommendationsApi";
import { getLiveDataSources } from "@/lib/liveDataApi";
import { getPortalLanguage, refreshHindiTranslation } from "@/lib/googleTranslate";
import { aggregateByCity } from "@/lib/upCities";
import {
  applyFilters,
  computeExtendedAnalytics,
  DEFAULT_FILTERS,
  enrichJob,
  type DashboardFilters,
} from "@/lib/jobAnalytics";
import type { Job, Stats } from "@/lib/types";
import type { InvestmentPredictionsResponse } from "@/lib/investmentTypes";
import type { AiRecommendationsResponse } from "@/lib/aiRecommendationsTypes";
import type { LiveDataSourcesResponse } from "@/lib/liveDataTypes";
import { getNcsJobs, getNcsStats, getNcsFacets, getNcsScopedFacets, triggerNcsSync } from "@/lib/ncsJobsApi";
import type { NcsScopedFacets } from "@/lib/ncsJobsApi";
import { DEFAULT_NCS_FILTERS } from "@/lib/ncsJobAnalytics";
import { normalizeNcsDashboardFilters } from "@/lib/ncsFilterNormalize";
import type { NcsDashboardFilters, NcsFacetsResponse, NcsJob, NcsStats } from "@/lib/ncsJobTypes";

const STATE_NAMES: Record<string, string> = {
  UP: "Uttar Pradesh",
};

export default function Dashboard() {
  const [portalNav, setPortalNav] = useState<PortalNavId>("vacancy");
  const [filters, setFilters] = useState<DashboardFilters>(DEFAULT_FILTERS);
  const [allJobs, setAllJobs] = useState<Job[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [investmentData, setInvestmentData] = useState<InvestmentPredictionsResponse | null>(null);
  const [aiData, setAiData] = useState<AiRecommendationsResponse | null>(null);
  const [liveData, setLiveData] = useState<LiveDataSourcesResponse | null>(null);
  const [liveDataLoading, setLiveDataLoading] = useState(false);
  const [liveDataError, setLiveDataError] = useState("");
  const [ncsJobs, setNcsJobs] = useState<NcsJob[]>([]);
  const [ncsStats, setNcsStats] = useState<NcsStats | null>(null);
  const [ncsFacets, setNcsFacets] = useState<NcsFacetsResponse["facets"] | null>(null);
  const [ncsScopedFacets, setNcsScopedFacets] = useState<NcsScopedFacets | null>(null);
  const [ncsFilters, setNcsFilters] = useState<NcsDashboardFilters>(DEFAULT_NCS_FILTERS);
  const [ncsDraftFilters, setNcsDraftFilters] = useState<NcsDashboardFilters>(DEFAULT_NCS_FILTERS);
  const [ncsDrillKey, setNcsDrillKey] = useState(0);
  const [ncsLoading, setNcsLoading] = useState(false);
  const [ncsMatchTotal, setNcsMatchTotal] = useState(0);
  const [ncsSyncing, setNcsSyncing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [investmentLoading, setInvestmentLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [investmentSyncing, setInvestmentSyncing] = useState(false);
  const [error, setError] = useState("");

  const enriched = useMemo(() => allJobs.map(enrichJob), [allJobs]);
  const filtered = useMemo(() => applyFilters(enriched, filters), [enriched, filters]);
  const analytics = useMemo(() => computeExtendedAnalytics(filtered), [filtered]);

  const ncsFiltered = useMemo(() => ncsJobs, [ncsJobs]);

  const boards = useMemo(() => {
    const set = new Set(enriched.map((j) => j.post_board).filter(Boolean));
    return Array.from(set).sort();
  }, [enriched]);

  const qualTags = useMemo(() => {
    const set = new Set<string>();
    enriched.forEach((j) => j.qualTags.forEach((t) => set.add(t)));
    return Array.from(set).sort();
  }, [enriched]);

  const cities = useMemo(
    () => aggregateByCity(enriched).map((c) => ({ key: c.cityId, name: c.cityName })),
    [enriched]
  );

  const stateName = STATE_NAMES[filters.state] || filters.state;
  const investmentJobs = investmentData?.summary.totalPredicted12m ?? 0;

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [jobsRes, statsRes] = await Promise.all([
        getJobs({ state: filters.state, limit: 500 }),
        getStats(filters.state),
      ]);
      setAllJobs(jobsRes.data);
      setStats(statsRes);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [filters.state]);

  const loadInvestment = useCallback(async () => {
    setInvestmentLoading(true);
    try {
      const data = await getInvestmentPredictions(filters.state);
      setInvestmentData(data);
    } catch {
      setInvestmentData(null);
    } finally {
      setInvestmentLoading(false);
    }
  }, [filters.state]);

  const loadAiRecommendations = useCallback(async () => {
    try {
      const data = await getAiRecommendations();
      setAiData(data);
      return data;
    } catch {
      setAiData(null);
      return null;
    }
  }, []);

  const loadLiveData = useCallback(async () => {
    setLiveDataLoading(true);
    setLiveDataError("");
    try {
      const data = await getLiveDataSources();
      setLiveData(data);
    } catch (err) {
      setLiveData(null);
      setLiveDataError(err instanceof Error ? err.message : "Failed to load live data");
    } finally {
      setLiveDataLoading(false);
    }
  }, []);

  const loadNcsScopedFacets = useCallback(async (activeFilters: NcsDashboardFilters) => {
    try {
      const facets = await getNcsScopedFacets(activeFilters);
      setNcsScopedFacets(facets);
    } catch {
      setNcsScopedFacets(null);
    }
  }, []);

  const loadNcsInitial = useCallback(async () => {
    setNcsLoading(true);
    try {
      const [jobsRes, statsRes, facetsRes] = await Promise.all([
        getNcsJobs({ limit: 200 }),
        getNcsStats(),
        getNcsFacets(),
      ]);
      setNcsJobs(jobsRes.data);
      setNcsMatchTotal(jobsRes.pagination.total);
      setNcsStats(statsRes);
      setNcsFacets(facetsRes.facets);
      void loadNcsScopedFacets(DEFAULT_NCS_FILTERS);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load NCS vacancies");
      setNcsJobs([]);
      setNcsStats(null);
      setNcsFacets(null);
    } finally {
      setNcsLoading(false);
    }
  }, [loadNcsScopedFacets]);

  const loadNcsJobs = useCallback(async (activeFilters: NcsDashboardFilters) => {
    try {
      const normalized = normalizeNcsDashboardFilters(activeFilters);
      const jobsRes = await getNcsJobs({ ...normalized, limit: 200 });
      setNcsJobs(jobsRes.data);
      setNcsMatchTotal(jobsRes.pagination.total);
      void loadNcsScopedFacets(normalized);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load NCS vacancies");
    }
  }, [loadNcsScopedFacets]);

  const applyNcsFilterPatch = useCallback(
    (patch: Partial<NcsDashboardFilters>) =>
      (prev: NcsDashboardFilters) =>
        normalizeNcsDashboardFilters({ ...prev, ...patch }) as NcsDashboardFilters,
    []
  );

  const ncsBootstrappedRef = useRef(false);
  const ncsJobsSkipDebounceRef = useRef(false);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (portalNav !== "vacancy") return;
    if (!ncsBootstrappedRef.current) {
      ncsBootstrappedRef.current = true;
      loadNcsInitial();
      return;
    }
    if (ncsJobsSkipDebounceRef.current) {
      ncsJobsSkipDebounceRef.current = false;
      return;
    }
    const timer = window.setTimeout(() => {
      loadNcsJobs(ncsFilters);
    }, 450);
    return () => window.clearTimeout(timer);
  }, [portalNav, ncsFilters, loadNcsInitial, loadNcsJobs]);

  // Load investment data after main dashboard data, not in parallel on first paint
  useEffect(() => {
    if (loading) return;
    if (portalNav === "investment" || portalNav === "dashboard") {
      loadInvestment();
    }
  }, [portalNav, loading, loadInvestment]);

  useEffect(() => {
    if (portalNav === "investment" && !investmentLoading) {
      loadAiRecommendations();
      loadLiveData();
    }
  }, [portalNav, investmentLoading, loadAiRecommendations, loadLiveData]);

  useEffect(() => {
    if (loading || getPortalLanguage() !== "hi") return;
    const timer = window.setTimeout(() => refreshHindiTranslation(), 400);
    return () => window.clearTimeout(timer);
  }, [loading, filtered.length, portalNav]);

  const handleFilterChange = (next: Partial<DashboardFilters>) => {
    setFilters((prev) => ({ ...prev, ...next }));
  };

  const handleReset = () => {
    setFilters({ ...DEFAULT_FILTERS, state: filters.state });
  };

  const handleDrillDown = (dimension: string, key: string) => {
    const resets: Partial<DashboardFilters> = {};
    if (dimension === "educationTier") resets.educationTier = key;
    if (dimension === "labourType") resets.labourType = key;
    if (dimension === "postCategory") resets.postCategory = key;
    if (dimension === "board") resets.board = key;
    if (dimension === "qualification") resets.qualification = key;
    if (dimension === "applicationType") resets.applicationType = key;
    if (dimension === "city") resets.city = key;
    setFilters((prev) => ({ ...prev, ...resets }));
  };

  const handleSync = async () => {
    setSyncing(true);
    setError("");
    try {
      await triggerSync(filters.state);
      await loadData();
      await loadInvestment();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sync failed");
    } finally {
      setSyncing(false);
    }
  };

  const handleInvestmentSync = async () => {
    setInvestmentSyncing(true);
    try {
      await Promise.all([triggerInvestmentSync(), triggerAuthenticDataSync()]);
      await loadInvestment();
      await loadAiRecommendations();
      await loadLiveData();
    } finally {
      setInvestmentSyncing(false);
    }
  };

  const handleNcsFilterChange = (next: Partial<NcsDashboardFilters>) => {
    setNcsDraftFilters((prev) => applyNcsFilterPatch(next)(prev));
    setNcsFilters((prev) => applyNcsFilterPatch(next)(prev));
  };

  const handleNcsFilterApply = () => {
    setNcsFilters(ncsDraftFilters);
    setNcsDrillKey((k) => k + 1);
    ncsJobsSkipDebounceRef.current = true;
    loadNcsJobs(ncsDraftFilters);
  };

  const handleNcsFilterReset = () => {
    setNcsDraftFilters(DEFAULT_NCS_FILTERS);
    setNcsFilters(DEFAULT_NCS_FILTERS);
    setNcsDrillKey((k) => k + 1);
    ncsJobsSkipDebounceRef.current = true;
    loadNcsJobs(DEFAULT_NCS_FILTERS);
  };

  const handleNcsDrillFilter = (next: Partial<NcsDashboardFilters>) => {
    setNcsFilters((prev) => {
      const merged = applyNcsFilterPatch(next)(prev);
      ncsJobsSkipDebounceRef.current = true;
      void loadNcsJobs(merged);
      window.requestAnimationFrame(() => {
        document.getElementById("ncs-vacancy-list")?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
      return merged;
    });
    setNcsDraftFilters((prev) => applyNcsFilterPatch(next)(prev));
  };

  const handleNcsSync = async () => {
    setNcsSyncing(true);
    setError("");
    try {
      await triggerNcsSync();
      await loadNcsInitial();
    } catch (err) {
      setError(err instanceof Error ? err.message : "NCS sync failed");
    } finally {
      setNcsSyncing(false);
    }
  };

  const sidebarLastSync =
    portalNav === "vacancy" ? ncsStats?.lastSync?.synced_at : stats?.lastSync?.synced_at;

  return (
    <PortalDashboard
      analytics={analytics}
      filtered={filtered}
      enriched={enriched}
      filters={filters}
      boards={boards}
      cities={cities}
      qualTags={qualTags}
      stateCode={filters.state}
      stateName={stateName}
      stats={stats}
      investmentJobs={investmentJobs}
      lastSync={sidebarLastSync}
      loading={loading}
      error={error}
      investmentData={investmentData}
      investmentLoading={investmentLoading}
      investmentSyncing={investmentSyncing}
      onInvestmentSync={handleInvestmentSync}
      aiData={aiData}
      liveData={liveData}
      liveDataLoading={liveDataLoading}
      liveDataError={liveDataError}
      activeNav={portalNav}
      onNavChange={setPortalNav}
      onFilterChange={handleFilterChange}
      onFilterReset={handleReset}
      onDrillDown={handleDrillDown}
      onSync={handleSync}
      syncing={syncing}
      ncsJobs={ncsJobs}
      ncsFiltered={ncsFiltered}
      ncsFilters={ncsFilters}
      ncsAppliedFilters={ncsFilters}
      ncsDrillKey={ncsDrillKey}
      ncsFacets={ncsFacets}
      ncsScopedFacets={ncsScopedFacets}
      ncsStats={ncsStats}
      ncsMatchTotal={ncsMatchTotal}
      ncsLoading={ncsLoading}
      ncsSyncing={ncsSyncing}
      onNcsFilterChange={handleNcsFilterChange}
      onNcsFilterApply={handleNcsFilterApply}
      onNcsFilterReset={handleNcsFilterReset}
      onNcsDrillFilter={handleNcsDrillFilter}
      onNcsSync={handleNcsSync}
    />
  );
}
