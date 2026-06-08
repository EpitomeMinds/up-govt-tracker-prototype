"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import CompactFilterBar from "@/components/CompactFilterBar";
import FilterPanel from "@/components/FilterPanel";
import MainTabNav from "@/components/MainTabNav";
import TabbedDashboard from "@/components/TabbedDashboard";
import TabbedAiDashboard from "@/components/ai/TabbedAiDashboard";
import AiCompactFilterBar from "@/components/ai/AiCompactFilterBar";
import AiFilterPanel from "@/components/ai/AiFilterPanel";
import { getJobs, getStats, getStates, triggerSync } from "@/lib/api";
import { getAiRecommendations } from "@/lib/aiRecommendationsApi";
import { aggregateByCity } from "@/lib/upCities";
import {
  applyFilters,
  computeExtendedAnalytics,
  DEFAULT_FILTERS,
  enrichJob,
  type DashboardFilters,
} from "@/lib/jobAnalytics";
import type {
  MainTab,
  AiRecommendationsResponse,
  AiRecommendationFilters,
} from "@/lib/aiRecommendationsTypes";
import { DEFAULT_AI_FILTERS as AI_DEFAULTS } from "@/lib/aiRecommendationsTypes";
import type { Job, State, Stats } from "@/lib/types";

export default function Dashboard() {
  const [mainTab, setMainTab] = useState<MainTab>("vacancy");
  const [filters, setFilters] = useState<DashboardFilters>(DEFAULT_FILTERS);
  const [aiFilters, setAiFilters] = useState<AiRecommendationFilters>(AI_DEFAULTS);
  const [allJobs, setAllJobs] = useState<Job[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [states, setStates] = useState<State[]>([]);
  const [aiData, setAiData] = useState<AiRecommendationsResponse | null>(null);
  const [selectedRecId, setSelectedRecId] = useState<number | null>(null);
  const [drillSector, setDrillSector] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState("");
  const [aiError, setAiError] = useState("");
  const [showFullFilters, setShowFullFilters] = useState(false);
  const [showFullAiFilters, setShowFullAiFilters] = useState(false);

  const enriched = useMemo(() => allJobs.map(enrichJob), [allJobs]);
  const filtered = useMemo(() => applyFilters(enriched, filters), [enriched, filters]);
  const analytics = useMemo(
    () => computeExtendedAnalytics(filtered),
    [filtered]
  );

  const boards = useMemo(() => {
    const set = new Set(enriched.map((j) => j.post_board).filter(Boolean));
    return Array.from(set).sort();
  }, [enriched]);

  const qualTags = useMemo(() => {
    const set = new Set<string>();
    enriched.forEach((j) => j.qualTags.forEach((t) => set.add(t)));
    return Array.from(set).sort();
  }, [enriched]);

  const cities = useMemo(() => aggregateByCity(enriched), [enriched]);

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

  const loadAiData = useCallback(async () => {
    setAiLoading(true);
    setAiError("");
    try {
      const data = await getAiRecommendations(aiFilters);
      setAiData(data);
      setSelectedRecId((prev) => {
        if (prev && data.recommendations.some((r) => r.id === prev)) return prev;
        return data.recommendations[0]?.id ?? null;
      });
    } catch (err) {
      setAiError(err instanceof Error ? err.message : "Failed to load AI recommendations");
    } finally {
      setAiLoading(false);
    }
  }, [aiFilters]);

  useEffect(() => {
    getStates().then(setStates).catch(() => {});
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (mainTab === "ai-recommendations") {
      loadAiData();
    }
  }, [mainTab, loadAiData]);

  const handleFilterChange = (next: Partial<DashboardFilters>) => {
    setFilters((prev) => ({ ...prev, ...next }));
  };

  const handleAiFilterChange = (next: Partial<AiRecommendationFilters>) => {
    setAiFilters((prev) => ({ ...prev, ...next }));
  };

  const handleAiReset = () => {
    setAiFilters(AI_DEFAULTS);
  };

  const handleRemoveAiFilter = (key: keyof AiRecommendationFilters) => {
    setAiFilters((prev) => ({ ...prev, [key]: "" }));
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

  const handleRemoveFilter = (key: keyof DashboardFilters) => {
    if (key === "closingSoon") {
      setFilters((prev) => ({ ...prev, closingSoon: false }));
    } else {
      setFilters((prev) => ({ ...prev, [key]: "" }));
    }
  };

  const handleReset = () => {
    setFilters({ ...DEFAULT_FILTERS, state: filters.state });
  };

  const handleSync = async () => {
    setSyncing(true);
    setError("");
    try {
      await triggerSync(filters.state);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sync failed");
    } finally {
      setSyncing(false);
    }
  };

  const stateName =
    states.find((s) => s.code === filters.state)?.name || filters.state;

  const mainTabNav = (
    <MainTabNav
      active={mainTab}
      onChange={setMainTab}
      onSync={handleSync}
      syncing={syncing}
      stateCode={filters.state}
      states={states}
      onStateChange={(code) =>
        handleFilterChange({
          state: code,
          board: "",
          qualification: "",
          city: "",
          district: "",
        })
      }
    />
  );

  const aiToolbar = (
    <>
      {mainTabNav}

      {aiData &&
        (showFullAiFilters ? (
          <div className="shrink-0 border-b border-bi-border bg-white p-4">
            <AiFilterPanel
              filters={aiFilters}
              facets={aiData.facets}
              resultCount={aiData.recommendations.length}
              totalCount={aiData.meta.totalRecords}
              onChange={handleAiFilterChange}
              onReset={handleAiReset}
              onRemoveFilter={handleRemoveAiFilter}
            />
            <button
              type="button"
              className="btn-ghost mt-2"
              onClick={() => setShowFullAiFilters(false)}
            >
              ← Back to compact filters
            </button>
          </div>
        ) : (
          <AiCompactFilterBar
            filters={aiFilters}
            facets={aiData.facets}
            resultCount={aiData.recommendations.length}
            totalCount={aiData.meta.totalRecords}
            onChange={handleAiFilterChange}
            onReset={handleAiReset}
            onRemoveFilter={handleRemoveAiFilter}
            onExpandFilters={() => setShowFullAiFilters(true)}
          />
        ))}

      {aiError && (
        <div className="shrink-0 border-b border-red-200 bg-red-50 px-5 py-2 text-xs text-red-700">
          {aiError}. Ensure API is running at{" "}
          <code className="rounded bg-red-100 px-1">localhost:3000</code>.
        </div>
      )}
    </>
  );

  const vacancyToolbar = (
    <>
      {mainTabNav}

      {showFullFilters ? (
        <div className="shrink-0 border-b border-bi-border bg-white p-4">
          <FilterPanel
            filters={filters}
            states={states}
            boards={boards}
            qualTags={qualTags}
            cities={cities}
            showCityFilter={filters.state === "UP"}
            onChange={handleFilterChange}
            onSync={handleSync}
            onReset={handleReset}
            syncing={syncing}
            onRemoveFilter={handleRemoveFilter}
          />
          <button
            type="button"
            className="btn-ghost mt-2"
            onClick={() => setShowFullFilters(false)}
          >
            ← Back to compact filters
          </button>
        </div>
      ) : (
        <CompactFilterBar
          filters={filters}
          boards={boards}
          cities={cities}
          onChange={handleFilterChange}
          onReset={handleReset}
          onRemoveFilter={handleRemoveFilter}
          onExpandFilters={() => setShowFullFilters(true)}
        />
      )}

      {error && (
        <div className="shrink-0 border-b border-red-200 bg-red-50 px-5 py-2 text-xs text-red-700">
          {error}. Ensure API is running at{" "}
          <code className="rounded bg-red-100 px-1">localhost:3000</code>.
        </div>
      )}
    </>
  );

  return (
    <div className="bi-app">
      {mainTab === "vacancy" ? (
        <TabbedDashboard
          analytics={analytics}
          filtered={filtered}
          enriched={enriched}
          stateCode={filters.state}
          stateName={stateName}
          showMap={filters.state === "UP"}
          lastSync={stats?.lastSync?.synced_at}
          selectedCityId={filters.city}
          selectedDistrict={filters.district}
          onSelectCity={(cityId) =>
            handleFilterChange({
              city: filters.city === cityId ? "" : cityId,
              district: cityId ? "" : filters.district,
            })
          }
          onSelectDistrict={(district) =>
            handleFilterChange({
              district: filters.district === district ? "" : district,
              city: district ? "" : filters.city,
            })
          }
          onDrillDown={handleDrillDown}
          toolbar={vacancyToolbar}
          loading={loading}
          sidebarMode="vacancy"
        />
      ) : aiLoading || !aiData ? (
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          {aiToolbar}
          <main className="bi-canvas flex min-h-0 flex-1 items-center justify-center overflow-hidden">
            <div className="bi-widget px-14 py-12 text-center">
              <div className="bi-spinner mx-auto mb-4" />
              <p className="text-sm font-semibold text-bi-title">Loading AI recommendations…</p>
              <p className="mt-1 text-xs text-bi-muted">Processing workforce planning data</p>
            </div>
          </main>
        </div>
      ) : (
        <TabbedAiDashboard
          data={aiData}
          stateCode={filters.state}
          stateName={stateName}
          toolbar={aiToolbar}
          onFilterChange={handleAiFilterChange}
          selectedId={selectedRecId}
          onSelect={setSelectedRecId}
        />
      )}
    </div>
  );
}
