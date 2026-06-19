const fs = require("fs");
const path = require("path");

const REGISTRY_PATH = path.join(__dirname, "..", "data", "sourceUrlRegistry.json");

let registryCache = null;

function loadRegistry() {
  if (registryCache) return registryCache;
  registryCache = JSON.parse(fs.readFileSync(REGISTRY_PATH, "utf8"));
  return registryCache;
}

function resolveFromReference(sourceReference, sector, investIndiaSectors = []) {
  const registry = loadRegistry();
  const ref = String(sourceReference || "");

  for (const pattern of registry.patterns || []) {
    if (ref.toLowerCase().includes(pattern.match.toLowerCase())) {
      return { url: pattern.url, label: pattern.match };
    }
  }

  if (sector && registry.sectors?.[sector]) {
    return { url: registry.sectors[sector], label: sector };
  }

  for (const live of investIndiaSectors) {
    const liveName = live.name.toLowerCase();
    const sectorLower = String(sector || "").toLowerCase();
    if (
      sectorLower &&
      (liveName.includes(sectorLower.slice(0, 8)) || sectorLower.includes(liveName.slice(0, 8)))
    ) {
      return { url: live.url, label: live.name };
    }
  }

  return { url: registry.defaultInvestIndiaUp, label: "Invest India – Uttar Pradesh" };
}

function resolveSectorUrl(sectorName, investIndiaSectors = []) {
  const registry = loadRegistry();
  if (registry.sectors?.[sectorName]) {
    return registry.sectors[sectorName];
  }
  const match = investIndiaSectors.find((s) =>
    s.name.toLowerCase().includes(String(sectorName || "").toLowerCase().slice(0, 6))
  );
  return match?.url || registry.defaultInvestIndiaUp;
}

function enrichWorkbookRow(row, investIndiaSectors = []) {
  const sourceRef = String(row["Source / Reference"] || row.sourceReference || "");
  const sector = String(row["Department / Industry"] || row.sector || "");
  const resolved = resolveFromReference(sourceRef, sector, investIndiaSectors);
  return {
    ...row,
    sourceUrl: resolved.url,
    sourceLabel: resolved.label,
  };
}

module.exports = {
  loadRegistry,
  resolveFromReference,
  resolveSectorUrl,
  enrichWorkbookRow,
};
