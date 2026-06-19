const signale = require("signale");
const { scrapeAllNcsJobs, fetchFilterOptions } = require("../customModules/ncs/jobScraper");
const {
  upsertNcsJobs,
  logNcsSync,
  saveNcsFilterOptions,
} = require("../db/database");

const log = signale.scope("ncs-sync");

async function syncNcsJobs(options = {}) {
  const maxPages = options.maxPages ?? (process.env.NCS_SYNC_MAX_PAGES ? Number(process.env.NCS_SYNC_MAX_PAGES) : null);

  log.info("Starting NCS national job sync");

  try {
    let filterOptions = null;
    try {
      filterOptions = await fetchFilterOptions();
      saveNcsFilterOptions(filterOptions);
      log.info("Saved NCS filter options");
    } catch (err) {
      log.warn(`NCS filter-options fetch failed: ${err.message}`);
    }

    const { jobs, meta } = await scrapeAllNcsJobs({
      maxPages,
      onProgress: ({ page, totalPages, fetched, totalElements }) => {
        if (page % 25 === 0 || page === totalPages) {
          log.info(`Progress: page ${page}/${totalPages}, ${fetched}/${totalElements} jobs`);
        }
      },
    });

    if (!jobs.length) {
      logNcsSync(0, "error", "No jobs returned from NCS");
      return { status: "error", count: 0, message: "No jobs returned from NCS", meta };
    }

    const result = upsertNcsJobs(jobs);
    logNcsSync(result.count, "success");
    log.success(`Synced ${result.count} NCS jobs (${meta.totalAvailable} available nationally)`);

    return {
      status: "success",
      count: result.count,
      scrapedAt: result.scrapedAt,
      totalAvailable: meta.totalAvailable,
      filterOptionsSaved: Boolean(filterOptions),
      meta,
    };
  } catch (err) {
    logNcsSync(0, "error", err.message);
    log.error(`NCS sync failed: ${err.message}`);
    throw err;
  }
}

module.exports = { syncNcsJobs };
