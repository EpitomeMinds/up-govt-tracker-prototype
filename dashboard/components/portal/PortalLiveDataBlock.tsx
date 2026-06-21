"use client";

import { useMemo, useState } from "react";
import type { LiveDataSourcesResponse, InvestUpLiveSector, UpsidaLiveProject } from "@/lib/liveDataTypes";
import { formatSyncedAt, getSourceCounts, isLiveSource } from "@/lib/liveDataApi";

interface Props {
  data: LiveDataSourcesResponse;
  onRefresh?: () => void;
  refreshing?: boolean;
}

type SourceFilter = "all" | "upsida" | "investindia" | "nsdc" | "investup";

type InvestUpOppFilter = "" | "has" | "5plus";
type InvestUpSort = "score-desc" | "name-asc" | "opportunities-desc";

function sectorMatchesCity(sector: InvestUpLiveSector, city: string) {
  const needle = city.toLowerCase();
  const inHotspots = (sector.districtHotspots ?? []).some(
    (d) => d.toLowerCase() === needle || d.toLowerCase().includes(needle)
  );
  if (inHotspots) return true;
  const content = [
    ...(sector.industryOverview?.upScenario ?? []),
    ...(sector.industryOverview?.indiaScenario ?? []),
  ]
    .join(" ")
    .toLowerCase();
  return content.includes(needle);
}

export default function PortalLiveDataBlock({ data, onRefresh, refreshing }: Props) {
  const [query, setQuery] = useState("");
  const [sectorFilter, setSectorFilter] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [investUpQuery, setInvestUpQuery] = useState("");
  const [investUpSectorFilter, setInvestUpSectorFilter] = useState("");
  const [investUpCityFilter, setInvestUpCityFilter] = useState("");
  const [investUpOppFilter, setInvestUpOppFilter] = useState<InvestUpOppFilter>("");
  const [investUpFeaturedOnly, setInvestUpFeaturedOnly] = useState(false);
  const [investUpSort, setInvestUpSort] = useState<InvestUpSort>("score-desc");
  const [selectedInvestUpSlug, setSelectedInvestUpSlug] = useState<string | null>(null);
  const [sourceView, setSourceView] = useState<SourceFilter>("all");

  const investUpSectors = data.investUpSectors ?? [];

  const investUpCities = useMemo(() => {
    const cities = new Set<string>();
    for (const s of investUpSectors) {
      for (const d of s.districtHotspots ?? []) cities.add(d);
    }
    return [...cities].sort((a, b) => a.localeCompare(b));
  }, [investUpSectors]);

  const filteredInvestUpSectors = useMemo(() => {
    const q = investUpQuery.trim().toLowerCase();
    const list = investUpSectors.filter((s) => {
      if (investUpSectorFilter && s.slug !== investUpSectorFilter) return false;
      if (investUpCityFilter && !sectorMatchesCity(s, investUpCityFilter)) return false;
      if (investUpOppFilter === "has" && !(s.investmentOpportunities?.length ?? 0)) return false;
      if (investUpOppFilter === "5plus" && (s.investmentOpportunities?.length ?? 0) < 5) return false;
      if (investUpFeaturedOnly && !s.isSpecialProject) return false;
      if (!q) return true;
      const haystack = [
        s.name,
        s.slug,
        s.policy,
        ...(s.districtHotspots ?? []),
        ...(s.investmentOpportunities?.map((o) => `${o.title} ${o.description}`) ?? []),
        ...(s.industryOverview?.indiaScenario ?? []),
        ...(s.industryOverview?.upScenario ?? []),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });

    return [...list].sort((a, b) => {
      if (investUpSort === "name-asc") return a.name.localeCompare(b.name);
      if (investUpSort === "opportunities-desc") {
        return (b.investmentOpportunities?.length ?? 0) - (a.investmentOpportunities?.length ?? 0);
      }
      return (b.investmentScore ?? 0) - (a.investmentScore ?? 0);
    });
  }, [
    investUpSectors,
    investUpQuery,
    investUpSectorFilter,
    investUpCityFilter,
    investUpOppFilter,
    investUpFeaturedOnly,
    investUpSort,
  ]);

  const resetInvestUpFilters = () => {
    setInvestUpQuery("");
    setInvestUpSectorFilter("");
    setInvestUpCityFilter("");
    setInvestUpOppFilter("");
    setInvestUpFeaturedOnly(false);
    setInvestUpSort("score-desc");
    setSelectedInvestUpSlug(null);
  };

  const investUpFiltersActive =
    investUpQuery.trim().length > 0 ||
    investUpSectorFilter.length > 0 ||
    investUpCityFilter.length > 0 ||
    investUpOppFilter.length > 0 ||
    investUpFeaturedOnly ||
    investUpSort !== "score-desc";

  const selectedInvestUp =
    filteredInvestUpSectors.find((s) => s.slug === selectedInvestUpSlug) ??
    filteredInvestUpSectors[0] ??
    null;

  const sectors = useMemo(
    () => [...new Set(data.upsidaProjects.map((p) => p.sector))].sort(),
    [data.upsidaProjects]
  );

  const filteredProjects = useMemo(() => {
    const q = query.trim().toLowerCase();
    return data.upsidaProjects.filter((p) => {
      if (sectorFilter && p.sector !== sectorFilter) return false;
      if (!q) return true;
      return [p.title, p.name, p.district, p.sector].some((v) => v.toLowerCase().includes(q));
    });
  }, [data.upsidaProjects, query, sectorFilter]);

  const selected =
    filteredProjects.find((p) => p.id === selectedId) ?? filteredProjects[0] ?? null;

  const counts = getSourceCounts(data);

  const liveCount = [
    data.upsida,
    data.investIndia,
    data.nsdc,
    data.investUp,
  ].filter((s) => isLiveSource(s.source)).length;

  return (
    <div className="space-y-5 pb-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900">Live Official Data</h2>
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700">
              Live
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Scraped from UPSIDA, Invest India, NSDC &amp; Invest UP · Last synced{" "}
            {formatSyncedAt(data.syncedAt)} · {liveCount}/4 sources live
          </p>
        </div>
        {onRefresh && (
          <button type="button" className="portal-btn-primary text-xs" onClick={onRefresh} disabled={refreshing}>
            {refreshing ? "Refreshing…" : "Refresh live data"}
          </button>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SourceCard
          label="UPSIDA Projects"
          count={counts.upsida}
          unit="projects"
          source={data.upsida.source}
          url={data.upsida.portalUrl}
          active={sourceView === "upsida"}
          onClick={() => setSourceView("upsida")}
        />
        <SourceCard
          label="Invest India Sectors"
          count={counts.investIndia}
          unit="sectors"
          source={data.investIndia.source}
          url={data.investIndia.portalUrl}
          active={sourceView === "investindia"}
          onClick={() => setSourceView("investindia")}
        />
        <SourceCard
          label="NSDC Skills"
          count={counts.nsdc}
          unit="resources"
          source={data.nsdc.source}
          url={data.nsdc.portalUrl}
          active={sourceView === "nsdc"}
          onClick={() => setSourceView("nsdc")}
        />
        <SourceCard
          label="Invest UP"
          count={counts.investUp}
          unit="sectors"
          source={data.investUp.source}
          url={data.investUp.portalUrl}
          active={sourceView === "investup"}
          onClick={() => setSourceView("investup")}
        />
      </div>

      {(sourceView === "all" || sourceView === "investup") && investUpSectors.length > 0 && (
        <InvestUpSectorPanel
          sectors={filteredInvestUpSectors}
          allSectors={investUpSectors}
          allCount={investUpSectors.length}
          portalUrl={data.investUp.portalUrl}
          query={investUpQuery}
          onQueryChange={setInvestUpQuery}
          sectorFilter={investUpSectorFilter}
          onSectorFilterChange={setInvestUpSectorFilter}
          cityFilter={investUpCityFilter}
          onCityFilterChange={setInvestUpCityFilter}
          cities={investUpCities}
          oppFilter={investUpOppFilter}
          onOppFilterChange={setInvestUpOppFilter}
          featuredOnly={investUpFeaturedOnly}
          onFeaturedOnlyChange={setInvestUpFeaturedOnly}
          sort={investUpSort}
          onSortChange={setInvestUpSort}
          filtersActive={investUpFiltersActive}
          onReset={resetInvestUpFilters}
          selected={selectedInvestUp}
          onSelect={setSelectedInvestUpSlug}
        />
      )}

      {(sourceView === "all" || sourceView === "upsida") && (
        <div className="portal-panel">
          <div className="portal-panel-header flex-wrap gap-3">
            <div>
              <h3 className="portal-panel-title">UPSIDA Upcoming Industrial Projects</h3>
              <p className="text-[10px] text-slate-500">
                Live from{" "}
                <a
                  href={data.upsida.portalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-[#2563eb] hover:underline"
                >
                  upsida.in
                </a>{" "}
                · {filteredProjects.length} of {data.upsidaProjects.length} shown
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="text"
                placeholder="Search district, project…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="portal-input w-44 text-sm"
              />
              <select
                value={sectorFilter}
                onChange={(e) => setSectorFilter(e.target.value)}
                className="portal-select min-w-[140px] text-sm"
                aria-label="Filter by sector"
              >
                <option value="">All sectors</option>
                {sectors.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-4 p-4 xl:grid-cols-[1fr_1.1fr]">
            <div className="max-h-[420px] overflow-y-auto rounded-xl border border-slate-100">
              {filteredProjects.map((project) => (
                <button
                  key={project.id}
                  type="button"
                  onClick={() => setSelectedId(project.id)}
                  className={`flex w-full gap-3 border-b border-slate-100 px-3 py-3 text-left transition-colors ${
                    selected?.id === project.id ? "bg-emerald-50" : "hover:bg-slate-50"
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-900">{project.name}</p>
                    <p className="mt-0.5 text-[10px] text-slate-500">
                      {project.district} · {project.sector}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-bold uppercase text-emerald-700">
                    Live
                  </span>
                </button>
              ))}
              {filteredProjects.length === 0 && (
                <p className="px-4 py-8 text-center text-sm text-slate-500">No projects match your search.</p>
              )}
            </div>

            {selected ? (
              <ProjectDetail project={selected} portalUrl={data.upsida.portalUrl} />
            ) : (
              <div className="flex items-center justify-center rounded-xl border border-dashed border-slate-200 p-8 text-sm text-slate-500">
                Select a project to view details
              </div>
            )}
          </div>
        </div>
      )}

      {(sourceView === "all" || sourceView === "investindia") && data.investIndiaSectors.length > 0 && (
        <LinkGrid
          title="Invest India – Uttar Pradesh Sectors"
          subtitle={`${data.investIndiaSectors.length} official sector pages`}
          portalUrl={data.investIndia.portalUrl}
          items={data.investIndiaSectors.slice(0, 12).map((s) => ({
            name: s.name,
            url: s.url,
          }))}
        />
      )}

      {(sourceView === "all" || sourceView === "nsdc") && data.nsdcSectors.length > 0 && (
        <LinkGrid
          title="NSDC Skill Resources"
          subtitle={`${data.nsdcSectors.length} training & sector links`}
          portalUrl={data.nsdc.portalUrl}
          items={data.nsdcSectors.slice(0, 10).map((s) => ({ name: s.name, url: s.url }))}
        />
      )}
    </div>
  );
}

function SourceCard({
  label,
  count,
  unit,
  source,
  url,
  active,
  onClick,
}: {
  label: string;
  count: number;
  unit: string;
  source: string;
  url: string;
  active?: boolean;
  onClick?: () => void;
}) {
  const live = isLiveSource(source);
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border p-3 text-left transition-all ${
        active
          ? "border-emerald-300 bg-emerald-50/60 ring-2 ring-emerald-200"
          : "border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{label}</p>
        <span
          className={`rounded-full px-1.5 py-0.5 text-[8px] font-bold uppercase ${
            live ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
          }`}
        >
          {live ? "Live" : "Unavailable"}
        </span>
      </div>
      <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900">{count}</p>
      <p className="text-[10px] text-slate-500">{unit}</p>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        className="mt-2 inline-flex items-center gap-1 text-[10px] font-semibold text-[#2563eb] hover:underline"
      >
        Open portal
        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
      </a>
    </button>
  );
}

function ProjectDetail({
  project,
  portalUrl,
}: {
  project: UpsidaLiveProject;
  portalUrl: string;
}) {
  return (
    <div className="rounded-xl border border-slate-100 bg-white p-4">
      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-bold uppercase text-emerald-700">
        UPSIDA Live
      </span>
      <h4 className="mt-2 text-sm font-bold text-slate-900">{project.name}</h4>
      <p className="mt-1 text-xs text-slate-500">{project.title}</p>

      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {[
          { l: "District", v: project.district },
          { l: "Sector", v: project.sector },
          { l: "Source", v: "UPSIDA Official Portal" },
          { l: "Updated", v: formatSyncedAt(project.scrapedAt) },
        ].map((m) => (
          <div key={m.l} className="rounded-lg bg-slate-50 px-2.5 py-2">
            <p className="text-[9px] font-bold uppercase text-slate-500">{m.l}</p>
            <p className="text-xs font-semibold text-slate-800">{m.v}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <a
          href={project.detailUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="portal-btn-primary inline-flex items-center gap-1.5 text-xs"
        >
          View details
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
        <a
          href={project.listUrl || portalUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="portal-btn-ghost inline-flex items-center gap-1.5 text-xs"
        >
          All UPSIDA projects
        </a>
      </div>
    </div>
  );
}

function InvestUpSectorPanel({
  sectors,
  allSectors,
  allCount,
  portalUrl,
  query,
  onQueryChange,
  sectorFilter,
  onSectorFilterChange,
  cityFilter,
  onCityFilterChange,
  cities,
  oppFilter,
  onOppFilterChange,
  featuredOnly,
  onFeaturedOnlyChange,
  sort,
  onSortChange,
  filtersActive,
  onReset,
  selected,
  onSelect,
}: {
  sectors: InvestUpLiveSector[];
  allSectors: InvestUpLiveSector[];
  allCount: number;
  portalUrl: string;
  query: string;
  onQueryChange: (q: string) => void;
  sectorFilter: string;
  onSectorFilterChange: (slug: string) => void;
  cityFilter: string;
  onCityFilterChange: (city: string) => void;
  cities: string[];
  oppFilter: InvestUpOppFilter;
  onOppFilterChange: (v: InvestUpOppFilter) => void;
  featuredOnly: boolean;
  onFeaturedOnlyChange: (v: boolean) => void;
  sort: InvestUpSort;
  onSortChange: (v: InvestUpSort) => void;
  filtersActive: boolean;
  onReset: () => void;
  selected: InvestUpLiveSector | null;
  onSelect: (slug: string) => void;
}) {
  return (
    <div className="portal-panel">
      <div className="portal-panel-header flex-wrap gap-3">
        <div>
          <h3 className="portal-panel-title">Invest UP – Priority Sectors</h3>
          <p className="text-[10px] text-slate-500">
            Live from{" "}
            <a
              href={portalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-[#2563eb] hover:underline"
            >
              invest.up.gov.in
            </a>{" "}
            · {sectors.length} of {allCount} entries (sectors + AI City)
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            placeholder="Search sector, opportunity, policy…"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            className="portal-input w-44 text-sm"
          />
          <select
            value={sectorFilter}
            onChange={(e) => {
              const slug = e.target.value;
              onSectorFilterChange(slug);
              if (slug) onSelect(slug);
            }}
            className="portal-select min-w-[160px] text-sm"
            aria-label="Filter by sector"
          >
            <option value="">All sectors</option>
            {allSectors.map((s) => (
              <option key={s.slug} value={s.slug}>
                {s.name}
              </option>
            ))}
          </select>
          {filtersActive && (
            <button type="button" className="portal-btn-ghost text-xs" onClick={onReset}>
              Reset
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 px-4 py-2.5">
        <select
          value={cityFilter}
          onChange={(e) => onCityFilterChange(e.target.value)}
          className="portal-select min-w-[140px] text-sm"
          aria-label="Filter by city"
        >
          <option value="">All cities</option>
          {cities.map((city) => (
            <option key={city} value={city}>
              {city}
            </option>
          ))}
        </select>
        <select
          value={oppFilter}
          onChange={(e) => onOppFilterChange(e.target.value as InvestUpOppFilter)}
          className="portal-select min-w-[140px] text-sm"
          aria-label="Filter by opportunities"
        >
          <option value="">Any opportunities</option>
          <option value="has">Has opportunities</option>
          <option value="5plus">5+ opportunities</option>
        </select>
        <select
          value={sort}
          onChange={(e) => onSortChange(e.target.value as InvestUpSort)}
          className="portal-select min-w-[140px] text-sm"
          aria-label="Sort sectors"
        >
          <option value="score-desc">Sort: Score ↓</option>
          <option value="name-asc">Sort: Name A–Z</option>
          <option value="opportunities-desc">Sort: Opportunities ↓</option>
        </select>
        <label className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700">
          <input
            type="checkbox"
            checked={featuredOnly}
            onChange={(e) => onFeaturedOnlyChange(e.target.checked)}
            className="rounded border-slate-300"
          />
          Featured only
        </label>
      </div>

      <div className="grid gap-4 p-4 xl:grid-cols-[minmax(240px,300px)_1fr]">
        <div className="max-h-[560px] overflow-y-auto rounded-xl border border-slate-100">
          {sectors.map((sector) => {
            const oppCount = sector.investmentOpportunities?.length ?? 0;
            const active = selected?.slug === sector.slug;
            return (
              <button
                key={sector.slug}
                type="button"
                onClick={() => onSelect(sector.slug)}
                className={`flex w-full flex-col gap-1.5 border-b border-slate-50 px-4 py-3.5 text-left transition-all ${
                  active ? "border-l-4 border-l-emerald-500 bg-emerald-50/80" : "border-l-4 border-l-transparent hover:bg-slate-50"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs font-bold leading-snug text-slate-900">{sector.name}</p>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    {sector.isSpecialProject && (
                      <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[8px] font-bold uppercase text-violet-800">
                        Featured
                      </span>
                    )}
                    {sector.investmentScore != null && (
                      <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-700">
                        {sector.investmentScore}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap gap-1">
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-semibold text-emerald-800">
                    {oppCount} opportunit{oppCount === 1 ? "y" : "ies"}
                  </span>
                  {sector.investmentSignal && (
                    <span
                      className={`rounded-full px-2 py-0.5 text-[9px] font-semibold capitalize ${
                        sector.investmentSignal === "high"
                          ? "bg-violet-100 text-violet-800"
                          : sector.investmentSignal === "medium"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {sector.investmentSignal} signal
                    </span>
                  )}
                </div>
              </button>
            );
          })}
          {sectors.length === 0 && (
            <p className="px-4 py-8 text-center text-sm text-slate-500">No sectors match your search.</p>
          )}
        </div>

        {selected ? (
          <InvestUpSectorDetail sector={selected} />
        ) : (
          <div className="flex min-h-[320px] items-center justify-center rounded-xl border border-dashed border-slate-200 p-8 text-sm text-slate-500">
            Select a sector to explore investment data
          </div>
        )}
      </div>
    </div>
  );
}

function signalColor(signal?: string) {
  if (signal === "high") return "from-violet-600 to-indigo-600";
  if (signal === "medium") return "from-amber-500 to-orange-500";
  return "from-slate-500 to-slate-600";
}

function InvestUpSectorDetail({ sector }: { sector: InvestUpLiveSector }) {
  const [tab, setTab] = useState<"overview" | "opportunities" | "contact">("overview");
  const overview = sector.industryOverview;
  const opportunities = sector.investmentOpportunities ?? [];
  const contacts = sector.contacts ?? [];

  return (
    <div className="max-h-[560px] overflow-y-auto bg-slate-50/40 p-4">
      <div className={`rounded-xl bg-gradient-to-r ${signalColor(sector.investmentSignal)} p-4 text-white`}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/70">Invest UP · Live Sector Profile</p>
            <h4 className="mt-1 text-lg font-bold">{sector.name}</h4>
            {sector.policy && <p className="mt-1 text-xs text-white/80">{sector.policy}</p>}
          </div>
          {sector.investmentScore != null && (
            <div className="rounded-xl bg-white/15 px-3 py-2 text-center backdrop-blur">
              <p className="text-[9px] font-bold uppercase text-white/70">Investment Score</p>
              <p className="text-2xl font-bold tabular-nums">{sector.investmentScore}</p>
            </div>
          )}
        </div>
        {sector.districtHotspots && sector.districtHotspots.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {sector.districtHotspots.slice(0, 5).map((d) => (
              <span key={d} className="rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-medium">
                {d}
              </span>
            ))}
          </div>
        )}
      </div>

      {overview?.stats && overview.stats.length > 0 && (
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {overview.stats.slice(0, 6).map((stat) => (
            <div
              key={`${stat.value}-${stat.label}`}
              className="rounded-xl border border-white bg-white px-3 py-2.5 shadow-sm"
            >
              <p className="text-lg font-bold leading-tight text-emerald-700">{stat.value}</p>
              <p className="mt-0.5 text-[10px] leading-snug text-slate-600">{stat.label}</p>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 flex gap-1 rounded-lg bg-white p-1 shadow-sm">
        {(["overview", "opportunities", "contact"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`flex-1 rounded-md px-2 py-1.5 text-[10px] font-bold uppercase tracking-wide transition-colors ${
              tab === t ? "bg-emerald-600 text-white" : "text-slate-500 hover:bg-slate-50"
            }`}
          >
            {t === "overview" ? "Overview" : t === "opportunities" ? `Opportunities (${opportunities.length})` : `Contact (${contacts.length})`}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="mt-3 space-y-4">
          {overview?.highlights && overview.highlights.length > 0 && (
            <div className="grid gap-2 sm:grid-cols-2">
              {overview.highlights.map((h) => (
                <div key={h.label} className="flex gap-2 rounded-lg border border-emerald-100 bg-emerald-50/50 px-3 py-2.5">
                  <span className="mt-0.5 text-emerald-600">✓</span>
                  <p className="text-[11px] leading-relaxed text-slate-700">{h.label}</p>
                </div>
              ))}
            </div>
          )}

          {overview?.indiaScenario && overview.indiaScenario.length > 0 && (
            <OverviewSection
              title={sector.isSpecialProject ? "Project Summary" : "India Scenario"}
              items={overview.indiaScenario}
              accent="blue"
            />
          )}
          {overview?.upScenario && overview.upScenario.length > 0 && (
            <OverviewSection
              title={sector.isSpecialProject ? "Infrastructure & Location" : "Uttar Pradesh Scenario"}
              items={overview.upScenario}
              accent="emerald"
            />
          )}
          {overview?.otherSections?.map((section) => (
            <OverviewSection key={section.heading} title={section.heading} items={section.bullets} accent="slate" />
          ))}
        </div>
      )}

      {tab === "opportunities" && (
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {opportunities.map((opp) => (
            <div key={`${opp.title}-${opp.description.slice(0, 40)}`} className="rounded-xl border border-slate-100 bg-white p-3 shadow-sm">
              <p className="text-[9px] font-bold uppercase tracking-wide text-emerald-700">{opp.category}</p>
              <p className="mt-1 text-xs font-bold text-slate-900">{opp.title}</p>
              <p className="mt-1.5 text-[11px] leading-relaxed text-slate-600">{opp.description}</p>
            </div>
          ))}
          {opportunities.length === 0 && (
            <p className="col-span-2 py-6 text-center text-sm text-slate-500">No opportunities listed for this sector yet.</p>
          )}
        </div>
      )}

      {tab === "contact" && (
        <div className="mt-3 space-y-2">
          {contacts.map((c) => (
            <div key={c.email || c.name} className="rounded-xl border border-slate-100 bg-white p-3 shadow-sm">
              <p className="text-sm font-bold text-slate-900">{c.name}</p>
              {c.designation && <p className="text-xs text-slate-600">{c.designation}</p>}
              {c.department && <p className="text-[10px] text-slate-500">{c.department}</p>}
              <div className="mt-2 flex flex-wrap gap-2">
                {c.phone && (
                  <a href={`tel:${c.phone}`} className="rounded-md bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-800">
                    {c.phone}
                  </a>
                )}
                {c.email && (
                  <a href={`mailto:${c.email}`} className="rounded-md bg-blue-50 px-2 py-1 text-[10px] font-semibold text-blue-800">
                    {c.email}
                  </a>
                )}
              </div>
            </div>
          ))}
          {contacts.length === 0 && (
            <p className="py-6 text-center text-sm text-slate-500">
              No sector nodal officer listed on the portal.{" "}
              <a href={sector.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-emerald-700 hover:underline">
                View sector page
              </a>
            </p>
          )}
        </div>
      )}

      <div className="mt-4">
        <a
          href={sector.url}
          target="_blank"
          rel="noopener noreferrer"
          className="portal-btn-primary inline-flex items-center gap-1.5 text-xs"
        >
          View full sector profile on Invest UP
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
      </div>
    </div>
  );
}

function OverviewSection({
  title,
  items,
  accent,
}: {
  title: string;
  items: string[];
  accent: "blue" | "emerald" | "slate";
}) {
  const border = accent === "blue" ? "border-blue-200" : accent === "emerald" ? "border-emerald-200" : "border-slate-200";
  const head = accent === "blue" ? "text-blue-800" : accent === "emerald" ? "text-emerald-800" : "text-slate-700";
  return (
    <div className={`rounded-xl border ${border} bg-white p-3 shadow-sm`}>
      <h5 className={`text-[10px] font-bold uppercase tracking-wide ${head}`}>{title}</h5>
      <ul className="mt-2 space-y-2">
        {items.slice(0, 8).map((item) => (
          <li key={item.slice(0, 70)} className="flex gap-2 text-[11px] leading-relaxed text-slate-700">
            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-current opacity-40" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function LinkGrid({
  title,
  subtitle,
  portalUrl,
  items,
}: {
  title: string;
  subtitle: string;
  portalUrl: string;
  items: { name: string; url: string }[];
}) {
  return (
    <div className="portal-panel">
      <div className="portal-panel-header">
        <div>
          <h3 className="portal-panel-title">{title}</h3>
          <p className="text-[10px] text-slate-500">{subtitle}</p>
        </div>
        <a
          href={portalUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="portal-btn-ghost text-xs"
        >
          Open portal
        </a>
      </div>
      <div className="grid gap-2 p-4 sm:grid-cols-2">
        {items.map((item) => (
          <a
            key={`${item.name}-${item.url}`}
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between gap-2 rounded-lg border border-slate-100 px-3 py-2.5 text-left transition-colors hover:border-blue-200 hover:bg-blue-50/40"
          >
            <span className="line-clamp-2 text-xs font-semibold text-slate-800">{item.name}</span>
            <span className="shrink-0 text-[10px] font-bold text-[#2563eb]">View →</span>
          </a>
        ))}
      </div>
    </div>
  );
}
