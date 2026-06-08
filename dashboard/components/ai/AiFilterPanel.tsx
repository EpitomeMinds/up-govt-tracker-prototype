"use client";

import { useMemo, useState } from "react";
import type {
  AiRecommendationFilters,
  AiRecommendationsFacets,
} from "@/lib/aiRecommendationsTypes";
import { PRIORITY_COLORS } from "@/lib/aiRecommendationsApi";
import AiActiveFilterChips, { countActiveAiFilters } from "./AiActiveFilterChips";

interface Props {
  filters: AiRecommendationFilters;
  facets: AiRecommendationsFacets;
  resultCount: number;
  totalCount: number;
  onChange: (next: Partial<AiRecommendationFilters>) => void;
  onReset: () => void;
  onRemoveFilter: (key: keyof AiRecommendationFilters) => void;
}

const PRIORITY_PILLS = [
  { value: "", label: "All", color: "bg-slate-100 text-slate-600 ring-slate-200" },
  { value: "Critical", label: "Critical", color: "bg-red-50 text-red-800 ring-red-200" },
  { value: "High", label: "High", color: "bg-amber-50 text-amber-800 ring-amber-200" },
  { value: "Medium", label: "Medium", color: "bg-blue-50 text-blue-800 ring-blue-200" },
  { value: "Low", label: "Low", color: "bg-slate-50 text-slate-700 ring-slate-200" },
];

export default function AiFilterPanel({
  filters,
  facets,
  resultCount,
  totalCount,
  onChange,
  onReset,
  onRemoveFilter,
}: Props) {
  const [expanded, setExpanded] = useState(true);
  const activeCount = useMemo(() => countActiveAiFilters(filters), [filters]);

  return (
    <div className="filter-panel overflow-hidden">
      <div className="h-1 bg-gradient-to-r from-bi-accent via-bi-violet to-bi-teal" />

      <div className="filter-panel-header">
        <div className="flex items-center gap-3">
          <div className="filter-panel-icon">
            <FilterIcon />
          </div>
          <div>
            <h2 className="text-base font-bold tracking-tight text-slate-900">
              Filter recommendations
            </h2>
            <p className="text-xs text-slate-500">
              Narrow by priority, sector, region, status &amp; timeline
            </p>
          </div>
          {activeCount > 0 && (
            <span className="filter-badge">{activeCount} active</span>
          )}
          <span className="rounded-full bg-bi-canvas px-2.5 py-0.5 text-[11px] font-semibold text-bi-muted">
            {resultCount} / {totalCount} shown
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="filter-btn-ghost"
            onClick={() => setExpanded((e) => !e)}
          >
            {expanded ? "Collapse" : "Expand"}
            <ChevronIcon up={expanded} />
          </button>
          <button type="button" className="filter-btn-ghost" onClick={onReset}>
            Clear all
          </button>
        </div>
      </div>

      {expanded && (
        <div className="filter-panel-body">
          <div className="filter-search-wrap">
            <SearchIcon />
            <input
              className="filter-search"
              placeholder="Search title, sector, department, region…"
              value={filters.q}
              onChange={(e) => onChange({ q: e.target.value })}
            />
            {filters.q && (
              <button
                type="button"
                className="filter-search-clear"
                onClick={() => onChange({ q: "" })}
                aria-label="Clear search"
              >
                ×
              </button>
            )}
          </div>

          <div className="filter-section">
            <SectionLabel icon={<PriorityIcon />} title="Priority" />
            <div className="flex flex-wrap gap-2">
              {PRIORITY_PILLS.map((pill) => {
                const active = filters.priority === pill.value;
                return (
                  <button
                    key={pill.value || "all"}
                    type="button"
                    onClick={() => onChange({ priority: pill.value })}
                    className={`filter-pill ${pill.color} ${active ? "filter-pill-active" : ""}`}
                    style={
                      active && pill.value
                        ? {
                            backgroundColor: PRIORITY_COLORS[pill.value],
                            color: "white",
                          }
                        : undefined
                    }
                  >
                    {pill.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="filter-section-card">
              <SectionLabel icon={<SectorIcon />} title="Sector & region" />
              <div className="grid gap-3 sm:grid-cols-2">
                <FilterSelect
                  label="Sector"
                  value={filters.sector}
                  onChange={(v) => onChange({ sector: v })}
                  options={[
                    { value: "", label: "All sectors" },
                    ...facets.sectors.map((s) => ({ value: s, label: s })),
                  ]}
                />
                <FilterSelect
                  label="Region"
                  value={filters.region}
                  onChange={(v) => onChange({ region: v })}
                  options={[
                    { value: "", label: "All regions" },
                    ...facets.regions.map((r) => ({ value: r, label: r })),
                  ]}
                />
              </div>
            </div>

            <div className="filter-section-card">
              <SectionLabel icon={<BoardIcon />} title="Boards & departments" />
              <div className="grid gap-3 sm:grid-cols-2">
                <FilterSelect
                  label="Board category"
                  value={filters.boardCategory}
                  onChange={(v) => onChange({ boardCategory: v, department: "" })}
                  options={[
                    { value: "", label: "All categories" },
                    ...facets.boardCategories.map((c) => ({ value: c, label: c })),
                  ]}
                />
                <FilterSelect
                  label="Department / board"
                  value={filters.department}
                  onChange={(v) => onChange({ department: v, boardCategory: "" })}
                  options={[
                    { value: "", label: "All boards" },
                    ...facets.departments.map((d) => ({ value: d, label: d })),
                  ]}
                />
              </div>
            </div>

            <div className="filter-section-card">
              <SectionLabel icon={<StatusIcon />} title="Status & timeline" />
              <div className="grid gap-3 sm:grid-cols-2">
                <FilterSelect
                  label="Status"
                  value={filters.status}
                  onChange={(v) => onChange({ status: v })}
                  options={[
                    { value: "", label: "All statuses" },
                    ...facets.statuses.map((s) => ({ value: s, label: s })),
                  ]}
                />
                <FilterSelect
                  label="Start year"
                  value={filters.startYear}
                  onChange={(v) => onChange({ startYear: v })}
                  options={[
                    { value: "", label: "All years" },
                    ...facets.startYears.map((y) => ({
                      value: String(y),
                      label: String(y),
                    })),
                  ]}
                />
              </div>
            </div>

            <div className="filter-section-card lg:col-span-2">
              <SectionLabel icon={<ActionIcon />} title="Action type" />
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => onChange({ actionType: "" })}
                  className={`filter-pill bg-slate-100 text-slate-600 ring-slate-200 ${
                    !filters.actionType ? "filter-pill-active" : ""
                  }`}
                >
                  All
                </button>
                {facets.actionTypes.map((a) => (
                  <button
                    key={a}
                    type="button"
                    onClick={() =>
                      onChange({ actionType: filters.actionType === a ? "" : a })
                    }
                    className={`filter-pill bg-bi-canvas text-bi-label ring-bi-border ${
                      filters.actionType === a ? "filter-pill-active" : ""
                    }`}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="filter-chips-row">
            <AiActiveFilterChips
              filters={filters}
              onRemove={onRemoveFilter}
              onClear={onReset}
              embedded
            />
          </div>
        </div>
      )}
    </div>
  );
}

function SectionLabel({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <span className="filter-section-icon">{icon}</span>
      <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
        {title}
      </span>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  const active = value !== "";
  return (
    <label className="block">
      <span className="filter-label">{label}</span>
      <div className={`filter-select-wrap ${active ? "filter-select-active" : ""}`}>
        <select
          className="filter-select"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        >
          {options.map((o) => (
            <option key={o.value || "__all"} value={o.value}>
              {o.label.length > 40 ? `${o.label.slice(0, 39)}…` : o.label}
            </option>
          ))}
        </select>
        <ChevronDownIcon />
      </div>
    </label>
  );
}

function FilterIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg className="h-4 w-4 shrink-0 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );
}

function ChevronIcon({ up }: { up: boolean }) {
  return (
    <svg className={`h-3.5 w-3.5 transition-transform ${up ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}

function PriorityIcon() {
  return (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  );
}

function SectorIcon() {
  return (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  );
}

function BoardIcon() {
  return (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
    </svg>
  );
}

function StatusIcon() {
  return (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function ActionIcon() {
  return (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  );
}
