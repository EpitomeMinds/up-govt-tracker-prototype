import type { InvestmentPredictionsResponse } from "./investmentTypes";
import { GEO_STATE_NAMES } from "./indiaStateNormalize";

export type GrowthFrameId = "geography" | "sectors" | "forecast" | "vacancyGap" | "heatmap";

export type GrowthDrillDimension =
  | "state"
  | "parentSector"
  | "subSector"
  | "pipelineSector"
  | "sectorState";

export interface GrowthDrillFilter {
  dimension: GrowthDrillDimension;
  value: string;
  label: string;
}

export interface GrowthDrillRow {
  key: string;
  label: string;
  investmentCr: number;
  jobs: number;
  gap: number;
  openRoles: number;
  yoyPct: number;
  meta?: string;
}

export interface GrowthFrameView {
  frameId: GrowthFrameId;
  title: string;
  hint: string;
  chartType: "map" | "bar" | "horizontalBar" | "heatmap" | "detail";
  drillable: boolean;
  dimension?: GrowthDrillDimension;
  breadcrumb: { level: number; label: string }[];
  summary: {
    investmentCr: number;
    jobs: number;
    gap: number;
    projects: number;
    openRoles: number;
  };
  rows: GrowthDrillRow[];
  /** All drill targets for the filter picker (top 5 + remaining). */
  pickerOptions?: GrowthDrillRow[];
  totalRowCount?: number;
  mapData?: Array<{
    key: string;
    label: string;
    postings: number;
    vacancies: number;
    applicants: number;
  }>;
  heatmap?: { states: string[]; sectors: string[]; matrix: number[][] };
  detail?: {
    kpis: { label: string; value: string }[];
    projects: Array<{ name: string; state: string; investmentCr: number; jobs: number; stage: string }>;
    insight?: string;
  };
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

function readNum(v: unknown): number {
  if (typeof v === "number") return v;
  const n = Number(String(v ?? "").replace(/[^0-9.-]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function col(row: Record<string, unknown>, ...needles: string[]): unknown {
  for (const [k, v] of Object.entries(row)) {
    const kl = k.toLowerCase();
    if (needles.every((n) => kl.includes(n.toLowerCase()))) return v;
  }
  return "";
}

function pipeline(data: InvestmentPredictionsResponse) {
  return data.workbook?.sheets?.mainDataset ?? [];
}

function master(data: InvestmentPredictionsResponse) {
  return data.workbook?.sheets?.sectorSubSectorMaster ?? [];
}

function vacancy(data: InvestmentPredictionsResponse) {
  return data.workbook?.sheets?.vacancyGapAnalysis ?? [];
}

function forecast(data: InvestmentPredictionsResponse) {
  return data.workbook?.sheets?.jobForecast ?? [];
}

function normalizeState(raw: string): string {
  const s = String(raw || "").trim();
  if (s === "Delhi-NCR") return "Delhi";
  if ((GEO_STATE_NAMES as readonly string[]).includes(s)) return s;
  return s;
}

function truncate(s: string, max = 20): string {
  return s.length > max ? `${s.slice(0, max - 1)}…` : s;
}

/** Skip Excel total/national footnote rows — not drillable sectors. */
export function isAggregateLabel(label: string): boolean {
  const s = String(label || "").trim();
  if (!s || s.length > 72) return true;
  const lower = s.toLowerCase();
  if (lower.startsWith("total")) return true;
  if (lower.startsWith("national")) return true;
  if (lower.startsWith("methodology")) return true;
  if (lower.startsWith("source project")) return true;
  if (lower.includes("index construction")) return true;
  if (lower.includes("recompute monthly")) return true;
  return false;
}

function topRows(rows: GrowthDrillRow[], showAll: boolean): GrowthDrillRow[] {
  return showAll ? rows : rows.slice(0, 5);
}

function breadcrumb(filters: GrowthDrillFilter[]): { level: number; label: string }[] {
  return [{ level: 0, label: "All India" }, ...filters.map((f, i) => ({ level: i + 1, label: f.label }))];
}

function masterRow(data: InvestmentPredictionsResponse, subSector: string) {
  return master(data).find(
    (r) => String(col(r, "sub-sector") || col(r, "sub sector")).trim() === subSector
  );
}

function projectsForSubSector(data: InvestmentPredictionsResponse, subSector: string, state?: string) {
  const needle = subSector.toLowerCase();
  return pipeline(data).filter((p) => {
    const sector = String(p.Sector ?? p["Department / Industry"] ?? "").toLowerCase();
    const sub = String(p["Sub-Sector"] ?? "").toLowerCase();
    const name = String(p["Investment Project / Initiative"] ?? "").toLowerCase();
    const match = sub.includes(needle) || sector.includes(needle) || name.includes(needle.slice(0, 12));
    if (!match) return false;
    if (state && normalizeState(String(p.State ?? "")) !== state) return false;
    return true;
  });
}

function buildMapData(data: InvestmentPredictionsResponse, stateFilter?: string): GrowthDrillRow[] {
  const map = new Map<string, GrowthDrillRow>();
  for (const name of GEO_STATE_NAMES) {
    map.set(name, { key: name, label: name, investmentCr: 0, jobs: 0, gap: 0, openRoles: 0, yoyPct: 0 });
  }
  for (const p of pipeline(data)) {
    const st = normalizeState(String(p.State ?? ""));
    if (!st || !map.has(st)) continue;
    if (stateFilter && st !== stateFilter) continue;
    const row = map.get(st)!;
    row.jobs += readNum(p["Projected Vacancies"]);
    row.investmentCr += readNum(p["Investment Value (INR Cr)"]);
    row.openRoles += 1;
  }
  return Array.from(map.values()).filter((r) => r.jobs > 0 || r.investmentCr > 0);
}

export function getGrowthFrameView(
  data: InvestmentPredictionsResponse,
  frameId: GrowthFrameId,
  filters: GrowthDrillFilter[] = []
): GrowthFrameView {
  switch (frameId) {
    case "sectors":
      return buildSectorsFrame(data, filters);
    case "geography":
      return buildGeographyFrame(data, filters);
    case "forecast":
      return buildForecastFrame(data, filters);
    case "vacancyGap":
      return buildVacancyFrame(data, filters);
    case "heatmap":
      return buildHeatmapFrame(data, filters);
    default:
      return buildSectorsFrame(data, filters);
  }
}

function buildHeatmapPickerOptions(
  states: string[],
  sectorCols: string[],
  matrix: number[][]
): GrowthDrillRow[] {
  const opts: GrowthDrillRow[] = [];
  for (let ri = 0; ri < states.length; ri++) {
    for (let ci = 0; ci < sectorCols.length; ci++) {
      const val = matrix[ri]?.[ci] ?? 0;
      if (val <= 0) continue;
      const sector = sectorCols[ci];
      const state = states[ri];
      opts.push({
        key: `${state}|${sector}`,
        label: `${sector} · ${state}`,
        investmentCr: 0,
        jobs: 0,
        gap: 0,
        openRoles: val,
        yoyPct: 0,
      });
    }
  }
  return opts.sort((a, b) => b.openRoles - a.openRoles);
}

function buildSectorsFrame(
  data: InvestmentPredictionsResponse,
  filters: GrowthDrillFilter[]
): GrowthFrameView {
  const parent = filters.find((f) => f.dimension === "parentSector");
  const sub = filters.find((f) => f.dimension === "subSector");

  if (sub) {
    const m = masterRow(data, sub.value);
    const projects = projectsForSubSector(data, sub.value);
    const inv = projects.reduce((s, p) => s + readNum(p["Investment Value (INR Cr)"]), 0);
    const jobs = projects.reduce((s, p) => s + readNum(p["Projected Vacancies"]), 0);
    return {
      frameId: "sectors",
      title: sub.label,
      hint: "Project pipeline · master KPIs",
      chartType: "detail",
      drillable: false,
      breadcrumb: breadcrumb(filters),
      summary: {
        investmentCr: inv,
        jobs,
        gap: 0,
        projects: projects.length,
        openRoles: readNum(col(m ?? {}, "open roles")),
      },
      rows: [],
      detail: {
        kpis: [
          { label: "Open roles (est.)", value: readNum(col(m ?? {}, "open roles")).toLocaleString("en-IN") },
          { label: "Jobs / ₹100 Cr", value: String(readNum(col(m ?? {}, "jobs per", "100cr"))) },
          { label: "FY26 hiring YoY", value: `${readNum(col(m ?? {}, "naukri", "yoy"))}%` },
          { label: "Gestation (mo)", value: String(readNum(col(m ?? {}, "gestation"))) },
          { label: "PLI coverage", value: String(col(m ?? {}, "pli coverage") || "—") },
          { label: "Pipeline jobs", value: jobs.toLocaleString("en-IN") },
        ],
        projects: projects.slice(0, 8).map((p) => ({
          name: String(p["Investment Project / Initiative"] ?? ""),
          state: String(p.State ?? ""),
          investmentCr: readNum(p["Investment Value (INR Cr)"]),
          jobs: readNum(p["Projected Vacancies"]),
          stage: String(p["Project Stage"] ?? ""),
        })),
        insight: String(col(m ?? {}, "notes") || ""),
      },
    };
  }

  if (parent) {
    const allSubs = master(data)
      .filter((r) => String(col(r, "parent sector")).trim() === parent.value)
      .map((r) => ({
        key: String(col(r, "sub-sector") || col(r, "sub sector")).trim(),
        label: String(col(r, "sub-sector") || col(r, "sub sector")).trim(),
        investmentCr: 0,
        jobs: 0,
        gap: 0,
        openRoles: readNum(col(r, "open roles")),
        yoyPct: readNum(col(r, "naukri", "yoy")),
      }))
      .filter((r) => r.key && !isAggregateLabel(r.label))
      .sort((a, b) => b.openRoles - a.openRoles);
    const subs = topRows(allSubs, false);

    return {
      frameId: "sectors",
      title: `Top 5 sub-sectors · ${parent.label}`,
      hint: "Click a sub-sector → pipeline & KPIs",
      chartType: "horizontalBar",
      drillable: true,
      dimension: "subSector",
      breadcrumb: breadcrumb(filters),
      totalRowCount: allSubs.length,
      pickerOptions: allSubs,
      summary: {
        investmentCr: subs.reduce((s, r) => s + r.investmentCr, 0),
        jobs: subs.reduce((s, r) => s + r.jobs, 0),
        gap: 0,
        projects: subs.length,
        openRoles: subs.reduce((s, r) => s + r.openRoles, 0),
      },
      rows: subs,
    };
  }

  const parents = new Map<string, GrowthDrillRow>();
  for (const r of master(data)) {
    const name = String(col(r, "parent sector")).trim();
    if (!name || isAggregateLabel(name)) continue;
    const existing = parents.get(name) ?? {
      key: name,
      label: name,
      investmentCr: 0,
      jobs: 0,
      gap: 0,
      openRoles: 0,
      yoyPct: 0,
    };
    existing.openRoles += readNum(col(r, "open roles"));
    existing.yoyPct = Math.max(existing.yoyPct, readNum(col(r, "naukri", "yoy")));
    parents.set(name, existing);
  }
  const allParents = Array.from(parents.values()).sort((a, b) => b.openRoles - a.openRoles);
  const rows = topRows(allParents, false);

  return {
    frameId: "sectors",
    title: "Top 5 sectors",
    hint: "Parent sectors · click → sub-sectors",
    chartType: "horizontalBar",
    drillable: true,
    dimension: "parentSector",
    breadcrumb: breadcrumb(filters),
    totalRowCount: allParents.length,
    pickerOptions: allParents,
    summary: {
      investmentCr: 0,
      jobs: 0,
      gap: 0,
      projects: rows.length,
      openRoles: rows.reduce((s, r) => s + r.openRoles, 0),
    },
    rows,
  };
}

function buildGeographyFrame(
  data: InvestmentPredictionsResponse,
  filters: GrowthDrillFilter[]
): GrowthFrameView {
  const stateF = filters.find((f) => f.dimension === "state");
  const sectorF = filters.find((f) => f.dimension === "pipelineSector");

  if (sectorF && stateF) {
    const projects = pipeline(data).filter(
      (p) =>
        normalizeState(String(p.State ?? "")) === stateF.value &&
        String(p.Sector ?? "") === sectorF.value
    );
    return {
      frameId: "geography",
      title: `${sectorF.label} · ${stateF.label}`,
      hint: "Pipeline projects in this state",
      chartType: "detail",
      drillable: false,
      breadcrumb: breadcrumb(filters),
      summary: {
        investmentCr: projects.reduce((s, p) => s + readNum(p["Investment Value (INR Cr)"]), 0),
        jobs: projects.reduce((s, p) => s + readNum(p["Projected Vacancies"]), 0),
        gap: 0,
        projects: projects.length,
        openRoles: 0,
      },
      rows: [],
      detail: {
        kpis: [],
        projects: projects.slice(0, 10).map((p) => ({
          name: String(p["Investment Project / Initiative"] ?? ""),
          state: String(p.State ?? ""),
          investmentCr: readNum(p["Investment Value (INR Cr)"]),
          jobs: readNum(p["Projected Vacancies"]),
          stage: String(p["Project Stage"] ?? ""),
        })),
      },
    };
  }

  if (stateF) {
    const bySector = new Map<string, GrowthDrillRow>();
    for (const p of pipeline(data)) {
      if (normalizeState(String(p.State ?? "")) !== stateF.value) continue;
      const sec = String(p.Sector ?? "Other");
      const row = bySector.get(sec) ?? {
        key: sec,
        label: sec,
        investmentCr: 0,
        jobs: 0,
        gap: 0,
        openRoles: 0,
        yoyPct: 0,
      };
      row.jobs += readNum(p["Projected Vacancies"]);
      row.investmentCr += readNum(p["Investment Value (INR Cr)"]);
      bySector.set(sec, row);
    }
    const allRows = Array.from(bySector.values())
      .filter((r) => !isAggregateLabel(r.label))
      .sort((a, b) => b.jobs - a.jobs);
    const rows = topRows(allRows, false);
    return {
      frameId: "geography",
      title: `Top 5 sectors · ${stateF.label}`,
      hint: "Click sector → projects",
      chartType: "horizontalBar",
      drillable: true,
      dimension: "pipelineSector",
      breadcrumb: breadcrumb(filters),
      totalRowCount: allRows.length,
      pickerOptions: allRows,
      summary: {
        investmentCr: rows.reduce((s, r) => s + r.investmentCr, 0),
        jobs: rows.reduce((s, r) => s + r.jobs, 0),
        gap: 0,
        projects: rows.length,
        openRoles: 0,
      },
      rows,
    };
  }

  const mapRows = buildMapData(data);
  const allStates = [...mapRows].sort((a, b) => b.jobs - a.jobs);
  return {
    frameId: "geography",
    title: "Geography",
    hint: "Heat map · click state → sectors",
    chartType: "map",
    drillable: true,
    dimension: "state",
    breadcrumb: breadcrumb(filters),
    totalRowCount: allStates.length,
    pickerOptions: allStates,
    summary: {
      investmentCr: mapRows.reduce((s, r) => s + r.investmentCr, 0),
      jobs: mapRows.reduce((s, r) => s + r.jobs, 0),
      gap: 0,
      projects: pipeline(data).length,
      openRoles: 0,
    },
    rows: mapRows,
    mapData: mapRows.map((r) => ({
      key: r.key,
      label: r.label,
      postings: Math.round(r.openRoles),
      vacancies: r.jobs,
      applicants: 0,
    })),
  };
}

function buildForecastFrame(
  data: InvestmentPredictionsResponse,
  filters: GrowthDrillFilter[]
): GrowthFrameView {
  const ss = filters.find((f) => f.dimension === "sectorState");
  if (ss) {
    const [sector, state] = ss.value.split("|");
    const row = forecast(data).find(
      (r) => String(r.Sector) === sector && normalizeState(String(r.State)) === normalizeState(state)
    );
    const projects = pipeline(data).filter(
      (p) => String(p.Sector ?? "").includes(sector.split(" ")[0]) && normalizeState(String(p.State ?? "")) === normalizeState(state)
    );
    return {
      frameId: "forecast",
      title: ss.label,
      hint: "12/24-month forecast detail",
      chartType: "detail",
      drillable: false,
      breadcrumb: breadcrumb(filters),
      summary: {
        investmentCr: readNum(row?.["Investment in Scope (₹ Cr)"]),
        jobs: readNum(row?.["12-Month Jobs"]),
        gap: 0,
        projects: projects.length,
        openRoles: 0,
      },
      rows: [],
      detail: {
        kpis: [
          { label: "3-month jobs", value: readNum(row?.["3-Month Jobs"]).toLocaleString("en-IN") },
          { label: "6-month jobs", value: readNum(row?.["6-Month Jobs"]).toLocaleString("en-IN") },
          { label: "12-month jobs", value: readNum(row?.["12-Month Jobs"]).toLocaleString("en-IN") },
          { label: "24-month jobs", value: readNum(row?.["24-Month Jobs"]).toLocaleString("en-IN") },
          { label: "Investment scope", value: `₹${readNum(row?.["Investment in Scope (₹ Cr)"]).toLocaleString("en-IN")} Cr` },
          { label: "Confidence", value: String(row?.["Model Confidence"] ?? "—") },
        ],
        projects: projects.slice(0, 6).map((p) => ({
          name: String(p["Investment Project / Initiative"] ?? ""),
          state: String(p.State ?? ""),
          investmentCr: readNum(p["Investment Value (INR Cr)"]),
          jobs: readNum(p["Projected Vacancies"]),
          stage: String(p["Project Stage"] ?? ""),
        })),
      },
    };
  }

  const allRows = forecast(data)
    .filter(
      (r) =>
        !isAggregateLabel(String(r.Sector ?? "")) && !isAggregateLabel(String(r.State ?? ""))
    )
    .map((r) => ({
      key: `${r.Sector}|${r.State}`,
      label: truncate(`${r.Sector} · ${r.State}`, 22),
      investmentCr: readNum(r["Investment in Scope (₹ Cr)"]),
      jobs: readNum(r["12-Month Jobs"]),
      gap: 0,
      openRoles: 0,
      yoyPct: 0,
      meta: `${r.Sector}|${r.State}`,
    }))
    .sort((a, b) => b.jobs - a.jobs);
  const rows = topRows(allRows, false);

  return {
    frameId: "forecast",
    title: "Top 5 · 12-month forecast",
    hint: "Click bar → horizon KPIs & projects",
    chartType: "horizontalBar",
    drillable: true,
    dimension: "sectorState",
    breadcrumb: breadcrumb(filters),
    totalRowCount: allRows.length,
    pickerOptions: allRows,
    summary: {
      investmentCr: rows.reduce((s, r) => s + r.investmentCr, 0),
      jobs: rows.reduce((s, r) => s + r.jobs, 0),
      gap: 0,
      projects: rows.length,
      openRoles: 0,
    },
    rows,
  };
}

function buildVacancyFrame(
  data: InvestmentPredictionsResponse,
  filters: GrowthDrillFilter[]
): GrowthFrameView {
  const sectorF = filters.find((f) => f.dimension === "parentSector");
  const stateF = filters.find((f) => f.dimension === "state");

  if (sectorF && stateF) {
    const row = vacancy(data).find(
      (r) => String(r.Sector) === sectorF.value && normalizeState(String(r.State)) === stateF.value
    );
    return {
      frameId: "vacancyGap",
      title: `${sectorF.label} · ${stateF.label}`,
      hint: "Vacancy gap KPIs",
      chartType: "detail",
      drillable: false,
      breadcrumb: breadcrumb(filters),
      summary: {
        investmentCr: 0,
        jobs: readNum(row?.["Total Projected Demand (12-mo)"]),
        gap: readNum(row?.["Net Vacancy Gap"]),
        projects: 0,
        openRoles: readNum(row?.["Current Open Vacancies (est.)"]),
      },
      rows: [],
      detail: {
        kpis: [
          { label: "Current vacancies", value: readNum(row?.["Current Open Vacancies (est.)"]).toLocaleString("en-IN") },
          { label: "Pipeline vacancies (12m)", value: readNum(row?.["New Vacancies from Pipeline (12-mo)"]).toLocaleString("en-IN") },
          { label: "Total demand", value: readNum(row?.["Total Projected Demand (12-mo)"]).toLocaleString("en-IN") },
          { label: "Talent supply", value: readNum(row?.["Annual Skilled-Talent Supply"]).toLocaleString("en-IN") },
          { label: "Net gap", value: readNum(row?.["Net Vacancy Gap"]).toLocaleString("en-IN") },
          { label: "Severity", value: String(row?.["Gap Severity"] ?? "—") },
        ],
        projects: [],
        insight: String(row?.["Recommended Action"] ?? ""),
      },
    };
  }

  if (sectorF) {
    const allRows = vacancy(data)
      .filter((r) => String(r.Sector) === sectorF.value && !isAggregateLabel(String(r.State ?? "")))
      .map((r) => ({
        key: normalizeState(String(r.State)),
        label: normalizeState(String(r.State)),
        investmentCr: 0,
        jobs: readNum(r["Total Projected Demand (12-mo)"]),
        gap: readNum(r["Net Vacancy Gap"]),
        openRoles: readNum(r["Current Open Vacancies (est.)"]),
        yoyPct: readNum(r["YoY Demand Growth %"]),
      }))
      .sort((a, b) => b.gap - a.gap);
    const rows = topRows(allRows, false);

    return {
      frameId: "vacancyGap",
      title: `Top 5 states · ${sectorF.label}`,
      hint: "Click state → gap detail",
      chartType: "horizontalBar",
      drillable: true,
      dimension: "state",
      breadcrumb: breadcrumb(filters),
      totalRowCount: allRows.length,
      pickerOptions: allRows,
      summary: {
        investmentCr: 0,
        jobs: rows.reduce((s, r) => s + r.jobs, 0),
        gap: rows.reduce((s, r) => s + r.gap, 0),
        projects: rows.length,
        openRoles: 0,
      },
      rows,
    };
  }

  const bySector = new Map<string, GrowthDrillRow>();
  for (const r of vacancy(data)) {
    const sec = String(r.Sector ?? "").trim();
    if (!sec || isAggregateLabel(sec)) continue;
    const row = bySector.get(sec) ?? {
      key: sec,
      label: truncate(sec, 22),
      investmentCr: 0,
      jobs: 0,
      gap: 0,
      openRoles: 0,
      yoyPct: 0,
    };
    row.gap += readNum(r["Net Vacancy Gap"]);
    row.jobs += readNum(r["Total Projected Demand (12-mo)"]);
    bySector.set(sec, row);
  }
  const allRows = Array.from(bySector.values()).sort((a, b) => b.gap - a.gap);
  const rows = topRows(allRows, false);

  return {
    frameId: "vacancyGap",
    title: "Top 5 · vacancy gap by sector",
    hint: "Click sector → states",
    chartType: "horizontalBar",
    drillable: true,
    dimension: "parentSector",
    breadcrumb: breadcrumb(filters),
    totalRowCount: allRows.length,
    pickerOptions: allRows,
    summary: {
      investmentCr: 0,
      jobs: rows.reduce((s, r) => s + r.jobs, 0),
      gap: rows.reduce((s, r) => s + r.gap, 0),
      projects: rows.length,
      openRoles: 0,
    },
    rows,
  };
}

function buildHeatmapFrame(data: InvestmentPredictionsResponse, filters: GrowthDrillFilter[]): GrowthFrameView {
  const heat = filterHeatmapRows(data.workbook?.sheets?.hiringHeatmap ?? []);
  const sectorCols = heat[0]
    ? Object.keys(heat[0]).filter((k) => k !== "State" && k !== "State / Sector")
    : [];
  const states = heat.map((r) => String(r.State ?? r["State / Sector"] ?? ""));
  const matrix = heat.map((r) => sectorCols.map((c) => readNum(r[c])));

  const cell = filters[0];
  if (cell?.dimension === "subSector") {
    const [state, sectorCol] = cell.value.split("|");
    const intensity = matrix[states.indexOf(state)]?.[sectorCols.indexOf(sectorCol)] ?? 0;
    const projects = pipeline(data).filter((p) => {
      const st = String(p.State ?? "");
      return (st === state || (state === "Delhi-NCR" && st.includes("Delhi"))) && String(p.Sector ?? "").length > 0;
    });
    return {
      frameId: "heatmap",
      title: `${truncate(sectorCol, 24)} · ${state}`,
      hint: "Hiring intensity cell detail",
      chartType: "detail",
      drillable: false,
      breadcrumb: breadcrumb(filters),
      summary: { investmentCr: 0, jobs: 0, gap: 0, projects: projects.length, openRoles: intensity },
      rows: [],
      detail: {
        kpis: [
          { label: "Intensity index", value: String(Math.round(intensity)) },
          { label: "State", value: state },
          { label: "Sector", value: sectorCol },
        ],
        projects: projects.slice(0, 5).map((p) => ({
          name: String(p["Investment Project / Initiative"] ?? ""),
          state: String(p.State ?? ""),
          investmentCr: readNum(p["Investment Value (INR Cr)"]),
          jobs: readNum(p["Projected Vacancies"]),
          stage: String(p["Project Stage"] ?? ""),
        })),
      },
    };
  }

  const pickerOptions = buildHeatmapPickerOptions(states, sectorCols, matrix);

  return {
    frameId: "heatmap",
    title: "Hiring intensity heatmap",
    hint: "",
    chartType: "heatmap",
    drillable: true,
    dimension: "subSector",
    breadcrumb: breadcrumb(filters),
    totalRowCount: pickerOptions.length,
    pickerOptions,
    summary: {
      investmentCr: 0,
      jobs: 0,
      gap: 0,
      projects: 0,
      openRoles: 0,
    },
    rows: [],
    heatmap: { states, sectors: sectorCols, matrix },
  };
}
