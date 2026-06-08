const cheerio = require("cheerio");
const signale = require("signale");

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

const DEFAULT_HEADERS = {
  "User-Agent": USER_AGENT,
  Accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
  "Cache-Control": "no-cache",
};

async function fetchHtml(url, retries = 3) {
  let lastError;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, { headers: DEFAULT_HEADERS });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status} for ${url}`);
      }
      return response.text();
    } catch (err) {
      lastError = err;
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, attempt * 1000));
      }
    }
  }
  throw lastError;
}

function parseJobRow($, el) {
  return {
    postDate: $(el).find("td").eq(0).text().trim(),
    postBoard: $(el).find("td").eq(1).text().trim(),
    postName: $(el).find("td").eq(2).text().trim(),
    qualification: $(el).find("td").eq(3).text().trim(),
    advtNo: $(el).find("td").eq(4).text().trim(),
    lastDate: $(el).find("td").eq(5).text().trim(),
    link: $(el).find("td").eq(6).find("a").attr("href") || "",
  };
}

function findRecruitmentTable($) {
  const matchPattern = /<th[^>]*>\s*Recruitment Board\s*<\/th>/i;
  let desiredTable = null;

  $("table").each((_, table) => {
    const html = $(table).html() || "";
    if (matchPattern.test(html)) {
      desiredTable = table;
      return false;
    }
  });

  return desiredTable;
}

function parseJobTable($, table) {
  const results = [];
  if (!table) return results;

  $(table)
    .find("tr")
    .each((index, el) => {
      if (index === 0) return;
      const row = parseJobRow($, el);
      if (row.postName || row.postBoard) {
        results.push(row);
      }
    });

  return results;
}

function findTablesInPost($) {
  const posts = $("div.post, article, .entry-content");
  if (posts.length === 0) {
    return $("table").toArray();
  }
  return posts.find("table").toArray();
}

async function topicScraper(URL, topic, tableNO) {
  const log = signale.scope("scraper:TopicScraper");
  log.info(`Fetching ${URL}`);

  const html = await fetchHtml(URL);
  const $ = cheerio.load(html);
  const tables = findTablesInPost($);
  const table = tables[tableNO];

  if (!table) {
    log.warn(`Table index ${tableNO} not found, trying recruitment table`);
    return parseJobTable($, findRecruitmentTable($));
  }

  return parseJobTable($, table);
}

async function latestNotifications(URL) {
  const log = signale.scope("scraper:latestNotifications");
  log.info(`Fetching ${URL}`);

  const html = await fetchHtml(URL);
  const $ = cheerio.load(html);
  const results = [];

  $("div.listcontentj ul").each((_, el) => {
    const entry = $(el).find("a").first();
    const title = entry.text().trim();
    const link = entry.attr("href") || "";
    if (title) {
      results.push({ title, link });
    }
  });

  return results;
}

async function smartScraper(URL, topic) {
  const log = signale.scope("scraper:stateWiseScraper");
  log.info(`Fetching ${URL} (${topic})`);

  const html = await fetchHtml(URL);
  const $ = cheerio.load(html);
  const table = findRecruitmentTable($);
  const results = parseJobTable($, table);

  log.success(`Parsed ${results.length} jobs`);
  return results;
}

module.exports = {
  latestNotifications,
  topicScraper,
  smartScraper,
  fetchHtml,
  findRecruitmentTable,
  parseJobTable,
};
