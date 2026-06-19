const cheerio = require("cheerio");
const signale = require("signale");
const sectorProfiles = require("../../data/investupSectorProfiles.json");

const log = signale.scope("scraper:investup");

const SECTORS_URL = "https://invest.up.gov.in/sectors-in-uttar-pradesh/";

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

async function fetchHtml(url) {
  const response = await fetch(url, {
    headers: {
      "User-Agent": USER_AGENT,
      Accept: "text/html,application/xhtml+xml",
    },
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} for ${url}`);
  }
  return response.text();
}

function slugify(name) {
  return name
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function normalizeSectorName(name) {
  return name.replace(/\s+/g, " ").trim();
}

function parseSectorsFromHtml(html) {
  const $ = cheerio.load(html);
  const found = new Set();

  $("a, h2, h3, h4, li, .sector-item, [class*='sector']").each((_, el) => {
    const text = normalizeSectorName($(el).text());
    if (text.length < 4 || text.length > 60) return;
    if (/^(home|search|sectors|invest|view all)/i.test(text)) return;

    for (const profile of sectorProfiles) {
      const key = profile.name.toLowerCase().slice(0, 12);
      if (text.toLowerCase().includes(key) || profile.name.toLowerCase().includes(text.toLowerCase().slice(0, 10))) {
        found.add(profile.name);
      }
    }
  });

  $("body")
    .text()
    .split("\n")
    .map((l) => normalizeSectorName(l))
    .forEach((line) => {
      for (const profile of sectorProfiles) {
        if (line === profile.name || line.replace(/\s+/g, " ") === profile.name) {
          found.add(profile.name);
        }
      }
    });

  return Array.from(found);
}

function sectorsFromScrapedNames(scrapedNames) {
  const scrapedSet = new Set(scrapedNames.map((n) => n.toLowerCase()));

  return sectorProfiles
    .filter((profile) => scrapedSet.has(profile.name.toLowerCase()))
    .map((profile) => ({
      ...profile,
      liveOnSite: true,
      sourceUrl: `${SECTORS_URL}#${profile.slug}`,
    }));
}

async function scrapeInvestUpSectors() {
  try {
    log.info(`Fetching ${SECTORS_URL}`);
    const html = await fetchHtml(SECTORS_URL);
    const scrapedNames = parseSectorsFromHtml(html);
    const sectors = sectorsFromScrapedNames(scrapedNames);
    log.success(`Parsed ${sectors.length} live Invest UP sectors (${scrapedNames.length} hits)`);
    return {
      sectors,
      meta: {
        source: sectors.length > 0 ? "investup_live" : "investup_failed",
        scrapedAt: new Date().toISOString(),
        sectorCount: sectors.length,
        liveSectorHits: scrapedNames.length,
        portalUrl: SECTORS_URL,
      },
    };
  } catch (err) {
    log.warn(`Invest UP scrape failed (${err.message})`);
    return {
      sectors: [],
      meta: {
        source: "investup_failed",
        scrapedAt: new Date().toISOString(),
        sectorCount: 0,
        liveSectorHits: 0,
        portalUrl: SECTORS_URL,
        error: err.message,
      },
    };
  }
}

module.exports = { scrapeInvestUpSectors, slugify };
