import type { InvestmentPredictionsResponse } from "./investmentTypes";
import type {
  DistrictImpactRow,
  GrowthKpis,
  SectorJobRow,
  TrendPoint,
} from "./investmentPortalAnalytics";
import { SECTOR_COLORS } from "./investmentPortalAnalyticsConstants";

export interface GrowthFilters {
  q: string;
  industry: string;
  region: string;
  district: string;
  skillType: string;
  confidence: string;
}

export interface GrowthFacets {
  industries: string[];
  regions: string[];
  districts: string[];
  skillTypes: string[];
  confidenceLevels: string[];
}

export const DEFAULT_GROWTH_FILTERS: GrowthFilters = {
  q: "",
  industry: "",
  region: "",
  district: "",
  skillType: "",
  confidence: "",
};

function readNum(value: unknown): number {
  if (typeof value === "number") return value;
  const parsed = Number(String(value ?? "").replace(/[^0-9.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function mainRows(data: InvestmentPredictionsResponse): Record<string, unknown>[] {
  return data.workbook?.sheets?.mainDataset ?? [];
}

export function extractGrowthFacets(data: InvestmentPredictionsResponse): GrowthFacets {
  const rows = mainRows(data);
  const uniq = (key: string) =>
    [...new Set(rows.map((r) => String(r[key] ?? "").trim()).filter(Boolean))].sort();

  const districts = [
    ...new Set(
      rows
        .map((r) => String(r.Location ?? "").trim())
        .filter(Boolean)
        .flatMap((loc) => loc.split(/[,/]/).map((p) => p.trim()))
        .filter(Boolean)
    ),
  ].sort();

  return {
    industries: uniq("Department / Industry"),
    regions: uniq("Region"),
    districts,
    skillTypes: uniq("Skill Type"),
    confidenceLevels: uniq("Confidence Level"),
  };
}

export function countActiveGrowthFilters(filters: GrowthFilters): number {
  return Object.values(filters).filter(Boolean).length;
}

export function filterGrowthRows(
  data: InvestmentPredictionsResponse,
  filters: GrowthFilters
): Record<string, unknown>[] {
  let rows = mainRows(data);
  if (!rows.length) return rows;

  if (filters.industry) {
    rows = rows.filter((r) => String(r["Department / Industry"] ?? "") === filters.industry);
  }
  if (filters.region) {
    rows = rows.filter((r) => String(r.Region ?? "") === filters.region);
  }
  if (filters.district) {
    const d = filters.district.toLowerCase();
    rows = rows.filter((r) => String(r.Location ?? "").toLowerCase().includes(d));
  }
  if (filters.skillType) {
    rows = rows.filter((r) => String(r["Skill Type"] ?? "") === filters.skillType);
  }
  if (filters.confidence) {
    rows = rows.filter((r) => String(r["Confidence Level"] ?? "") === filters.confidence);
  }
  if (filters.q) {
    const q = filters.q.toLowerCase();
    rows = rows.filter((r) => {
      const hay = [
        r["Investment Project / Initiative"],
        r["Department / Industry"],
        r["Sub-Sector"],
        r.Location,
        r["Key Skills Required"],
        r["Job Category"],
      ]
        .map((v) => String(v ?? "").toLowerCase())
        .join(" ");
      return hay.includes(q);
    });
  }
  return rows;
}

export function computeFilteredGrowthKpis(
  rows: Record<string, unknown>[],
  data: InvestmentPredictionsResponse
): GrowthKpis {
  if (!rows.length) {
    return {
      totalInvestmentCr: 0,
      investmentGrowthPct: 0,
      projectedJobs: 0,
      activeProjects: 0,
      industryCount: 0,
      districtCount: 0,
      topOpportunities: 0,
    };
  }

  const totalInvestmentCr = rows.reduce(
    (sum, r) => sum + readNum(r["Investment Value (INR Cr)"]),
    0
  );
  const projectedJobs = rows.reduce((sum, r) => sum + readNum(r["Projected Vacancies"]), 0);
  const industries = new Set(rows.map((r) => String(r["Department / Industry"] ?? "").trim()).filter(Boolean));
  const districts = new Set(
    rows
      .map((r) => String(r.Location ?? "").trim())
      .filter(Boolean)
      .flatMap((loc) => loc.split(/[,/]/).map((p) => p.trim()))
      .filter(Boolean)
  );

  return {
    totalInvestmentCr,
    investmentGrowthPct: data.summary.avgConfidence,
    projectedJobs,
    activeProjects: rows.length,
    industryCount: industries.size,
    districtCount: districts.size,
    topOpportunities: rows.length,
  };
}

export function buildFilteredTrendData(rows: Record<string, unknown>[]): TrendPoint[] {
  const yearMap = new Map<string, { jobs: number; investment: number }>();
  for (const row of rows) {
    const period = String(row["Hiring Period"] ?? row["Start Date"] ?? "2026");
    const years = period.match(/20\d{2}/g) ?? ["2026"];
    const start = Number(years[0]);
    const end = Number(years[years.length - 1] ?? years[0]);
    const span = Math.max(1, end - start + 1);
    const jobs = readNum(row["Projected Vacancies"]);
    const investment = readNum(row["Investment Value (INR Cr)"]);
    for (let year = start; year <= end; year += 1) {
      const existing = yearMap.get(String(year)) ?? { jobs: 0, investment: 0 };
      existing.jobs += Math.round(jobs / span);
      existing.investment += Math.round(investment / span);
      yearMap.set(String(year), existing);
    }
  }
  return Array.from(yearMap.entries())
    .sort((a, b) => Number(a[0]) - Number(b[0]))
    .map(([month, value]) => ({ month, ...value }));
}

export function buildFilteredSectorData(rows: Record<string, unknown>[]): SectorJobRow[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const name = String(row["Department / Industry"] ?? "Unknown").trim() || "Unknown";
    map.set(name, (map.get(name) ?? 0) + readNum(row["Projected Vacancies"]));
  }
  return Array.from(map.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([fullName, jobs], i) => ({
      name: fullName.length > 14 ? `${fullName.slice(0, 13)}…` : fullName,
      fullName,
      jobs,
      fill: SECTOR_COLORS[i % SECTOR_COLORS.length],
    }));
}

export function buildFilteredDistrictRows(
  rows: Record<string, unknown>[],
  data: InvestmentPredictionsResponse
): DistrictImpactRow[] {
  if (!rows.length) return [];

  const map = new Map<
    string,
    { investmentCr: number; projects: number; jobsProjected: number; sectors: Map<string, number> }
  >();

  for (const row of rows) {
    const loc = String(row.Location ?? "Statewide").trim() || "Statewide";
    const parts = loc.split(/[,/]/).map((p) => p.trim()).filter(Boolean);
    const districts = parts.length ? parts : [loc];
    const share = 1 / districts.length;
    const industry = String(row["Department / Industry"] ?? "General");
    const jobs = readNum(row["Projected Vacancies"]);
    const investment = readNum(row["Investment Value (INR Cr)"]);

    for (const district of districts) {
      const existing = map.get(district) ?? {
        investmentCr: 0,
        projects: 0,
        jobsProjected: 0,
        sectors: new Map<string, number>(),
      };
      existing.projects += share;
      existing.jobsProjected += Math.round(jobs * share);
      existing.investmentCr += investment * share;
      existing.sectors.set(industry, (existing.sectors.get(industry) ?? 0) + jobs);
      map.set(district, existing);
    }
  }

  return Array.from(map.entries())
    .map(([district, row]) => {
      const topSector =
        [...row.sectors.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "General";
      return {
        district,
        investmentCr: row.investmentCr,
        projects: Math.max(1, Math.round(row.projects)),
        jobsCreated: 0,
        jobsProjected: row.jobsProjected,
        topSector,
        status: row.jobsProjected > 0 ? ("Active" as const) : ("Pipeline" as const),
        skillType: "",
        growthOutlook: "",
        keyProjects: "",
        policy: "",
      };
    })
    .sort((a, b) => b.investmentCr - a.investmentCr);
}

export function applyGrowthFilters(
  data: InvestmentPredictionsResponse,
  filters: GrowthFilters
) {
  const allRows = mainRows(data);
  const rows = filterGrowthRows(data, filters);
  const hasFilters = countActiveGrowthFilters(filters) > 0;
  const totalCount = allRows.length || data.sectors.length;
  const resultCount =
    allRows.length > 0 ? rows.length : hasFilters ? 0 : data.sectors.length;

  return {
    rows,
    totalCount,
    resultCount,
    kpis: allRows.length > 0 ? computeFilteredGrowthKpis(rows, data) : undefined,
    trendData: allRows.length > 0 ? buildFilteredTrendData(rows) : undefined,
    sectorData: allRows.length > 0 ? buildFilteredSectorData(rows) : undefined,
    districtRows:
      allRows.length > 0 ? buildFilteredDistrictRows(rows, data) : undefined,
  };
}
