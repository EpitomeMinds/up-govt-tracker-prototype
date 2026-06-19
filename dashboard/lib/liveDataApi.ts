import type { LiveDataSourcesResponse } from "./liveDataTypes";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

function resolveCount(metaValue: number | undefined, arrayLength: number): number {
  const meta = Number(metaValue);
  const len = arrayLength || 0;
  if (Number.isFinite(meta) && meta > 0) return meta;
  return len;
}

function dedupeLinks<T extends { name: string; url: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = `${item.name}|${item.url}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function normalizeLiveData(raw: LiveDataSourcesResponse | null): LiveDataSourcesResponse | null {
  if (!raw) return null;

  const upsidaProjects = raw.upsidaProjects ?? [];
  const investIndiaSectors = raw.investIndiaSectors ?? [];
  const investUpSectors = raw.investUpSectors ?? [];
  const nsdcSectors = raw.nsdcSectors ?? [];
  const upSkillPortals = dedupeLinks(raw.ncsData?.upSkillPortals ?? []);
  const industryJobLinks = dedupeLinks(raw.ncsData?.industryJobLinks ?? []);
  const ncsLinkCount = upSkillPortals.length + industryJobLinks.length;

  return {
    ...raw,
    upsida: {
      ...raw.upsida,
      projectCount: resolveCount(raw.upsida?.projectCount, upsidaProjects.length),
    },
    investIndia: {
      ...raw.investIndia,
      sectorCount: resolveCount(raw.investIndia.sectorCount, investIndiaSectors.length),
    },
    ncs: {
      ...raw.ncs,
      linkCount: resolveCount(raw.ncs.linkCount, ncsLinkCount),
    },
    nsdc: {
      ...raw.nsdc,
      sectorCount: resolveCount(raw.nsdc.sectorCount, nsdcSectors.length),
    },
    investUp: {
      ...raw.investUp,
      sectorCount: resolveCount(raw.investUp.sectorCount, investUpSectors.length),
    },
    upsidaProjects,
    investIndiaSectors,
    investUpSectors,
    nsdcSectors,
    ncsData: { upSkillPortals, industryJobLinks },
  };
}

async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`API error ${res.status}: ${path}`);
  return res.json();
}

export async function getLiveDataSources(): Promise<LiveDataSourcesResponse | null> {
  const apiData = await fetchJson<LiveDataSourcesResponse>("/api/ai-recommendations/sources");
  return normalizeLiveData(apiData);
}

export function formatSyncedAt(iso: string): string {
  try {
    return new Date(iso).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export function isLiveSource(source: string): boolean {
  return source.endsWith("_live");
}

export function getSourceCounts(data: LiveDataSourcesResponse) {
  const ncsLinks =
    (data.ncsData.upSkillPortals?.length ?? 0) + (data.ncsData.industryJobLinks?.length ?? 0);
  return {
    upsida: resolveCount(data.upsida.projectCount, data.upsidaProjects.length),
    investIndia: resolveCount(data.investIndia.sectorCount, data.investIndiaSectors.length),
    ncs: resolveCount(data.ncs.linkCount, ncsLinks),
    nsdc: resolveCount(data.nsdc.sectorCount, data.nsdcSectors.length),
    investUp: resolveCount(data.investUp.sectorCount, data.investUpSectors?.length ?? 0),
  };
}
