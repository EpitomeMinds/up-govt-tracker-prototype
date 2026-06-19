const cheerio = require("cheerio");
const signale = require("signale");

const log = signale.scope("scraper:ncs");

const NCS_HOME = "https://www.ncs.gov.in/";
const NCS_GOVT_JOBS = "https://www.ncs.gov.in/_layouts/15/ncsp/govtjobvacancies.aspx";
const NCS_UP_JOBS = "https://betacloud.ncs.gov.in/job-listing";
const NCS_STATE_SKILLS = "https://www.ncs.gov.in/Pages/StateSkillPortalLinks.aspx";

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

function dedupeLinks(items) {
  const seen = new Set();
  return items.filter((item) => {
    const key = `${item.name}|${item.url}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function parseSkillPortals(html) {
  const $ = cheerio.load(html);
  const portals = [];

  $("a").each((_, el) => {
    const href = $(el).attr("href") || "";
    const text = $(el).text().trim();
    if (!text || text.length > 120) return;
    if (/uttar pradesh|up skill|upsdm/i.test(text) || /up\.gov\.in|upsdm/i.test(href)) {
      portals.push({
        name: text,
        url: href.startsWith("http") ? href : `${NCS_HOME}${href.replace(/^\//, "")}`,
        state: "Uttar Pradesh",
      });
    }
  });

  return portals;
}

function parseIndustryLinks(html) {
  const $ = cheerio.load(html);
  const links = [];

  $("a").each((_, el) => {
    const href = $(el).attr("href") || "";
    const text = $(el).text().trim();
    if (/job-listing\?industry=/i.test(href) && text.length > 3 && text.length < 80) {
      links.push({
        name: text,
        url: href.startsWith("http") ? href : href,
        source: "ncs_live",
      });
    }
  });

  return links;
}

async function scrapeNcsData() {
  const errors = [];
  let scrapedPortals = [];
  let scrapedIndustry = [];

  try {
    log.info("Fetching NCS state skill portals");
    const skillsHtml = await fetchHtml(NCS_STATE_SKILLS);
    scrapedPortals = parseSkillPortals(skillsHtml);
  } catch (err) {
    errors.push(err.message);
    log.warn(`NCS skill portals scrape failed: ${err.message}`);
  }

  try {
    log.info("Fetching NCS homepage industry links");
    const homeHtml = await fetchHtml(NCS_HOME);
    scrapedIndustry = parseIndustryLinks(homeHtml);
  } catch (err) {
    errors.push(err.message);
    log.warn(`NCS industry links scrape failed: ${err.message}`);
  }

  const upSkillPortals = dedupeLinks(scrapedPortals);
  const industryJobLinks = dedupeLinks(scrapedIndustry);
  const total = upSkillPortals.length + industryJobLinks.length;

  log.success(
    `NCS: ${upSkillPortals.length} UP portals, ${industryJobLinks.length} industry links`
  );

  return {
    upSkillPortals,
    industryJobLinks,
    meta: {
      source: total > 0 ? "ncs_live" : "ncs_failed",
      scrapedAt: new Date().toISOString(),
      portalUrl: NCS_HOME,
      upJobsUrl: NCS_UP_JOBS,
      govtJobsUrl: NCS_GOVT_JOBS,
      linkCount: total,
      error: errors.length ? errors.join("; ") : undefined,
    },
  };
}

module.exports = { scrapeNcsData, NCS_UP_JOBS, NCS_GOVT_JOBS };
