const fs = require("fs");
const path = require("path");
const Database = require("better-sqlite3");
const crypto = require("crypto");
const { normalizeStateToGeo, primeStateVariantCache, getStateDbVariants } = require("../services/indiaStateNormalize");
const {
  resolveIndustryBucket,
  buildIndustryBucketCondition,
  getBucketDef,
} = require("../services/ncsIndustryBuckets");
const { normalizeNcsJobParams, industryBucketKeys } = require("../services/ncsFilterNormalize");
const { SALARY_BAND_EXPR, EXPERIENCE_BAND_EXPR } = require("../services/ncsBandFilters");

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

  CREATE TABLE IF NOT EXISTS ncs_jobs (
    id                 INTEGER PRIMARY KEY,
    job_title          TEXT NOT NULL,
    organization_name  TEXT,
    functional_area    TEXT,
    functional_role    TEXT,
    industry           TEXT,
    job_type           TEXT,
    job_description    TEXT,
    required_skills    TEXT,
    city               TEXT,
    state              TEXT,
    locations          TEXT,
    min_experience     REAL,
    max_experience     REAL,
    min_salary         REAL,
    max_salary         REAL,
    hide_salary_range  INTEGER DEFAULT 0,
    no_of_vacancies    INTEGER,
    applicant_count    INTEGER DEFAULT 0,
    gender_preference  TEXT,
    is_government_job  INTEGER DEFAULT 0,
    published_at       TEXT,
    expired_at         TEXT,
    created_at         TEXT,
    link               TEXT,
    source             TEXT DEFAULT 'ncs',
    scraped_at         TEXT NOT NULL,
    is_active          INTEGER DEFAULT 1
  );

  CREATE INDEX IF NOT EXISTS idx_ncs_jobs_city ON ncs_jobs(city);
  CREATE INDEX IF NOT EXISTS idx_ncs_jobs_state ON ncs_jobs(state);
  CREATE INDEX IF NOT EXISTS idx_ncs_jobs_job_type ON ncs_jobs(job_type);
  CREATE INDEX IF NOT EXISTS idx_ncs_jobs_functional_area ON ncs_jobs(functional_area);
  CREATE INDEX IF NOT EXISTS idx_ncs_jobs_active ON ncs_jobs(is_active);
  CREATE INDEX IF NOT EXISTS idx_ncs_jobs_published ON ncs_jobs(published_at);

  CREATE TABLE IF NOT EXISTS ncs_sync_log (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    job_count   INTEGER,
    status      TEXT,
    message     TEXT,
    synced_at   TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS ncs_filter_options (
    id         INTEGER PRIMARY KEY CHECK (id = 1),
    payload    TEXT NOT NULL,
    scraped_at TEXT NOT NULL
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

const upsertNcsJob = db.prepare(`
  INSERT INTO ncs_jobs (
    id, job_title, organization_name, functional_area, functional_role, industry,
    job_type, job_description, required_skills, city, state, locations,
    min_experience, max_experience, min_salary, max_salary, hide_salary_range,
    no_of_vacancies, applicant_count, gender_preference, is_government_job,
    published_at, expired_at, created_at, link, source, scraped_at, is_active
  ) VALUES (
    @id, @job_title, @organization_name, @functional_area, @functional_role, @industry,
    @job_type, @job_description, @required_skills, @city, @state, @locations,
    @min_experience, @max_experience, @min_salary, @max_salary, @hide_salary_range,
    @no_of_vacancies, @applicant_count, @gender_preference, @is_government_job,
    @published_at, @expired_at, @created_at, @link, @source, @scraped_at, 1
  )
  ON CONFLICT(id) DO UPDATE SET
    job_title = excluded.job_title,
    organization_name = excluded.organization_name,
    functional_area = excluded.functional_area,
    functional_role = excluded.functional_role,
    industry = excluded.industry,
    job_type = excluded.job_type,
    job_description = excluded.job_description,
    required_skills = excluded.required_skills,
    city = excluded.city,
    state = excluded.state,
    locations = excluded.locations,
    min_experience = excluded.min_experience,
    max_experience = excluded.max_experience,
    min_salary = excluded.min_salary,
    max_salary = excluded.max_salary,
    hide_salary_range = excluded.hide_salary_range,
    no_of_vacancies = excluded.no_of_vacancies,
    applicant_count = excluded.applicant_count,
    gender_preference = excluded.gender_preference,
    is_government_job = excluded.is_government_job,
    published_at = excluded.published_at,
    expired_at = excluded.expired_at,
    created_at = excluded.created_at,
    link = excluded.link,
    scraped_at = excluded.scraped_at,
    is_active = 1
`);

const deactivateMissingNcsJobs = db.prepare(`
  UPDATE ncs_jobs SET is_active = 0
  WHERE id NOT IN (SELECT value FROM json_each(?))
`);

const insertNcsSyncLog = db.prepare(`
  INSERT INTO ncs_sync_log (job_count, status, message, synced_at)
  VALUES (@job_count, @status, @message, @synced_at)
`);

const upsertNcsFilterOptions = db.prepare(`
  INSERT INTO ncs_filter_options (id, payload, scraped_at)
  VALUES (1, @payload, @scraped_at)
  ON CONFLICT(id) DO UPDATE SET
    payload = excluded.payload,
    scraped_at = excluded.scraped_at
`);

function mapNcsJobRow(job, scrapedAt) {
  return {
    id: job.id,
    job_title: job.jobTitle || "",
    organization_name: job.organizationName || "",
    functional_area: job.functionalArea || "",
    functional_role: job.functionalRole || "",
    industry: job.industry || "",
    job_type: job.jobType || "",
    job_description: job.jobDescription || "",
    required_skills: JSON.stringify(job.requiredSkills || []),
    city: job.city || "",
    state: job.state || "",
    locations: JSON.stringify(job.locations || []),
    min_experience: job.minExperience,
    max_experience: job.maxExperience,
    min_salary: job.minSalary,
    max_salary: job.maxSalary,
    hide_salary_range: job.hideSalaryRange ? 1 : 0,
    no_of_vacancies: job.noOfVacancies,
    applicant_count: job.applicantCount ?? 0,
    gender_preference: job.genderPreference || "",
    is_government_job: job.isGovernmentJob ? 1 : 0,
    published_at: job.publishedAt || "",
    expired_at: job.expiredAt || "",
    created_at: job.createdAt || "",
    link: job.link || "",
    source: "ncs",
    scraped_at: scrapedAt,
  };
}

function parseNcsJobRow(row) {
  if (!row) return row;
  let requiredSkills = [];
  let locations = [];
  try {
    requiredSkills = JSON.parse(row.required_skills || "[]");
  } catch {
    requiredSkills = [];
  }
  try {
    locations = JSON.parse(row.locations || "[]");
  } catch {
    locations = [];
  }
  return {
    ...row,
    required_skills: requiredSkills,
    locations,
    hide_salary_range: Boolean(row.hide_salary_range),
    is_government_job: Boolean(row.is_government_job),
    is_active: Boolean(row.is_active),
  };
}

function upsertNcsJobs(jobs) {
  const scrapedAt = new Date().toISOString();
  const ids = [];

  const tx = db.transaction((items) => {
    for (const job of items) {
      ids.push(job.id);
      upsertNcsJob.run(mapNcsJobRow(job, scrapedAt));
    }
    deactivateMissingNcsJobs.run(JSON.stringify(ids));
  });

  tx(jobs);
  return { count: jobs.length, scrapedAt };
}

function saveNcsFilterOptions(options) {
  const scrapedAt = new Date().toISOString();
  upsertNcsFilterOptions.run({
    payload: JSON.stringify(options),
    scraped_at: scrapedAt,
  });
  return { scrapedAt };
}

function getNcsFilterOptions() {
  const row = db.prepare("SELECT payload, scraped_at FROM ncs_filter_options WHERE id = 1").get();
  if (!row) return null;
  try {
    return { data: JSON.parse(row.payload), scrapedAt: row.scraped_at };
  } catch {
    return null;
  }
}

function ensureNcsStateVariantCache() {
  if (primeStateVariantCache._ready) return;
  const rows = db
    .prepare(
      `SELECT DISTINCT state FROM ncs_jobs
       WHERE is_active = 1 AND is_government_job = 0
         AND state IS NOT NULL AND TRIM(state) != ''`
    )
    .all();
  primeStateVariantCache(rows.map((r) => r.state));
}

function buildNcsJobsWhere(rawParams = {}) {
  const {
    q,
    city,
    state,
    jobType,
    functionalArea,
    industry,
    organization,
    functionalRole,
    jobTitle,
    salaryBand,
    experienceBand,
    minSalary,
    maxSalary,
    minExperience,
    maxExperience,
    activeOnly = true,
    privateOnly = true,
  } = normalizeNcsJobParams(rawParams);

  const conditions = [];
  const params = {};

  if (activeOnly) conditions.push("is_active = 1");
  if (privateOnly) conditions.push("is_government_job = 0");

  if (city) {
    conditions.push("city = @city");
    params.city = city;
  }
  if (state) {
    ensureNcsStateVariantCache();
    const variants = getStateDbVariants(state);
    if (variants.length === 1) {
      conditions.push("state = @state");
      params.state = variants[0];
    } else {
      const placeholders = variants.map((_, i) => `@stateVar${i}`).join(", ");
      conditions.push(`state IN (${placeholders})`);
      variants.forEach((v, i) => {
        params[`stateVar${i}`] = v;
      });
    }
  }
  if (jobType) {
    conditions.push("job_type = @jobType");
    params.jobType = jobType;
  }
  if (functionalArea) {
    conditions.push("functional_area = @functionalArea");
    params.functionalArea = functionalArea;
  }
  if (industry) {
    if (getBucketDef(industry)) {
      conditions.push(buildIndustryBucketCondition(industry, params, "indFilter"));
    } else {
      conditions.push("industry = @industry");
      params.industry = industry;
    }
  }
  if (organization) {
    conditions.push("TRIM(organization_name) = TRIM(@organization)");
    params.organization = organization;
  }
  if (functionalRole && !jobTitle) {
    conditions.push("TRIM(functional_role) = TRIM(@functionalRole)");
    params.functionalRole = functionalRole;
  }
  if (jobTitle) {
    conditions.push("TRIM(job_title) = TRIM(@jobTitle)");
    params.jobTitle = jobTitle;
  }
  if (salaryBand) {
    conditions.push(`${SALARY_BAND_EXPR} = @salaryBand`);
    params.salaryBand = salaryBand;
  }
  if (experienceBand) {
    conditions.push(`${EXPERIENCE_BAND_EXPR} = @experienceBand`);
    params.experienceBand = experienceBand;
  }
  if (minSalary != null && minSalary !== "") {
    conditions.push("(max_salary IS NULL OR max_salary >= @minSalary)");
    params.minSalary = Number(minSalary);
  }
  if (maxSalary != null && maxSalary !== "") {
    conditions.push("(min_salary IS NULL OR min_salary <= @maxSalary)");
    params.maxSalary = Number(maxSalary);
  }
  if (minExperience != null && minExperience !== "") {
    conditions.push("(max_experience IS NULL OR max_experience >= @minExperience)");
    params.minExperience = Number(minExperience);
  }
  if (maxExperience != null && maxExperience !== "") {
    conditions.push("(min_experience IS NULL OR min_experience <= @maxExperience)");
    params.maxExperience = Number(maxExperience);
  }
  if (q) {
    conditions.push(
      "(job_title LIKE @q OR organization_name LIKE @q OR functional_area LIKE @q OR functional_role LIKE @q OR job_description LIKE @q OR city LIKE @q OR state LIKE @q)"
    );
    params.q = `%${q}%`;
  }

  const where = conditions.length ? conditions.join(" AND ") : "1=1";
  return { where, params };
}

function queryNcsJobs({
  q,
  city,
  state,
  jobType,
  functionalArea,
  industry,
  organization,
  functionalRole,
  jobTitle,
  salaryBand,
  experienceBand,
  minSalary,
  maxSalary,
  minExperience,
  maxExperience,
  sort = "published_at",
  order = "desc",
  page = 1,
  limit = 50,
  activeOnly = true,
  privateOnly = true,
}) {
  const { where, params: filterParams } = buildNcsJobsWhere({
    q,
    city,
    state,
    jobType,
    functionalArea,
    industry,
    organization,
    functionalRole,
    jobTitle,
    salaryBand,
    experienceBand,
    minSalary,
    maxSalary,
    minExperience,
    maxExperience,
    activeOnly,
    privateOnly,
  });
  const params = {
    ...filterParams,
    limit: Number(limit),
    offset: (Number(page) - 1) * Number(limit),
  };

  const sortMap = {
    published_at: "published_at",
    salary: "max_salary",
    experience: "min_experience",
    title: "job_title",
    applicants: "applicant_count",
  };
  const sortCol = sortMap[sort] || "published_at";
  const sortOrder = order === "asc" ? "ASC" : "DESC";

  const countRow = db
    .prepare(`SELECT COUNT(*) as total FROM ncs_jobs WHERE ${where}`)
    .get(params);

  const rows = db
    .prepare(
      `SELECT * FROM ncs_jobs WHERE ${where} ORDER BY ${sortCol} ${sortOrder}, job_title ASC LIMIT @limit OFFSET @offset`
    )
    .all(params);

  return {
    data: rows.map(parseNcsJobRow),
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total: countRow.total,
      pages: Math.ceil(countRow.total / Number(limit)) || 1,
    },
  };
}

function getNormalizedStateStats() {
  const rows = db
    .prepare(
      `SELECT state,
        COUNT(*) AS postings,
        SUM(CASE WHEN no_of_vacancies IS NOT NULL AND no_of_vacancies > 0 THEN no_of_vacancies ELSE 1 END) AS vacancies,
        SUM(COALESCE(applicant_count, 0)) AS applicants
       FROM ncs_jobs
       WHERE is_active = 1 AND is_government_job = 0
         AND state IS NOT NULL AND TRIM(state) != ''
       GROUP BY state`
    )
    .all();

  primeStateVariantCache(rows.map((r) => r.state));

  const merged = new Map();
  for (const row of rows) {
    const geo = normalizeStateToGeo(row.state);
    if (!geo) continue;
    const cur = merged.get(geo) || { name: geo, postings: 0, vacancies: 0, applicants: 0 };
    cur.postings += row.postings;
    cur.vacancies += row.vacancies;
    cur.applicants += row.applicants;
    merged.set(geo, cur);
  }

  return Array.from(merged.values());
}

function topRankings(items, metric, limit = 5) {
  return [...items]
    .sort((a, b) => b[metric] - a[metric])
    .slice(0, limit)
    .map(({ name, postings, vacancies, applicants }) => ({
      name,
      postings,
      vacancies,
      applicants,
      value: metric === "postings" ? postings : metric === "vacancies" ? vacancies : applicants,
    }));
}

function getIndustryStats() {
  const rows = db
    .prepare(
      `SELECT industry, functional_area,
        COUNT(*) AS postings,
        SUM(CASE WHEN no_of_vacancies IS NOT NULL AND no_of_vacancies > 0 THEN no_of_vacancies ELSE 1 END) AS vacancies,
        SUM(COALESCE(applicant_count, 0)) AS applicants
       FROM ncs_jobs
       WHERE is_active = 1 AND is_government_job = 0
       GROUP BY industry, functional_area`
    )
    .all();

  const merged = new Map();
  for (const row of rows) {
    const bucket = resolveIndustryBucket(row.industry, row.functional_area);
    const cur = merged.get(bucket) || { name: bucket, postings: 0, vacancies: 0, applicants: 0 };
    cur.postings += row.postings;
    cur.vacancies += row.vacancies;
    cur.applicants += row.applicants;
    merged.set(bucket, cur);
  }

  return Array.from(merged.values());
}

function topStateRankings(states, metric, limit = 5) {
  return topRankings(states, metric, limit);
}

function getNcsStats() {
  const total = db
    .prepare("SELECT COUNT(*) as c FROM ncs_jobs WHERE is_active = 1 AND is_government_job = 0")
    .get().c;

  const aggregates = db
    .prepare(
      `SELECT
        COUNT(*) as totalPostings,
        SUM(CASE WHEN no_of_vacancies IS NOT NULL AND no_of_vacancies > 0 THEN no_of_vacancies ELSE 1 END) as totalVacancies,
        SUM(COALESCE(applicant_count, 0)) as totalApplicants,
        COUNT(DISTINCT NULLIF(organization_name, '')) as employers
       FROM ncs_jobs
       WHERE is_active = 1 AND is_government_job = 0`
    )
    .get();

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const newThisWeek = db
    .prepare(
      `SELECT COUNT(*) as c FROM ncs_jobs
       WHERE is_active = 1 AND is_government_job = 0 AND published_at >= ?`
    )
    .get(sevenDaysAgo.toISOString()).c;

  const topCities = db
    .prepare(
      `SELECT city, COUNT(*) as count FROM ncs_jobs
       WHERE is_active = 1 AND is_government_job = 0 AND city != ''
       GROUP BY city ORDER BY count DESC LIMIT 10`
    )
    .all();

  const topFunctionalAreas = db
    .prepare(
      `SELECT functional_area as area, COUNT(*) as count FROM ncs_jobs
       WHERE is_active = 1 AND is_government_job = 0 AND functional_area != ''
       GROUP BY functional_area ORDER BY count DESC LIMIT 10`
    )
    .all();

  const jobTypes = db
    .prepare(
      `SELECT job_type as type, COUNT(*) as count FROM ncs_jobs
       WHERE is_active = 1 AND is_government_job = 0 AND job_type != ''
       GROUP BY job_type ORDER BY count DESC`
    )
    .all();

  const sectorBreakdown = db
    .prepare(
      `SELECT functional_area as name,
        COUNT(*) as postings,
        SUM(CASE WHEN no_of_vacancies IS NOT NULL AND no_of_vacancies > 0 THEN no_of_vacancies ELSE 1 END) as vacancies
       FROM ncs_jobs
       WHERE is_active = 1 AND is_government_job = 0 AND functional_area != ''
       GROUP BY functional_area ORDER BY postings DESC LIMIT 8`
    )
    .all();

  const stateStats = getNormalizedStateStats();
  const industryStats = getIndustryStats();

  const lastSync = db
    .prepare("SELECT synced_at, job_count, status FROM ncs_sync_log ORDER BY id DESC LIMIT 1")
    .get();

  return {
    total,
    totalPostings: aggregates.totalPostings ?? total,
    totalVacancies: aggregates.totalVacancies ?? total,
    totalApplicants: aggregates.totalApplicants ?? 0,
    statesCovered: stateStats.length,
    employers: aggregates.employers ?? 0,
    newThisWeek,
    topIndustriesByPostings: topRankings(industryStats, "postings"),
    topIndustriesByVacancies: topRankings(industryStats, "vacancies"),
    topIndustriesByApplicants: topRankings(industryStats, "applicants"),
    topStatesByVacancies: topStateRankings(stateStats, "vacancies"),
    topCities,
    topFunctionalAreas,
    jobTypes,
    sectorBreakdown,
    lastSync: lastSync || null,
  };
}

function logNcsSync(jobCount, status, message = "") {
  insertNcsSyncLog.run({
    job_count: jobCount,
    status,
    message,
    synced_at: new Date().toISOString(),
  });
}

function getNcsScopedFacets(rawParams = {}) {
  const { where, params } = buildNcsJobsWhere(rawParams);

  const cities = db
    .prepare(
      `SELECT city, COUNT(*) as count FROM ncs_jobs
       WHERE ${where} AND city IS NOT NULL AND TRIM(city) != ''
       GROUP BY city ORDER BY count DESC LIMIT 100`
    )
    .all(params);

  const functionalAreas = db
    .prepare(
      `SELECT functional_area as name, COUNT(*) as count FROM ncs_jobs
       WHERE ${where} AND functional_area IS NOT NULL AND TRIM(functional_area) != ''
       GROUP BY functional_area ORDER BY count DESC LIMIT 100`
    )
    .all(params);

  const jobTypes = db
    .prepare(
      `SELECT job_type as name, COUNT(*) as count FROM ncs_jobs
       WHERE ${where} AND job_type IS NOT NULL AND TRIM(job_type) != ''
       GROUP BY job_type ORDER BY count DESC`
    )
    .all(params);

  const industryRows = db
    .prepare(
      `SELECT industry, functional_area,
        COUNT(*) AS count
       FROM ncs_jobs
       WHERE ${where}
       GROUP BY industry, functional_area`
    )
    .all(params);

  const bucketCounts = new Map();
  for (const key of industryBucketKeys()) {
    bucketCounts.set(key, 0);
  }
  for (const row of industryRows) {
    const bucket = resolveIndustryBucket(row.industry, row.functional_area);
    bucketCounts.set(bucket, (bucketCounts.get(bucket) || 0) + row.count);
  }

  const industries = industryBucketKeys()
    .map((name) => ({ name, count: bucketCounts.get(name) || 0 }))
    .filter((row) => row.count > 0)
    .sort((a, b) => b.count - a.count);

  const total = db.prepare(`SELECT COUNT(*) as count FROM ncs_jobs WHERE ${where}`).get(params).count;

  const states = getNormalizedStateStats()
    .map(({ name, postings }) => ({ state: name, count: postings }))
    .filter((row) => row.count > 0);

  return { cities, functionalAreas, industries, jobTypes, states, total };
}

function getNcsFacets() {
  const cities = db
    .prepare(
      `SELECT city, COUNT(*) as count FROM ncs_jobs
       WHERE is_active = 1 AND is_government_job = 0 AND city != ''
       GROUP BY city ORDER BY count DESC LIMIT 200`
    )
    .all();

  const states = getNormalizedStateStats().map(({ name, postings }) => ({
    state: name,
    count: postings,
  }));

  const functionalAreas = db
    .prepare(
      `SELECT functional_area as name, COUNT(*) as count FROM ncs_jobs
       WHERE is_active = 1 AND is_government_job = 0 AND functional_area != ''
       GROUP BY functional_area ORDER BY count DESC LIMIT 100`
    )
    .all();

  const industries = db
    .prepare(
      `SELECT industry as name, COUNT(*) as count FROM ncs_jobs
       WHERE is_active = 1 AND is_government_job = 0 AND industry != ''
       GROUP BY industry ORDER BY count DESC LIMIT 50`
    )
    .all();

  const jobTypes = db
    .prepare(
      `SELECT job_type as name, COUNT(*) as count FROM ncs_jobs
       WHERE is_active = 1 AND is_government_job = 0 AND job_type != ''
       GROUP BY job_type ORDER BY count DESC`
    )
    .all();

  return { cities, states, functionalAreas, industries, jobTypes };
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
  upsertNcsJobs,
  queryNcsJobs,
  getNcsStats,
  logNcsSync,
  saveNcsFilterOptions,
  getNcsFilterOptions,
  getNcsFacets,
  getNcsScopedFacets,
  buildNcsJobsWhere,
};
