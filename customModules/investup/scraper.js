const https = require("https");
const signale = require("signale");
const sectorProfiles = require("../../data/investupSectorProfiles.json");
const { parseIndustryOverview, parseInvestmentOpportunities, parseSectorContacts, parseAiCityPage } = require("./sectorParsers");

const log = signale.scope("scraper:investup");

const BASE_URL = "https://invest.up.gov.in";
const SECTORS_URL = `${BASE_URL}/sectors-in-uttar-pradesh/`;
const AI_CITY_URL = `${BASE_URL}/ai-city/`;

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

const httpsAgent = new https.Agent({ rejectUnauthorized: false });

function fetchHtml(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(
      url,
      {
        agent: httpsAgent,
        headers: {
          "User-Agent": USER_AGENT,
          Accept: "text/html,application/xhtml+xml",
        },
        timeout: 45000,
      },
      (res) => {
        if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          res.resume();
          fetchHtml(
            res.headers.location.startsWith("http") ? res.headers.location : `${BASE_URL}${res.headers.location}`
          )
            .then(resolve)
            .catch(reject);
          return;
        }
        if (res.statusCode !== 200) {
          res.resume();
          reject(new Error(`HTTP ${res.statusCode} for ${url}`));
          return;
        }
        let body = "";
        res.setEncoding("utf8");
        res.on("data", (chunk) => {
          body += chunk;
        });
        res.on("end", () => resolve(body));
      }
    );
    req.on("timeout", () => {
      req.destroy(new Error(`Timeout for ${url}`));
    });
    req.on("error", reject);
  });
}

function slugify(name) {
  return name
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function profileSlugVariants(slug) {
  const base = slug.replace(/-sector$/, "");
  return [slug, base, `${base}-sector`, slug.replace(/-/g, "")];
}

function findProfileForSlug(slug) {
  const variants = new Set(profileSlugVariants(slug));
  return sectorProfiles.find((p) => variants.has(p.slug) || variants.has(p.slug.replace(/-sector$/, "")));
}

function enrichSectorWithProfile(sector) {
  const profile = findProfileForSlug(sector.slug);
  if (!profile) return sector;
  return {
    ...profile,
    ...sector,
    id: profile.id,
    policy: profile.policy,
    investmentSignal: profile.investmentSignal,
    investmentScore: profile.investmentScore,
    growthMultiplier: profile.growthMultiplier,
    keywords: profile.keywords,
    typicalRoles: profile.typicalRoles,
    educationDemand: profile.educationDemand,
    districtHotspots: profile.districtHotspots,
  };
}

function parseSectorLinksFromListing(html) {
  const cheerio = require("cheerio");
  const $ = cheerio.load(html);
  const sectors = [];
  const seen = new Set();

  $("div.grid > a[href], a:has(figure.effect-winston), a:has(.effect_box)").each((_, el) => {
    const href = $(el).attr("href") || "";
    if (!href.includes("invest.up.gov.in/")) return;
    const path = href.replace(/\/$/, "").split("/").pop() || "";
    if (!path || path === "sectors-in-uttar-pradesh") return;

    const h2 = $(el).find("h2").first();
    const name = (h2.text() || $(el).find("figcaption").text()).replace(/\s+/g, " ").trim();
    if (!name || name.length < 3 || name.length > 80) return;

    const url = href.startsWith("http") ? href : `${BASE_URL}/${path}/`;
    const key = path.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);

    sectors.push({
      slug: path,
      name,
      url: url.endsWith("/") ? url : `${url}/`,
      sourceUrl: url.endsWith("/") ? url : `${url}/`,
      liveOnSite: true,
    });
  });

  return sectors;
}

async function scrapeSectorDetail(sector, attempt = 1) {
  try {
    const html = await fetchHtml(sector.url);
    const industryOverview = parseIndustryOverview(html);
    const { opportunities: investmentOpportunities, format: opportunityFormat } = parseInvestmentOpportunities(html);
    const contacts = parseSectorContacts(html);

    return enrichSectorWithProfile({
      ...sector,
      industryOverview,
      investmentOpportunities,
      opportunityFormat,
      contacts,
      detailScraped: true,
    });
  } catch (err) {
    if (attempt < 3) {
      await new Promise((r) => setTimeout(r, 2000 * attempt));
      return scrapeSectorDetail(sector, attempt + 1);
    }
    log.warn(`Detail scrape failed for ${sector.name}: ${err.message}`);
    return enrichSectorWithProfile({
      ...sector,
      industryOverview: null,
      investmentOpportunities: [],
      detailScraped: false,
      detailError: err.message,
    });
  }
}

async function scrapeAllSectorDetails(sectorLinks) {
  const sectors = [];
  for (let i = 0; i < sectorLinks.length; i++) {
    const sector = sectorLinks[i];
    log.info(`[${i + 1}/${sectorLinks.length}] ${sector.name}`);
    sectors.push(await scrapeSectorDetail(sector));
    if (i < sectorLinks.length - 1) {
      await new Promise((r) => setTimeout(r, 600));
    }
  }
  return sectors;
}

async function scrapeAiCity() {
  try {
    log.info(`Fetching ${AI_CITY_URL}`);
    const html = await fetchHtml(AI_CITY_URL);
    const aiCity = parseAiCityPage(html);
    if (!aiCity) throw new Error("AI City content not found on page");
    log.success(`Parsed AI City (${aiCity.investmentOpportunities?.length ?? 0} components)`);
    return aiCity;
  } catch (err) {
    log.warn(`AI City scrape failed (${err.message})`);
    return null;
  }
}

async function scrapeInvestUpSectors({ includeDetails = true } = {}) {
  try {
    log.info(`Fetching ${SECTORS_URL}`);
    const html = await fetchHtml(SECTORS_URL);
    const sectorLinks = parseSectorLinksFromListing(html);

    if (!sectorLinks.length) {
      throw new Error("No sector links found on listing page");
    }

    log.info(`Found ${sectorLinks.length} sectors — fetching detail pages sequentially…`);

    const sectors = includeDetails
      ? await scrapeAllSectorDetails(sectorLinks)
      : sectorLinks.map(enrichSectorWithProfile);

    const aiCity = includeDetails ? await scrapeAiCity() : null;
    if (aiCity) sectors.unshift(aiCity);

    const withOverview = sectors.filter(
      (s) =>
        s.industryOverview?.indiaScenario?.length ||
        s.industryOverview?.upScenario?.length ||
        s.industryOverview?.otherSections?.length
    ).length;
    const withOpportunities = sectors.filter((s) => s.investmentOpportunities?.length > 0).length;

    log.success(
      `Parsed ${sectors.length} Invest UP entries (${sectorLinks.length} sectors${aiCity ? " + AI City" : ""}, ${withOverview} overviews, ${withOpportunities} with opportunities)`
    );

    return {
      sectors,
      meta: {
        source: sectors.length > 0 ? "investup_live" : "investup_failed",
        scrapedAt: new Date().toISOString(),
        sectorCount: sectors.length,
        liveSectorHits: sectorLinks.length + (aiCity ? 1 : 0),
        overviewCount: withOverview,
        opportunityCount: withOpportunities,
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

module.exports = { scrapeInvestUpSectors, scrapeAiCity, slugify, fetchHtml, parseSectorLinksFromListing };
