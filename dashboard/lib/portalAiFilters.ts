import type {
  AiAggregateRow,
  AiRecommendation,
  AiRecommendationFilters,
  AiRecommendationsResponse,
  AiRecommendationsSummary,
} from "./aiRecommendationsTypes";
import { DEFAULT_AI_FILTERS } from "./aiRecommendationsTypes";

function groupBy<T>(items: T[], keyFn: (item: T) => string): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const item of items) {
    const key = keyFn(item);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(item);
  }
  return map;
}

function aggregateGroup(name: string, items: AiRecommendation[]): AiAggregateRow {
  return {
    name,
    count: items.length,
    required: items.reduce((s, i) => s + i.requiredWorkforce, 0),
    available: items.reduce((s, i) => s + i.currentlyAvailable, 0),
    gap: items.reduce((s, i) => s + i.skillGap, 0),
    budgetCr: Math.round(items.reduce((s, i) => s + i.budgetCr, 0) * 100) / 100,
    avgConfidence: Math.round(
      items.reduce((s, i) => s + i.aiConfidence, 0) / Math.max(items.length, 1)
    ),
    avgImpact: Math.round(
      items.reduce((s, i) => s + i.impactScore, 0) / Math.max(items.length, 1)
    ),
    avgGapPercent:
      Math.round(
        (items.reduce((s, i) => s + i.gapPercent, 0) / Math.max(items.length, 1)) * 10
      ) / 10,
  };
}

export function categorizeBoard(department: string): string {
  const d = department.toLowerCase();
  if (/electronics|semiconductor|manufacturing|white goods|automotive|ev /.test(d)) return "Manufacturing & Electronics";
  if (/construction|infrastructure|real estate|smart city|urban/.test(d)) return "Construction & Infrastructure";
  if (/\bit\b|ites|gcc|ai|data center|telecom|fintech|e-commerce|startup/.test(d)) return "IT, GCC & Digital";
  if (/logistics|warehousing|airport|aviation|transport|metro/.test(d)) return "Logistics & Mobility";
  if (/renewable|solar|energy/.test(d)) return "Energy & Renewables";
  if (/health|medical|pharma|biotech/.test(d)) return "Health, Pharma & Biotech";
  if (/textile|apparel|leather|food|agro/.test(d)) return "Consumer & MSME";
  if (/tourism|hospitality|retail/.test(d)) return "Services & Hospitality";
  if (/defence|aerospace/.test(d)) return "Defence & Aerospace";
  return "Other Departments";
}

function buildSummary(recommendations: AiRecommendation[]): AiRecommendationsSummary {
  const byPriority = ["Critical", "High", "Medium", "Low"].map((p) => {
    const items = recommendations.filter((r) => r.priority === p);
    return aggregateGroup(p, items);
  });

  const bySector = Array.from(groupBy(recommendations, (r) => r.sector).entries())
    .map(([name, items]) => ({ ...aggregateGroup(name, items), id: items[0].sectorId }))
    .sort((a, b) => b.gap - a.gap);

  const byRegion = Array.from(groupBy(recommendations, (r) => r.region).entries())
    .map(([name, items]) => ({ ...aggregateGroup(name, items), id: items[0].regionId }))
    .sort((a, b) => b.required - a.required);

  const byStartYear = Array.from(groupBy(recommendations, (r) => String(r.startYear)).entries())
    .map(([name, items]) => aggregateGroup(name, items))
    .sort((a, b) => Number(a.name) - Number(b.name));

  const byActionType = Array.from(groupBy(recommendations, (r) => r.actionType).entries())
    .map(([name, items]) => aggregateGroup(name, items))
    .sort((a, b) => b.count - a.count);

  const byStatus = Array.from(groupBy(recommendations, (r) => r.status).entries())
    .map(([name, items]) => aggregateGroup(name, items))
    .sort((a, b) => b.count - a.count);

  const byDepartment = Array.from(groupBy(recommendations, (r) => r.department).entries())
    .map(([name, items]) => ({
      ...aggregateGroup(name, items),
      id: name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      category: categorizeBoard(name),
    }))
    .sort((a, b) => b.gap - a.gap);

  return {
    totalRecommendations: recommendations.length,
    totalRequired: recommendations.reduce((s, r) => s + r.requiredWorkforce, 0),
    totalAvailable: recommendations.reduce((s, r) => s + r.currentlyAvailable, 0),
    totalSkillGap: recommendations.reduce((s, r) => s + r.skillGap, 0),
    totalBudgetCr: Math.round(recommendations.reduce((s, r) => s + r.budgetCr, 0) * 10) / 10,
    avgConfidence: Math.round(
      recommendations.reduce((s, r) => s + r.aiConfidence, 0) / Math.max(recommendations.length, 1)
    ),
    avgImpact: Math.round(
      recommendations.reduce((s, r) => s + r.impactScore, 0) / Math.max(recommendations.length, 1)
    ),
    avgGapPercent:
      Math.round(
        (recommendations.reduce((s, r) => s + r.gapPercent, 0) /
          Math.max(recommendations.length, 1)) *
          10
      ) / 10,
    criticalCount: recommendations.filter((r) => r.priority === "Critical").length,
    sectorCount: bySector.length,
    regionCount: byRegion.length,
    boardCount: byDepartment.length,
    categoryCount: new Set(byDepartment.map((d) => d.category)).size,
    byPriority,
    bySector,
    byRegion,
    byDepartment,
    byBoardCategory: [],
    byStartYear,
    byActionType,
    byStatus,
    topSectors: bySector.slice(0, 5).map((s) => ({
      id: s.id ?? "",
      name: s.name,
      gap: s.gap,
      required: s.required,
    })),
  };
}

export function filterAiRecommendations(
  recommendations: AiRecommendation[],
  filters: AiRecommendationFilters
): AiRecommendation[] {
  let result = recommendations;

  if (filters.priority) result = result.filter((r) => r.priority === filters.priority);
  if (filters.sector) result = result.filter((r) => r.sector === filters.sector);
  if (filters.department) result = result.filter((r) => r.department === filters.department);
  if (filters.boardCategory) {
    result = result.filter((r) => categorizeBoard(r.department) === filters.boardCategory);
  }
  if (filters.region) result = result.filter((r) => r.region === filters.region);
  if (filters.status) result = result.filter((r) => r.status === filters.status);
  if (filters.actionType) result = result.filter((r) => r.actionType === filters.actionType);
  if (filters.startYear) result = result.filter((r) => r.startYear === Number(filters.startYear));
  if (filters.q) {
    const q = filters.q.toLowerCase();
    result = result.filter((r) => {
      const hay = [
        r.title,
        r.sector,
        r.department,
        r.region,
        r.subSector,
        r.jobCategory,
        r.location,
        r.keySkillsRequired,
      ]
        .map((v) => String(v ?? "").toLowerCase())
        .join(" ");
      return hay.includes(q);
    });
  }
  return result;
}

export function countActiveAiFilters(filters: AiRecommendationFilters): number {
  let n = 0;
  if (filters.q) n++;
  if (filters.priority) n++;
  if (filters.sector) n++;
  if (filters.region) n++;
  if (filters.department) n++;
  if (filters.boardCategory) n++;
  if (filters.status) n++;
  if (filters.actionType) n++;
  if (filters.startYear) n++;
  return n;
}

export function applyAiFilters(
  data: AiRecommendationsResponse,
  filters: AiRecommendationFilters
): AiRecommendationsResponse {
  const filtered = filterAiRecommendations(data.recommendations, filters);
  return {
    ...data,
    summary: buildSummary(filtered),
    recommendations: filtered,
  };
}

export { DEFAULT_AI_FILTERS };
