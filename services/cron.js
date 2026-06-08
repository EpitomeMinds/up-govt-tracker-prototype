const cron = require("node-cron");
const signale = require("signale");
const { syncState } = require("./ingestion");

const log = signale.scope("cron");
const DEFAULT_STATE = process.env.DEFAULT_STATE || "UP";
const CRON_SCHEDULE = process.env.SYNC_CRON || "0 */4 * * *";

let task = null;

function startCron() {
  if (process.env.DISABLE_CRON === "true") {
    log.warn("Cron disabled via DISABLE_CRON=true");
    return;
  }

  task = cron.schedule(CRON_SCHEDULE, async () => {
    log.info(`Scheduled sync for ${DEFAULT_STATE}`);
    try {
      await syncState(DEFAULT_STATE);
    } catch (err) {
      log.error(err.message);
    }
  });

  log.success(`Cron scheduled: ${CRON_SCHEDULE} (state: ${DEFAULT_STATE})`);
}

function stopCron() {
  if (task) task.stop();
}

module.exports = { startCron, stopCron };
