import type { NcsAnalyticsFilter, NcsFrameAnalytics, NcsFrameId } from "./ncsAnalyticsTypes";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`API error ${res.status}: ${path}`);
  return res.json();
}

export function getNcsFrameAnalytics(
  frameId: NcsFrameId,
  filters: NcsAnalyticsFilter[] = []
): Promise<NcsFrameAnalytics> {
  const qs =
    filters.length > 0 ? `?filters=${encodeURIComponent(JSON.stringify(filters))}` : "";
  return fetchJson(`/api/ncs/analytics/frame/${frameId}${qs}`);
}
