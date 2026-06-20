const express = require("express");
const cors = require("cors");
const signale = require("signale");
const dotenv = require("dotenv");
const freejobalert = require("./routes/freejobalert/route");
const api = require("./routes/api/route");
const { startCron } = require("./services/cron");
const { syncState } = require("./services/ingestion");
const { syncInvestUp } = require("./services/investIngestion");
const { syncAuthenticData, loadScrapedCache } = require("./services/recommendationSync");

dotenv.config();

const app = express();
const log = signale.scope("server:global");
const DEFAULT_STATE = process.env.DEFAULT_STATE || "UP";
const PORT = process.env.PORT || 3000;

function resolveCorsOrigin() {
  const raw = process.env.CORS_ORIGIN || "*";
  if (raw === "*") return "*";

  const allowed = raw
    .split(",")
    .map((o) => o.trim().replace(/\/$/, ""))
    .filter(Boolean);

  return (origin, callback) => {
    if (!origin) return callback(null, true);
    const normalized = origin.replace(/\/$/, "");
    if (allowed.includes(normalized)) return callback(null, true);
    callback(new Error(`CORS blocked for origin: ${origin}`));
  };
}

app.use(
  cors({
    origin: resolveCorsOrigin(),
  })
);
app.use(express.json());

app.get("/", (req, res) => {
  res.status(200).json({
    name: "jobful-api",
    version: "1.2.0",
    endpoints: {
      dashboard: "/api/jobs?state=UP",
      stats: "/api/stats?state=UP",
      states: "/api/states",
      sync: "POST /api/sync?state=UP",
      investments: "/api/investments/predictions?state=UP",
      investSync: "POST /api/investments/sync",
      aiRecommendations: "/api/ai-recommendations",
      aiSync: "POST /api/ai-recommendations/sync",
      growthReport: "/api/growth/report",
      legacy: "/freejobalert/gov/state/UP",
    },
  });
});

app.use("/api", api);
app.use("/freejobalert", freejobalert);

app.all("*", (req, res) => {
  log.error("Invalid URL");
  res.status(404).json({ err: "404 Invalid URL" });
});

async function runStartupSyncs() {
  if (process.env.SKIP_STARTUP_SYNC === "true") return;

  try {
    log.info(`Initial sync for ${DEFAULT_STATE}...`);
    await syncState(DEFAULT_STATE);
  } catch (err) {
    log.warn(`Startup sync failed: ${err.message}`);
  }
  try {
    log.info("Initial Invest UP sector sync…");
    await syncInvestUp();
  } catch (err) {
    log.warn(`Invest UP startup sync failed: ${err.message}`);
  }
  if (!loadScrapedCache()) {
    try {
      log.info("Initial authentic recommendations sync (no cache found)…");
      await syncAuthenticData();
    } catch (err) {
      log.warn(`Authentic data startup sync failed: ${err.message}`);
    }
  }
}

async function bootstrap() {
  startCron();

  const server = app.listen(PORT, () => {
    log.watch(`listening on port ${PORT}`);
  });

  server.on("error", (err) => {
    if (err.code === "EADDRINUSE") {
      log.error(`Port ${PORT} is already in use — stop the other API process first:`);
      log.error(`  lsof -i :${PORT}   then   kill <PID>`);
      log.error(`Or use: fuser -k ${PORT}/tcp`);
      process.exit(1);
    }
    throw err;
  });

  // Serve API immediately; long-running scrapes must not block the dashboard.
  void runStartupSyncs().catch((err) => log.warn(`Background startup sync error: ${err.message}`));
}

if (require.main === module) {
  bootstrap();
}

module.exports = app;
