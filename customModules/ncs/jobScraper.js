const signale = require("signale");

const log = signale.scope("scraper:ncs-jobs");

const NCS_API = "https://betacloud.ncs.gov.in/api";
const NCS_JOB_LISTING = "https://betacloud.ncs.gov.in/job-listing";
const SEARCH_URL = `${NCS_API}/v1/job-posts/search`;
const FILTER_OPTIONS_URL = `${NCS_API}/v1/job-posts/filter-options`;

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

const DEFAULT_PAGE_SIZE = 50;
const REQUEST_DELAY_MS = Number(process.env.NCS_REQUEST_DELAY_MS || 120);

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function jobDetailUrl(jobId) {
  return `${NCS_JOB_LISTING}/applying/${jobId}`;
}

function normalizeJob(raw) {
  const primary =
    raw.jobLocations?.find((loc) => loc.isPrimary) || raw.jobLocations?.[0] || null;

  return {
    id: raw.id,
    jobTitle: raw.jobTitle?.trim() || "",
    organizationName: raw.organizationName?.trim() || "",
    functionalArea: raw.functionalArea || "",
    functionalRole: raw.functionalState || "",
    industry: raw.industry || "",
    jobType: raw.jobType || "",
    jobDescription: raw.jobDescription || "",
    requiredSkills: raw.requiredSkills || [],
    city: primary?.city || "",
    state: primary?.state || "",
    locations: raw.jobLocations || [],
    minExperience: raw.minExperience ?? null,
    maxExperience: raw.maxExperience ?? null,
    minSalary: raw.minSalary ?? null,
    maxSalary: raw.maxSalary ?? null,
    hideSalaryRange: Boolean(raw.hideSalaryRange),
    noOfVacancies: raw.noOfVacancies ?? null,
    applicantCount: raw.applicantCount ?? 0,
    genderPreference: raw.genderPreference || "",
    isGovernmentJob: Boolean(raw.isGovernmentJob),
    publishedAt: raw.publishedAt || raw.createdAt || "",
    expiredAt: raw.expiredAt || "",
    createdAt: raw.createdAt || "",
    link: jobDetailUrl(raw.id),
  };
}

async function fetchFilterOptions() {
  const response = await fetch(FILTER_OPTIONS_URL, {
    headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
    signal: AbortSignal.timeout(20000),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} for filter-options`);
  }

  const payload = await response.json();
  if (payload.status !== "SUCCESS" || !payload.data) {
    throw new Error(payload.message || "Failed to load NCS filter options");
  }

  return payload.data;
}

async function searchJobsPage(page, size = DEFAULT_PAGE_SIZE, filters = {}) {
  const body = { sortBy: "NEWEST", ...filters };
  const url = `${SEARCH_URL}?page=${page}&size=${size}`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "User-Agent": USER_AGENT,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(30000),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} for page ${page}`);
  }

  const payload = await response.json();
  if (payload.status !== "SUCCESS" || !payload.data) {
    throw new Error(payload.message || `Search failed on page ${page}`);
  }

  return payload.data;
}

async function scrapeAllNcsJobs(options = {}) {
  const pageSize = options.pageSize || DEFAULT_PAGE_SIZE;
  const maxPages = options.maxPages ?? null;
  const onProgress = options.onProgress || null;

  let page = 0;
  let totalPages = 1;
  let totalElements = 0;
  const allJobs = [];
  const seenIds = new Set();

  log.info("Fetching all NCS jobs nationally (no location filter)");

  while (page < totalPages) {
    if (maxPages != null && page >= maxPages) break;

    const data = await searchJobsPage(page, pageSize);
    totalElements = data.totalElements || totalElements;
    totalPages = data.totalPages || totalPages;

    const batch = (data.content || []).map(normalizeJob).filter((job) => {
      if (!job.id || seenIds.has(job.id)) return false;
      seenIds.add(job.id);
      return true;
    });

    allJobs.push(...batch);

    if (onProgress) {
      onProgress({
        page: page + 1,
        totalPages,
        totalElements,
        fetched: allJobs.length,
      });
    }

    log.info(`Page ${page + 1}/${totalPages} — ${allJobs.length}/${totalElements} jobs`);

    page += 1;
    if (page < totalPages) await sleep(REQUEST_DELAY_MS);
  }

  log.success(`NCS jobs: fetched ${allJobs.length} of ${totalElements} available`);

  return {
    jobs: allJobs,
    meta: {
      source: allJobs.length > 0 ? "ncs_live" : "ncs_failed",
      scrapedAt: new Date().toISOString(),
      portalUrl: NCS_JOB_LISTING,
      totalAvailable: totalElements,
      totalFetched: allJobs.length,
      pageSize,
    },
  };
}

module.exports = {
  scrapeAllNcsJobs,
  fetchFilterOptions,
  normalizeJob,
  NCS_JOB_LISTING,
  SEARCH_URL,
};
