const signale = require("signale");
const { scrapeInvestUpSectors } = require("../customModules/investup/scraper");
const { upsertInvestmentSectors, logInvestmentSync } = require("../db/database");

const log = signale.scope("ingestion:investup");

async function syncInvestUp() {
  log.info("Syncing Invest UP sector data…");

  try {
    const { sectors, meta } = await scrapeInvestUpSectors();
    const result = upsertInvestmentSectors(sectors, meta);
    logInvestmentSync(result.count, "success", meta.source);
    log.success(`Synced ${result.count} investment sectors from ${meta.source}`);
    return { ...result, meta };
  } catch (err) {
    logInvestmentSync(0, "error", err.message);
    log.error(`Invest UP sync failed: ${err.message}`);
    throw err;
  }
}

module.exports = { syncInvestUp };
