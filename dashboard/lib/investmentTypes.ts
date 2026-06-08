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
}

export interface InvestmentSummary {
  sectorCount: number;
  totalPredicted6m: number;
  totalPredicted12m: number;
  highGrowthSectors: number;
  avgConfidence: number;
  topSectors: { id: string; name: string; predicted12m: number; confidence: number }[];
}

export interface InvestmentPredictionsResponse {
  generatedAt: string;
  model: string;
  modelNote: string;
  stateCode: string;
  summary: InvestmentSummary;
  sectors: SectorPrediction[];
  meta: {
    lastSync: { synced_at: string; sector_count: number; status: string; message?: string } | null;
    sectorCount: number;
  };
}
