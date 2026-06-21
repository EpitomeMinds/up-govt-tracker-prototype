import type { NcsAnalyticsFilter, NcsFrameAnalytics, NcsFrameId } from "./ncsAnalyticsTypes";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`API error ${res.status}: ${path}`);
  return res.json();
}

export function getNcsFrameAnalytics(
  frameId: NcsFrameId,
  filters: NcsAnalyticsFilter[] = [],
  scope: NcsAnalyticsFilter[] = []
): Promise<NcsFrameAnalytics> {
  const params = new URLSearchParams();
  if (filters.length > 0) params.set("filters", JSON.stringify(filters));
  if (scope.length > 0) params.set("scope", JSON.stringify(scope));
  const qs = params.toString();
  return fetchJson(`/api/ncs/analytics/frame/${frameId}${qs ? `?${qs}` : ""}`);
}
