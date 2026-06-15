import type { AiRecommendationFilters, AiRecommendationsResponse } from "./aiRecommendationsTypes";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`API error ${res.status}: ${path}`);
  return res.json();
}

export function getAiRecommendations(
  filters: Partial<AiRecommendationFilters> = {}
): Promise<AiRecommendationsResponse> {
  const params = new URLSearchParams();
  if (filters.priority) params.set("priority", filters.priority);
  if (filters.sector) params.set("sector", filters.sector);
  if (filters.region) params.set("region", filters.region);
  if (filters.department) params.set("department", filters.department);
  if (filters.boardCategory) params.set("boardCategory", filters.boardCategory);
  if (filters.status) params.set("status", filters.status);
  if (filters.actionType) params.set("actionType", filters.actionType);
  if (filters.startYear) params.set("startYear", filters.startYear);
  if (filters.q) params.set("q", filters.q);
  const qs = params.toString();
  return fetchJson(`/api/ai-recommendations${qs ? `?${qs}` : ""}`);
}

export function formatWorkforce(n: number): string {
  if (n >= 100000) return `${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return n.toLocaleString("en-IN");
}

export function formatBudgetCr(n: number): string {
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)}k Cr`;
  return `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 1 })} Cr`;
}

export const PRIORITY_COLORS: Record<string, string> = {
  Critical: "#dc2626",
  High: "#f59e0b",
  Medium: "#0078e8",
  Low: "#8b95ad",
};

export const STATUS_COLORS: Record<string, string> = {
  High: "#059669",
  Medium: "#f59e0b",
  Low: "#8b95ad",
  Approved: "#059669",
  "In Execution": "#0078e8",
  Proposed: "#6c5ce7",
  "Pending Funding": "#f59e0b",
  "Under Review": "#8b95ad",
};
