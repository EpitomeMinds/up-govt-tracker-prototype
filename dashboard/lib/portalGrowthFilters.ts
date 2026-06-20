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
  state: string;
  district: string;
  subSector: string;
  skillType: string;
  confidence: string;
}

export interface GrowthFacets {
  industries: string[];
  regions: string[];
  states: string[];
  districts: string[];
  subSectors: string[];
  subSectorsByIndustry: Record<string, string[]>;
  skillTypes: string[];
  confidenceLevels: string[];
}

export const DEFAULT_GROWTH_FILTERS: GrowthFilters = {
  q: "",
  industry: "",
  region: "",
  state: "",
  district: "",
  subSector: "",
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

function masterRows(data: InvestmentPredictionsResponse): Record<string, unknown>[] {
  return data.workbook?.sheets?.sectorSubSectorMaster ?? [];
}

const STOP_WORDS = new Set([
  "and",
  "incl",
  "the",
  "for",
  "with",
  "from",
  "via",
  "all",
  "bands",
]);

function tokenize(label: string): string[] {
  return label
    .toLowerCase()
    .split(/[\s/&,()–\-]+/)
    .map((t) => t.replace(/[^a-z0-9]/g, ""))
    .filter((t) => t.length > 2 && !STOP_WORDS.has(t));
}

/** Match a pipeline / recommendation row against a master sub-sector label. */
export function rowMatchesMasterSubSector(
  row: Record<string, unknown>,
  subSector: string
): boolean {
  const hay = [
    row.Sector,
    row["Department / Industry"],
    row["Sub-Sector"],
    row["Investment Project / Initiative"],
    row.sector,
    row.subSector,
    row.title,
  ]
    .map((v) => String(v ?? "").toLowerCase())
    .join(" ");
  const subL = subSector.toLowerCase();
  if (hay.includes(subL)) return true;

  const primary = subSector.split(/[(]/)[0]?.trim().toLowerCase() ?? "";
  if (primary.length >= 8) {
    for (let len = Math.min(primary.length, 22); len >= 8; len -= 1) {
      for (let i = 0; i <= primary.length - len; i += 1) {
        const chunk = primary.slice(i, i + len);
        if (hay.includes(chunk)) return true;
      }
    }
  }

  const tokens = tokenize(subSector).filter((t) => t.length >= 4);
  if (!tokens.length) return false;
  const hits = tokens.filter((t) => hay.includes(t)).length;
  const need = tokens.length <= 2 ? tokens.length : Math.max(2, Math.ceil(tokens.length * 0.5));
  return hits >= need;
}

function buildMasterSectorFacets(data: InvestmentPredictionsResponse): {
  industries: string[];
  subSectors: string[];
  subSectorsByIndustry: Record<string, string[]>;
} {
  const subSectorsByIndustry: Record<string, string[]> = {};
  const industries: string[] = [];
  const allSubSectors = new Set<string>();

  for (const row of masterRows(data)) {
    const parent = String(row["Parent Sector"] ?? "").trim();
    const sub = String(row["Sub-Sector / Industry"] ?? "").trim();
    if (!parent || !sub) continue;
    if (!subSectorsByIndustry[parent]) {
      subSectorsByIndustry[parent] = [];
      industries.push(parent);
    }
    if (!subSectorsByIndustry[parent].includes(sub)) {
      subSectorsByIndustry[parent].push(sub);
      allSubSectors.add(sub);
    }
  }

  industries.sort();
  for (const parent of industries) subSectorsByIndustry[parent].sort();

  return {
    industries,
    subSectors: [...allSubSectors].sort(),
    subSectorsByIndustry,
  };
}

export function extractGrowthFacets(data: InvestmentPredictionsResponse): GrowthFacets {
  const rows = mainRows(data);
  const uniq = (key: string) =>
    [...new Set(rows.map((r) => String(r[key] ?? "").trim()).filter(Boolean))].sort();

  const districts = [
    ...new Set(
      rows
        .map((r) => String(r["City/District"] ?? r.Location ?? "").trim())
        .filter(Boolean)
        .flatMap((loc) => loc.split(/[,/]/).map((p) => p.trim()))
        .filter(Boolean)
    ),
  ].sort();

  const masterSectors = buildMasterSectorFacets(data);

  return {
    industries: masterSectors.industries,
    regions: uniq("Region"),
    states: uniq("State").length ? uniq("State") : uniq("Region"),
    districts,
    subSectors: masterSectors.subSectors,
    subSectorsByIndustry: masterSectors.subSectorsByIndustry,
    skillTypes: uniq("Skill Type"),
    confidenceLevels: uniq("Confidence Level"),
  };
}

export function subSectorsForIndustry(facets: GrowthFacets, industry: string): string[] {
  if (!industry) return [];
  return facets.subSectorsByIndustry[industry] ?? [];
}

/** Apply growth sector / sub-sector filters to AI recommendation rows. */
export function recommendationMatchesGrowthSectorFilters(
  rec: Record<string, unknown>,
  filters: GrowthFilters,
  facets: GrowthFacets
): boolean {
  if (filters.subSector) return rowMatchesMasterSubSector(rec, filters.subSector);
  if (filters.industry) {
    const subs = facets.subSectorsByIndustry[filters.industry] ?? [];
    return subs.some((sub) => rowMatchesMasterSubSector(rec, sub));
  }
  return true;
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

  const facets = extractGrowthFacets(data);

  if (filters.subSector) {
    rows = rows.filter((r) => rowMatchesMasterSubSector(r, filters.subSector));
  } else if (filters.industry) {
    const subs = facets.subSectorsByIndustry[filters.industry] ?? [];
    rows = rows.filter((r) => subs.some((sub) => rowMatchesMasterSubSector(r, sub)));
  }
  if (filters.state) {
    rows = rows.filter((r) => String(r.State ?? r.Region ?? "") === filters.state);
  }
  if (filters.region) {
    rows = rows.filter((r) => String(r.Region ?? r.State ?? "") === filters.region);
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
        r.Sector,
        r["Department / Industry"],
        r["Sub-Sector"],
        r.State,
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
  const industries = new Set(rows.map((r) => String(r.Sector ?? r["Department / Industry"] ?? "").trim()).filter(Boolean));
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
