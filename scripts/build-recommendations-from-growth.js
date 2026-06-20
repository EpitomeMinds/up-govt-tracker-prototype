#!/usr/bin/env node
/**
 * Import AI Job Opportunity workbook and build recommendations JSON.
 * Usage: node scripts/build-recommendations-from-growth.js [path-to-xlsx]
 */
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const { buildRecommendationsFromGrowthReport } = require("../services/recommendationBuilder");

const xlsxPath =
  process.argv[2] ||
  path.join(__dirname, "..", "AI_Job_Opportunity_Forecasting_Dashboard_India(1).xlsx");
const importScript = path.join(__dirname, "import-ai-job-workbook.py");

if (fs.existsSync(xlsxPath)) {
  execSync(`python3 "${importScript}" "${xlsxPath}"`, { stdio: "inherit" });
}

const dataDir = path.join(__dirname, "..", "data");
const publicDir = path.join(__dirname, "..", "dashboard", "public");
const growthPath = path.join(dataDir, "upGrowthInvestmentReport.json");

if (!fs.existsSync(growthPath)) {
  console.error("Growth report not found:", growthPath);
  process.exit(1);
}

const growth = JSON.parse(fs.readFileSync(growthPath, "utf8"));
const recommendations = buildRecommendationsFromGrowthReport(growth);

for (const dir of [dataDir, publicDir]) {
  const out = path.join(dir, "upAiRecommendations.json");
  fs.writeFileSync(out, JSON.stringify(recommendations, null, 2));
  console.log("Wrote", out, `(${recommendations.recommendations.length} records)`);
}
