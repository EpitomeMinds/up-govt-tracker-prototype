"use client";

import type { NcsDashboardFilters } from "@/lib/ncsJobTypes";
import type { NcsFacetsResponse } from "@/lib/ncsJobTypes";

interface Props {
  filters: NcsDashboardFilters;
  facets: NcsFacetsResponse["facets"] | null;
  totalAvailable?: number;
  onChange: (next: Partial<NcsDashboardFilters>) => void;
  onReset: () => void;
}

export default function PortalNcsFilterBar({
  filters,
  facets,
  totalAvailable,
  onChange,
  onReset,
}: Props) {
  const cities = facets?.cities ?? [];
  const states = facets?.states ?? [];
  const jobTypes = facets?.jobTypes ?? [];
  const functionalAreas = facets?.functionalAreas ?? [];

  return (
    <div className="portal-filter-card flex-col items-stretch gap-3 !p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-slate-800">Private sector vacancies</p>
          {totalAvailable != null && (
            <p className="text-xs text-slate-500">
              {totalAvailable.toLocaleString("en-IN")} jobs available nationally
            </p>
          )}
        </div>
      </div>

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
          onChange={(e) => onChange({ state: e.target.value, city: "" })}
          className="portal-select"
        >
          <option value="">All states</option>
          {states.slice(0, 40).map((s) => (
            <option key={s.state} value={s.state}>
              {s.state} ({s.count})
            </option>
          ))}
        </select>

        <select
          value={filters.city}
          onChange={(e) => onChange({ city: e.target.value })}
          className="portal-select"
        >
          <option value="">All cities</option>
          {cities.slice(0, 50).map((c) => (
            <option key={c.city} value={c.city}>
              {c.city} ({c.count})
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
            <option key={t.name} value={t.name}>
              {t.name.replace(/_/g, " ")} ({t.count})
            </option>
          ))}
        </select>

        <select
          value={filters.functionalArea}
          onChange={(e) => onChange({ functionalArea: e.target.value })}
          className="portal-select"
        >
          <option value="">Functional area</option>
          {functionalAreas.slice(0, 40).map((a) => (
            <option key={a.name} value={a.name}>
              {a.name} ({a.count})
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

        <button type="button" onClick={onReset} className="portal-btn-primary">
          Reset
        </button>
      </div>
    </div>
  );
}
