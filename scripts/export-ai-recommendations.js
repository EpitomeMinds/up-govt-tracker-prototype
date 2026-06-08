#!/usr/bin/env node
/**
 * Re-export UP AI Recommendations Excel to data/upAiRecommendations.json
 * Usage: node scripts/export-ai-recommendations.js [path-to-xlsx]
 */
const fs = require("fs");
const path = require("path");

const defaultXlsx = path.join(__dirname, "..", "UP_AI_Recommendations (1)(2).xlsx");
const xlsxPath = process.argv[2] || defaultXlsx;
const outPath = path.join(__dirname, "..", "data", "upAiRecommendations.json");

function slug(s) {
  return String(s)
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

async function main() {
  let XLSX;
  try {
    XLSX = require("xlsx");
  } catch {
    console.error("Install xlsx: npm install xlsx");
    process.exit(1);
  }

  if (!fs.existsSync(xlsxPath)) {
    console.error("File not found:", xlsxPath);
    process.exit(1);
  }

  const wb = XLSX.readFile(xlsxPath);
  const sheet = wb.Sheets["AI Recommendations"];
  if (!sheet) {
    console.error('Sheet "AI Recommendations" not found');
    process.exit(1);
  }

  const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });
  const recommendations = rows
    .filter((r) => r["S.No"])
    .map((d) => ({
      id: Number(d["S.No"]),
      priority: d["Priority"],
      title: d["Recommendation Title"],
      sector: d["Sector"],
      department: d["Department"],
      region: d["Region"],
      horizon: d["Horizon"],
      actionType: d["Action Type"],
      status: d["Status"],
      requiredWorkforce: Number(d["Required Workforce"] || 0),
      currentlyAvailable: Number(d["Currently Available"] || 0),
      skillGap: Number(d["Skill Gap"] || 0),
      gapPercent: Number(d["Gap %"] || 0),
      budgetCr: Number(d["Budget (INR Cr)"] || 0),
      durationMonths: Number(d["Duration (Months)"] || 0),
      startYear: Number(d["Start Year"] || 0),
      institutionsInvolved: Number(d["Institutions Involved"] || 0),
      aiConfidence: Number(d["AI Confidence %"] || 0),
      impactScore: Number(d["Impact Score"] || 0),
      sectorId: slug(d["Sector"]),
      regionId: slug(d["Region"]),
    }));

  const payload = {
    meta: {
      source: path.basename(xlsxPath),
      sheet: "AI Recommendations",
      exportedAt: new Date().toISOString(),
      totalRecords: recommendations.length,
    },
    recommendations,
  };

  fs.writeFileSync(outPath, JSON.stringify(payload, null, 2));
  console.log(`Exported ${recommendations.length} records → ${outPath}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
