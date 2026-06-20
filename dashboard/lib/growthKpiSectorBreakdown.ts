import type { AiRecommendationsSummary } from "./aiRecommendationsTypes";
import type { InvestmentPredictionsResponse } from "./investmentTypes";

export interface GrowthKpiSectorRanking {
  name: string;
  value: number;
}

export interface GrowthKpiSectorBreakdowns {
  pli: GrowthKpiSectorRanking[];
  fdi: GrowthKpiSectorRanking[];
  startup: GrowthKpiSectorRanking[];
  pipeline: GrowthKpiSectorRanking[];
  aiRecommendations: GrowthKpiSectorRanking[];
}

function readNum(value: unknown): number {
  if (typeof value === "number") return value;
  const parsed = Number(String(value ?? "").replace(/[^0-9.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

/** Drop national totals, catch-alls, and other non-sector rollup rows from top-N lists. */
export function isAggregateSectorLabel(label: string): boolean {
  const s = String(label ?? "").trim();
  if (!s || s.length > 72) return true;
  const lower = s.toLowerCase();
  if (lower === "sector") return true;
  if (lower.startsWith("total")) return true;
  if (lower.startsWith("national")) return true;
  if (lower.startsWith("methodology")) return true;
  if (lower.startsWith("source:") || lower.startsWith("source project")) return true;
  if (lower.startsWith("note:")) return true;
  if (/^[a-d]\.\s/.test(lower)) return true;
  if (lower === "others" || lower === "other") return true;
  if (lower.startsWith("other /") || lower.startsWith("other/")) return true;
  if (lower.includes("other cities")) return true;
  if (lower === "general") return true;
  if (/^mixed\s*[–-]/i.test(s)) return true;
  if (/policy\s*\/\s*multi/i.test(lower)) return true;
  if (/multi-sector|multisector|pan-india|pan india|all sectors|all industries/i.test(lower)) {
    return true;
  }
  return false;
}

function sectorRows(rows: GrowthKpiSectorRanking[]): GrowthKpiSectorRanking[] {
  return rows.filter((row) => !isAggregateSectorLabel(row.name));
}

function topN(rows: GrowthKpiSectorRanking[], limit = 5): GrowthKpiSectorRanking[] {
  return sectorRows(rows).sort((a, b) => b.value - a.value).slice(0, limit);
}

function aggregateByField(
  rows: Record<string, unknown>[],
  labelKey: string,
  valueKey: string
): GrowthKpiSectorRanking[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const label = String(row[labelKey] ?? "").trim();
    if (!label || isAggregateSectorLabel(label)) continue;
    map.set(label, (map.get(label) ?? 0) + readNum(row[valueKey]));
  }
  return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
}

function isHeaderOrNote(label: string): boolean {
  return isAggregateSectorLabel(label);
}

function parsePliSectors(
  pliTracker: Record<string, unknown>[],
  pliJobsTotal: number
): GrowthKpiSectorRanking[] {
  const outlayRows: GrowthKpiSectorRanking[] = [];
  let inSection = false;

  for (const row of pliTracker) {
    const metric = String(row.Metric ?? "").trim();
    if (metric === "SECTOR-WISE PLI PERFORMANCE") {
      inSection = true;
      continue;
    }
    if (!inSection) continue;
    if (isHeaderOrNote(metric)) continue;
    const outlay = readNum(row.Unit);
    if (outlay > 0) outlayRows.push({ name: metric, value: outlay });
  }

  const eligibleOutlay = outlayRows.filter((row) => !isAggregateSectorLabel(row.name));
  const totalOutlay = eligibleOutlay.reduce((sum, row) => sum + row.value, 0);
  if (totalOutlay <= 0 || pliJobsTotal <= 0) return topN(eligibleOutlay);

  return topN(
    eligibleOutlay.map((row) => ({
      name: row.name,
      value: Math.round(pliJobsTotal * (row.value / totalOutlay)),
    }))
  );
}

function parseFdiSectors(
  fdiTracker: Record<string, unknown>[],
  fdiTotalUsdBn: number
): GrowthKpiSectorRanking[] {
  const shareRows: GrowthKpiSectorRanking[] = [];
  let inSection = false;

  for (const row of fdiTracker) {
    const fy = String(row["Financial Year"] ?? "").trim();
    if (/sector-wise/i.test(fy) && /fdi|equity/i.test(fy)) {
      inSection = true;
      continue;
    }
    if (!inSection) continue;
    if (/^[A-D]\.\s/.test(fy)) break;
    if (isHeaderOrNote(fy)) continue;
    // Workbook stores cumulative equity *share* (0–1) in this column, not USD Bn.
    const share = readNum(row["Total FDI Inflow (US$ Bn)"]);
    if (share > 0 && share <= 1) shareRows.push({ name: fy, value: share });
  }

  if (fdiTotalUsdBn <= 0) return topN(shareRows);

  return topN(
    shareRows.map((row) => ({
      name: row.name,
      value: fdiTotalUsdBn * row.value,
    }))
  );
}

function parseStartupSectors(startupTracker: Record<string, unknown>[]): GrowthKpiSectorRanking[] {
  const rows: GrowthKpiSectorRanking[] = [];
  let inSection = false;

  for (const row of startupTracker) {
    const fy = String(row["Financial Year"] ?? "").trim();
    if (/sector-wise funding/i.test(fy)) {
      inSection = true;
      continue;
    }
    if (!inSection) continue;
    if (/^[A-D]\.\s/.test(fy)) break;
    if (isHeaderOrNote(fy)) continue;
    const fundingUsdBn = readNum(row["Total Funding (US$ Bn)"]);
    if (fundingUsdBn > 0 && fundingUsdBn <= 20) {
      rows.push({ name: fy, value: fundingUsdBn });
    }
  }

  return topN(rows);
}

export function buildGrowthKpiSectorBreakdowns(
  data: InvestmentPredictionsResponse,
  aiSummary?: AiRecommendationsSummary | null
): GrowthKpiSectorBreakdowns {
  const sheets = data.workbook?.sheets;
  const pliJobs = sheets?.dashboardKpis?.pliJobsCumulative ?? 0;
  const fdiUsdBn = sheets?.dashboardKpis?.fdiInflowUsdBn ?? 0;

  const pipeline = aggregateByField(
    sheets?.mainDataset ?? [],
    "Sector",
    "Investment Value (INR Cr)"
  );

  const aiRecommendations = topN(
    (aiSummary?.bySector ?? []).map((s) => ({ name: s.name, value: s.gap }))
  );

  return {
    pli: parsePliSectors(sheets?.pliTracker ?? [], pliJobs),
    fdi: parseFdiSectors(sheets?.fdiTracker ?? [], fdiUsdBn),
    startup: parseStartupSectors(sheets?.startupTracker ?? []),
    pipeline: topN(pipeline),
    aiRecommendations,
  };
}
