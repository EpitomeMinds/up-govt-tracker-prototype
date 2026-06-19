const fs = require("fs");
const path = require("path");

const DATA_PATH = path.join(__dirname, "..", "data", "upAiRecommendations.json");

let cached = null;

function loadData() {
  if (cached) return cached;
  if (!fs.existsSync(DATA_PATH)) {
    throw new Error(`AI recommendations data not found at ${DATA_PATH}`);
  }
  cached = JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));
  return cached;
}

function reloadData() {
  cached = null;
  return loadData();
}

function groupBy(items, keyFn) {
  const map = new Map();
  for (const item of items) {
    const key = keyFn(item);
    if (!map.has(key)) {
      map.set(key, []);
    }
    map.get(key).push(item);
  }
  return map;
}

function aggregateGroup(name, items) {
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
    avgGapPercent: Math.round(
      (items.reduce((s, i) => s + i.gapPercent, 0) / Math.max(items.length, 1)) * 10
    ) / 10,
  };
}

function categorizeBoard(department) {
  const d = String(department).toLowerCase();
  if (/health|medical|drugs|ayush/.test(d)) return "Health & Medical";
  if (/education|iti|skills|upsdm/.test(d)) return "Education & Skills";
  if (/industr|upsida|invest|msme|defence|stpi|upneda|updes/.test(d)) return "Industry & Investment";
  if (/transport|upsrtc|metro|aviation|airport/.test(d)) return "Transport & Mobility";
  if (/pwd|urban|housing|revenue|uprnn|uplc|board of revenue/.test(d)) return "Public Works & Urban";
  if (/police|home/.test(d)) return "Security & Home";
  if (/tourism/.test(d)) return "Tourism & Hospitality";
  if (/agriculture|mandi/.test(d)) return "Agriculture & Rural";
  if (/it |electronics|energy|uppcl/.test(d)) return "IT & Energy";
  if (/handloom|textile/.test(d)) return "Textile & Handloom";
  return "Other Departments";
}

function buildBoardCategories(recommendations) {
  const deptMap = groupBy(recommendations, (r) => r.department);
  const byDepartment = Array.from(deptMap.entries())
    .map(([name, items]) => ({
      ...aggregateGroup(name, items),
      id: name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      category: categorizeBoard(name),
    }))
    .sort((a, b) => b.gap - a.gap);

  const catMap = new Map();
  for (const dept of byDepartment) {
    if (!catMap.has(dept.category)) {
      catMap.set(dept.category, []);
    }
    catMap.get(dept.category).push(dept);
  }

  const order = [
    "Industry & Investment",
    "Health & Medical",
    "Education & Skills",
    "Transport & Mobility",
    "Public Works & Urban",
    "IT & Energy",
    "Security & Home",
    "Tourism & Hospitality",
    "Agriculture & Rural",
    "Textile & Handloom",
    "Other Departments",
  ];

  const byBoardCategory = order
    .filter((name) => catMap.has(name))
    .map((name) => {
      const departments = catMap.get(name);
      return {
        name,
        id: name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        count: departments.reduce((s, d) => s + d.count, 0),
        required: departments.reduce((s, d) => s + d.required, 0),
        gap: departments.reduce((s, d) => s + d.gap, 0),
        budgetCr: Math.round(departments.reduce((s, d) => s + d.budgetCr, 0) * 100) / 100,
        departments,
      };
    });

  return { byDepartment, byBoardCategory };
}

function buildSummary(recommendations) {
  const byPriority = ["Critical", "High", "Medium", "Low"].map((p) => {
    const items = recommendations.filter((r) => r.priority === p);
    return aggregateGroup(p, items);
  });

  const sectorMap = groupBy(recommendations, (r) => r.sector);
  const bySector = Array.from(sectorMap.entries())
    .map(([name, items]) => ({ ...aggregateGroup(name, items), id: items[0].sectorId }))
    .sort((a, b) => b.gap - a.gap);

  const regionMap = groupBy(recommendations, (r) => r.region);
  const byRegion = Array.from(regionMap.entries())
    .map(([name, items]) => ({ ...aggregateGroup(name, items), id: items[0].regionId }))
    .sort((a, b) => b.required - a.required);

  const yearMap = groupBy(recommendations, (r) => String(r.startYear));
  const byStartYear = Array.from(yearMap.entries())
    .map(([name, items]) => aggregateGroup(name, items))
    .sort((a, b) => Number(a.name) - Number(b.name));

  const actionMap = groupBy(recommendations, (r) => r.actionType);
  const byActionType = Array.from(actionMap.entries())
    .map(([name, items]) => aggregateGroup(name, items))
    .sort((a, b) => b.count - a.count);

  const statusMap = groupBy(recommendations, (r) => r.status);
  const byStatus = Array.from(statusMap.entries())
    .map(([name, items]) => aggregateGroup(name, items))
    .sort((a, b) => b.count - a.count);

  const totalRequired = recommendations.reduce((s, r) => s + r.requiredWorkforce, 0);
  const totalAvailable = recommendations.reduce((s, r) => s + r.currentlyAvailable, 0);
  const totalGap = recommendations.reduce((s, r) => s + r.skillGap, 0);
  const totalBudget = recommendations.reduce((s, r) => s + r.budgetCr, 0);

  const { byDepartment, byBoardCategory } = buildBoardCategories(recommendations);

  return {
    totalRecommendations: recommendations.length,
    totalRequired,
    totalAvailable,
    totalSkillGap: totalGap,
    totalBudgetCr: Math.round(totalBudget * 10) / 10,
    avgConfidence: Math.round(
      recommendations.reduce((s, r) => s + r.aiConfidence, 0) / Math.max(recommendations.length, 1)
    ),
    avgImpact: Math.round(
      recommendations.reduce((s, r) => s + r.impactScore, 0) / Math.max(recommendations.length, 1)
    ),
    avgGapPercent: Math.round(
      (recommendations.reduce((s, r) => s + r.gapPercent, 0) / Math.max(recommendations.length, 1)) *
        10
    ) / 10,
    criticalCount: recommendations.filter((r) => r.priority === "Critical").length,
    sectorCount: bySector.length,
    regionCount: byRegion.length,
    boardCount: byDepartment.length,
    categoryCount: byBoardCategory.length,
    byPriority,
    bySector,
    byRegion,
    byDepartment,
    byBoardCategory,
    byStartYear,
    byActionType,
    byStatus,
    topSectors: bySector.slice(0, 5).map((s) => ({
      id: s.id,
      name: s.name,
      gap: s.gap,
      required: s.required,
    })),
  };
}

function filterRecommendations(recommendations, filters) {
  let result = recommendations;

  if (filters.priority) {
    result = result.filter((r) => r.priority === filters.priority);
  }
  if (filters.sector) {
    result = result.filter((r) => r.sector === filters.sector || r.sectorId === filters.sector);
  }
  if (filters.department) {
    result = result.filter((r) => r.department === filters.department);
  }
  if (filters.boardCategory) {
    result = result.filter((r) => categorizeBoard(r.department) === filters.boardCategory);
  }
  if (filters.region) {
    result = result.filter((r) => r.region === filters.region || r.regionId === filters.region);
  }
  if (filters.status) {
    result = result.filter((r) => r.status === filters.status);
  }
  if (filters.actionType) {
    result = result.filter((r) => r.actionType === filters.actionType);
  }
  if (filters.startYear) {
    result = result.filter((r) => r.startYear === Number(filters.startYear));
  }
  if (filters.q) {
    const q = filters.q.toLowerCase();
    result = result.filter(
      (r) =>
        r.title.toLowerCase().includes(q) ||
        r.sector.toLowerCase().includes(q) ||
        r.department.toLowerCase().includes(q) ||
        r.region.toLowerCase().includes(q)
    );
  }

  return result;
}

function getAiRecommendations(query = {}) {
  const { meta, recommendations } = loadData();
  const filtered = filterRecommendations(recommendations, query);
  const summary = buildSummary(filtered);

  const facets = {
    priorities: [...new Set(recommendations.map((r) => r.priority))],
    sectors: [...new Set(recommendations.map((r) => r.sector))].sort(),
    regions: [...new Set(recommendations.map((r) => r.region))].sort(),
    departments: [...new Set(recommendations.map((r) => r.department))].sort(),
    boardCategories: [...new Set(recommendations.map((r) => categorizeBoard(r.department)))],
    statuses: [...new Set(recommendations.map((r) => r.status))].sort(),
    actionTypes: [...new Set(recommendations.map((r) => r.actionType))].sort(),
    startYears: [...new Set(recommendations.map((r) => r.startYear))].sort(),
  };

  return {
    meta,
    summary,
    facets,
    recommendations: filtered,
  };
}

function getRecommendationById(id) {
  const { recommendations } = loadData();
  return recommendations.find((r) => r.id === Number(id)) || null;
}

module.exports = {
  getAiRecommendations,
  getRecommendationById,
  reloadData,
  loadData,
  categorizeBoard,
  buildSummary,
  filterRecommendations,
};
