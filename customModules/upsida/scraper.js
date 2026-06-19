const cheerio = require("cheerio");
const signale = require("signale");

const log = signale.scope("scraper:upsida");

const PROJECTS_URL = "https://upsida.in/Home/UpcomingProjects";
const BASE_URL = "https://upsida.in";

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

function resolveUrl(raw) {
  if (!raw) return PROJECTS_URL;
  if (raw.startsWith("http")) return raw;
  if (raw.startsWith("https://upsida.inhttps://")) {
    return raw.replace("https://upsida.in", "");
  }
  if (raw.startsWith("../")) return `${BASE_URL}${raw.replace(/^\.\./, "")}`;
  if (raw.startsWith("/")) return `${BASE_URL}${raw}`;
  return `${BASE_URL}/${raw}`;
}

async function fetchHtml(url) {
  const response = await fetch(url, {
    headers: { "User-Agent": USER_AGENT, Accept: "text/html" },
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status} for ${url}`);
  return response.text();
}

function inferSector(name) {
  const n = name.toLowerCase();
  if (/food|mega food/i.test(n)) return "Food Processing";
  if (/spinning|yarn|textile|mill/i.test(n)) return "Textile & Apparel";
  if (/perfume/i.test(n)) return "Consumer & MSME";
  if (/trans ganga|hi-tech|flatted|integrated manufacturing/i.test(n)) return "Construction & Infrastructure";
  if (/industrial area/i.test(n)) return "Construction & Infrastructure";
  return "Industry & Investment";
}

function parseProjects(html) {
  const $ = cheerio.load(html);
  const projects = [];

  $(".card").each((_, card) => {
    const onclick = $(card).attr("onclick") || "";
    const detailMatch = onclick.match(/window\.open\("([^"]+)"/);
    const bg = $(card).find(".card-image").attr("style") || "";
    const bgMatch = bg.match(/url\('([^']+)'\)/);
    const district = $(card).find("h6").text().trim();
    const name = $(card).find("p").text().trim();
    if (!district || !name) return;

    const detailUrl = detailMatch ? resolveUrl(detailMatch[1]) : PROJECTS_URL;
    projects.push({
      id: `upsida-${slugify(`${district}-${name}`)}`,
      district,
      name,
      title: `${name} – ${district}`,
      sector: inferSector(name),
      detailUrl,
      sourceUrl: detailUrl,
      listUrl: PROJECTS_URL,
      imageUrl: bgMatch ? resolveUrl(bgMatch[1]) : null,
      source: "upsida_live",
      scrapedAt: new Date().toISOString(),
    });
  });

  return projects;
}

function slugify(text) {
  return String(text)
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

async function scrapeUpsidaProjects() {
  try {
    log.info(`Fetching ${PROJECTS_URL}`);
    const html = await fetchHtml(PROJECTS_URL);
    const projects = parseProjects(html);
    log.success(`Parsed ${projects.length} UPSIDA upcoming projects`);
    return {
      projects,
      meta: {
        source: "upsida_live",
        scrapedAt: new Date().toISOString(),
        portalUrl: PROJECTS_URL,
        projectCount: projects.length,
      },
    };
  } catch (err) {
    log.warn(`UPSIDA scrape failed (${err.message})`);
    return {
      projects: [],
      meta: {
        source: "upsida_failed",
        scrapedAt: new Date().toISOString(),
        portalUrl: PROJECTS_URL,
        projectCount: 0,
        error: err.message,
      },
    };
  }
}

module.exports = { scrapeUpsidaProjects, parseProjects, resolveUrl };
