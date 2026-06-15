"use client";

import type { AiRecommendationFilters } from "@/lib/aiRecommendationsTypes";

interface Props {
  filters: AiRecommendationFilters;
  onRemove: (key: keyof AiRecommendationFilters) => void;
  onClear: () => void;
  embedded?: boolean;
}

const LABELS: Record<keyof AiRecommendationFilters, string> = {
  q: "Search",
  priority: "Priority",
  sector: "Industry",
  region: "Region",
  department: "Industry",
  boardCategory: "Cluster",
  status: "Confidence",
  actionType: "Skill type",
  startYear: "Start year",
};

export default function AiActiveFilterChips({
  filters,
  onRemove,
  onClear,
  embedded = false,
}: Props) {
  const active: { key: keyof AiRecommendationFilters; label: string }[] = [];

  if (filters.q) active.push({ key: "q", label: `"${filters.q}"` });
  if (filters.priority) active.push({ key: "priority", label: filters.priority });
  if (filters.sector) active.push({ key: "sector", label: filters.sector });
  if (filters.region) active.push({ key: "region", label: filters.region });
  if (filters.department) active.push({ key: "department", label: filters.department });
  if (filters.boardCategory) active.push({ key: "boardCategory", label: filters.boardCategory });
  if (filters.status) active.push({ key: "status", label: filters.status });
  if (filters.actionType) active.push({ key: "actionType", label: filters.actionType });
  if (filters.startYear) active.push({ key: "startYear", label: filters.startYear });

  if (active.length === 0) return null;

  return (
    <div
      className={`flex flex-wrap items-center gap-2 ${embedded ? "" : "rounded-xl border border-bi-accent/20 bg-bi-accentSoft/30 px-4 py-3"}`}
    >
      <span className="text-[10px] font-bold uppercase tracking-widest text-bi-accent">
        Active
      </span>
      {active.map(({ key, label }) => (
        <button
          key={key}
          type="button"
          onClick={() => onRemove(key)}
          className="filter-chip"
          title={`Remove ${LABELS[key]} filter`}
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

export function countActiveAiFilters(filters: AiRecommendationFilters): number {
  let n = 0;
  if (filters.q) n++;
  if (filters.priority) n++;
  if (filters.sector) n++;
  if (filters.region) n++;
  if (filters.department) n++;
  if (filters.boardCategory) n++;
  if (filters.status) n++;
  if (filters.actionType) n++;
  if (filters.startYear) n++;
  return n;
}
