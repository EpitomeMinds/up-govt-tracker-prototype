"use client";

import {
  LABOUR_OPTIONS,
  type DashboardFilters,
} from "@/lib/jobAnalytics";

interface Props {
  filters: DashboardFilters;
  boards: string[];
  cities: { key: string; name: string }[];
  qualTags: string[];
  onChange: (next: Partial<DashboardFilters>) => void;
  onApply: () => void;
  onReset: () => void;
}

export default function PortalFilterBar({
  filters,
  boards,
  cities,
  qualTags,
  onChange,
  onApply,
  onReset,
}: Props) {
  return (
    <div className="portal-filter-card">
      <div className="relative flex-1 min-w-[220px]">
        <svg
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          inputMode="search"
          placeholder="Search by title, department..."
          value={filters.q}
          onChange={(e) => onChange({ q: e.target.value })}
          className="portal-input portal-input-with-icon"
        />
      </div>

      <select
        value={filters.board}
        onChange={(e) => onChange({ board: e.target.value })}
        className="portal-select"
      >
        <option value="">Department</option>
        {boards.map((b) => (
          <option key={b} value={b}>
            {b}
          </option>
        ))}
      </select>

      <select
        value={filters.labourType}
        onChange={(e) => onChange({ labourType: e.target.value })}
        className="portal-select"
      >
        {LABOUR_OPTIONS.map((o) => (
          <option key={o.value || "all"} value={o.value}>
            {o.value ? o.label : "Skill Level"}
          </option>
        ))}
      </select>

      <select
        value={filters.city}
        onChange={(e) => onChange({ city: e.target.value })}
        className="portal-select"
      >
        <option value="">Location</option>
        {cities.slice(0, 30).map((c) => (
          <option key={c.key} value={c.key}>
            {c.name}
          </option>
        ))}
      </select>

      <select
        value={filters.qualification}
        onChange={(e) => onChange({ qualification: e.target.value })}
        className="portal-select"
      >
        <option value="">Qualification</option>
        {qualTags.slice(0, 40).map((tag) => (
          <option key={tag} value={tag}>
            {tag}
          </option>
        ))}
      </select>

      <button type="button" onClick={onApply} className="portal-btn-primary">
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
        </svg>
        Apply
      </button>

      <button type="button" onClick={onReset} className="portal-btn-primary">
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        Reset
      </button>
    </div>
  );
}
