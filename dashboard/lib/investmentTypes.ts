export type MainTab = "vacancy" | "investment";

export interface InvestmentTimelinePoint {
  month: string;
  predicted: number;
}

export interface InvestmentRoleBreakdown {
  role: string;
  share: number;
  predictedOpenings: number;
}

export interface SectorPrediction {
  id: string;
  name: string;
  slug: string;
  policy: string;
  investmentSignal: "high" | "medium" | "low";
  investmentScore: number;
  growthRate: number;
  growthMultiplier: number;
  liveOnSite: boolean;
  sourceUrl: string;
  baseline: { listings: number; vacancies: number };
  predictedOpenings6m: number;
  predictedOpenings12m: number;
  confidence: number;
  timeline: InvestmentTimelinePoint[];
  typicalRoles: InvestmentRoleBreakdown[];
  educationDemand: Record<string, number>;
  districtHotspots: string[];
  aiRationale: string;
  keywords: string[];
  investmentCr?: number;
  projectCount?: number;
  startYear?: number;
  endYear?: number;
  projects?: WorkbookProjectRow[];
}

export interface InvestmentSummary {
  sectorCount: number;
  totalPredicted6m: number;
  totalPredicted12m: number;
  highGrowthSectors: number;
  avgConfidence: number;
  totalInvestmentCr?: number;
  projectCount?: number;
  districtCount?: number;
  topSectors: { id: string; name: string; predicted12m: number; confidence: number }[];
}

export interface WorkbookProjectRow {
  name: string;
  subSector: string;
  investmentCr: number;
  vacancies: number;
  startDate: string;
  expectedCompletion: string;
  hiringPeriod: string;
  location: string;
  skillType: string;
  jobCategory: string;
  keySkillsRequired: string;
  sourceReference: string;
  confidenceLevel: string;
  additionalInsights: string;
}

export interface WorkbookGrowthSheets {
  mainDataset?: Record<string, unknown>[];
  executiveSummary?: Record<string, unknown>[];
  skillDemandForecast?: Record<string, unknown>[];
  topOpportunities?: Record<string, unknown>[];
  districtForecast?: Record<string, unknown>[];
  employmentRanking?: Record<string, unknown>[];
  assumptions?: Record<string, unknown>[];
}

export interface InvestmentPredictionsResponse {
  generatedAt: string;
  model: string;
  modelNote: string;
  stateCode: string;
  summary: InvestmentSummary;
  sectors: SectorPrediction[];
  workbook?: {
    source: string;
    sheets: WorkbookGrowthSheets;
  };
  meta: {
    lastSync: { synced_at: string; sector_count: number; status: string; message?: string } | null;
    sectorCount: number;
  };
}
