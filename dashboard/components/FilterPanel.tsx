"use client";

import { useMemo, useState } from "react";
import type { State } from "@/lib/types";
import type { DashboardFilters } from "@/lib/jobAnalytics";
import type { CityAggregate } from "@/lib/upCities";
import {
  APPLICATION_OPTIONS,
  CATEGORY_OPTIONS,
  EDUCATION_OPTIONS,
} from "@/lib/jobAnalytics";
import ActiveFilterChips from "./ActiveFilterChips";

interface Props {
  filters: DashboardFilters;
  states: State[];
  boards: string[];
  qualTags: string[];
  cities?: CityAggregate[];
  showCityFilter?: boolean;
  onChange: (next: Partial<DashboardFilters>) => void;
  onSync: () => void;
  onReset: () => void;
  syncing: boolean;
  onRemoveFilter?: (key: keyof DashboardFilters) => void;
}

const LABOUR_PILLS = [
  { value: "", label: "All", color: "bg-slate-100 text-slate-600 ring-slate-200" },
  { value: "skilled", label: "Skilled", color: "bg-emerald-50 text-emerald-800 ring-emerald-200" },
  { value: "semi_skilled", label: "Semi", color: "bg-amber-50 text-amber-800 ring-amber-200" },
  { value: "unskilled", label: "Unskilled", color: "bg-red-50 text-red-800 ring-red-200" },
  { value: "general", label: "General", color: "bg-slate-50 text-slate-700 ring-slate-200" },
];

function countActiveFilters(filters: DashboardFilters): number {
  let n = 0;
  if (filters.q) n++;
  if (filters.board) n++;
  if (filters.city) n++;
  if (filters.district) n++;
  if (filters.educationTier) n++;
  if (filters.labourType) n++;
  if (filters.postCategory) n++;
  if (filters.qualification) n++;
  if (filters.applicationType) n++;
  if (filters.minPosts) n++;
  if (filters.closingSoon) n++;
  return n;
}

export default function FilterPanel({
  filters,
  states,
  boards,
  qualTags,
  cities = [],
  showCityFilter = false,
  onChange,
  onSync,
  onReset,
  syncing,
  onRemoveFilter,
}: Props) {
  const [expanded, setExpanded] = useState(true);
  const activeCount = useMemo(() => countActiveFilters(filters), [filters]);

  return (
    <div className="filter-panel overflow-hidden">
      {/* Accent bar */}
      <div className="h-1 bg-gradient-to-r from-up-saffron via-amber-400 to-up-green" />

      {/* Header */}
      <div className="filter-panel-header">
        <div className="flex items-center gap-3">
          <div className="filter-panel-icon">
            <FilterIcon />
          </div>
          <div>
            <h2 className="text-base font-bold tracking-tight text-slate-900">
              Explore &amp; filter
            </h2>
            <p className="text-xs text-slate-500">
              Narrow jobs by location, skills, education &amp; more
            </p>
          </div>
          {activeCount > 0 && (
            <span className="filter-badge">{activeCount} active</span>
          )}
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
          <button
            type="button"
            className="filter-btn-primary"
            onClick={onSync}
            disabled={syncing}
          >
            <RefreshIcon spinning={syncing} />
            {syncing ? "Syncing…" : "Refresh"}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="filter-panel-body">
          {/* Search */}
          <div className="filter-search-wrap">
            <SearchIcon />
            <input
              className="filter-search"
              placeholder="Search posts, boards, qualifications, advt numbers…"
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

          {/* Labour quick pills */}
          <div className="filter-section">
            <SectionLabel icon={<LabourIcon />} title="Labour type" />
            <div className="flex flex-wrap gap-2">
              {LABOUR_PILLS.map((pill) => {
                const active = filters.labourType === pill.value;
                return (
                  <button
                    key={pill.value || "all"}
                    type="button"
                    onClick={() => onChange({ labourType: pill.value })}
                    className={`filter-pill ${pill.color} ${
                      active ? "filter-pill-active" : ""
                    }`}
                  >
                    {pill.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {/* Location */}
            <div className="filter-section-card">
              <SectionLabel icon={<LocationIcon />} title="Location" />
              <div className="grid gap-3 sm:grid-cols-2">
                <FilterSelect
                  label="State"
                  value={filters.state}
                  onChange={(v) =>
                    onChange({ state: v, board: "", qualification: "", city: "", district: "" })
                  }
                  options={states.map((s) => ({ value: s.code, label: s.name }))}
                />
                {showCityFilter && (
                  <FilterSelect
                    label="City"
                    value={filters.city}
                    onChange={(v) => onChange({ city: v, district: v ? "" : filters.district })}
                    options={[
                      { value: "", label: "All cities" },
                      ...cities.map((c) => ({
                        value: c.cityId,
                        label: `${c.cityName} (${c.vacancies.toLocaleString("en-IN")})`,
                      })),
                    ]}
                  />
                )}
              </div>
            </div>

            {/* Workforce */}
            <div className="filter-section-card">
              <SectionLabel icon={<BriefcaseIcon />} title="Job profile" />
              <div className="grid gap-3 sm:grid-cols-2">
                <FilterSelect
                  label="Category"
                  value={filters.postCategory}
                  onChange={(v) => onChange({ postCategory: v })}
                  options={CATEGORY_OPTIONS.map((o) => ({
                    value: o.value,
                    label: o.label,
                  }))}
                />
                <FilterSelect
                  label="Recruitment board"
                  value={filters.board}
                  onChange={(v) => onChange({ board: v })}
                  options={[
                    { value: "", label: "All boards" },
                    ...boards.map((b) => ({ value: b, label: b })),
                  ]}
                />
              </div>
            </div>

            {/* Education */}
            <div className="filter-section-card">
              <SectionLabel icon={<EducationIcon />} title="Qualifications" />
              <div className="grid gap-3 sm:grid-cols-2">
                <FilterSelect
                  label="Education level"
                  value={filters.educationTier}
                  onChange={(v) => onChange({ educationTier: v })}
                  options={EDUCATION_OPTIONS.map((o) => ({
                    value: o.value,
                    label: o.label,
                  }))}
                />
                <FilterSelect
                  label="Qualification tag"
                  value={filters.qualification}
                  onChange={(v) => onChange({ qualification: v })}
                  options={[
                    { value: "", label: "Any qualification" },
                    ...qualTags.map((q) => ({ value: q, label: q })),
                  ]}
                />
              </div>
            </div>

            {/* Listing options */}
            <div className="filter-section-card">
              <SectionLabel icon={<SlidersIcon />} title="Listing options" />
              <div className="grid gap-3 sm:grid-cols-2">
                <FilterSelect
                  label="Application mode"
                  value={filters.applicationType}
                  onChange={(v) => onChange({ applicationType: v })}
                  options={APPLICATION_OPTIONS.map((o) => ({
                    value: o.value,
                    label: o.label,
                  }))}
                />
                <FilterSelect
                  label="Minimum posts"
                  value={filters.minPosts}
                  onChange={(v) => onChange({ minPosts: v })}
                  options={[
                    { value: "", label: "Any size" },
                    { value: "1", label: "1+ posts" },
                    { value: "10", label: "10+ posts" },
                    { value: "50", label: "50+ posts" },
                    { value: "100", label: "100+ posts" },
                    { value: "500", label: "500+ posts" },
                  ]}
                />
                <FilterSelect
                  label="Sort by"
                  value={filters.sort}
                  onChange={(v) => onChange({ sort: v })}
                  options={[
                    { value: "post_date", label: "Post date" },
                    { value: "last_date", label: "Last date" },
                    { value: "posts", label: "No. of posts" },
                    { value: "board", label: "Board" },
                    { value: "post_name", label: "Post name" },
                  ]}
                />
                <div className="flex items-end">
                  <label
                    className={`filter-toggle ${filters.closingSoon ? "filter-toggle-on" : ""}`}
                  >
                    <input
                      type="checkbox"
                      checked={filters.closingSoon}
                      onChange={(e) => onChange({ closingSoon: e.target.checked })}
                      className="sr-only"
                    />
                    <ClockIcon />
                    <span>Closing this week</span>
                    <span className="filter-toggle-knob" />
                  </label>
                </div>
              </div>
            </div>
          </div>

          {onRemoveFilter && (
            <div className="filter-chips-row">
              <ActiveFilterChips
                filters={filters}
                cities={cities}
                onRemove={onRemoveFilter}
                onClear={onReset}
                embedded
              />
            </div>
          )}
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
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDownIcon />
      </div>
    </label>
  );
}

/* Icons */
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

function RefreshIcon({ spinning }: { spinning: boolean }) {
  return (
    <svg
      className={`h-4 w-4 ${spinning ? "animate-spin" : ""}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  );
}

function ChevronIcon({ up }: { up: boolean }) {
  return (
    <svg
      className={`h-3.5 w-3.5 transition-transform ${up ? "rotate-180" : ""}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
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

function LocationIcon() {
  return (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function LabourIcon() {
  return (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function BriefcaseIcon() {
  return (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  );
}

function EducationIcon() {
  return (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path d="M12 14l9-5-9-5-9 5 9 5z" />
      <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824 2.998 12.078 12.078 0 01.665-6.479L12 14z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824 2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
    </svg>
  );
}

function SlidersIcon() {
  return (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}
