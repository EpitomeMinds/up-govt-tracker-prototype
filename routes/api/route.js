const express = require("express");
const signale = require("signale");
const stateCodes = require("../../data/freeJobAlertStateMap.json");
const {
  queryJobs,
  getStats,
  getInvestmentSectors,
  getInvestmentSyncMeta,
  getActiveJobsForState,
  queryNcsJobs,
  getNcsStats,
  getNcsFilterOptions,
  getNcsFacets,
  getNcsScopedFacets,
} = require("../../db/database");
const { syncState, syncAllStates } = require("../../services/ingestion");
const { syncInvestUp } = require("../../services/investIngestion");
const { syncNcsJobs } = require("../../services/ncsJobSync");
const {
  getNcsFrameAnalytics,
  getNcsScopedStats,
  listNcsFrames,
} = require("../../services/ncsAnalytics");
const { generateInvestmentPredictions } = require("../../services/investmentPrediction");
const { getAiRecommendations, getRecommendationById, reloadData } = require("../../services/aiRecommendations");
const { getGrowthReport, reloadGrowthReport } = require("../../services/growthReport");
const { syncAuthenticData, loadScrapedCache } = require("../../services/recommendationSync");

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

router.get("/ncs/jobs", (req, res) => {
  const {
    q,
    city,
    state,
    jobType,
    functionalArea,
    industry,
    organization,
    functionalRole,
    jobTitle,
    salaryBand,
    experienceBand,
    minSalary,
    maxSalary,
    minExperience,
    maxExperience,
    sort = "published_at",
    order = "desc",
    page = "1",
    limit = "50",
  } = req.query;

  const result = queryNcsJobs({
    q: q || undefined,
    city: city || undefined,
    state: state || undefined,
    jobType: jobType || undefined,
    functionalArea: functionalArea || undefined,
    industry: industry || undefined,
    organization: organization || undefined,
    functionalRole: functionalRole || undefined,
    jobTitle: jobTitle || undefined,
    salaryBand: salaryBand || undefined,
    experienceBand: experienceBand || undefined,
    minSalary: minSalary || undefined,
    maxSalary: maxSalary || undefined,
    minExperience: minExperience || undefined,
    maxExperience: maxExperience || undefined,
    sort,
    order,
    page,
    limit,
  });

  res.json(result);
});

router.get("/ncs/stats", (req, res) => {
  if (req.query.scope) {
    try {
      res.json(getNcsScopedStats(req.query.scope));
      return;
    } catch (err) {
      log.error(err.message);
      res.status(400).json({ error: err.message });
      return;
    }
  }
  res.json(getNcsStats());
});

router.get("/ncs/facets", (req, res) => {
  const cached = getNcsFilterOptions();
  const facets = getNcsFacets();
  res.json({
    facets,
    filterOptions: cached?.data || null,
    scrapedAt: cached?.scrapedAt || null,
  });
});

router.get("/ncs/facets/scoped", (req, res) => {
  const {
    q,
    city,
    state,
    jobType,
    functionalArea,
    industry,
    organization,
    functionalRole,
    jobTitle,
    salaryBand,
    experienceBand,
    minSalary,
    maxSalary,
    minExperience,
    maxExperience,
  } = req.query;

  res.json(
    getNcsScopedFacets({
      q: q || undefined,
      city: city || undefined,
      state: state || undefined,
      jobType: jobType || undefined,
      functionalArea: functionalArea || undefined,
      industry: industry || undefined,
      organization: organization || undefined,
      functionalRole: functionalRole || undefined,
      jobTitle: jobTitle || undefined,
      salaryBand: salaryBand || undefined,
      experienceBand: experienceBand || undefined,
      minSalary: minSalary || undefined,
      maxSalary: maxSalary || undefined,
      minExperience: minExperience || undefined,
      maxExperience: maxExperience || undefined,
    })
  );
});

router.get("/ncs/analytics/frames", (req, res) => {
  res.json({ frames: listNcsFrames() });
});

router.get("/ncs/analytics/frame/:frameId", (req, res) => {
  try {
    const result = getNcsFrameAnalytics(
      req.params.frameId,
      req.query.filters,
      req.query.scope
    );
    res.json(result);
  } catch (err) {
    log.error(err.message);
    res.status(400).json({ error: err.message });
  }
});

router.post("/ncs/sync", async (req, res) => {
  try {
    const maxPages = req.query.maxPages || req.body?.maxPages;
    const result = await syncNcsJobs({
      maxPages: maxPages != null ? Number(maxPages) : undefined,
    });
    res.json({ ok: true, ...result });
  } catch (err) {
    log.error(err.message);
    res.status(500).json({ ok: false, error: err.message });
  }
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

  try {
    const growthReport = getGrowthReport();
    const meta = getInvestmentSyncMeta();
    return res.json({
      ...growthReport,
      stateCode,
      meta: {
        ...growthReport.meta,
        lastSync: meta?.lastSync ?? null,
        sectorCount: growthReport.sectors?.length ?? 0,
      },
    });
  } catch (growthErr) {
    log.warn(`Growth report unavailable (${growthErr.message}), falling back to live predictions`);
  }

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

router.get("/ai-recommendations/sources", (req, res) => {
  try {
    const cache = loadScrapedCache();
    if (!cache) {
      return res.status(404).json({ error: "No scraped source cache — run POST /api/ai-recommendations/sync first" });
    }
    res.json(cache);
  } catch (err) {
    log.error(err.message);
    res.status(500).json({ error: err.message });
  }
});

router.post("/ai-recommendations/sync", async (req, res) => {
  try {
    const result = await syncAuthenticData();
    reloadData();
    reloadGrowthReport();
    res.json(result);
  } catch (err) {
    log.error(err.message);
    res.status(500).json({ ok: false, error: err.message });
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

router.get("/growth/report", (req, res) => {
  try {
    const report = getGrowthReport();
    res.json(report);
  } catch (err) {
    log.error(err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
