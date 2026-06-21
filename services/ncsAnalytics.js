const { db } = require("../db/database");
const {
  normalizeStateToGeo,
  primeStateVariantCache,
  getStateDbVariants,
} = require("./indiaStateNormalize");
const {
  resolveIndustryBucket,
  buildIndustryBucketCondition,
} = require("./ncsIndustryBuckets");

const ACTIVE = "is_active = 1 AND is_government_job = 0";
const TOP_N = 5;

const SALARY_BAND_EXPR = `CASE
  WHEN hide_salary_range = 1 OR (min_salary IS NULL AND max_salary IS NULL) THEN 'Not disclosed'
  WHEN COALESCE(max_salary, min_salary) < 300000 THEN 'Below 3 LPA'
  WHEN COALESCE(max_salary, min_salary) < 500000 THEN '3–5 LPA'
  WHEN COALESCE(max_salary, min_salary) < 800000 THEN '5–8 LPA'
  WHEN COALESCE(max_salary, min_salary) < 1200000 THEN '8–12 LPA'
  ELSE '12+ LPA'
END`;

const EXPERIENCE_BAND_EXPR = `CASE
  WHEN max_experience IS NULL OR max_experience <= 1 THEN 'Fresher (0–1 yr)'
  WHEN max_experience <= 3 THEN '1–3 yrs'
  WHEN max_experience <= 5 THEN '3–5 yrs'
  WHEN max_experience <= 10 THEN '5–10 yrs'
  ELSE '10+ yrs'
END`;

const FRAME_DRILL = {
  geography: ["state", "city", "functionalArea"],
  employers: ["organization", "functionalArea", "city"],
  employment: ["industry", "functionalArea", "functionalRole", "jobTitle"],
  salary: ["salaryBand", "functionalArea", "city"],
  experience: ["experienceBand", "functionalArea", "jobType"],
  timeline: ["month", "functionalArea", "city"],
};

const FRAME_META = {
  geography: { title: "Geography", hint: "Click a state on the map → top cities → sectors" },
  employers: { title: "Top employers", hint: "Employer → sectors → cities" },
  employment: {
    title: "Top 5 industry sectors",
    hint: "Industry → sub-sector → role → openings",
  },
  salary: { title: "Compensation", hint: "Salary bands · top 5 sectors on drill" },
  experience: { title: "Experience", hint: "Experience levels · click to drill down" },
  timeline: { title: "Hiring timeline", hint: "Monthly trend → sectors → cities" },
};

function parseFilters(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function buildWhere(filters) {
  const conditions = [ACTIVE];
  const params = {};

  for (const f of filters) {
    if (!f?.dimension || f.value == null || f.value === "") continue;
    switch (f.dimension) {
      case "state": {
        const variants = getStateDbVariants(f.value);
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
        break;
      }
      case "city":
        conditions.push("city = @city");
        params.city = f.value;
        break;
      case "functionalArea":
        conditions.push("functional_area = @functionalArea");
        params.functionalArea = f.value;
        break;
      case "industry":
        conditions.push(buildIndustryBucketCondition(f.value, params, "indFilter"));
        break;
      case "functionalRole":
        conditions.push("functional_role = @functionalRole");
        params.functionalRole = f.value;
        break;
      case "jobTitle":
        conditions.push("job_title = @jobTitle");
        params.jobTitle = f.value;
        break;
      case "organization":
        conditions.push("organization_name = @organization");
        params.organization = f.value;
        break;
      case "jobType":
        conditions.push("job_type = @jobType");
        params.jobType = f.value;
        break;
      case "salaryBand":
        conditions.push(`${SALARY_BAND_EXPR} = @salaryBand`);
        params.salaryBand = f.value;
        break;
      case "experienceBand":
        conditions.push(`${EXPERIENCE_BAND_EXPR} = @experienceBand`);
        params.experienceBand = f.value;
        break;
      case "month":
        conditions.push("strftime('%Y-%m', published_at) = @month");
        params.month = f.value;
        break;
      case "search": {
        const term = `%${String(f.value).trim()}%`;
        conditions.push(
          "(LOWER(job_title) LIKE LOWER(@search) OR LOWER(organization_name) LIKE LOWER(@search) OR LOWER(functional_area) LIKE LOWER(@search) OR LOWER(job_description) LIKE LOWER(@search) OR LOWER(city) LIKE LOWER(@search) OR LOWER(state) LIKE LOWER(@search))"
        );
        params.search = term;
        break;
      }
      case "minSalary":
        conditions.push(
          "(hide_salary_range = 0 AND COALESCE(max_salary, min_salary) >= @minSalary)"
        );
        params.minSalary = Number(f.value);
        break;
      case "minExperience":
        conditions.push("(max_experience IS NOT NULL AND max_experience >= @minExperience)");
        params.minExperience = Number(f.value);
        break;
      case "maxSalary":
        conditions.push(
          "(hide_salary_range = 0 AND COALESCE(min_salary, max_salary) <= @maxSalary)"
        );
        params.maxSalary = Number(f.value);
        break;
      case "maxExperience":
        conditions.push("(min_experience IS NOT NULL AND min_experience <= @maxExperience)");
        params.maxExperience = Number(f.value);
        break;
      default:
        break;
    }
  }

  return { where: conditions.join(" AND "), params };
}

function ensureStateVariantCache() {
  if (primeStateVariantCache._ready) return;
  const rows = db
    .prepare(
      `SELECT DISTINCT state FROM ncs_jobs WHERE ${ACTIVE} AND state IS NOT NULL AND TRIM(state) != ''`
    )
    .all();
  primeStateVariantCache(rows.map((r) => r.state));
  primeStateVariantCache._ready = true;
}

function queryStateNormalized(where, params) {
  ensureStateVariantCache();
  const rows = db
    .prepare(
      `SELECT state AS raw,
        COUNT(*) AS postings,
        SUM(CASE WHEN no_of_vacancies IS NOT NULL AND no_of_vacancies > 0 THEN no_of_vacancies ELSE 1 END) AS vacancies,
        SUM(COALESCE(applicant_count, 0)) AS applicants
       FROM ncs_jobs
       WHERE ${where} AND state IS NOT NULL AND TRIM(state) != ''
       GROUP BY state`
    )
    .all(params);

  const merged = new Map();
  for (const row of rows) {
    const geo = normalizeStateToGeo(row.raw);
    if (!geo) continue;
    const cur = merged.get(geo) || { key: geo, postings: 0, vacancies: 0, applicants: 0 };
    cur.postings += row.postings;
    cur.vacancies += row.vacancies;
    cur.applicants += row.applicants;
    merged.set(geo, cur);
  }

  return Array.from(merged.values()).sort((a, b) => b.vacancies - a.vacancies);
}

function aggregateQuery(groupExpr, groupAlias, where, params, limit = TOP_N, orderBy = "vacancies") {
  const orderCol = orderBy === "vacancies" ? "vacancies" : "postings";
  const limitClause = limit != null ? `LIMIT ${limit}` : "";
  const sql = `
    SELECT ${groupExpr} AS ${groupAlias},
      COUNT(*) AS postings,
      SUM(CASE WHEN no_of_vacancies IS NOT NULL AND no_of_vacancies > 0 THEN no_of_vacancies ELSE 1 END) AS vacancies,
      SUM(COALESCE(applicant_count, 0)) AS applicants
    FROM ncs_jobs
    WHERE ${where} AND ${groupExpr} IS NOT NULL AND TRIM(CAST(${groupExpr} AS TEXT)) != ''
    GROUP BY ${groupAlias}
    ORDER BY ${orderCol} DESC
    ${limitClause}
  `;
  return db.prepare(sql).all(params);
}

function queryIndustryBuckets(where, params) {
  const rows = db
    .prepare(
      `SELECT industry, functional_area,
        COUNT(*) AS postings,
        SUM(CASE WHEN no_of_vacancies IS NOT NULL AND no_of_vacancies > 0 THEN no_of_vacancies ELSE 1 END) AS vacancies,
        SUM(COALESCE(applicant_count, 0)) AS applicants
       FROM ncs_jobs
       WHERE ${where}
       GROUP BY industry, functional_area`
    )
    .all(params);

  const merged = new Map();
  for (const row of rows) {
    const bucket = resolveIndustryBucket(row.industry, row.functional_area);
    const cur = merged.get(bucket) || { key: bucket, postings: 0, vacancies: 0, applicants: 0 };
    cur.postings += row.postings;
    cur.vacancies += row.vacancies;
    cur.applicants += row.applicants;
    merged.set(bucket, cur);
  }

  return Array.from(merged.values())
    .sort((a, b) => b.vacancies - a.vacancies)
    .slice(0, TOP_N);
}

function queryIndustryBucketsAll(where, params) {
  const rows = db
    .prepare(
      `SELECT industry, functional_area,
        COUNT(*) AS postings,
        SUM(CASE WHEN no_of_vacancies IS NOT NULL AND no_of_vacancies > 0 THEN no_of_vacancies ELSE 1 END) AS vacancies,
        SUM(COALESCE(applicant_count, 0)) AS applicants
       FROM ncs_jobs
       WHERE ${where}
       GROUP BY industry, functional_area`
    )
    .all(params);

  const merged = new Map();
  for (const row of rows) {
    const bucket = resolveIndustryBucket(row.industry, row.functional_area);
    const cur = merged.get(bucket) || { key: bucket, postings: 0, vacancies: 0, applicants: 0 };
    cur.postings += row.postings;
    cur.vacancies += row.vacancies;
    cur.applicants += row.applicants;
    merged.set(bucket, cur);
  }

  return Array.from(merged.values()).sort((a, b) => b.vacancies - a.vacancies);
}

function queryDimension(dimension, where, params, frameId, filterCount) {
  return queryDimensionWithLimit(dimension, where, params, frameId, filterCount, TOP_N);
}

function queryDimensionWithLimit(dimension, where, params, frameId, filterCount, limit) {
  switch (dimension) {
    case "state":
      return queryStateNormalized(where, params);
    case "industry":
      if (limit === TOP_N) return queryIndustryBuckets(where, params);
      return queryIndustryBucketsAll(where, params).slice(0, limit ?? undefined);
    case "organization":
      return aggregateQuery("organization_name", "key", where, params, limit);
    case "city":
      return aggregateQuery("city", "key", where, params, limit);
    case "functionalArea":
      return aggregateQuery("functional_area", "key", where, params, limit);
    case "functionalRole":
      return aggregateQuery("functional_role", "key", where, params, limit);
    case "jobTitle":
      return aggregateQuery("job_title", "key", where, params, limit ?? 8, "vacancies");
    case "jobType":
      return aggregateQuery("job_type", "key", where, params, limit);
    case "salaryBand":
      return aggregateQuery(SALARY_BAND_EXPR, "key", where, params, limit);
    case "experienceBand":
      return aggregateQuery(EXPERIENCE_BAND_EXPR, "key", where, params, limit);
    case "month":
      return db
        .prepare(
          `SELECT strftime('%Y-%m', published_at) AS key,
            COUNT(*) AS postings,
            SUM(CASE WHEN no_of_vacancies IS NOT NULL AND no_of_vacancies > 0 THEN no_of_vacancies ELSE 1 END) AS vacancies,
            SUM(COALESCE(applicant_count, 0)) AS applicants
           FROM ncs_jobs
           WHERE ${where} AND published_at IS NOT NULL AND published_at != ''
           GROUP BY key
           ORDER BY key DESC
           LIMIT 12`
        )
        .all(params)
        .reverse();
    default:
      return [];
  }
}

function dimensionLabel(dimension) {
  const labels = {
    state: "State",
    city: "City",
    industry: "Industry",
    organization: "Employer",
    functionalArea: "Sub-sector",
    functionalRole: "Role",
    jobTitle: "Opening",
    jobType: "Job type",
    salaryBand: "Salary band",
    experienceBand: "Experience",
    month: "Month",
  };
  return labels[dimension] || dimension;
}

function chartTypeFor(frameId, dimension, filterCount) {
  if (frameId === "geography" && dimension === "state" && filterCount === 0) return "map";
  if (frameId === "timeline" && dimension === "month") return "line";
  if (frameId === "employment" && dimension === "jobTitle") return "openings";
  if (frameId === "employment" || frameId === "employers") return "horizontalBar";
  if (dimension === "jobType" || dimension === "salaryBand" || dimension === "experienceBand") {
    return "pie";
  }
  if (dimension === "functionalArea") return "horizontalBar";
  return "bar";
}

function buildTitle(frameId, dimension, filters) {
  const meta = FRAME_META[frameId];
  if (filters.length === 0) {
    if (frameId === "geography") return "India vacancy heat map";
    if (frameId === "employment") return `Top ${TOP_N} industry sectors`;
    if (frameId === "employers") return `Top ${TOP_N} employers`;
    return meta?.title || "Overview";
  }

  const last = filters[filters.length - 1];

  if (frameId === "employment") {
    if (dimension === "functionalArea") return `Sub-sectors in ${last.value}`;
    if (dimension === "functionalRole") return `Roles in ${truncateLabel(last.value, 40)}`;
    if (dimension === "jobTitle") return `Open positions · ${truncateLabel(last.value, 36)}`;
  }

  if (frameId === "employers") {
    if (dimension === "functionalArea") return `Sectors at ${truncateLabel(last.value, 36)}`;
    if (dimension === "city") return `Cities · ${truncateLabel(last.value, 36)}`;
  }

  if (frameId === "geography" && dimension === "city") {
    return `Top ${TOP_N} cities in ${last.value}`;
  }
  if (
    frameId === "salary" &&
    dimension === "functionalArea"
  ) {
    return `Top ${TOP_N} sectors`;
  }
  if (frameId === "timeline" && dimension === "functionalArea") {
    return `Sectors in ${last.value}`;
  }

  const dimLabel = dimensionLabel(dimension);
  return `${dimLabel} breakdown`;
}

function truncateLabel(label, max = 40) {
  if (!label || label.length <= max) return label;
  return `${label.slice(0, max - 1)}…`;
}

function buildBreadcrumb(frameId, filters) {
  const meta = FRAME_META[frameId];
  const crumbs = [{ label: meta?.title || "Overview", level: 0, filters: [] }];
  filters.forEach((f, i) => {
    crumbs.push({
      label: f.value.replace(/_/g, " "),
      level: i + 1,
      filters: filters.slice(0, i + 1),
    });
  });
  return crumbs;
}

function formatDatumRows(rows, dimension) {
  return rows.map((row) => ({
    key: row.key,
    label: dimension === "month" ? formatMonth(row.key) : String(row.key).replace(/_/g, " "),
    postings: row.postings,
    vacancies: row.vacancies,
    applicants: row.applicants,
  }));
}

function getFilterForPathDimension(allFilters, dim) {
  const direct = allFilters.find((f) => f.dimension === dim);
  if (direct) return direct;
  if (dim === "organization" || dim === "functionalRole" || dim === "jobTitle") {
    const search = allFilters.find((f) => f.dimension === "search");
    if (search) return { dimension: dim, value: search.value };
  }
  return null;
}

function buildFrameStack(frameId, allFilters) {
  const path = FRAME_DRILL[frameId];
  if (!path) return [];
  const stack = [];
  for (const dim of path) {
    const entry = getFilterForPathDimension(allFilters, dim);
    if (!entry) break;
    stack.push(entry);
  }
  return stack;
}

function dedupeFilters(filters) {
  const merged = new Map();
  for (const f of filters) {
    if (!f?.dimension || f.value == null || f.value === "") continue;
    merged.set(f.dimension, f);
  }
  return Array.from(merged.values());
}

function getNcsFrameAnalytics(frameId, rawFilters = [], rawScope = []) {
  const localDrill = parseFilters(rawFilters);
  const scopeFilters = parseFilters(rawScope);
  const allFilters = dedupeFilters([...scopeFilters, ...localDrill]);
  const drillPath = FRAME_DRILL[frameId];
  if (!drillPath) {
    throw new Error(`Unknown analytics frame: ${frameId}`);
  }

  const frameStack = buildFrameStack(frameId, allFilters);
  const level = frameStack.length;
  const dimension = drillPath[Math.min(level, drillPath.length - 1)];
  const nextDimension = level < drillPath.length - 1 ? drillPath[level + 1] : null;
  const { where, params } = buildWhere(allFilters);

  const rows = queryDimension(dimension, where, params, frameId, level);
  const pickerRows =
    nextDimension && dimension !== "jobTitle"
      ? queryDimensionWithLimit(dimension, where, params, frameId, level, 500)
      : [];
  const summary = db
    .prepare(
      `SELECT COUNT(*) AS postings,
        SUM(CASE WHEN no_of_vacancies IS NOT NULL AND no_of_vacancies > 0 THEN no_of_vacancies ELSE 1 END) AS vacancies,
        SUM(COALESCE(applicant_count, 0)) AS applicants
       FROM ncs_jobs WHERE ${where}`
    )
    .get(params);

  const data = formatDatumRows(rows, dimension);
  const pickerOptions = formatDatumRows(pickerRows, dimension);

  const chartType = chartTypeFor(frameId, dimension, level);
  if (chartType === "bar" || chartType === "horizontalBar") {
    data.sort((a, b) => b.vacancies - a.vacancies);
    pickerOptions.sort((a, b) => b.vacancies - a.vacancies);
  }

  return {
    frameId,
    level,
    dimension,
    nextDimension,
    drillable: Boolean(nextDimension) && data.length > 0 && dimension !== "jobTitle",
    chartType,
    title: buildTitle(frameId, dimension, frameStack),
    hint: FRAME_META[frameId]?.hint,
    breadcrumb: buildBreadcrumb(frameId, frameStack),
    filters: frameStack,
    summary: {
      postings: summary?.postings ?? 0,
      vacancies: summary?.vacancies ?? 0,
      applicants: summary?.applicants ?? 0,
    },
    data,
    pickerOptions,
  };
}

function formatMonth(key) {
  if (!key || key.length < 7) return key;
  const [y, m] = key.split("-");
  const d = new Date(Number(y), Number(m) - 1, 1);
  return d.toLocaleDateString("en-IN", { month: "short", year: "numeric" });
}

function listNcsFrames() {
  return Object.keys(FRAME_META).map((id) => ({ id, ...FRAME_META[id] }));
}

function toRankings(items, metric, limit = TOP_N) {
  return [...items]
    .sort((a, b) => b[metric] - a[metric])
    .slice(0, limit)
    .map((item) => ({
      name: item.name || item.key,
      postings: item.postings,
      vacancies: item.vacancies,
      applicants: item.applicants,
      value: item[metric],
    }));
}

function getNcsScopedStats(rawScope = []) {
  const scopeFilters = parseFilters(rawScope);
  const { where, params } = buildWhere(scopeFilters);

  const summary = db
    .prepare(
      `SELECT COUNT(*) AS totalPostings,
        SUM(CASE WHEN no_of_vacancies IS NOT NULL AND no_of_vacancies > 0 THEN no_of_vacancies ELSE 1 END) AS totalVacancies,
        SUM(COALESCE(applicant_count, 0)) AS totalApplicants,
        COUNT(DISTINCT NULLIF(organization_name, '')) AS employers
       FROM ncs_jobs WHERE ${where}`
    )
    .get(params);

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const newThisWeek = db
    .prepare(
      `SELECT COUNT(*) AS c FROM ncs_jobs
       WHERE ${where} AND published_at >= @since`
    )
    .get({ ...params, since: sevenDaysAgo.toISOString() }).c;

  const stateRows = queryStateNormalized(where, params).map((row) => ({
    key: row.key,
    name: row.key,
    postings: row.postings,
    vacancies: row.vacancies,
    applicants: row.applicants,
  }));
  const industryRows = queryIndustryBuckets(where, params).map((row) => ({
    key: row.key,
    name: row.key,
    postings: row.postings,
    vacancies: row.vacancies,
    applicants: row.applicants,
  }));

  const lastSync = db
    .prepare("SELECT synced_at, job_count, status FROM ncs_sync_log ORDER BY id DESC LIMIT 1")
    .get();

  return {
    total: summary.totalPostings ?? 0,
    totalPostings: summary.totalPostings ?? 0,
    totalVacancies: summary.totalVacancies ?? 0,
    totalApplicants: summary.totalApplicants ?? 0,
    statesCovered: stateRows.length,
    employers: summary.employers ?? 0,
    newThisWeek,
    topIndustriesByPostings: toRankings(industryRows, "postings"),
    topIndustriesByVacancies: toRankings(industryRows, "vacancies"),
    topIndustriesByApplicants: toRankings(industryRows, "applicants"),
    topStatesByVacancies: toRankings(stateRows, "vacancies"),
    topCities: [],
    topFunctionalAreas: [],
    jobTypes: [],
    sectorBreakdown: [],
    lastSync: lastSync || null,
  };
}

module.exports = { getNcsFrameAnalytics, getNcsScopedStats, listNcsFrames };
