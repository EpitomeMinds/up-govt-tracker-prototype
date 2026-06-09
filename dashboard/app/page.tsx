"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import PortalDashboard from "@/components/portal/PortalDashboard";
import type { PortalNavId } from "@/components/portal/PortalSidebar";
import {
  getJobs,
  getStats,
  getInvestmentPredictions,
  triggerSync,
  triggerInvestmentSync,
} from "@/lib/api";
import { getAiRecommendations } from "@/lib/aiRecommendationsApi";
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

const STATE_NAMES: Record<string, string> = {
  UP: "Uttar Pradesh",
};

export default function Dashboard() {
  const [portalNav, setPortalNav] = useState<PortalNavId>("dashboard");
  const [filters, setFilters] = useState<DashboardFilters>(DEFAULT_FILTERS);
  const [allJobs, setAllJobs] = useState<Job[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [investmentData, setInvestmentData] = useState<InvestmentPredictionsResponse | null>(null);
  const [aiData, setAiData] = useState<AiRecommendationsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [investmentLoading, setInvestmentLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [investmentSyncing, setInvestmentSyncing] = useState(false);
  const [error, setError] = useState("");

  const enriched = useMemo(() => allJobs.map(enrichJob), [allJobs]);
  const filtered = useMemo(() => applyFilters(enriched, filters), [enriched, filters]);
  const analytics = useMemo(() => computeExtendedAnalytics(filtered), [filtered]);

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
    } catch {
      setAiData(null);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

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
    }
  }, [portalNav, investmentLoading, loadAiRecommendations]);

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
      await triggerInvestmentSync();
      await loadInvestment();
    } finally {
      setInvestmentSyncing(false);
    }
  };

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
      lastSync={stats?.lastSync?.synced_at}
      loading={loading}
      error={error}
      investmentData={investmentData}
      investmentLoading={investmentLoading}
      investmentSyncing={investmentSyncing}
      onInvestmentSync={handleInvestmentSync}
      aiData={aiData}
      activeNav={portalNav}
      onNavChange={setPortalNav}
      onFilterChange={handleFilterChange}
      onFilterReset={handleReset}
      onDrillDown={handleDrillDown}
      onSync={handleSync}
      syncing={syncing}
    />
  );
}
