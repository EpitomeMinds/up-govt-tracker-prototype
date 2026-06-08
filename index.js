const express = require("express");
const cors = require("cors");
const signale = require("signale");
const dotenv = require("dotenv");
const freejobalert = require("./routes/freejobalert/route");
const api = require("./routes/api/route");
const { startCron } = require("./services/cron");
const { syncState } = require("./services/ingestion");
const { syncInvestUp } = require("./services/investIngestion");

dotenv.config();

const app = express();
const log = signale.scope("server:global");
const DEFAULT_STATE = process.env.DEFAULT_STATE || "UP";
const PORT = process.env.PORT || 3000;

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "*",
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

async function bootstrap() {
  if (process.env.SKIP_STARTUP_SYNC !== "true") {
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
  }

  startCron();

  app.listen(PORT, () => {
    log.watch(`listening on port ${PORT}`);
  });
}

if (require.main === module) {
  bootstrap();
}

module.exports = app;
