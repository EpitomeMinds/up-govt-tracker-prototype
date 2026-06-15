"use client";

import type { AiRecommendationFilters, AiRecommendationsFacets } from "@/lib/aiRecommendationsTypes";
import type { GrowthFacets, GrowthFilters } from "@/lib/portalGrowthFilters";

type Mode = "growth" | "recommendations";

interface BaseProps {
  mode: Mode;
  resultCount: number;
  totalCount: number;
  onReset: () => void;
}

interface GrowthProps extends BaseProps {
  mode: "growth";
  growthFilters: GrowthFilters;
  growthFacets: GrowthFacets;
  onChange: (next: Partial<GrowthFilters>) => void;
}

interface RecommendationsProps extends BaseProps {
  mode: "recommendations";
  aiFilters: AiRecommendationFilters;
  aiFacets: AiRecommendationsFacets;
  onChange: (next: Partial<AiRecommendationFilters>) => void;
}

type Props = GrowthProps | RecommendationsProps;

export default function PortalGrowthRecommendationsFilterBar(props: Props) {
  const { mode, resultCount, totalCount, onReset } = props;
  const activeCount =
    mode === "growth"
      ? Object.values(props.growthFilters).filter(Boolean).length
      : [
          props.aiFilters.q,
          props.aiFilters.priority,
          props.aiFilters.sector,
          props.aiFilters.region,
          props.aiFilters.actionType,
          props.aiFilters.status,
          props.aiFilters.startYear,
        ].filter(Boolean).length;

  return (
    <div className="portal-filter-card flex-col !items-stretch gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wide text-slate-500">Filters</span>
          {activeCount > 0 && (
            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700">
              {activeCount} active
            </span>
          )}
          <span className="text-[11px] text-slate-500">
            {resultCount} of {totalCount} shown
          </span>
        </div>
        <button type="button" onClick={onReset} className="portal-btn-ghost text-xs">
          Reset filters
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {mode === "growth" ? (
          <GrowthFields {...props} />
        ) : (
          <RecommendationsFields {...props} />
        )}
      </div>
    </div>
  );
}

function GrowthFields({
  growthFilters,
  growthFacets,
  onChange,
}: GrowthProps) {
  return (
    <>
      <SearchInput
        value={growthFilters.q}
        placeholder="Search project, industry, skills…"
        onChange={(q) => onChange({ q })}
      />
      <Select
        value={growthFilters.industry}
        onChange={(industry) => onChange({ industry })}
        label="Industry"
        options={growthFacets.industries}
      />
      <Select
        value={growthFilters.region}
        onChange={(region) => onChange({ region })}
        label="Region"
        options={growthFacets.regions}
      />
      <Select
        value={growthFilters.district}
        onChange={(district) => onChange({ district })}
        label="Location"
        options={growthFacets.districts}
      />
      <Select
        value={growthFilters.skillType}
        onChange={(skillType) => onChange({ skillType })}
        label="Skill type"
        options={growthFacets.skillTypes}
      />
      <Select
        value={growthFilters.confidence}
        onChange={(confidence) => onChange({ confidence })}
        label="Confidence"
        options={growthFacets.confidenceLevels}
      />
    </>
  );
}

function RecommendationsFields({
  aiFilters,
  aiFacets,
  onChange,
}: RecommendationsProps) {
  return (
    <>
      <SearchInput
        value={aiFilters.q}
        placeholder="Search project, industry, skills…"
        onChange={(q) => onChange({ q })}
      />
      <Select
        value={aiFilters.priority}
        onChange={(priority) => onChange({ priority })}
        label="Priority"
        options={aiFacets.priorities}
      />
      <Select
        value={aiFilters.sector}
        onChange={(sector) => onChange({ sector })}
        label="Industry"
        options={aiFacets.sectors}
      />
      <Select
        value={aiFilters.region}
        onChange={(region) => onChange({ region })}
        label="Region"
        options={aiFacets.regions}
      />
      <Select
        value={aiFilters.actionType}
        onChange={(actionType) => onChange({ actionType })}
        label="Skill type"
        options={aiFacets.actionTypes}
      />
      <Select
        value={aiFilters.status}
        onChange={(status) => onChange({ status })}
        label="Confidence"
        options={aiFacets.statuses}
      />
      <Select
        value={aiFilters.startYear}
        onChange={(startYear) => onChange({ startYear })}
        label="Start year"
        options={aiFacets.startYears.map(String)}
      />
    </>
  );
}

function SearchInput({
  value,
  placeholder,
  onChange,
}: {
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="relative min-w-[200px] flex-1">
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
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="portal-input portal-input-with-icon w-full"
      />
    </div>
  );
}

function Select({
  value,
  onChange,
  label,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  label: string;
  options: string[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="portal-select min-w-[130px]"
      aria-label={label}
    >
      <option value="">{label}</option>
      {options.map((opt) => (
        <option key={opt} value={opt}>
          {opt.length > 36 ? `${opt.slice(0, 35)}…` : opt}
        </option>
      ))}
    </select>
  );
}
