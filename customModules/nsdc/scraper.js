const cheerio = require("cheerio");
const signale = require("signale");

const log = signale.scope("scraper:nsdc");

const NSDC_HOME = "https://www.nsdcindia.org/";
const NSDC_SECTORS = "https://www.nsdcindia.org/national-skills-qualification-framework";

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

function parseSkillSectors(html) {
  const $ = cheerio.load(html);
  const sectors = [];

  $("a").each((_, el) => {
    const href = $(el).attr("href") || "";
    const text = $(el).text().trim();
    if (
      text.length > 3 &&
      text.length < 80 &&
      (/sector|skill|qualification|training|course/i.test(text) ||
        /nsdcindia\.org\/(sector|skill|course)/i.test(href))
    ) {
      const url = href.startsWith("http") ? href : `${NSDC_HOME}${href.replace(/^\//, "")}`;
      sectors.push({ name: text, url, source: "nsdc_live" });
    }
  });

  const unique = new Map();
  for (const s of sectors) unique.set(s.name.toLowerCase(), s);
  return Array.from(unique.values());
}

async function scrapeNsdcData() {
  try {
    log.info(`Fetching ${NSDC_HOME}`);
    const html = await fetchHtml(NSDC_HOME);
    let sectors = parseSkillSectors(html);

    if (sectors.length < 5) {
      try {
        const nsqfHtml = await fetchHtml(NSDC_SECTORS);
        sectors = [...sectors, ...parseSkillSectors(nsqfHtml)];
      } catch {
        /* NSQF page optional */
      }
    }

    const unique = new Map();
    for (const s of sectors) unique.set(s.name.toLowerCase(), s);
    sectors = Array.from(unique.values());

    log.success(`Parsed ${sectors.length} NSDC skill sector references`);
    return {
      sectors,
      meta: {
        source: sectors.length > 0 ? "nsdc_live" : "nsdc_failed",
        scrapedAt: new Date().toISOString(),
        portalUrl: NSDC_HOME,
        sectorCount: sectors.length,
      },
    };
  } catch (err) {
    log.warn(`NSDC scrape failed (${err.message})`);
    return {
      sectors: [],
      meta: {
        source: "nsdc_failed",
        scrapedAt: new Date().toISOString(),
        portalUrl: NSDC_HOME,
        sectorCount: 0,
        error: err.message,
      },
    };
  }
}

module.exports = { scrapeNsdcData };
