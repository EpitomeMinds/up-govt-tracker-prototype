const signale = require("signale");
const { smartScraper } = require("../customModules/freejobalerts/scraper");
const stateCodes = require("../data/freeJobAlertStateMap.json");
const { upsertJobs, logSync } = require("../db/database");
const { resolveNoticeLinksForJobs } = require("./noticeLinkResolver");

const log = signale.scope("ingestion");

async function syncState(stateCode) {
  const code = stateCode.toUpperCase();
  const state = stateCodes.find((s) => s.code === code);

  if (!state) {
    throw new Error(`Unknown state code: ${stateCode}`);
  }

  log.info(`Syncing ${state.name} (${code}) from ${state.link}`);

  try {
    const jobs = await smartScraper(state.link, `Govt. jobs for ${state.name}`);
    log.info(`Resolving official notice links for ${jobs.length} jobs…`);
    const jobsWithLinks = await resolveNoticeLinksForJobs(jobs);
    const result = upsertJobs(code, jobsWithLinks);
    logSync(code, result.count, "success");
    log.success(`Synced ${result.count} jobs for ${code}`);
    return { stateCode: code, stateName: state.name, ...result };
  } catch (err) {
    logSync(code, 0, "error", err.message);
    log.error(`Sync failed for ${code}: ${err.message}`);
    throw err;
  }
}

async function syncAllStates() {
  const results = [];
  for (const state of stateCodes) {
    try {
      const result = await syncState(state.code);
      results.push({ ...result, status: "success" });
    } catch (err) {
      results.push({
        stateCode: state.code,
        status: "error",
        message: err.message,
      });
    }
  }
  return results;
}

module.exports = { syncState, syncAllStates };
