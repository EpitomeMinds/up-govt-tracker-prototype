const fs = require("fs");
const path = require("path");
const { enrichWorkbookRow, resolveSectorUrl } = require("./sourceResolver");

const GROWTH_REPORT_PATH = path.join(
  __dirname,
  "..",
  "dashboard",
  "public",
  "upGrowthInvestmentReport.json"
);
const DATA_GROWTH_PATH = path.join(__dirname, "..", "data", "upGrowthInvestmentReport.json");

let cached = null;

function loadRawReport() {
  const paths = [DATA_GROWTH_PATH, GROWTH_REPORT_PATH];
  for (const p of paths) {
    if (fs.existsSync(p)) {
      return JSON.parse(fs.readFileSync(p, "utf8"));
    }
  }
  throw new Error("Growth investment report JSON not found");
}

function enrichReport(report, investIndiaSectors = []) {
  const sheets = report.workbook?.sheets || {};
  const enrichedSheets = { ...sheets };

  if (sheets.mainDataset) {
    enrichedSheets.mainDataset = sheets.mainDataset.map((row) => enrichWorkbookRow(row, investIndiaSectors));
  }

  const sectors = (report.sectors || []).map((sector) => {
    const url = resolveSectorUrl(sector.name, investIndiaSectors);
    const projects = (sector.projects || []).map((p) => {
      const resolved = enrichWorkbookRow(
        { ...p, "Source / Reference": p.sourceReference, "Department / Industry": sector.name },
        investIndiaSectors
      );
      return { ...p, sourceUrl: resolved.sourceUrl, sourceLabel: resolved.sourceLabel };
    });
    return {
      ...sector,
      sourceUrl: url,
      liveOnSite: true,
      projects,
    };
  });

  return {
    ...report,
    model: report.model || "ai-job-opportunity-forecasting-v1",
    modelNote:
      report.modelNote ||
      "Growth data from AI Job Opportunity Forecasting Dashboard workbook (PIB, DPIIT, Naukri, Tracxn, India Investment Grid, NSDC).",
    generatedAt: new Date().toISOString(),
    sectors,
    workbook: report.workbook
      ? {
          ...report.workbook,
          sheets: enrichedSheets,
        }
      : undefined,
  };
}

function getGrowthReport(investIndiaSectors = []) {
  if (cached && !investIndiaSectors.length) return cached;
  const raw = loadRawReport();
  const enriched = enrichReport(raw, investIndiaSectors);
  if (!investIndiaSectors.length) cached = enriched;
  return enriched;
}

function reloadGrowthReport() {
  cached = null;
  return getGrowthReport();
}

function saveEnrichedReport(report) {
  fs.writeFileSync(DATA_GROWTH_PATH, JSON.stringify(report, null, 2));
  fs.writeFileSync(GROWTH_REPORT_PATH, JSON.stringify(report, null, 2));
  cached = report;
  return report;
}

module.exports = {
  getGrowthReport,
  reloadGrowthReport,
  enrichReport,
  saveEnrichedReport,
  loadRawReport,
};
