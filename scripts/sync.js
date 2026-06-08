require("dotenv").config();
const { syncState, syncAllStates } = require("../services/ingestion");

async function main() {
  const syncAll = process.argv.includes("--all");
  const stateArg = process.argv.find((a) => a.startsWith("--state="));
  const state = stateArg ? stateArg.split("=")[1] : process.env.DEFAULT_STATE || "UP";

  if (syncAll) {
    const results = await syncAllStates();
    console.log(JSON.stringify(results, null, 2));
    return;
  }

  const result = await syncState(state);
  console.log(JSON.stringify(result, null, 2));
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
