export type MainTab = "vacancy" | "ai-recommendations";

export type AiZoneId =
  | "overview"
  | "boards"
  | "initiatives"
  | "sectors"
  | "regions"
  | "analytics";

export interface AiRecommendation {
  id: number;
  priority: "Critical" | "High" | "Medium" | "Low";
  title: string;
  sector: string;
  department: string;
  region: string;
  horizon: string;
  actionType: string;
  status: string;
  requiredWorkforce: number;
  currentlyAvailable: number;
  skillGap: number;
  gapPercent: number;
  budgetCr: number;
  durationMonths: number;
  startYear: number;
  institutionsInvolved: number;
  aiConfidence: number;
  impactScore: number;
  sectorId: string;
  regionId: string;
}

export interface AiDepartmentRow extends AiAggregateRow {
  id: string;
  category: string;
}

export interface AiBoardCategoryRow {
  name: string;
  id: string;
  count: number;
  required: number;
  gap: number;
  budgetCr: number;
  departments: AiDepartmentRow[];
}

export interface AiAggregateRow {
  name: string;
  id?: string;
  count: number;
  required: number;
  available: number;
  gap: number;
  budgetCr: number;
  avgConfidence: number;
  avgImpact: number;
  avgGapPercent: number;
}

export interface AiRecommendationsSummary {
  totalRecommendations: number;
  totalRequired: number;
  totalAvailable: number;
  totalSkillGap: number;
  totalBudgetCr: number;
  avgConfidence: number;
  avgImpact: number;
  avgGapPercent: number;
  criticalCount: number;
  sectorCount: number;
  regionCount: number;
  boardCount: number;
  categoryCount: number;
  byPriority: AiAggregateRow[];
  bySector: AiAggregateRow[];
  byRegion: AiAggregateRow[];
  byDepartment: AiDepartmentRow[];
  byBoardCategory: AiBoardCategoryRow[];
  byStartYear: AiAggregateRow[];
  byActionType: AiAggregateRow[];
  byStatus: AiAggregateRow[];
  topSectors: { id: string; name: string; gap: number; required: number }[];
}

export interface AiRecommendationsFacets {
  priorities: string[];
  sectors: string[];
  regions: string[];
  departments: string[];
  boardCategories: string[];
  statuses: string[];
  actionTypes: string[];
  startYears: number[];
}

export interface AiRecommendationsResponse {
  meta: {
    source: string;
    sheet: string;
    exportedAt: string;
    totalRecords: number;
  };
  summary: AiRecommendationsSummary;
  facets: AiRecommendationsFacets;
  recommendations: AiRecommendation[];
}

export interface AiRecommendationFilters {
  priority: string;
  sector: string;
  region: string;
  department: string;
  boardCategory: string;
  status: string;
  actionType: string;
  startYear: string;
  q: string;
}

export const DEFAULT_AI_FILTERS: AiRecommendationFilters = {
  priority: "",
  sector: "",
  region: "",
  department: "",
  boardCategory: "",
  status: "",
  actionType: "",
  startYear: "",
  q: "",
};

export const BOARD_CATEGORY_COLORS: Record<string, string> = {
  "Industry & Investment": "#0078e8",
  "Health & Medical": "#059669",
  "Education & Skills": "#6c5ce7",
  "Transport & Mobility": "#0891b2",
  "Public Works & Urban": "#64748b",
  "IT & Energy": "#f59e0b",
  "Security & Home": "#dc2626",
  "Tourism & Hospitality": "#e84393",
  "Agriculture & Rural": "#84cc16",
  "Textile & Handloom": "#d97706",
  "Other Departments": "#94a3b8",
};
