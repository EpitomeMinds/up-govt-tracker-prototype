import type {
  NcsDashboardFilters,
  NcsFacetsResponse,
  NcsJobsResponse,
  NcsStats,
} from "./ncsJobTypes";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`API error ${res.status}: ${path}`);
  }
  return res.json();
}

export function getNcsJobs(
  filters: Partial<NcsDashboardFilters> & { page?: number; limit?: number } = {}
): Promise<NcsJobsResponse> {
  const search = new URLSearchParams();
  if (filters.q) search.set("q", filters.q);
  if (filters.city) search.set("city", filters.city);
  if (filters.state) search.set("state", filters.state);
  if (filters.jobType) search.set("jobType", filters.jobType);
  if (filters.functionalArea) search.set("functionalArea", filters.functionalArea);
  if (filters.industry) search.set("industry", filters.industry);
  if (filters.minSalary) search.set("minSalary", filters.minSalary);
  if (filters.maxSalary) search.set("maxSalary", filters.maxSalary);
  if (filters.minExperience) search.set("minExperience", filters.minExperience);
  if (filters.maxExperience) search.set("maxExperience", filters.maxExperience);
  if (filters.sort) search.set("sort", filters.sort);
  if (filters.order) search.set("order", filters.order);
  if (filters.page) search.set("page", String(filters.page));
  search.set("limit", String(filters.limit ?? 500));
  return fetchJson(`/api/ncs/jobs?${search}`);
}

export function getNcsStats(): Promise<NcsStats> {
  return fetchJson("/api/ncs/stats");
}

export function getNcsFacets(): Promise<NcsFacetsResponse> {
  return fetchJson("/api/ncs/facets");
}

export async function triggerNcsSync(maxPages?: number): Promise<void> {
  const qs = maxPages != null ? `?maxPages=${maxPages}` : "";
  await fetchJson(`/api/ncs/sync${qs}`, { method: "POST" });
}

export function formatSalaryLpa(min: number | null, max: number | null, hidden = false): string {
  if (hidden) return "Not disclosed";
  if (min == null && max == null) return "Not disclosed";
  const toLpa = (v: number) => (v / 100000).toFixed(1);
  if (min != null && max != null && min !== max) {
    return `${toLpa(min)}–${toLpa(max)} LPA`;
  }
  const val = min ?? max;
  return val != null ? `${toLpa(val)} LPA` : "Not disclosed";
}

export function formatExperience(min: number | null, max: number | null): string {
  if (min == null && max == null) return "Fresher";
  if (min === 0 && (max === 0 || max === 1)) return "Fresher";
  if (min != null && max != null && min !== max) return `${min}–${max} yrs`;
  const val = min ?? max;
  return val != null ? `${val} yr${val === 1 ? "" : "s"}` : "—";
}

export function formatJobType(type: string): string {
  return type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function timeAgo(iso: string): string {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${Math.max(1, mins)} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr${hrs === 1 ? "" : "s"} ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
