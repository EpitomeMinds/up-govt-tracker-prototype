"use client";

import { useMemo, useState } from "react";
import type { LiveDataSourcesResponse, UpsidaLiveProject } from "@/lib/liveDataTypes";
import { formatSyncedAt, getSourceCounts, isLiveSource } from "@/lib/liveDataApi";

interface Props {
  data: LiveDataSourcesResponse;
  onRefresh?: () => void;
  refreshing?: boolean;
}

type SourceFilter = "all" | "upsida" | "investindia" | "nsdc";

export default function PortalLiveDataBlock({ data, onRefresh, refreshing }: Props) {
  const [query, setQuery] = useState("");
  const [sectorFilter, setSectorFilter] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sourceView, setSourceView] = useState<SourceFilter>("all");

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
          active={sourceView === "all"}
          onClick={() => setSourceView("all")}
        />
      </div>

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

      {sourceView === "all" && (data.investUpSectors?.length ?? 0) > 0 && (
        <LinkGrid
          title="Invest UP – Priority Sectors"
          subtitle={`${data.investUpSectors!.length} industrial sectors in Uttar Pradesh`}
          portalUrl={data.investUp.portalUrl}
          items={data.investUpSectors!.slice(0, 12).map((s) => ({ name: s.name, url: s.url }))}
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
