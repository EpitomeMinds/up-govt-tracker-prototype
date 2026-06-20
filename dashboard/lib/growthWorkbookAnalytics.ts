import type { InvestmentPredictionsResponse } from "./investmentTypes";
import { GEO_STATE_NAMES } from "./indiaStateNormalize";

export type GrowthFrameId =
  | "geography"
  | "sectors"
  | "forecast"
  | "vacancyGap"
  | "skills"
  | "heatmap";

export interface GrowthStateDatum {
  key: string;
  label: string;
  postings: number;
  vacancies: number;
  applicants: number;
  investmentCr: number;
}

export interface GrowthRankingRow {
  label: string;
  value: number;
  secondary?: number;
  meta?: string;
}

export interface GrowthFrameAnalytics {
  frameId: GrowthFrameId;
  title: string;
  hint: string;
  chartType: "bar" | "line" | "pie" | "map" | "heatmap-grid";
  rows: GrowthRankingRow[];
  stateMapData?: GrowthStateDatum[];
  heatmap?: { states: string[]; sectors: string[]; matrix: number[][] };
}

function readNum(value: unknown): number {
  if (typeof value === "number") return value;
  const parsed = Number(String(value ?? "").replace(/[^0-9.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

const STATE_ALIASES: Record<string, string> = {
  "Delhi-NCR": "Delhi",
  "Delhi NCR": "Delhi",
  NCR: "Delhi",
};

function normalizeState(raw: string): string {
  const s = String(raw || "").trim();
  if (!s || /multi-state|pan-india/i.test(s)) return "";
  const alias = STATE_ALIASES[s] ?? s;
  if ((GEO_STATE_NAMES as readonly string[]).includes(alias)) return alias;
  if (alias.includes(",")) return normalizeState(alias.split(",")[0].trim());
  return alias;
}

function mainRows(data: InvestmentPredictionsResponse): Record<string, unknown>[] {
  return data.workbook?.sheets?.mainDataset ?? [];
}

function vacancyRows(data: InvestmentPredictionsResponse): Record<string, unknown>[] {
  return data.workbook?.sheets?.vacancyGapAnalysis ?? [];
}

function forecastRows(data: InvestmentPredictionsResponse): Record<string, unknown>[] {
  return data.workbook?.sheets?.jobForecast ?? [];
}

function truncate(label: string, max = 22): string {
  return label.length > max ? `${label.slice(0, max - 1)}…` : label;
}

function isHeatmapStateRow(raw: string): boolean {
  const s = String(raw || "").trim();
  if (!s || s.length > 48) return false;
  const lower = s.toLowerCase();
  if (lower.startsWith("index construction")) return false;
  if (lower.includes("recompute monthly") || lower.includes("darker red")) return false;
  return true;
}

function filterHeatmapRows(rows: Record<string, unknown>[]) {
  return rows.filter((r) => isHeatmapStateRow(String(r.State ?? r["State / Sector"] ?? "")));
}

export function buildGrowthStateMapData(
  data: InvestmentPredictionsResponse,
  filters?: { state?: string; sector?: string }
): GrowthStateDatum[] {
  const map = new Map<string, GrowthStateDatum>();

  for (const name of GEO_STATE_NAMES) {
    map.set(name, {
      key: name,
      label: name,
      postings: 0,
      vacancies: 0,
      applicants: 0,
      investmentCr: 0,
    });
  }

  for (const row of mainRows(data)) {
    const state = normalizeState(String(row.State ?? row.Region ?? ""));
    if (!state) continue;
    if (filters?.state && state !== filters.state) continue;
    if (filters?.sector) {
      const sector = String(row.Sector ?? row["Department / Industry"] ?? "");
      if (sector !== filters.sector) continue;
    }
    const entry = map.get(state);
    if (!entry) continue;
    const jobs = readNum(row["Projected Vacancies"]);
    entry.postings += 1;
    entry.vacancies += jobs;
    entry.investmentCr += readNum(row["Investment Value (INR Cr)"]);
  }

  for (const row of vacancyRows(data)) {
    const state = normalizeState(String(row.State ?? ""));
    if (!state) continue;
    if (filters?.state && state !== filters.state) continue;
    if (filters?.sector && String(row.Sector ?? "") !== filters.sector) continue;
    const entry = map.get(state);
    if (!entry) continue;
    entry.applicants += readNum(row["Annual Skilled-Talent Supply"]);
    entry.vacancies += readNum(row["Total Projected Demand (12-mo)"]);
  }

  // Hiring heatmap matrix — composite intensity per state (Excel diagram)
  for (const row of filterHeatmapRows(data.workbook?.sheets?.hiringHeatmap ?? [])) {
    const raw = String(row.State ?? row["State / Sector"] ?? "").trim();
    const state = raw === "Delhi-NCR" ? "Delhi" : normalizeState(raw);
    if (!state || !map.has(state)) continue;
    const intensity = Object.keys(row)
      .filter((k) => k !== "State" && k !== "State / Sector")
      .reduce((sum, k) => sum + readNum(row[k]), 0);
    const entry = map.get(state)!;
    entry.vacancies += Math.round(intensity * 50);
    entry.postings += 1;
  }

  return Array.from(map.values()).filter(
    (r) => r.vacancies > 0 || r.postings > 0 || r.investmentCr > 0
  );
}

export function buildGrowthDashboardKpis(data: InvestmentPredictionsResponse) {
  const dash = data.workbook?.sheets?.dashboardKpis;
  const pipeline = mainRows(data);
  const vacancy = vacancyRows(data);
  const forecast = forecastRows(data);

  return {
    pliJobs: dash?.pliJobsCumulative ?? 0,
    fdiUsdBn: dash?.fdiInflowUsdBn ?? 0,
    startupFundingUsdBn: dash?.startupFundingUsdBn ?? 0,
    pipelineInvestmentCr:
      dash?.trackedPipelineInvestmentCr ??
      data.summary.totalInvestmentCr ??
      pipeline.reduce((s, r) => s + readNum(r["Investment Value (INR Cr)"]), 0),
    projectedJobs12m:
      forecast.reduce((s, r) => s + readNum(r["12-Month Jobs"]), 0) ||
      data.summary.totalPredicted12m,
    totalSkillGap: vacancy.reduce((s, r) => s + readNum(r["Net Vacancy Gap"]), 0),
    projectCount: pipeline.length,
    sectorCount: data.summary.sectorCount,
    stateCount: new Set(pipeline.map((r) => normalizeState(String(r.State ?? ""))).filter(Boolean)).size,
    forecastHorizons: dash?.forecastHorizons ?? [],
    topStates: dash?.topStatesByIntensity ?? [],
  };
}

function aggregateByKey(
  rows: Record<string, unknown>[],
  key: string,
  valueKey: string,
  limit = 8
): GrowthRankingRow[] {
  const map = new Map<string, { value: number; secondary: number; meta: string }>();
  for (const row of rows) {
    const label = String(row[key] ?? "Unknown").trim() || "Unknown";
    const existing = map.get(label) ?? { value: 0, secondary: 0, meta: label };
    existing.value += readNum(row[valueKey]);
    map.set(label, existing);
  }
  return Array.from(map.entries())
    .sort((a, b) => b[1].value - a[1].value)
    .slice(0, limit)
    .map(([label, v]) => ({ label: truncate(label), value: v.value, meta: label }));
}

export function getGrowthFrameAnalytics(
  data: InvestmentPredictionsResponse,
  frameId: GrowthFrameId,
  filters: { state?: string; sector?: string; subSector?: string } = {}
): GrowthFrameAnalytics {
  let rows = mainRows(data);
  let vacancy = vacancyRows(data);
  let forecast = forecastRows(data);

  if (filters.state) {
    rows = rows.filter((r) => normalizeState(String(r.State ?? "")) === filters.state);
    vacancy = vacancy.filter((r) => normalizeState(String(r.State ?? "")) === filters.state);
    forecast = forecast.filter((r) => normalizeState(String(r.State ?? "")) === filters.state);
  }
  if (filters.sector) {
    rows = rows.filter(
      (r) => String(r.Sector ?? r["Department / Industry"] ?? "") === filters.sector
    );
    vacancy = vacancy.filter((r) => String(r.Sector ?? "") === filters.sector);
    forecast = forecast.filter((r) => String(r.Sector ?? "") === filters.sector);
  }
  if (filters.subSector) {
    rows = rows.filter((r) => String(r["Sub-Sector"] ?? "") === filters.subSector);
  }

  switch (frameId) {
    case "geography":
      return {
        frameId,
        title: "Geography",
        hint: "India heat map · click state → cities → sectors",
        chartType: "map",
        rows: [],
        stateMapData: buildGrowthStateMapData(data, filters),
      };
    case "sectors":
      return {
        frameId,
        title: "Top sectors by pipeline jobs",
        hint: "Sector → sub-sector → projects",
        chartType: "bar",
        rows: aggregateByKey(rows, "Sector", "Projected Vacancies"),
      };
    case "forecast":
      return {
        frameId,
        title: "12-month job forecast",
        hint: "By sector and state",
        chartType: "bar",
        rows: forecast
          .map((r) => ({
            label: truncate(`${r.Sector} · ${r.State}`),
            value: readNum(r["12-Month Jobs"]),
            meta: `${r.Sector}|${r.State}`,
          }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 8),
      };
    case "vacancyGap":
      return {
        frameId,
        title: "Vacancy gap by sector",
        hint: "Demand vs supply · click to drill projects",
        chartType: "bar",
        rows: aggregateByKey(vacancy, "Sector", "Net Vacancy Gap"),
      };
    case "skills": {
      const skills = data.workbook?.sheets?.skillDemandForecast ?? [];
      return {
        frameId,
        title: "Skills & roles demand",
        hint: "Top skills and roles by demand",
        chartType: "pie",
        rows: skills
          .map((r) => {
            const label = String(
              r["Role / Skill Cluster"] ?? Object.values(r).find((v) => typeof v === "string" && String(v).includes("/")) ?? ""
            );
            const yoy = Object.entries(r).find(([k]) => k.toLowerCase().includes("yoy"))?.[1];
            return {
              label: truncate(label),
              value: readNum(yoy) || 1,
              meta: label,
            };
          })
          .filter((r) => r.label)
          .slice(0, 8),
      };
    }
    case "heatmap": {
      const heat = filterHeatmapRows(data.workbook?.sheets?.hiringHeatmap ?? []);
      const sectorCols = heat[0]
        ? Object.keys(heat[0]).filter((k) => k !== "State" && k !== "State / Sector")
        : [];
      const states = heat.map((r) => String(r.State ?? r["State / Sector"] ?? ""));
      const matrix = heat.map((r) => sectorCols.map((c) => readNum(r[c])));
      return {
        frameId,
        title: "Hiring intensity heatmap",
        hint: "State × sector matrix",
        chartType: "heatmap-grid",
        rows: states.slice(0, 5).map((state, i) => ({
          label: state,
          value: matrix[i]?.reduce((s, v) => s + v, 0) ?? 0,
        })),
        heatmap: { states, sectors: sectorCols.map((c) => truncate(c, 16)), matrix },
      };
    }
    default:
      return {
        frameId: "sectors",
        title: "Sectors",
        hint: "",
        chartType: "bar",
        rows: [],
      };
  }
}

export function parseGrowthDrillMeta(meta?: string): { sector?: string; state?: string } {
  if (!meta) return {};
  if (meta.includes("|")) {
    const [sector, state] = meta.split("|");
    return { sector: sector.trim(), state: normalizeState(state) };
  }
  return { sector: meta.trim() };
}
