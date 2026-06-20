import type { WorkbookGrowthSheets } from "./investmentTypes";

export type GrowthWorkbookSheetKind = "data" | "heatmap" | "text" | "filters";

export interface GrowthWorkbookSheetDef {
  id: string;
  /** Friendly tab & panel title */
  label: string;
  sheetKey: keyof WorkbookGrowthSheets;
  kind: GrowthWorkbookSheetKind;
  /** Primary bar chart */
  groupBy?: string[];
  barMetric?: string[];
  barTitle?: string;
  barValueLabel?: string;
  chartLimit?: number;
  /** Secondary pie / donut (row counts or summed metric) */
  pieGroup?: string[];
  pieMetric?: string[];
  pieTitle?: string;
  /** Optional second bar chart (used instead of pie when set) */
  secondaryBar?: {
    groupBy: string[];
    metric: string[];
    title: string;
    valueLabel?: string;
  };
}

/** Excel workbook tabs after README, Dashboard & Control_Panel. */
export const GROWTH_WORKBOOK_SHEETS: GrowthWorkbookSheetDef[] = [
  {
    id: "sectorSubSectorMaster",
    label: "Sectors & Sub-sectors",
    sheetKey: "sectorSubSectorMaster",
    kind: "data",
    groupBy: ["parent sector"],
    barMetric: ["jobs per", "100cr"],
    barTitle: "Jobs per ₹100 Cr · by parent sector",
    barValueLabel: "Jobs / ₹100 Cr",
    secondaryBar: {
      groupBy: ["sub-sector", "industry"],
      metric: ["jobs per", "100cr"],
      title: "Top sub-sectors by jobs per ₹100 Cr",
      valueLabel: "Jobs / ₹100 Cr",
    },
  },
  {
    id: "vacancyGapAnalysis",
    label: "Vacancy Gaps",
    sheetKey: "vacancyGapAnalysis",
    kind: "data",
    groupBy: ["sector"],
    barMetric: ["net vacancy gap"],
    barTitle: "Net vacancy gap by sector",
    barValueLabel: "Gap",
    pieGroup: ["gap severity"],
    pieTitle: "Vacancy gaps by severity",
  },
  {
    id: "jobForecast",
    label: "Job Forecast",
    sheetKey: "jobForecast",
    kind: "data",
    groupBy: ["sector"],
    barMetric: ["12-month"],
    barTitle: "12-month job forecast by sector",
    barValueLabel: "Jobs",
    pieGroup: ["state"],
    pieMetric: ["12-month"],
    pieTitle: "12-month jobs by state",
  },
  {
    id: "skillDemandForecast",
    label: "Skills & Roles",
    sheetKey: "skillDemandForecast",
    kind: "data",
    groupBy: ["role", "skill"],
    barMetric: ["yoy demand"],
    barTitle: "YoY demand growth by skill / role",
    barValueLabel: "YoY %",
    pieGroup: ["primary sector"],
    pieTitle: "Skill clusters by primary sector",
  },
  {
    id: "topOpportunities",
    label: "Top Employers",
    sheetKey: "topOpportunities",
    kind: "data",
    groupBy: ["company"],
    barMetric: ["announced jobs"],
    barTitle: "Top employers by announced jobs (direct)",
    barValueLabel: "Jobs",
    chartLimit: 10,
    secondaryBar: {
      groupBy: ["company"],
      metric: ["announced investment"],
      title: "Top employers by announced investment (₹ Cr)",
      valueLabel: "₹ Cr",
    },
  },
  {
    id: "hiringHeatmap",
    label: "Hiring Heatmap",
    sheetKey: "hiringHeatmap",
    kind: "heatmap",
  },
  {
    id: "investmentToEmployment",
    label: "Investment → Jobs",
    sheetKey: "investmentToEmployment",
    kind: "data",
    groupBy: ["sector"],
    barMetric: ["blended average"],
    barTitle: "₹ Cr per direct job by sector",
    barValueLabel: "₹ Cr / job",
    pieGroup: ["capital intensity"],
    pieTitle: "Sectors by capital intensity",
  },
];

export type GrowthWorkbookSheetId = (typeof GROWTH_WORKBOOK_SHEETS)[number]["id"];

const LEGACY_SECTION_MAP: Record<string, GrowthWorkbookSheetId> = {
  overview: "vacancyGapAnalysis",
  sectors: "sectorSubSectorMaster",
  districts: "vacancyGapAnalysis",
  trends: "jobForecast",
  projects: "topOpportunities",
  skills: "skillDemandForecast",
  opportunities: "topOpportunities",
  ranking: "vacancyGapAnalysis",
  summary: "vacancyGapAnalysis",
  recommendations: "vacancyGapAnalysis",
  controlPanel: "sectorSubSectorMaster",
  methodologyAssumptions: "investmentToEmployment",
  dataSources: "investmentToEmployment",
  stateCityMaster: "vacancyGapAnalysis",
  projectPipelineSheet: "topOpportunities",
  fdiTracker: "investmentToEmployment",
  pliTracker: "investmentToEmployment",
  startupTracker: "investmentToEmployment",
  alertsWatchlist: "investmentToEmployment",
  aiInsights: "investmentToEmployment",
  economicIndicators: "investmentToEmployment",
  historicalTrend: "investmentToEmployment",
};

export function resolveGrowthSheetId(section?: string | null): GrowthWorkbookSheetId {
  if (!section) return GROWTH_WORKBOOK_SHEETS[0]?.id ?? "sectorSubSectorMaster";
  const mapped = LEGACY_SECTION_MAP[section];
  if (mapped) return mapped;
  if (GROWTH_WORKBOOK_SHEETS.some((s) => s.id === section)) return section as GrowthWorkbookSheetId;
  return GROWTH_WORKBOOK_SHEETS[0]?.id ?? "sectorSubSectorMaster";
}

export function getWorkbookSheetDef(id: GrowthWorkbookSheetId): GrowthWorkbookSheetDef | undefined {
  return GROWTH_WORKBOOK_SHEETS.find((s) => s.id === id);
}
