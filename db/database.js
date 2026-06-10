const fs = require("fs");
const path = require("path");
const Database = require("better-sqlite3");
const crypto = require("crypto");

const DATA_DIR = path.join(__dirname, "..", "data");
const DB_PATH = process.env.DB_PATH || path.join(DATA_DIR, "jobs.db");

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS jobs (
    id            TEXT PRIMARY KEY,
    state_code    TEXT NOT NULL,
    post_date     TEXT,
    post_board    TEXT,
    post_name     TEXT NOT NULL,
    qualification TEXT,
    advt_no       TEXT,
    last_date     TEXT,
    last_date_parsed TEXT,
    link          TEXT,
    official_link TEXT,
    source        TEXT DEFAULT 'freejobalert',
    scraped_at    TEXT NOT NULL,
    is_active     INTEGER DEFAULT 1
  );

  CREATE INDEX IF NOT EXISTS idx_jobs_state ON jobs(state_code);
  CREATE INDEX IF NOT EXISTS idx_jobs_board ON jobs(post_board);
  CREATE INDEX IF NOT EXISTS idx_jobs_active ON jobs(is_active);
  CREATE INDEX IF NOT EXISTS idx_jobs_scraped ON jobs(scraped_at);

  CREATE TABLE IF NOT EXISTS sync_log (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    state_code TEXT,
    job_count  INTEGER,
    status     TEXT,
    message    TEXT,
    synced_at  TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS investment_sectors (
    sector_id          TEXT PRIMARY KEY,
    name               TEXT NOT NULL,
    slug               TEXT,
    policy             TEXT,
    investment_signal  TEXT,
    investment_score   INTEGER,
    growth_multiplier  REAL,
    keywords           TEXT,
    typical_roles      TEXT,
    education_demand   TEXT,
    district_hotspots  TEXT,
    live_on_site       INTEGER DEFAULT 1,
    source_url         TEXT,
    scraped_at         TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS investment_sync_log (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    sector_count INTEGER,
    status     TEXT,
    message    TEXT,
    synced_at  TEXT NOT NULL
  );
`);

const jobColumns = db.prepare("PRAGMA table_info(jobs)").all().map((c) => c.name);
if (!jobColumns.includes("official_link")) {
  db.exec("ALTER TABLE jobs ADD COLUMN official_link TEXT");
}

function hashJobId(stateCode, job) {
  const key = [stateCode, job.postBoard, job.postName, job.advtNo, job.link]
    .join("|")
    .toLowerCase();
  return crypto.createHash("sha256").update(key).digest("hex").slice(0, 16);
}

function parseLastDate(lastDate) {
  if (!lastDate) return null;
  const match = lastDate.match(/(\d{1,2})[-\/](\d{1,2})[-\/](\d{2,4})/);
  if (!match) return null;

  let [, day, month, year] = match;
  if (year.length === 2) {
    year = `20${year}`;
  }

  const iso = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  const parsed = new Date(iso);
  return Number.isNaN(parsed.getTime()) ? null : iso;
}

const upsertJob = db.prepare(`
  INSERT INTO jobs (
    id, state_code, post_date, post_board, post_name, qualification,
    advt_no, last_date, last_date_parsed, link, official_link, source, scraped_at, is_active
  ) VALUES (
    @id, @state_code, @post_date, @post_board, @post_name, @qualification,
    @advt_no, @last_date, @last_date_parsed, @link, @official_link, @source, @scraped_at, 1
  )
  ON CONFLICT(id) DO UPDATE SET
    post_date = excluded.post_date,
    post_board = excluded.post_board,
    post_name = excluded.post_name,
    qualification = excluded.qualification,
    advt_no = excluded.advt_no,
    last_date = excluded.last_date,
    last_date_parsed = excluded.last_date_parsed,
    link = excluded.link,
    official_link = excluded.official_link,
    scraped_at = excluded.scraped_at,
    is_active = 1
`);

const deactivateMissing = db.prepare(`
  UPDATE jobs SET is_active = 0
  WHERE state_code = ? AND id NOT IN (SELECT value FROM json_each(?))
`);

const insertSyncLog = db.prepare(`
  INSERT INTO sync_log (state_code, job_count, status, message, synced_at)
  VALUES (@state_code, @job_count, @status, @message, @synced_at)
`);

function upsertJobs(stateCode, jobs) {
  const scrapedAt = new Date().toISOString();
  const ids = [];

  const tx = db.transaction((items) => {
    for (const job of items) {
      const id = hashJobId(stateCode, job);
      ids.push(id);
      upsertJob.run({
        id,
        state_code: stateCode,
        post_date: job.postDate || "",
        post_board: job.postBoard || "",
        post_name: job.postName || "",
        qualification: job.qualification || "",
        advt_no: job.advtNo || "",
        last_date: job.lastDate || "",
        last_date_parsed: parseLastDate(job.lastDate),
        link: job.link || "",
        official_link: job.officialLink || job.official_link || "",
        source: "freejobalert",
        scraped_at: scrapedAt,
      });
    }
    deactivateMissing.run(stateCode, JSON.stringify(ids));
  });

  tx(jobs);
  return { count: jobs.length, scrapedAt };
}

function queryJobs({
  stateCode = "UP",
  board,
  q,
  sort = "post_date",
  order = "desc",
  page = 1,
  limit = 50,
  activeOnly = true,
}) {
  const conditions = ["state_code = @stateCode"];
  const params = { stateCode, limit: Number(limit), offset: (Number(page) - 1) * Number(limit) };

  if (activeOnly) conditions.push("is_active = 1");
  if (board) {
    conditions.push("post_board LIKE @board");
    params.board = `%${board}%`;
  }
  if (q) {
    conditions.push(
      "(post_name LIKE @q OR post_board LIKE @q OR qualification LIKE @q OR advt_no LIKE @q)"
    );
    params.q = `%${q}%`;
  }

  const sortMap = {
    post_date: "post_date",
    last_date: "last_date_parsed",
    board: "post_board",
    post_name: "post_name",
  };
  const sortCol = sortMap[sort] || "post_date";
  const sortOrder = order === "asc" ? "ASC" : "DESC";
  const where = conditions.join(" AND ");

  const countRow = db
    .prepare(`SELECT COUNT(*) as total FROM jobs WHERE ${where}`)
    .get(params);

  const rows = db
    .prepare(
      `SELECT * FROM jobs WHERE ${where} ORDER BY ${sortCol} ${sortOrder}, post_name ASC LIMIT @limit OFFSET @offset`
    )
    .all(params);

  return {
    data: rows,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total: countRow.total,
      pages: Math.ceil(countRow.total / Number(limit)) || 1,
    },
  };
}

function getStats(stateCode = "UP") {
  const total = db
    .prepare("SELECT COUNT(*) as c FROM jobs WHERE state_code = ? AND is_active = 1")
    .get(stateCode).c;

  const today = new Date();
  const weekAhead = new Date(today);
  weekAhead.setDate(weekAhead.getDate() + 7);
  const todayIso = today.toISOString().slice(0, 10);
  const weekIso = weekAhead.toISOString().slice(0, 10);

  const closingThisWeek = db
    .prepare(
      `SELECT COUNT(*) as c FROM jobs
       WHERE state_code = ? AND is_active = 1
       AND last_date_parsed IS NOT NULL
       AND last_date_parsed >= ? AND last_date_parsed <= ?`
    )
    .get(stateCode, todayIso, weekIso).c;

  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const newThisWeek = db
    .prepare(
      `SELECT COUNT(*) as c FROM jobs
       WHERE state_code = ? AND is_active = 1 AND scraped_at >= ?`
    )
    .get(stateCode, sevenDaysAgo.toISOString()).c;

  const topBoards = db
    .prepare(
      `SELECT post_board as board, COUNT(*) as count FROM jobs
       WHERE state_code = ? AND is_active = 1 AND post_board != ''
       GROUP BY post_board ORDER BY count DESC LIMIT 8`
    )
    .all(stateCode);

  const lastSync = db
    .prepare(
      `SELECT synced_at, job_count, status FROM sync_log
       WHERE state_code = ? ORDER BY id DESC LIMIT 1`
    )
    .get(stateCode);

  return {
    stateCode,
    total,
    closingThisWeek,
    newThisWeek,
    topBoards,
    lastSync: lastSync || null,
  };
}

function logSync(stateCode, jobCount, status, message = "") {
  insertSyncLog.run({
    state_code: stateCode,
    job_count: jobCount,
    status,
    message,
    synced_at: new Date().toISOString(),
  });
}

const upsertInvestmentSector = db.prepare(`
  INSERT INTO investment_sectors (
    sector_id, name, slug, policy, investment_signal, investment_score,
    growth_multiplier, keywords, typical_roles, education_demand,
    district_hotspots, live_on_site, source_url, scraped_at
  ) VALUES (
    @sector_id, @name, @slug, @policy, @investment_signal, @investment_score,
    @growth_multiplier, @keywords, @typical_roles, @education_demand,
    @district_hotspots, @live_on_site, @source_url, @scraped_at
  )
  ON CONFLICT(sector_id) DO UPDATE SET
    name = excluded.name,
    slug = excluded.slug,
    policy = excluded.policy,
    investment_signal = excluded.investment_signal,
    investment_score = excluded.investment_score,
    growth_multiplier = excluded.growth_multiplier,
    keywords = excluded.keywords,
    typical_roles = excluded.typical_roles,
    education_demand = excluded.education_demand,
    district_hotspots = excluded.district_hotspots,
    live_on_site = excluded.live_on_site,
    source_url = excluded.source_url,
    scraped_at = excluded.scraped_at
`);

const insertInvestmentSyncLog = db.prepare(`
  INSERT INTO investment_sync_log (sector_count, status, message, synced_at)
  VALUES (@sector_count, @status, @message, @synced_at)
`);

function upsertInvestmentSectors(sectors, meta = {}) {
  const scrapedAt = meta.scrapedAt || new Date().toISOString();

  const tx = db.transaction((items) => {
    for (const sector of items) {
      upsertInvestmentSector.run({
        sector_id: sector.id,
        name: sector.name,
        slug: sector.slug || "",
        policy: sector.policy || "",
        investment_signal: sector.investmentSignal || "medium",
        investment_score: sector.investmentScore || 50,
        growth_multiplier: sector.growthMultiplier || 1.1,
        keywords: JSON.stringify(sector.keywords || []),
        typical_roles: JSON.stringify(sector.typicalRoles || []),
        education_demand: JSON.stringify(sector.educationDemand || {}),
        district_hotspots: JSON.stringify(sector.districtHotspots || []),
        live_on_site: sector.liveOnSite ? 1 : 0,
        source_url: sector.sourceUrl || "",
        scraped_at: scrapedAt,
      });
    }
  });

  tx(sectors);
  return { count: sectors.length, scrapedAt };
}

function getInvestmentSectors() {
  return db
    .prepare("SELECT * FROM investment_sectors ORDER BY investment_score DESC, name ASC")
    .all();
}

function getInvestmentSyncMeta() {
  const lastSync = db
    .prepare(
      "SELECT synced_at, sector_count, status, message FROM investment_sync_log ORDER BY id DESC LIMIT 1"
    )
    .get();

  const count = db.prepare("SELECT COUNT(*) as c FROM investment_sectors").get().c;

  return { lastSync: lastSync || null, sectorCount: count };
}

function logInvestmentSync(sectorCount, status, message = "") {
  insertInvestmentSyncLog.run({
    sector_count: sectorCount,
    status,
    message,
    synced_at: new Date().toISOString(),
  });
}

function getActiveJobsForState(stateCode = "UP") {
  return db
    .prepare(
      "SELECT post_name, post_board, qualification FROM jobs WHERE state_code = ? AND is_active = 1"
    )
    .all(stateCode);
}

module.exports = {
  db,
  upsertJobs,
  queryJobs,
  getStats,
  logSync,
  parseLastDate,
  hashJobId,
  upsertInvestmentSectors,
  getInvestmentSectors,
  getInvestmentSyncMeta,
  logInvestmentSync,
  getActiveJobsForState,
};
