const signale = require("signale");
const { syncNcsJobs } = require("../services/ncsJobSync");

const log = signale.scope("sync:ncs");

async function main() {
  const maxPagesArg = process.argv.find((a) => a.startsWith("--max-pages="));
  const maxPages = maxPagesArg ? Number(maxPagesArg.split("=")[1]) : undefined;

  try {
    const result = await syncNcsJobs({ maxPages });
    log.success(`Done — ${result.count} jobs synced (${result.totalAvailable} available on NCS)`);
    process.exit(0);
  } catch (err) {
    log.error(err.message);
    process.exit(1);
  }
}

main();
