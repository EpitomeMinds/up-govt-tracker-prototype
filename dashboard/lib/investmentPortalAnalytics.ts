import type { InvestmentPredictionsResponse } from "./investmentTypes";
import { SECTOR_COLORS } from "./investmentPortalAnalyticsConstants";

export interface GrowthKpis {
  totalInvestmentCr: number;
  investmentGrowthPct: number;
  projectedJobs: number;
  activeProjects: number;
  industryCount: number;
  districtCount: number;
  topOpportunities: number;
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
  skillType?: string;
  growthOutlook?: string;
  keyProjects?: string;
  policy?: string;
}

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
  if (data.workbook?.sheets) {
    return {
      totalInvestmentCr:
        data.summary.totalInvestmentCr ??
        data.sectors.reduce((sum, sector) => sum + (sector.investmentCr ?? 0), 0),
      investmentGrowthPct: data.summary.avgConfidence,
      projectedJobs: data.summary.totalPredicted12m,
      activeProjects: data.summary.projectCount ?? data.workbook.sheets.mainDataset?.length ?? data.sectors.length,
      industryCount: data.summary.sectorCount,
      districtCount: data.summary.districtCount ?? data.workbook.sheets.districtForecast?.length ?? 0,
      topOpportunities: data.workbook.sheets.topOpportunities?.length ?? data.sectors.length,
    };
  }

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
    industryCount: data.summary.sectorCount,
    districtCount: districts.size || 75,
    topOpportunities: Math.round(
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
  if (data.workbook?.sheets.mainDataset?.length) {
    const yearMap = new Map<string, { jobs: number; investment: number }>();
    for (const row of data.workbook.sheets.mainDataset) {
      const period = String(row["Hiring Period"] ?? row["Start Date"] ?? "2026");
      const years = period.match(/20\d{2}/g) ?? ["2026"];
      const start = Number(years[0]);
      const end = Number(years[years.length - 1] ?? years[0]);
      const span = Math.max(1, end - start + 1);
      const jobs = Number(String(row["Projected Vacancies"] ?? 0).replace(/[^0-9.-]/g, ""));
      const investment = Number(String(row["Investment Value (INR Cr)"] ?? 0).replace(/[^0-9.-]/g, ""));
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
  const districtForecast = data.workbook?.sheets.districtForecast;
  if (districtForecast?.length) {
    return districtForecast
      .map((row) => ({
        district: String(row["District / City"] ?? "Unknown"),
        investmentCr: Number(String(row["Total Investment (INR Cr est.)"] ?? 0).replace(/[^0-9.-]/g, "")),
        projects: String(row["Key Projects"] ?? "")
          .split(",")
          .map((p) => p.trim())
          .filter(Boolean).length,
        jobsCreated: 0,
        jobsProjected: Number(String(row["Total Projected Jobs"] ?? 0).replace(/[^0-9.-]/g, "")),
        topSector: String(row["Top Industries"] ?? "General").split(",")[0]?.trim() || "General",
        status: String(row["Growth Outlook"] ?? "").includes("★★★") ? ("Active" as const) : ("Pipeline" as const),
        skillType: String(row["Dominant Skill Type"] ?? ""),
        growthOutlook: String(row["Growth Outlook"] ?? ""),
        keyProjects: String(row["Key Projects"] ?? ""),
        policy: String(row["Special Economic Zone / Policy"] ?? ""),
      }))
      .sort((a, b) => b.investmentCr - a.investmentCr);
  }

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
    "District,Investment (Cr),Projects,Jobs Projected,Top Sector,Skill Type,Growth Outlook,Key Projects,Policy,Status";
  const lines = rows.map(
    (r) =>
      `"${r.district}",${Math.round(r.investmentCr)},${r.projects},${r.jobsProjected},"${r.topSector}","${r.skillType ?? ""}","${r.growthOutlook ?? ""}","${r.keyProjects ?? ""}","${r.policy ?? ""}",${r.status}`
  );
  const blob = new Blob([[header, ...lines].join("\n")], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "district-investment-impact.csv";
  a.click();
  URL.revokeObjectURL(url);
}
