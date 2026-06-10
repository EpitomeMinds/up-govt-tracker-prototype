const { queryJobs } = require("../db/database");
const Database = require("better-sqlite3");
const path = require("path");
const { resolveNoticeLink } = require("./noticeLinkResolver");

const DB_PATH = process.env.DB_PATH || path.join(__dirname, "..", "data", "jobs.db");
const db = new Database(DB_PATH);
const updateLink = db.prepare("UPDATE jobs SET official_link = ? WHERE id = ?");

async function backfillOfficialLinks(stateCode = "UP", concurrency = 4) {
  const jobs = queryJobs({ stateCode, limit: 1000, activeOnly: true }).data;
  let updated = 0;

  for (let i = 0; i < jobs.length; i += concurrency) {
    const batch = jobs.slice(i, i + concurrency);
    await Promise.all(
      batch.map(async (job) => {
        if (job.official_link && !/freejobalert\.com/i.test(job.official_link)) return;

        const officialLink = (await resolveNoticeLink(job)) || "";
        if (officialLink && officialLink !== job.official_link) {
          updateLink.run(officialLink, job.id);
          updated += 1;
        }
      })
    );
    process.stdout.write(`\rResolved ${Math.min(i + concurrency, jobs.length)}/${jobs.length}`);
  }

  process.stdout.write("\n");
  return { total: jobs.length, updated };
}

if (require.main === module) {
  backfillOfficialLinks(process.argv[2] || "UP")
    .then((result) => {
      console.log(`Backfill complete: ${result.updated}/${result.total} jobs updated`);
      process.exit(0);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = { backfillOfficialLinks };
