const cheerio = require("cheerio");
const signale = require("signale");
const { fetchHtml } = require("../customModules/freejobalerts/scraper");

const log = signale.scope("noticeLink");

const BLOCKED =
  /freejobalert|facebook|twitter|whatsapp|telegram|instagram|youtube|linkedin|play\.google|apps\.apple|mailto:/i;

const BOARD_PORTALS = [
  { test: /uppsc|public service commission/i, url: "https://uppsc.up.nic.in/" },
  { test: /upsssc|subordinate services/i, url: "https://upsssc.gov.in/" },
  { test: /uppcl|power corporation/i, url: "https://www.uppcl.org/" },
  { test: /upsidc|industrial development/i, url: "https://www.upsidc.com/" },
  { test: /bank of baroda/i, url: "https://www.bankofbaroda.in/careers" },
  { test: /esic/i, url: "https://www.esic.nic.in/recruitments" },
  { test: /npcil|atomic energy/i, url: "https://npcil.nic.in/" },
  { test: /indian railway|railway/i, url: "https://indianrailways.gov.in/" },
  { test: /up police/i, url: "https://uppolice.gov.in/" },
  { test: /up basic education|education department/i, url: "https://upbasiceduboard.gov.in/" },
];

function isFreeJobAlert(url) {
  return /freejobalert\.com/i.test(url || "");
}

function boardPortal(postBoard) {
  const board = (postBoard || "").toLowerCase();
  for (const entry of BOARD_PORTALS) {
    if (entry.test.test(board)) return entry.url;
  }
  return null;
}

function scoreLink(href, text) {
  let score = 0;
  const h = href.toLowerCase();
  const t = text.toLowerCase();

  if (/\.(gov|nic)\.in/i.test(href)) score += 100;
  if (/\.pdf$/i.test(href)) score += 40;
  if (/official|notification|detailed advertisement|advertisement|recruitment notice/i.test(t)) {
    score += 30;
  }
  if (/apply online|click here to apply|apply now|visit official|download/i.test(t)) score += 25;
  if (/recruitment|career|vacancy|notice|advertisement|jobs\//i.test(h)) score += 15;
  if (/\.edu\.in/i.test(href)) score += 20;
  if (/\.(org|co)\.in/i.test(href) && /recruit|career|vacancy|pdf|notice|jobs/i.test(`${h} ${t}`)) {
    score += 15;
  }

  return score;
}

function extractFromHtml(html) {
  const $ = cheerio.load(html);
  const candidates = [];

  $("a[href]").each((_, el) => {
    const href = ($(el).attr("href") || "").trim();
    const text = $(el).text().trim();
    if (!href || href.startsWith("#") || BLOCKED.test(href)) return;

    const score = scoreLink(href, text);
    if (score >= 15) candidates.push({ href, score });
  });

  candidates.sort((a, b) => b.score - a.score);
  return candidates[0]?.href || null;
}

async function resolveNoticeLink(job) {
  const sourceLink = job.link || job.sourceLink || "";
  const postBoard = job.postBoard || job.post_board || "";

  if (sourceLink && !isFreeJobAlert(sourceLink)) {
    return sourceLink;
  }

  if (sourceLink && isFreeJobAlert(sourceLink)) {
    try {
      const html = await fetchHtml(sourceLink);
      const extracted = extractFromHtml(html);
      if (extracted) return extracted;
    } catch (err) {
      log.warn(`Could not resolve notice for ${postBoard}: ${err.message}`);
    }
  }

  return boardPortal(postBoard);
}

async function resolveNoticeLinksForJobs(jobs, concurrency = 4) {
  const resolved = [];

  for (let i = 0; i < jobs.length; i += concurrency) {
    const batch = jobs.slice(i, i + concurrency);
    const batchResolved = await Promise.all(
      batch.map(async (job) => ({
        ...job,
        officialLink: (await resolveNoticeLink(job)) || "",
      }))
    );
    resolved.push(...batchResolved);
  }

  return resolved;
}

module.exports = {
  resolveNoticeLink,
  resolveNoticeLinksForJobs,
  boardPortal,
  extractFromHtml,
  isFreeJobAlert,
};
