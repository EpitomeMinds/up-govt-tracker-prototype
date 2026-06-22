"use client";

import { useMemo } from "react";
import type { NcsDashboardFilters } from "@/lib/ncsJobTypes";
import type { NcsScopedFacets } from "@/lib/ncsJobsApi";
import { hasNcsScopeFilters } from "@/lib/ncsAnalyticsFilters";
import { isIndustryBucketKey } from "@/lib/ncsFilterNormalize";

interface Props {
  filters: NcsDashboardFilters;
  scopedFacets: NcsScopedFacets | null;
  totalAvailable?: number;
  matchTotal?: number;
  onChange: (next: Partial<NcsDashboardFilters>) => void;
  onApply: () => void;
  onReset: () => void;
}

function ensureOption(
  options: { value: string; label: string; count?: number }[],
  value: string,
  fallbackLabel?: string
) {
  if (!value) return options;
  if (options.some((opt) => opt.value === value)) return options;
  return [{ value, label: fallbackLabel || value, count: undefined }, ...options];
}

export default function PortalNcsFilterBar({
  filters,
  scopedFacets,
  totalAvailable,
  matchTotal,
  onChange,
  onApply,
  onReset,
}: Props) {
  const isFiltered = hasNcsScopeFilters(filters);

  const stateOptions = useMemo(() => {
    const rows = scopedFacets?.states ?? [];
    const options = rows.map((s) => ({
      value: s.state,
      label: s.state,
      count: s.count,
    }));
    return ensureOption(options, filters.state);
  }, [scopedFacets?.states, filters.state]);

  const cities = useMemo(() => {
    const rows = scopedFacets?.cities ?? [];
    const options = rows.map((c) => ({
      value: c.city,
      label: c.city,
      count: c.count,
    }));
    return ensureOption(options, filters.city);
  }, [scopedFacets?.cities, filters.city]);

  const industries = useMemo(() => {
    const rows = scopedFacets?.industries ?? [];
    const options = rows.map((row) => ({
      value: row.name,
      label: row.name,
      count: row.count,
    }));
    return ensureOption(options, filters.industry);
  }, [scopedFacets?.industries, filters.industry]);

  const functionalAreas = useMemo(() => {
    const rows = (scopedFacets?.functionalAreas ?? []).filter(
      (row) => row.name && !isIndustryBucketKey(row.name)
    );
    const options = rows.map((row) => ({
      value: row.name,
      label: row.name,
      count: row.count,
    }));
    return ensureOption(options, filters.functionalArea);
  }, [scopedFacets?.functionalAreas, filters.functionalArea]);

  const jobTypes = useMemo(() => {
    const rows = scopedFacets?.jobTypes ?? [];
    const options = rows.map((row) => ({
      value: row.name,
      label: row.name.replace(/_/g, " "),
      count: row.count,
    }));
    return ensureOption(options, filters.jobType);
  }, [scopedFacets?.jobTypes, filters.jobType]);

  const activeChips = useMemo(() => {
    const chips: { key: keyof NcsDashboardFilters; label: string; value: string }[] = [];
    if (filters.state) chips.push({ key: "state", label: "State", value: filters.state });
    if (filters.city) chips.push({ key: "city", label: "City", value: filters.city });
    if (filters.industry) chips.push({ key: "industry", label: "Sector", value: filters.industry });
    if (filters.functionalArea) {
      chips.push({ key: "functionalArea", label: "Sub-sector", value: filters.functionalArea });
    }
    if (filters.organization) {
      chips.push({ key: "organization", label: "Employer", value: filters.organization });
    }
    if (filters.functionalRole) {
      chips.push({ key: "functionalRole", label: "Role", value: filters.functionalRole });
    }
    if (filters.jobTitle) chips.push({ key: "jobTitle", label: "Opening", value: filters.jobTitle });
    if (filters.jobType) chips.push({ key: "jobType", label: "Job type", value: filters.jobType });
    if (filters.salaryBand) {
      chips.push({ key: "salaryBand", label: "Salary band", value: filters.salaryBand });
    }
    if (filters.experienceBand) {
      chips.push({ key: "experienceBand", label: "Experience", value: filters.experienceBand });
    }
    if (filters.q.trim()) chips.push({ key: "q", label: "Search", value: filters.q.trim() });
    return chips;
  }, [filters]);

  const clearChip = (key: keyof NcsDashboardFilters) => {
    if (key === "state") {
      onChange({ state: "", city: "", industry: "", functionalArea: "" });
      return;
    }
    if (key === "industry") {
      onChange({ industry: "", functionalArea: "" });
      return;
    }
    onChange({ [key]: "" } as Partial<NcsDashboardFilters>);
  };

  return (
    <div className="portal-filter-card flex-col items-stretch gap-3 !p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-slate-800">Private sector vacancies</p>
          {isFiltered && matchTotal != null ? (
            <p className="text-xs text-slate-500">
              {matchTotal.toLocaleString("en-IN")} listings match your chart filters
              {totalAvailable != null && totalAvailable !== matchTotal
                ? ` (${totalAvailable.toLocaleString("en-IN")} nationally)`
                : ""}
            </p>
          ) : totalAvailable != null ? (
            <p className="text-xs text-slate-500">
              {totalAvailable.toLocaleString("en-IN")} jobs available nationally
            </p>
          ) : null}
        </div>
      </div>

      {activeChips.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {activeChips.map((chip) => (
            <button
              key={`${chip.key}-${chip.value}`}
              type="button"
              onClick={() => clearChip(chip.key)}
              className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-[11px] font-medium text-blue-800"
            >
              <span className="text-blue-600">{chip.label}:</span>
              <span className="max-w-[180px] truncate">{chip.value}</span>
              <span className="text-blue-500">×</span>
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <div className="relative min-w-[220px] flex-1">
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
            placeholder="Search title, company, skills..."
            value={filters.q}
            onChange={(e) => onChange({ q: e.target.value })}
            className="portal-input portal-input-with-icon"
          />
        </div>

        <select
          value={filters.state}
          onChange={(e) =>
            onChange({
              state: e.target.value,
              city: "",
              industry: "",
              functionalArea: "",
            })
          }
          className="portal-select"
        >
          <option value="">All states</option>
          {stateOptions.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
              {s.count != null ? ` (${s.count})` : ""}
            </option>
          ))}
        </select>

        <select
          value={filters.city}
          onChange={(e) => onChange({ city: e.target.value })}
          className="portal-select"
          disabled={!filters.state && cities.length === 0}
        >
          <option value="">
            {filters.state ? "All cities in state" : "City (select state first)"}
          </option>
          {cities.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label} ({c.count ?? 0})
            </option>
          ))}
        </select>

        <select
          value={filters.industry}
          onChange={(e) =>
            onChange({
              industry: e.target.value,
              functionalArea: "",
            })
          }
          className="portal-select"
        >
          <option value="">Industry sector</option>
          {industries.map((row) => (
            <option key={row.value} value={row.value}>
              {row.label} ({row.count ?? 0})
            </option>
          ))}
        </select>

        <select
          value={filters.functionalArea}
          onChange={(e) => onChange({ functionalArea: e.target.value })}
          className="portal-select"
          disabled={!filters.industry && functionalAreas.length === 0}
        >
          <option value="">
            {filters.industry ? "Sub-sector (functional area)" : "Sub-sector (select sector first)"}
          </option>
          {functionalAreas.map((a) => (
            <option key={a.value} value={a.value}>
              {a.label} ({a.count ?? 0})
            </option>
          ))}
        </select>

        <select
          value={filters.jobType}
          onChange={(e) => onChange({ jobType: e.target.value })}
          className="portal-select"
        >
          <option value="">Job type</option>
          {jobTypes.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label} ({t.count ?? 0})
            </option>
          ))}
        </select>

        <select
          value={filters.minExperience}
          onChange={(e) => onChange({ minExperience: e.target.value })}
          className="portal-select"
        >
          <option value="">Min experience</option>
          <option value="0">Fresher (0 yrs)</option>
          <option value="1">1+ yrs</option>
          <option value="3">3+ yrs</option>
          <option value="5">5+ yrs</option>
        </select>

        <select
          value={filters.minSalary}
          onChange={(e) => onChange({ minSalary: e.target.value })}
          className="portal-select"
        >
          <option value="">Min salary</option>
          <option value="200000">2 LPA+</option>
          <option value="300000">3 LPA+</option>
          <option value="500000">5 LPA+</option>
          <option value="800000">8 LPA+</option>
          <option value="1200000">12 LPA+</option>
        </select>

        <select
          value={filters.sort}
          onChange={(e) => onChange({ sort: e.target.value })}
          className="portal-select"
        >
          <option value="published_at">Newest first</option>
          <option value="salary">Salary</option>
          <option value="experience">Experience</option>
          <option value="applicants">Applicants</option>
        </select>

        <button type="button" onClick={onApply} className="portal-btn-primary">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          Apply
        </button>

        <button type="button" onClick={onReset} className="portal-btn-primary">
          Reset
        </button>
      </div>
    </div>
  );
}
