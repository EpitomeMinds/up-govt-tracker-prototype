import type { Job, JobsResponse, Stats, State } from "./types";
import type { InvestmentPredictionsResponse } from "./investmentTypes";

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

async function loadBundledGrowthReport(): Promise<InvestmentPredictionsResponse | null> {
  try {
    const res = await fetch("/upGrowthInvestmentReport.json", { cache: "no-store" });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

function hasWorkbookSheets(data: InvestmentPredictionsResponse | null | undefined): boolean {
  const sheets = data?.workbook?.sheets;
  if (!sheets) return false;
  return Boolean(
    sheets.topOpportunities?.length ||
      sheets.employmentRanking?.length ||
      sheets.mainDataset?.length
  );
}

export function getJobs(params: {
  state?: string;
  board?: string;
  q?: string;
  sort?: string;
  order?: string;
  page?: number;
  limit?: number;
}): Promise<JobsResponse> {
  const search = new URLSearchParams();
  search.set("state", params.state || "UP");
  if (params.board) search.set("board", params.board);
  if (params.q) search.set("q", params.q);
  if (params.sort) search.set("sort", params.sort);
  if (params.order) search.set("order", params.order);
  if (params.page) search.set("page", String(params.page));
  search.set("limit", String(params.limit ?? 50));
  return fetchJson(`/api/jobs?${search}`);
}

export function getStats(state = "UP"): Promise<Stats> {
  return fetchJson(`/api/stats?state=${state}`);
}

export function getStates(): Promise<State[]> {
  return fetchJson("/api/states");
}

export async function triggerSync(state = "UP", invest = false): Promise<void> {
  const qs = invest ? `?state=${state}&invest=true` : `?state=${state}`;
  await fetchJson(`/api/sync${qs}`, { method: "POST" });
}

export async function getInvestmentPredictions(
  state = "UP"
): Promise<InvestmentPredictionsResponse> {
  try {
    const data = await fetchJson<InvestmentPredictionsResponse>(
      `/api/investments/predictions?state=${state}`
    );
    if (hasWorkbookSheets(data)) return data;
  } catch {
    // Fall through to bundled workbook JSON below.
  }

  const bundled = await loadBundledGrowthReport();
  if (bundled) {
    return { ...bundled, stateCode: state };
  }

  throw new Error("Investment predictions unavailable");
}

export async function triggerInvestmentSync(): Promise<void> {
  await fetchJson("/api/investments/sync", { method: "POST" });
}

export function formatDate(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

export function isClosingSoon(job: Job): boolean {
  if (!job.last_date_parsed) return false;
  const last = new Date(job.last_date_parsed);
  const now = new Date();
  const week = new Date();
  week.setDate(week.getDate() + 7);
  return last >= now && last <= week;
}

export function parsePostInfo(postName: string): {
  title: string;
  postCount: number | null;
} {
  const match = postName.match(/^(.+?)\s*[–-]\s*(\d+)\s*Posts?\s*$/i);
  if (match) {
    return {
      title: match[1].trim(),
      postCount: parseInt(match[2], 10),
    };
  }
  return { title: postName.trim(), postCount: null };
}

export function formatPostCount(count: number | null): string {
  if (count === null) return "—";
  return count.toLocaleString("en-IN");
}
