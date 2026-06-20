const fs = require("fs");
const path = require("path");
const { resolveFromReference, resolveSectorUrl } = require("./sourceResolver");
const { buildSummary, categorizeBoard } = require("./aiRecommendations");

const GROWTH_REPORT_PATH = path.join(__dirname, "..", "data", "upGrowthInvestmentReport.json");
const GROWTH_PUBLIC_PATH = path.join(
  __dirname,
  "..",
  "dashboard",
  "public",
  "upGrowthInvestmentReport.json"
);

function slug(text) {
  return String(text)
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function parseNumber(raw) {
  if (typeof raw === "number") return raw;
  const cleaned = String(raw || "0").replace(/,/g, "").trim();
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : 0;
}

function parseYear(raw) {
  const match = String(raw || "").match(/\d{4}/);
  return match ? Number(match[0]) : new Date().getFullYear();
}

function normalizeGapPercent(raw) {
  const n = parseNumber(raw);
  if (n <= 0) return 0;
  return n <= 1 ? Math.round(n * 1000) / 10 : Math.round(n * 10) / 10;
}

function priorityFromGap(severity, gapPct) {
  const s = String(severity || "").toLowerCase();
  if (s.includes("critical") || gapPct >= 35) return "Critical";
  if (s.includes("high") || gapPct >= 25) return "High";
  if (gapPct >= 15) return "Medium";
  return "Low";
}

function priorityFromConfidence(level, gapPct) {
  const l = String(level || "").toLowerCase();
  if (l === "high" && gapPct >= 30) return "Critical";
  if (l === "high") return "High";
  if (l === "medium" && gapPct >= 35) return "High";
  if (l === "medium") return "Medium";
  return "Low";
}

function gapFromVacancies(vacancies) {
  const required = Math.max(vacancies, 100);
  const gapPct = Math.min(45, Math.max(15, Math.round((required % 40) + 18)));
  const gap = Math.round(required * (gapPct / 100));
  return { required, available: required - gap, gap, gapPct };
}

function vacancyGapRowToRecommendation(row, index) {
  const demand = parseNumber(row["Total Projected Demand (12-mo)"]);
  const supply = parseNumber(row["Annual Skilled-Talent Supply"]);
  const gap = parseNumber(row["Net Vacancy Gap"]);
  const gapPct = normalizeGapPercent(row["Gap as % of Demand"]);
  const sector = String(row.Sector || "General");
  const region = String(row.State || "India");
  const confidence = String(row.Confidence || "Medium");
  const severity = String(row["Gap Severity"] || "");

  return {
    id: index + 1,
    priority: priorityFromGap(severity, gapPct),
    title: `${sector} — ${region} vacancy gap`,
    sector,
    department: sector,
    region,
    horizon: "12 months",
    actionType: String(row["Top Constraint"] || "Skilled talent"),
    status: confidence,
    requiredWorkforce: Math.round(demand),
    currentlyAvailable: Math.round(supply),
    skillGap: Math.round(gap),
    gapPercent: gapPct,
    budgetCr: 0,
    durationMonths: 12,
    startYear: 2026,
    institutionsInvolved: 2,
    aiConfidence: confidence === "High" ? 88 : confidence === "Medium" ? 72 : 58,
    impactScore: Math.min(99, Math.round(gapPct + parseNumber(row["YoY Demand Growth %"]))),
    sectorId: slug(sector),
    regionId: slug(region),
    subSector: sector,
    projectedVacancies: Math.round(demand),
    location: region,
    keySkillsRequired: String(row["Recommended Action"] || ""),
    sourceReference: String(row.Source || ""),
    confidenceLevel: confidence,
    additionalInsights: String(row["Recommended Action"] || ""),
    dataSource: "vacancy_gap_analysis",
  };
}

function workbookRowToRecommendation(row, index, investIndiaSectors) {
  const vacancies = parseNumber(row["Projected Vacancies"]);
  const investmentCr = parseNumber(row["Investment Value (INR Cr)"]);
  const { required, available, gap, gapPct } = gapFromVacancies(vacancies);
  const sector = String(row.Sector || row["Department / Industry"] || "General");
  const region = String(row.State || row.Region || "India");
  const confidence = String(row["Confidence Level"] || "Medium");
  const sourceRef = String(row["Source / Reference"] || "");
  const resolved = resolveFromReference(sourceRef, sector, investIndiaSectors);
  const hiringPeriod = String(row["Hiring Period"] || row["Start Date"] || "");
  const startYear = parseYear(row["Start Date"] || hiringPeriod);

  return {
    id: index + 1,
    priority: priorityFromConfidence(confidence, gapPct),
    title: String(row["Investment Project / Initiative"] || `Investment initiative – ${sector}`),
    sector,
    department: sector,
    region,
    horizon: hiringPeriod || `${startYear}-${startYear + 3}`,
    actionType: String(row["Skill Type"] || "Skilled"),
    status: confidence,
    requiredWorkforce: required,
    currentlyAvailable: available,
    skillGap: gap,
    gapPercent: gapPct,
    budgetCr: investmentCr,
    durationMonths: 48,
    startYear,
    institutionsInvolved: 2,
    aiConfidence: confidence === "High" ? 88 : confidence === "Medium" ? 72 : 58,
    impactScore: Math.min(99, Math.round(investmentCr / 2000 + gapPct)),
    sectorId: slug(sector),
    regionId: slug(region),
    subSector: String(row["Sub-Sector"] || ""),
    investmentProject: String(row["Investment Project / Initiative"] || ""),
    skillType: String(row["Skill Type"] || ""),
    jobCategory: String(row["Job Category"] || ""),
    projectedVacancies: vacancies,
    investmentValueCr: investmentCr,
    startDate: String(row["Start Date"] || ""),
    expectedCompletion: String(row["Expected Completion"] || ""),
    hiringPeriod,
    location: String(row.Location || region),
    keySkillsRequired: String(row["Key Skills Required"] || ""),
    sourceReference: sourceRef,
    sourceUrl: resolved.url,
    sourceLabel: resolved.label,
    confidenceLevel: confidence,
    additionalInsights: String(row["Additional Insights"] || ""),
    dataSource: "project_pipeline",
  };
}

function alertRowToRecommendation(row, index) {
  const regionSector = String(row["Region / Sector"] || "");
  const parts = regionSector.split("—").map((p) => p.trim());
  const region = parts[0] || "India";
  const sector = parts[1] || parts[0] || "Cross-sector";
  const severity = String(row.Severity || "High");

  return {
    id: index + 1,
    priority: severity.toLowerCase() === "critical" ? "Critical" : "High",
    title: String(row.Type || "Workforce alert"),
    sector,
    department: "Alerts & Watchlist",
    region,
    horizon: "Immediate",
    actionType: String(row.Type || "Alert"),
    status: severity,
    requiredWorkforce: 5000,
    currentlyAvailable: 2500,
    skillGap: 2500,
    gapPercent: 50,
    budgetCr: 0,
    durationMonths: 6,
    startYear: 2026,
    institutionsInvolved: 1,
    aiConfidence: 90,
    impactScore: 85,
    sectorId: slug(sector),
    regionId: slug(region),
    keySkillsRequired: String(row["Recommended Audience"] || ""),
    additionalInsights: String(row.Detail || ""),
    dataSource: "alerts_watchlist",
  };
}

function insightRowToRecommendation(row, index) {
  const insight = String(row["Generated Insight (Natural Language)"] || "");
  const conf = String(row.Confidence || "M").toUpperCase();
  const confidence = conf === "H" ? "High" : conf === "L" ? "Low" : "Medium";

  return {
    id: index + 1,
    priority: "High",
    title: insight.length > 100 ? `${insight.slice(0, 97)}…` : insight,
    sector: String(row["Sector(s)"] || "Cross-sector"),
    department: "AI Insights",
    region: String(row["Region(s)"] || "India"),
    horizon: String(row.Horizon || "12-18 months"),
    actionType: "AI Insight",
    status: confidence,
    requiredWorkforce: 10000,
    currentlyAvailable: 7000,
    skillGap: 3000,
    gapPercent: 30,
    budgetCr: 0,
    durationMonths: 18,
    startYear: 2026,
    institutionsInvolved: 1,
    aiConfidence: confidence === "High" ? 88 : 72,
    impactScore: 75,
    sectorId: slug(String(row["Sector(s)"] || "insight")),
    regionId: slug(String(row["Region(s)"] || "india")),
    additionalInsights: insight,
    sourceReference: String(row["Traceable Inputs (sheet!cell logic)"] || ""),
    dataSource: "ai_insights",
  };
}

function upsidaProjectToRecommendation(project, idOffset, investIndiaSectors) {
  const sector = project.sector || "Industry & Investment";
  const { required, available, gap, gapPct } = gapFromVacancies(2500);

  return {
    id: idOffset,
    priority: "High",
    title: project.title,
    sector,
    department: "UPSIDA",
    region: "Uttar Pradesh",
    horizon: `${new Date().getFullYear()}-${new Date().getFullYear() + 4}`,
    actionType: /spinning|yarn|textile/i.test(project.name) ? "Semi-Skilled" : "Skilled",
    status: "High",
    requiredWorkforce: required,
    currentlyAvailable: available,
    skillGap: gap,
    gapPercent: gapPct,
    budgetCr: 500,
    durationMonths: 36,
    startYear: new Date().getFullYear(),
    institutionsInvolved: 1,
    aiConfidence: 85,
    impactScore: 42,
    sectorId: slug(sector),
    regionId: "uttar-pradesh",
    subSector: project.name,
    investmentProject: project.title,
    location: project.district,
    keySkillsRequired: inferUpsidaSkills(project.name),
    sourceReference: "UPSIDA Upcoming Projects Portal",
    sourceUrl: project.detailUrl || project.sourceUrl,
    sourceLabel: "UPSIDA Official Portal",
    confidenceLevel: "High",
    additionalInsights: `Live industrial project listed on UPSIDA portal in ${project.district}.`,
    dataSource: "upsida_live",
    listUrl: project.listUrl,
  };
}

function inferUpsidaSkills(name) {
  const n = name.toLowerCase();
  if (/spinning|yarn|textile|mill/i.test(n)) return "Spinning, Weaving, Quality Control, Machine Operation";
  if (/food/i.test(n)) return "Food Processing, Cold Chain, Quality Assurance";
  return "Industrial Operations, Safety, Quality Control, Maintenance";
}

function loadGrowthReport() {
  for (const p of [GROWTH_REPORT_PATH, GROWTH_PUBLIC_PATH]) {
    if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, "utf8"));
  }
  return null;
}

function loadWorkbookRows() {
  const report = loadGrowthReport();
  return report?.workbook?.sheets?.mainDataset || [];
}

function buildRecommendationsFromGrowthReport(report, { investIndiaSectors = [] } = {}) {
  const sheets = report?.workbook?.sheets || {};
  const vacancyGap = sheets.vacancyGapAnalysis || [];
  const pipeline = sheets.mainDataset || [];
  const alerts = sheets.alertsWatchlist || [];
  const insights = sheets.aiInsights || [];

  const fromVacancy = vacancyGap.map((row, i) => vacancyGapRowToRecommendation(row, i));
  const fromPipeline = pipeline.map((row, i) =>
    workbookRowToRecommendation(row, fromVacancy.length + i, investIndiaSectors)
  );
  const fromAlerts = alerts.map((row, i) =>
    alertRowToRecommendation(row, fromVacancy.length + fromPipeline.length + i)
  );
  const fromInsights = insights.map((row, i) =>
    insightRowToRecommendation(row, fromVacancy.length + fromPipeline.length + fromAlerts.length + i)
  );

  const seen = new Set();
  const recommendations = [...fromVacancy, ...fromPipeline, ...fromAlerts, ...fromInsights]
    .filter((r) => {
      const key = r.title.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .map((r, i) => ({ ...r, id: i + 1 }));

  const summary = buildSummary(recommendations);
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
    meta: {
      source: "investment_forecasting_model",
      sources: [
        "Government investment & PLI programmes",
        "Vacancy gap analysis",
        "Project pipeline",
        "AI insights",
        "Investment alerts",
      ],
      exportedAt: report.generatedAt || new Date().toISOString(),
      totalRecords: recommendations.length,
      workbookProjects: pipeline.length,
      liveUpsidaProjects: 0,
    },
    summary,
    facets,
    recommendations,
  };
}

function buildRecommendations({ upsidaProjects = [], investIndiaSectors = [] } = {}) {
  const report = loadGrowthReport();
  if (report?.workbook?.sheets?.vacancyGapAnalysis?.length) {
    const base = buildRecommendationsFromGrowthReport(report, { investIndiaSectors });
    if (!upsidaProjects.length) return base;

    const existingTitles = new Set(base.recommendations.map((r) => r.title.toLowerCase()));
    const upsidaRecs = upsidaProjects
      .filter((p) => !existingTitles.has(p.title.toLowerCase()))
      .map((p, i) =>
        upsidaProjectToRecommendation(p, base.recommendations.length + i + 1, investIndiaSectors)
      );

    const recommendations = [...base.recommendations, ...upsidaRecs].map((r, i) => ({ ...r, id: i + 1 }));
    return {
      ...base,
      meta: {
        ...base.meta,
        liveUpsidaProjects: upsidaRecs.length,
        totalRecords: recommendations.length,
      },
      summary: buildSummary(recommendations),
      recommendations,
    };
  }

  const workbookRows = loadWorkbookRows();
  const fromWorkbook = workbookRows.map((row, i) =>
    workbookRowToRecommendation(row, i, investIndiaSectors)
  );

  const existingTitles = new Set(fromWorkbook.map((r) => r.title.toLowerCase()));
  const upsidaRecs = upsidaProjects
    .filter((p) => !existingTitles.has(p.title.toLowerCase()))
    .map((p, i) => upsidaProjectToRecommendation(p, fromWorkbook.length + i + 1, investIndiaSectors));

  const recommendations = [...fromWorkbook, ...upsidaRecs].map((r, i) => ({ ...r, id: i + 1 }));
  const summary = buildSummary(recommendations);
  const facets = {
    priorities: [...new Set(recommendations.map((r) => r.priority))],
    sectors: [...new Set(recommendations.map((r) => r.sector))].sort(),
    regions: [...new Set(recommendations.map((r) => r.region))].sort(),
    departments: [...new Set(recommendations.map((r) => r.department))].sort(),
    boardCategories: [...new Set(recommendations.map((r) => r.department))],
    statuses: [...new Set(recommendations.map((r) => r.status))].sort(),
    actionTypes: [...new Set(recommendations.map((r) => r.actionType))].sort(),
    startYears: [...new Set(recommendations.map((r) => r.startYear))].sort(),
  };

  return {
    meta: {
      source: "authentic_multi_source_pipeline",
      sources: ["Project Pipeline"],
      sheet: "Main Dataset",
      exportedAt: new Date().toISOString(),
      totalRecords: recommendations.length,
      workbookProjects: fromWorkbook.length,
      liveUpsidaProjects: upsidaRecs.length,
    },
    summary,
    facets,
    recommendations,
  };
}

module.exports = {
  buildRecommendations,
  buildRecommendationsFromGrowthReport,
  workbookRowToRecommendation,
  vacancyGapRowToRecommendation,
  upsidaProjectToRecommendation,
  loadWorkbookRows,
};
