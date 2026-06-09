import type { InvestmentPredictionsResponse } from "./investmentTypes";

export interface GrowthKpis {
  totalInvestmentCr: number;
  investmentGrowthPct: number;
  projectedJobs: number;
  activeProjects: number;
  districtCount: number;
  companies: number;
}

export interface TrendPoint {
  month: string;
  investment: number;
  jobs: number;
}

export interface SectorJobRow {
  name: string;
  fullName: string;
  jobs: number;
  fill: string;
}

export interface DistrictImpactRow {
  district: string;
  investmentCr: number;
  projects: number;
  jobsCreated: number;
  jobsProjected: number;
  topSector: string;
  status: "Active" | "Pipeline";
}

const SECTOR_COLORS = [
  "#f97316",
  "#2563eb",
  "#10b981",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
  "#6366f1",
];

/** Merge equivalent district names so rows are not split (e.g. GB Nagar → Noida). */
const DISTRICT_ALIASES: Record<string, string> = {
  "Gautam Buddha Nagar": "Noida",
};

function normalizeDistrict(name: string): string {
  return DISTRICT_ALIASES[name] ?? name;
}

function sectorDistricts(sector: InvestmentPredictionsResponse["sectors"][0]): string[] {
  const raw =
    sector.districtHotspots.length > 0 ? sector.districtHotspots : ["Statewide"];
  return raw.map(normalizeDistrict);
}

export function computeGrowthKpis(data: InvestmentPredictionsResponse): GrowthKpis {
  const projectedJobs = data.summary.totalPredicted12m;
  const totalInvestmentCr =
    data.sectors.reduce(
      (sum, s) => sum + s.investmentScore * s.predictedOpenings12m * 0.018,
      0
    ) / 100;
  const activeProjects = data.sectors.length;
  const districts = new Set<string>();
  data.sectors.forEach((s) => sectorDistricts(s).forEach((d) => districts.add(d)));
  const avgGrowth =
    data.sectors.reduce((s, x) => s + x.growthRate, 0) /
    Math.max(data.sectors.length, 1);

  return {
    totalInvestmentCr,
    investmentGrowthPct: Math.round(avgGrowth),
    projectedJobs,
    activeProjects,
    districtCount: districts.size || 75,
    companies: Math.round(
      data.summary.sectorCount * 2.4 + data.summary.highGrowthSectors * 8
    ),
  };
}

export function formatInvestmentCr(value: number): string {
  if (value >= 100000) return `Rs ${(value / 100000).toFixed(2)}L Cr`;
  if (value >= 1000) return `Rs ${(value / 1000).toFixed(1)}k Cr`;
  return `Rs ${Math.round(value).toLocaleString("en-IN")} Cr`;
}

export function formatCount(n: number): string {
  return n >= 1000 ? `${(n / 1000).toFixed(1).replace(/\.0$/, "")}k` : n.toLocaleString("en-IN");
}

export function buildTrendData(data: InvestmentPredictionsResponse): TrendPoint[] {
  const monthMap = new Map<string, { jobs: number; investment: number }>();

  for (const sector of data.sectors) {
    for (const point of sector.timeline) {
      const existing = monthMap.get(point.month) || { jobs: 0, investment: 0 };
      existing.jobs += point.predicted;
      existing.investment += point.predicted * sector.investmentScore * 0.015;
      monthMap.set(point.month, existing);
    }
  }

  return Array.from(monthMap.entries()).map(([month, v]) => ({
    month: month.split(" ")[0],
    investment: Math.round(v.investment / 10),
    jobs: v.jobs,
  }));
}

export function buildSectorJobData(data: InvestmentPredictionsResponse): SectorJobRow[] {
  return data.sectors.slice(0, 8).map((s, i) => ({
    name: s.name.length > 14 ? `${s.name.slice(0, 13)}…` : s.name,
    fullName: s.name,
    jobs: s.predictedOpenings12m,
    fill: SECTOR_COLORS[i % SECTOR_COLORS.length],
  }));
}

export function buildDistrictRows(data: InvestmentPredictionsResponse): DistrictImpactRow[] {
  const map = new Map<
    string,
    {
      projects: number;
      jobsProjected: number;
      jobsCreated: number;
      investmentCr: number;
      sectors: Map<string, number>;
    }
  >();

  for (const sector of data.sectors) {
    const districts = sectorDistricts(sector);
    const share = districts.length > 0 ? 1 / districts.length : 1;
    const primaryDistrict = districts[0];

    for (const district of districts) {
      const row = map.get(district) || {
        projects: 0,
        jobsProjected: 0,
        jobsCreated: 0,
        investmentCr: 0,
        sectors: new Map<string, number>(),
      };
      // Each sector = one project, counted only on its primary district
      if (district === primaryDistrict) {
        row.projects += 1;
      }
      row.jobsProjected += Math.round(sector.predictedOpenings12m * share);
      row.jobsCreated += Math.round(sector.baseline.vacancies * share);
      row.investmentCr +=
        (sector.investmentScore * sector.predictedOpenings12m * 0.018 * share) / 100;
      row.sectors.set(
        sector.name,
        (row.sectors.get(sector.name) || 0) + sector.predictedOpenings12m
      );
      map.set(district, row);
    }
  }

  return Array.from(map.entries())
    .map(([district, row]) => {
      const topSector =
        [...row.sectors.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "General";
      return {
        district,
        investmentCr: row.investmentCr,
        projects: row.projects,
        jobsCreated: row.jobsCreated,
        jobsProjected: row.jobsProjected,
        topSector,
        status: row.jobsCreated > 0 ? ("Active" as const) : ("Pipeline" as const),
      };
    })
    .sort((a, b) => b.investmentCr - a.investmentCr);
}

export function exportDistrictCsv(rows: DistrictImpactRow[]): void {
  const header =
    "District,Investment (Cr),Projects,Jobs Created,Jobs Projected,Top Sector,Status";
  const lines = rows.map(
    (r) =>
      `"${r.district}",${Math.round(r.investmentCr)},${r.projects},${r.jobsCreated},${r.jobsProjected},"${r.topSector}",${r.status}`
  );
  const blob = new Blob([[header, ...lines].join("\n")], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "district-investment-impact.csv";
  a.click();
  URL.revokeObjectURL(url);
}
