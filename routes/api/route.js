const express = require("express");
const signale = require("signale");
const stateCodes = require("../../data/freeJobAlertStateMap.json");
const {
  queryJobs,
  getStats,
  getInvestmentSectors,
  getInvestmentSyncMeta,
  getActiveJobsForState,
} = require("../../db/database");
const { syncState, syncAllStates } = require("../../services/ingestion");
const { syncInvestUp } = require("../../services/investIngestion");
const { generateInvestmentPredictions } = require("../../services/investmentPrediction");
const { getAiRecommendations, getRecommendationById } = require("../../services/aiRecommendations");

const router = express.Router();
const log = signale.scope("api");

router.get("/states", (req, res) => {
  res.json(stateCodes);
});

router.get("/jobs", (req, res) => {
  const {
    state = "UP",
    board,
    q,
    sort = "post_date",
    order = "desc",
    page = "1",
    limit = "50",
  } = req.query;

  const result = queryJobs({
    stateCode: String(state).toUpperCase(),
    board: board || undefined,
    q: q || undefined,
    sort,
    order,
    page,
    limit,
  });

  res.json(result);
});

router.get("/stats", (req, res) => {
  const stateCode = String(req.query.state || "UP").toUpperCase();
  res.json(getStats(stateCode));
});

router.post("/sync", async (req, res) => {
  const state = req.query.state || req.body?.state || "UP";
  const syncAll = req.query.all === "true" || req.body?.all === true;
  const syncInvest = req.query.invest === "true" || req.body?.invest === true;

  try {
    const results = {};

    if (syncAll) {
      results.jobs = await syncAllStates();
    } else {
      results.jobs = await syncState(String(state).toUpperCase());
    }

    if (syncInvest) {
      try {
        results.investments = await syncInvestUp();
      } catch (investErr) {
        results.investments = { status: "error", message: investErr.message };
      }
    }

    res.json({ ok: true, ...results });
  } catch (err) {
    log.error(err.message);
    res.status(500).json({ ok: false, error: err.message });
  }
});

router.get("/investments/sectors", (req, res) => {
  const sectors = getInvestmentSectors();
  const meta = getInvestmentSyncMeta();
  res.json({ sectors, meta });
});

router.get("/investments/predictions", async (req, res) => {
  const stateCode = String(req.query.state || "UP").toUpperCase();
  let sectors = getInvestmentSectors();

  if (sectors.length === 0) {
    try {
      await syncInvestUp();
      sectors = getInvestmentSectors();
    } catch (err) {
      return res.status(503).json({
        error: "Investment sector data unavailable",
        detail: err.message,
      });
    }
  }

  const jobs = getActiveJobsForState(stateCode);
  const predictions = generateInvestmentPredictions(sectors, jobs);
  const meta = getInvestmentSyncMeta();

  res.json({ ...predictions, meta, stateCode });
});

router.post("/investments/sync", async (req, res) => {
  try {
    const result = await syncInvestUp();
    res.json({ ok: true, ...result });
  } catch (err) {
    log.error(err.message);
    res.status(500).json({ ok: false, error: err.message });
  }
});

router.get("/ai-recommendations", (req, res) => {
  try {
    const {
      priority,
      sector,
      region,
      department,
      boardCategory,
      status,
      actionType,
      startYear,
      q,
    } = req.query;
    const data = getAiRecommendations({
      priority: priority || undefined,
      sector: sector || undefined,
      region: region || undefined,
      department: department || undefined,
      boardCategory: boardCategory || undefined,
      status: status || undefined,
      actionType: actionType || undefined,
      startYear: startYear || undefined,
      q: q || undefined,
    });
    res.json(data);
  } catch (err) {
    log.error(err.message);
    res.status(500).json({ error: err.message });
  }
});

router.get("/ai-recommendations/:id", (req, res) => {
  try {
    const item = getRecommendationById(req.params.id);
    if (!item) return res.status(404).json({ error: "Not found" });
    res.json(item);
  } catch (err) {
    log.error(err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
