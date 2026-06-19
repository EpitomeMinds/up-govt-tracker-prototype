const cheerio = require("cheerio");
const signale = require("signale");

const log = signale.scope("scraper:investindia");

const UP_STATE_URL = "https://www.investindia.gov.in/state/uttar-pradesh";
const BASE_URL = "https://www.investindia.gov.in";

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

async function fetchHtml(url) {
  const response = await fetch(url, {
    headers: { "User-Agent": USER_AGENT, Accept: "text/html" },
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status} for ${url}`);
  return response.text();
}

function parseSectorLinks(html) {
  const $ = cheerio.load(html);
  const sectors = new Map();

  $("a").each((_, el) => {
    const href = $(el).attr("href") || "";
    const text = $(el).text().trim();
    if (!href.includes("/sector/") || text.length < 3 || text.length > 80) return;
    if (/^visit page$/i.test(text)) return;
    const url = href.startsWith("http") ? href : `${BASE_URL}${href.startsWith("/") ? "" : "/"}${href}`;
    sectors.set(text, { name: text, url, source: "investindia_live" });
  });

  return Array.from(sectors.values());
}

async function scrapeInvestIndiaUp() {
  try {
    log.info(`Fetching ${UP_STATE_URL}`);
    const html = await fetchHtml(UP_STATE_URL);
    const sectors = parseSectorLinks(html);
    log.success(`Parsed ${sectors.length} Invest India sector links for UP`);
    return {
      sectors,
      meta: {
        source: "investindia_live",
        scrapedAt: new Date().toISOString(),
        portalUrl: UP_STATE_URL,
        sectorCount: sectors.length,
      },
    };
  } catch (err) {
    log.warn(`Invest India scrape failed (${err.message})`);
    return {
      sectors: [],
      meta: {
        source: "investindia_failed",
        scrapedAt: new Date().toISOString(),
        portalUrl: UP_STATE_URL,
        sectorCount: 0,
        error: err.message,
      },
    };
  }
}

module.exports = { scrapeInvestIndiaUp, parseSectorLinks };
