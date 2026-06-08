"use client";

import type { DashboardFilters } from "@/lib/jobAnalytics";
import { filterLabel } from "@/lib/jobAnalytics";
import type { CityAggregate } from "@/lib/upCities";

interface Props {
  filters: DashboardFilters;
  cities?: CityAggregate[];
  onRemove: (key: keyof DashboardFilters) => void;
  onClear: () => void;
  embedded?: boolean;
}

export default function ActiveFilterChips({
  filters,
  cities = [],
  onRemove,
  onClear,
  embedded = false,
}: Props) {
  const active: { key: keyof DashboardFilters; label: string }[] = [];

  if (filters.q) active.push({ key: "q", label: `"${filters.q}"` });
  if (filters.board) active.push({ key: "board", label: filters.board });
  if (filters.city) {
    const cityName =
      cities.find((c) => c.cityId === filters.city)?.cityName || filters.city;
    active.push({ key: "city", label: cityName });
  }
  if (filters.district) {
    active.push({ key: "district", label: filters.district });
  }
  if (filters.educationTier)
    active.push({
      key: "educationTier",
      label: filterLabel("educationTier", filters.educationTier),
    });
  if (filters.labourType)
    active.push({
      key: "labourType",
      label: filterLabel("labourType", filters.labourType),
    });
  if (filters.postCategory)
    active.push({
      key: "postCategory",
      label: filterLabel("postCategory", filters.postCategory),
    });
  if (filters.qualification)
    active.push({ key: "qualification", label: filters.qualification });
  if (filters.applicationType)
    active.push({
      key: "applicationType",
      label: filterLabel("applicationType", filters.applicationType),
    });
  if (filters.minPosts)
    active.push({ key: "minPosts", label: `${filters.minPosts}+ posts` });
  if (filters.closingSoon)
    active.push({ key: "closingSoon", label: "Closing this week" });

  if (active.length === 0) return null;

  return (
    <div className={`flex flex-wrap items-center gap-2 ${embedded ? "" : "rounded-xl border border-orange-100 bg-orange-50/50 px-4 py-3"}`}>
      <span className="text-[10px] font-bold uppercase tracking-widest text-orange-600/80">
        Active
      </span>
      {active.map(({ key, label }) => (
        <button
          key={key}
          type="button"
          onClick={() => onRemove(key)}
          className="filter-chip"
        >
          {label}
          <span className="filter-chip-x" aria-hidden>
            ×
          </span>
        </button>
      ))}
      {!embedded && (
        <button type="button" onClick={onClear} className="filter-chip-clear">
          Clear all
        </button>
      )}
    </div>
  );
}
