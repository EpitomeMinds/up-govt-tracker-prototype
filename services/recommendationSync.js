const fs = require("fs");
const path = require("path");
const signale = require("signale");
const { scrapeUpsidaProjects } = require("../customModules/upsida/scraper");
const { scrapeInvestIndiaUp } = require("../customModules/investindia/scraper");
const { scrapeNcsData } = require("../customModules/ncs/scraper");
const { scrapeNsdcData } = require("../customModules/nsdc/scraper");
const { scrapeInvestUpSectors } = require("../customModules/investup/scraper");
const { buildRecommendations } = require("./recommendationBuilder");
const { enrichReport, saveEnrichedReport, loadRawReport } = require("./growthReport");
const { normalizeLiveData } = require("./liveDataNormalize");

const log = signale.scope("sync:recommendations");

const AI_DATA_PATH = path.join(__dirname, "..", "data", "upAiRecommendations.json");
const PUBLIC_AI_PATH = path.join(__dirname, "..", "dashboard", "public", "upAiRecommendations.json");
const SCRAPED_CACHE_PATH = path.join(__dirname, "..", "data", "scrapedSourcesCache.json");
const PUBLIC_CACHE_PATH = path.join(__dirname, "..", "dashboard", "public", "scrapedSourcesCache.json");

function buildInvestUpSectorLinks(sectors, source) {
  if (!sectors?.length) return [];
  return sectors.map((s) => ({
    name: s.name,
    url: s.sourceUrl || `https://invest.up.gov.in/sectors-in-uttar-pradesh/#${s.slug}`,
    source,
  }));
}

function saveRecommendations(payload) {
  const json = JSON.stringify(payload, null, 2);
  fs.writeFileSync(AI_DATA_PATH, json);
  fs.writeFileSync(PUBLIC_AI_PATH, json);
  return payload;
}

function saveScrapedCache(cache) {
  const normalized = normalizeLiveData(cache);
  const json = JSON.stringify(normalized, null, 2);
  fs.writeFileSync(SCRAPED_CACHE_PATH, json);
  fs.writeFileSync(PUBLIC_CACHE_PATH, json);
  return normalized;
}

function loadScrapedCache() {
  const paths = [SCRAPED_CACHE_PATH, PUBLIC_CACHE_PATH];
  for (const p of paths) {
    if (!fs.existsSync(p)) continue;
    try {
      return normalizeLiveData(JSON.parse(fs.readFileSync(p, "utf8")));
    } catch {
      /* try next path */
    }
  }
  return null;
}

async function syncAuthenticData() {
  log.info("Starting authentic data sync from official sources…");

  const [upsida, investIndia, ncs, nsdc, investUp] = await Promise.all([
    scrapeUpsidaProjects(),
    scrapeInvestIndiaUp(),
    scrapeNcsData(),
    scrapeNsdcData(),
    scrapeInvestUpSectors(),
  ]);

  const scrapedCache = normalizeLiveData({
    syncedAt: new Date().toISOString(),
    upsida: upsida.meta,
    investIndia: investIndia.meta,
    ncs: ncs.meta,
    nsdc: nsdc.meta,
    investUp: investUp.meta,
    upsidaProjects: upsida.projects,
    investIndiaSectors: investIndia.sectors,
    investUpSectors: buildInvestUpSectorLinks(investUp.sectors, investUp.meta?.source),
    ncsData: {
      upSkillPortals: ncs.upSkillPortals,
      industryJobLinks: ncs.industryJobLinks,
    },
    nsdcSectors: nsdc.sectors,
  });
  saveScrapedCache(scrapedCache);

  const recommendations = buildRecommendations({
    upsidaProjects: upsida.projects,
    investIndiaSectors: investIndia.sectors,
  });
  saveRecommendations(recommendations);

  const rawGrowth = loadRawReport();
  const enrichedGrowth = enrichReport(rawGrowth, investIndia.sectors);
  saveEnrichedReport(enrichedGrowth);

  log.success(
    `Synced ${recommendations.recommendations.length} recommendations ` +
      `(${recommendations.meta.workbookProjects} workbook + ${recommendations.meta.liveUpsidaProjects} UPSIDA live)`
  );

  return {
    ok: true,
    recommendations: {
      total: recommendations.recommendations.length,
      workbook: recommendations.meta.workbookProjects,
      upsidaLive: recommendations.meta.liveUpsidaProjects,
    },
    growth: {
      projectCount: enrichedGrowth.summary?.projectCount,
      sectors: enrichedGrowth.sectors?.length,
    },
    sources: scrapedCache,
  };
}

module.exports = { syncAuthenticData, loadScrapedCache, saveRecommendations };
