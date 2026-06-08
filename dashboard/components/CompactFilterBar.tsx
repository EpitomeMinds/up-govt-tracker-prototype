"use client";

import type { DashboardFilters } from "@/lib/jobAnalytics";
import ActiveFilterChips from "./ActiveFilterChips";
import type { CityAggregate } from "@/lib/upCities";

interface Props {
  filters: DashboardFilters;
  boards: string[];
  cities?: CityAggregate[];
  onChange: (next: Partial<DashboardFilters>) => void;
  onReset: () => void;
  onRemoveFilter: (key: keyof DashboardFilters) => void;
  onExpandFilters: () => void;
}

const LABOUR = [
  { value: "", label: "All" },
  { value: "skilled", label: "Skilled" },
  { value: "semi_skilled", label: "Semi" },
  { value: "unskilled", label: "Unskilled" },
];

export default function CompactFilterBar({
  filters,
  boards,
  cities = [],
  onChange,
  onReset,
  onRemoveFilter,
  onExpandFilters,
}: Props) {
  return (
    <div className="bi-toolbar">
      <div className="relative">
        <svg
          className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-bi-muted"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          className="bi-search"
          placeholder="Search jobs…"
          value={filters.q}
          onChange={(e) => onChange({ q: e.target.value })}
        />
      </div>

      <div className="hidden h-6 w-px bg-bi-border sm:block" />

      <div className="flex gap-1">
        {LABOUR.map((p) => (
          <button
            key={p.value || "all"}
            type="button"
            onClick={() => onChange({ labourType: p.value })}
            className={`bi-pill ${
              filters.labourType === p.value ? "bi-pill-active" : "bi-pill-inactive"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      <select
        className="bi-select"
        value={filters.board}
        onChange={(e) => onChange({ board: e.target.value })}
      >
        <option value="">All boards</option>
        {boards.map((b) => (
          <option key={b} value={b}>
            {b.length > 28 ? `${b.slice(0, 27)}…` : b}
          </option>
        ))}
      </select>

      <div className="ml-auto flex items-center gap-3">
        <button type="button" className="btn-ghost" onClick={onExpandFilters}>
          More filters
        </button>
        <button type="button" className="btn-ghost" onClick={onReset}>
          Clear all
        </button>
      </div>

      <div className="w-full basis-full">
        <ActiveFilterChips
          filters={filters}
          cities={cities}
          onRemove={onRemoveFilter}
          onClear={onReset}
          embedded
        />
      </div>
    </div>
  );
}
