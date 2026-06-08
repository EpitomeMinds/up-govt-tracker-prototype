"use client";

import type {
  AiRecommendationFilters,
  AiRecommendationsFacets,
} from "@/lib/aiRecommendationsTypes";
import { PRIORITY_COLORS } from "@/lib/aiRecommendationsApi";
import AiActiveFilterChips from "./AiActiveFilterChips";

interface Props {
  filters: AiRecommendationFilters;
  facets: AiRecommendationsFacets;
  resultCount: number;
  totalCount: number;
  onChange: (next: Partial<AiRecommendationFilters>) => void;
  onReset: () => void;
  onRemoveFilter: (key: keyof AiRecommendationFilters) => void;
  onExpandFilters: () => void;
}

const PRIORITIES = ["Critical", "High", "Medium", "Low"];

export default function AiCompactFilterBar({
  filters,
  facets,
  resultCount,
  totalCount,
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
          placeholder="Search title, sector, department…"
          value={filters.q}
          onChange={(e) => onChange({ q: e.target.value })}
        />
      </div>

      <div className="hidden h-6 w-px bg-bi-border sm:block" />

      <div className="flex flex-wrap gap-1">
        {PRIORITIES.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => onChange({ priority: filters.priority === p ? "" : p })}
            className={`bi-pill ${
              filters.priority === p ? "bi-pill-active text-white" : "bi-pill-inactive"
            }`}
            style={
              filters.priority === p
                ? { backgroundColor: PRIORITY_COLORS[p], borderColor: PRIORITY_COLORS[p] }
                : undefined
            }
          >
            {p}
          </button>
        ))}
      </div>

      <select
        className="bi-select"
        value={filters.sector}
        onChange={(e) => onChange({ sector: e.target.value })}
      >
        <option value="">All sectors</option>
        {facets.sectors.map((s) => (
          <option key={s} value={s}>
            {s.length > 32 ? `${s.slice(0, 31)}…` : s}
          </option>
        ))}
      </select>

      <select
        className="bi-select"
        value={filters.region}
        onChange={(e) => onChange({ region: e.target.value })}
      >
        <option value="">All regions</option>
        {facets.regions.map((r) => (
          <option key={r} value={r}>
            {r}
          </option>
        ))}
      </select>

      <select
        className="bi-select max-w-[140px]"
        value={filters.boardCategory}
        onChange={(e) => onChange({ boardCategory: e.target.value, department: "" })}
      >
        <option value="">All categories</option>
        {facets.boardCategories.map((c) => (
          <option key={c} value={c}>
            {c.length > 24 ? `${c.slice(0, 23)}…` : c}
          </option>
        ))}
      </select>

      <select
        className="bi-select max-w-[160px]"
        value={filters.department}
        onChange={(e) => onChange({ department: e.target.value, boardCategory: "" })}
      >
        <option value="">All boards</option>
        {facets.departments.map((d) => (
          <option key={d} value={d}>
            {d.length > 28 ? `${d.slice(0, 27)}…` : d}
          </option>
        ))}
      </select>

      <select
        className="bi-select"
        value={filters.status}
        onChange={(e) => onChange({ status: e.target.value })}
      >
        <option value="">All statuses</option>
        {facets.statuses.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>

      <div className="ml-auto flex items-center gap-3">
        <span className="hidden text-[11px] tabular-nums text-bi-muted sm:inline">
          {resultCount} of {totalCount}
        </span>
        <button type="button" className="btn-ghost" onClick={onExpandFilters}>
          More filters
        </button>
        <button type="button" className="btn-ghost" onClick={onReset}>
          Clear all
        </button>
      </div>

      <div className="w-full basis-full">
        <AiActiveFilterChips
          filters={filters}
          onRemove={onRemoveFilter}
          onClear={onReset}
          embedded
        />
      </div>
    </div>
  );
}
