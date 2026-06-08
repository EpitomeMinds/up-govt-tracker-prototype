const { db } = require("../db/database");

function countVacancyMatches(jobs, keywords) {
  let listings = 0;
  let vacancies = 0;

  for (const job of jobs) {
    const haystack = [
      job.post_name,
      job.post_board,
      job.qualification,
    ]
      .join(" ")
      .toLowerCase();

    const matched = keywords.some((kw) => haystack.includes(kw.toLowerCase()));
    if (!matched) continue;

    listings += 1;
    const countMatch = (job.post_name || "").match(/(\d+)\s*Posts?/i);
    vacancies += countMatch ? parseInt(countMatch[1], 10) : 1;
  }

  return { listings, vacancies };
}

function buildTimeline(baseMonthly, months, growthRate) {
  const points = [];
  let value = baseMonthly;

  for (let i = 0; i < months; i++) {
    const seasonal = 1 + Math.sin((i / months) * Math.PI * 2) * 0.08;
    const trend = 1 + (growthRate / 100) * (i / months);
    value = Math.round(baseMonthly * seasonal * trend);
    const d = new Date();
    d.setMonth(d.getMonth() + i);
    points.push({
      month: d.toLocaleDateString("en-IN", { month: "short", year: "2-digit" }),
      predicted: value,
    });
  }

  return points;
}

function buildRationale(sector, baseline, predicted6m, predicted12m, confidence, districtHotspots, typicalRoles) {
  const signalLabel =
    sector.investment_signal === "high"
      ? "strong government push"
      : sector.investment_signal === "medium"
        ? "steady policy support"
        : "moderate policy focus";

  const baselineNote =
    baseline.vacancies > 0
      ? `Current vacancy baseline of ${baseline.vacancies} posts across ${baseline.listings} listings provides a measurable demand anchor.`
      : "Limited current vacancy data suggests this sector is emerging — predictions lean on investment signals.";

  return [
    `Invest UP lists "${sector.name}" under active sectoral policies (${sector.policy || "state industrial policy"}), indicating ${signalLabel}.`,
    baselineNote,
    `With investment score ${sector.investment_score}/100 and growth multiplier ${sector.growth_multiplier}×, our model forecasts ~${predicted6m} openings in 6 months and ~${predicted12m} in 12 months (${confidence}% confidence).`,
    `Hotspots: ${districtHotspots.slice(0, 3).join(", ")}. Top roles: ${typicalRoles.slice(0, 3).join(", ")}.`,
  ].join(" ");
}

function computePredictions(sectors, jobs) {
  const totalBaselineVacancies = jobs.reduce((s, j) => {
    const m = (j.post_name || "").match(/(\d+)\s*Posts?/i);
    return s + (m ? parseInt(m[1], 10) : 1);
  }, 0);

  const avgBaseline = totalBaselineVacancies / Math.max(sectors.length, 1);

  return sectors.map((sector) => {
    const keywords = JSON.parse(sector.keywords || "[]");
    const baseline = countVacancyMatches(jobs, keywords);

    const investmentWeight = sector.investment_score / 100;
    const baselineVacancies = baseline.vacancies || Math.max(2, Math.round(avgBaseline * 0.15));
    const growthRate = Math.round((sector.growth_multiplier - 1) * 100);

    const predicted6m = Math.round(
      baselineVacancies * sector.growth_multiplier * (0.5 + investmentWeight * 0.5) * 1.8
    );
    const predicted12m = Math.round(predicted6m * (1 + growthRate / 200));

    const dataRichness = Math.min(1, baseline.listings / 5);
    const confidence = Math.round(
      55 + investmentWeight * 25 + dataRichness * 15 + (sector.live_on_site ? 5 : 0)
    );

    const monthlyBase = Math.max(1, Math.round(predicted12m / 12));
    const timeline = buildTimeline(monthlyBase, 12, growthRate);

    const typicalRoles = JSON.parse(sector.typical_roles || "[]");
    const educationDemand = JSON.parse(sector.education_demand || "{}");
    const districtHotspots = JSON.parse(sector.district_hotspots || "[]");

    const roleBreakdown = typicalRoles.map((role, i) => ({
      role,
      share: Math.round(100 / typicalRoles.length + (i === 0 ? 5 : 0)),
      predictedOpenings: Math.round(predicted12m / typicalRoles.length),
    }));

    return {
      id: sector.sector_id,
      name: sector.name,
      slug: sector.slug,
      policy: sector.policy,
      investmentSignal: sector.investment_signal,
      investmentScore: sector.investment_score,
      growthRate,
      growthMultiplier: sector.growth_multiplier,
      liveOnSite: !!sector.live_on_site,
      sourceUrl: sector.source_url,
      baseline: {
        listings: baseline.listings,
        vacancies: baseline.vacancies,
      },
      predictedOpenings6m: predicted6m,
      predictedOpenings12m: predicted12m,
      confidence: Math.min(95, confidence),
      timeline,
      typicalRoles: roleBreakdown,
      educationDemand,
      districtHotspots,
      aiRationale: buildRationale(
        sector,
        baseline,
        predicted6m,
        predicted12m,
        Math.min(95, confidence),
        districtHotspots,
        typicalRoles
      ),
      keywords,
    };
  });
}

function buildSummary(predictions) {
  const total6m = predictions.reduce((s, p) => s + p.predictedOpenings6m, 0);
  const total12m = predictions.reduce((s, p) => s + p.predictedOpenings12m, 0);
  const highGrowth = predictions.filter((p) => p.investmentSignal === "high").length;
  const avgConfidence = Math.round(
    predictions.reduce((s, p) => s + p.confidence, 0) / Math.max(predictions.length, 1)
  );

  const topSectors = [...predictions]
    .sort((a, b) => b.predictedOpenings12m - a.predictedOpenings12m)
    .slice(0, 5);

  return {
    sectorCount: predictions.length,
    totalPredicted6m: total6m,
    totalPredicted12m: total12m,
    highGrowthSectors: highGrowth,
    avgConfidence,
    topSectors: topSectors.map((s) => ({
      id: s.id,
      name: s.name,
      predicted12m: s.predictedOpenings12m,
      confidence: s.confidence,
    })),
  };
}

function generateInvestmentPredictions(sectors, jobs) {
  const predictions = computePredictions(sectors, jobs);
  predictions.sort((a, b) => b.predictedOpenings12m - a.predictedOpenings12m);

  return {
    generatedAt: new Date().toISOString(),
    model: "jobful-investment-v1",
    modelNote:
      "Forecasts combine Invest UP sector signals, policy weights, and current vacancy baselines using a heuristic AI scoring engine.",
    summary: buildSummary(predictions),
    sectors: predictions,
  };
}

module.exports = { generateInvestmentPredictions, countVacancyMatches };
