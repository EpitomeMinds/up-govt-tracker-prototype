"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { InvestmentPredictionsResponse } from "@/lib/investmentTypes";
import type { AiRecommendationsResponse } from "@/lib/aiRecommendationsTypes";
import type { GrowthAnalysisSectionId, GrowthDrillNavigation } from "@/lib/portalGrowthNavigation";
import {
  buildDistrictRows,
  buildSectorJobData,
  buildTrendData,
  computeGrowthKpis,
  formatCount,
} from "@/lib/investmentPortalAnalytics";
import PortalGrowthKpiRow from "./PortalGrowthKpiRow";
import PortalGrowthCharts from "./PortalGrowthCharts";
import PortalDistrictTable from "./PortalDistrictTable";
import PortalRecommendationsDashboard from "./PortalRecommendationsDashboard";
import StableChartContainer from "@/components/charts/StableChartContainer";

export type { GrowthAnalysisSectionId };

const SECTIONS: { id: GrowthAnalysisSectionId; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "sectors", label: "Industries" },
  { id: "districts", label: "Districts" },
  { id: "trends", label: "Trends" },
  { id: "projects", label: "Projects" },
  { id: "skills", label: "Skills" },
  { id: "opportunities", label: "Top 50" },
  { id: "ranking", label: "Ranking" },
  { id: "summary", label: "Summary" },
  { id: "recommendations", label: "Recommendations" },
];

const SIGNAL_COLORS = {
  high: "#2563eb",
  medium: "#f97316",
  low: "#94a3b8",
};

const CHART_COLORS = ["#2563eb", "#f97316", "#10b981", "#8b5cf6", "#ec4899", "#06b6d4", "#64748b"];

interface DrillState {
  title: string;
  groupLabel: string;
  groupValue: string;
  rows: Record<string, unknown>[];
  columns: string[];
  metrics: { label: string; value: string; tone?: string }[];
}

interface Props {
  data: InvestmentPredictionsResponse;
  aiData?: AiRecommendationsResponse | null;
  initialNav?: GrowthDrillNavigation | null;
  onBack: () => void;
}

export default function PortalGrowthDetailedAnalysis({
  data,
  aiData,
  initialNav,
  onBack,
}: Props) {
  const [active, setActive] = useState<GrowthAnalysisSectionId>(initialNav?.section ?? "overview");
  const [drill, setDrill] = useState<DrillState | null>(null);

  const kpis = useMemo(() => computeGrowthKpis(data), [data]);
  const districtRows = useMemo(() => buildDistrictRows(data), [data]);
  const trendData = useMemo(() => buildTrendData(data), [data]);
  const sectorData = useMemo(() => buildSectorJobData(data), [data]);
  const sheets = data.workbook?.sheets;

  useEffect(() => {
    if (!initialNav?.filterKey || !initialNav.filterValue) return;
    const section = initialNav.section;
    setActive(section);

    if (section === "projects" && sheets?.mainDataset) {
      const columns = [
        "Region",
        "Department / Industry",
        "Sub-Sector",
        "Investment Project / Initiative",
        "Investment Value (INR Cr)",
        "Projected Vacancies",
        "Location",
        "Key Skills Required",
        "Confidence Level",
      ];
      const key = initialNav.filterKey;
      const value = initialNav.filterValue;
      const selected =
        key === "Location"
          ? sheets.mainDataset.filter((row) =>
              String(row.Location ?? "")
                .toLowerCase()
                .includes(value.toLowerCase())
            )
          : key === "Hiring Period"
            ? sheets.mainDataset.filter((row) =>
                String(row["Hiring Period"] ?? row["Start Date"] ?? "").includes(value)
              )
            : filterRows(sheets.mainDataset, key, value);
      if (selected.length) {
        setDrill(
          buildDrill("Project Drill-down", key, value, selected, columns, [
            ["Investment", "Investment Value (INR Cr)", "cr"],
            ["Vacancies", "Projected Vacancies", "count"],
            ["Projects", null, "count"],
          ])
        );
      }
    }
  }, [initialNav, sheets?.mainDataset]);

  return (
    <div className="flex min-h-0 flex-col">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <button
            type="button"
            onClick={onBack}
            className="mb-1 inline-flex items-center gap-1.5 text-sm font-semibold text-[#2563eb] hover:text-[#1d4ed8]"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Back to growth dashboard
          </button>
          <h2 className="text-lg font-bold text-slate-900">Detailed Analysis</h2>
        </div>
      </div>

      <div className="portal-analysis-tabs mb-3">
        {SECTIONS.map((section) => (
          <button
            key={section.id}
            type="button"
            onClick={() => {
              setActive(section.id);
              setDrill(null);
            }}
            className={`portal-analysis-tab ${active === section.id ? "portal-analysis-tab-active" : ""}`}
          >
            {section.label}
          </button>
        ))}
      </div>

      <div className="portal-panel overflow-y-auto p-3">
        <div className="portal-analysis-body">
          {active === "overview" && (
            <div className="space-y-4">
              <PortalGrowthKpiRow kpis={kpis} />
              <PortalGrowthCharts
                data={data}
                compact
                onSectorClick={(sector) => {
                  setActive("projects");
                  const columns = [
                    "Region",
                    "Department / Industry",
                    "Sub-Sector",
                    "Investment Project / Initiative",
                    "Investment Value (INR Cr)",
                    "Projected Vacancies",
                    "Location",
                    "Confidence Level",
                  ];
                  const selected = filterRows(sheets?.mainDataset ?? [], "Department / Industry", sector);
                  if (selected.length) {
                    setDrill(
                      buildDrill("Project Drill-down", "Industry", sector, selected, columns, [
                        ["Investment", "Investment Value (INR Cr)", "cr"],
                        ["Vacancies", "Projected Vacancies", "count"],
                        ["Projects", null, "count"],
                      ])
                    );
                  }
                }}
                onYearClick={(year) => {
                  setActive("projects");
                  const columns = [
                    "Region",
                    "Department / Industry",
                    "Investment Project / Initiative",
                    "Projected Vacancies",
                    "Hiring Period",
                    "Location",
                  ];
                  const selected = (sheets?.mainDataset ?? []).filter((row) =>
                    String(row["Hiring Period"] ?? row["Start Date"] ?? "").includes(year)
                  );
                  if (selected.length) {
                    setDrill(
                      buildDrill("Project Drill-down", "Year", year, selected, columns, [
                        ["Investment", "Investment Value (INR Cr)", "cr"],
                        ["Vacancies", "Projected Vacancies", "count"],
                        ["Projects", null, "count"],
                      ])
                    );
                  }
                }}
              />
            </div>
          )}

          {active === "sectors" && (
            <div className="space-y-4">
              <div className="portal-panel">
                <div className="portal-panel-header">
                  <h3 className="portal-panel-title">Sector Forecast</h3>
                </div>
                <StableChartContainer height={240} className="px-2 pb-4">
                  <BarChart data={sectorData} margin={{ bottom: 48, left: -8 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 10, fill: "#64748b" }}
                        angle={-35}
                        textAnchor="end"
                        interval={0}
                        height={56}
                      />
                      <YAxis tick={{ fontSize: 10, fill: "#64748b" }} />
                      <Tooltip
                        formatter={(v: number) => [v.toLocaleString("en-IN"), "Projected jobs"]}
                        labelFormatter={(_, payload) =>
                          (payload?.[0]?.payload as { fullName?: string })?.fullName ?? ""
                        }
                      />
                      <Bar
                        dataKey="jobs"
                        radius={[6, 6, 0, 0]}
                        cursor="pointer"
                        onClick={(payload) => {
                          const fullName = String(
                            (payload as { fullName?: string; payload?: { fullName?: string } }).fullName ??
                              (payload as { payload?: { fullName?: string } }).payload?.fullName ??
                              ""
                          );
                          if (!fullName) return;
                          const columns = [
                            "Region",
                            "Department / Industry",
                            "Investment Project / Initiative",
                            "Projected Vacancies",
                            "Location",
                          ];
                          const selected = filterRows(
                            sheets?.mainDataset ?? [],
                            "Department / Industry",
                            fullName
                          );
                          if (selected.length) {
                            setActive("projects");
                            setDrill(
                              buildDrill("Project Drill-down", "Industry", fullName, selected, columns, [
                                ["Investment", "Investment Value (INR Cr)", "cr"],
                                ["Vacancies", "Projected Vacancies", "count"],
                                ["Projects", null, "count"],
                              ])
                            );
                          }
                        }}
                      >
                        {sectorData.map((entry) => (
                          <Cell key={entry.fullName} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                </StableChartContainer>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {data.sectors.slice(0, 6).map((sector) => (
                  <div
                    key={sector.id}
                    className="rounded-xl border border-slate-100 bg-slate-50/60 p-4"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-bold text-slate-900">{sector.name}</p>
                      <span
                        className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase"
                        style={{
                          backgroundColor: `${SIGNAL_COLORS[sector.investmentSignal]}20`,
                          color: SIGNAL_COLORS[sector.investmentSignal],
                        }}
                      >
                        {sector.investmentSignal}
                      </span>
                    </div>
                    <p className="mt-2 text-2xl font-bold text-[#2563eb]">
                      {formatCount(sector.predictedOpenings12m)}
                    </p>
                    <p className="text-xs text-slate-500">12-month job forecast</p>
                    <p className="mt-2 line-clamp-2 text-xs text-slate-600">{sector.aiRationale}</p>
                    {sector.projects?.length ? (
                      <p className="mt-2 text-[11px] font-semibold text-slate-500">
                        {sector.projects.length} workbook project(s) · Rs{" "}
                        {(sector.investmentCr ?? 0).toLocaleString("en-IN")} Cr
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          )}

          {active === "districts" && (
            <PortalDistrictTable
              rows={districtRows}
              onDistrictClick={(district) => {
                setActive("projects");
                const columns = [
                  "Region",
                  "Department / Industry",
                  "Investment Project / Initiative",
                  "Projected Vacancies",
                  "Location",
                  "Confidence Level",
                ];
                const selected = (sheets?.mainDataset ?? []).filter((row) =>
                  String(row.Location ?? "")
                    .toLowerCase()
                    .includes(district.toLowerCase())
                );
                if (selected.length) {
                  setDrill(
                    buildDrill("Project Drill-down", "Location", district, selected, columns, [
                      ["Investment", "Investment Value (INR Cr)", "cr"],
                      ["Vacancies", "Projected Vacancies", "count"],
                      ["Projects", null, "count"],
                    ])
                  );
                }
              }}
            />
          )}

          {active === "trends" && (
            <div className="portal-panel">
              <div className="portal-panel-header">
                <h3 className="portal-panel-title">Investment vs Job Creation Trend</h3>
              </div>
              <StableChartContainer height={320} className="px-2 pb-4">
                  <AreaChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#64748b" }} />
                    <YAxis tick={{ fontSize: 10, fill: "#64748b" }} />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="investment"
                      name="Investment index"
                      stroke="#f97316"
                      fill="#f97316"
                      fillOpacity={0.12}
                      strokeWidth={2}
                    />
                    <Area
                      type="monotone"
                      dataKey="jobs"
                      name="Jobs"
                      stroke="#2563eb"
                      fill="#2563eb"
                      fillOpacity={0.1}
                      strokeWidth={2}
                    />
                  </AreaChart>
              </StableChartContainer>
            </div>
          )}

          {active === "projects" && (
            <WorkbookTab
              drill={drill}
              onClearDrill={() => setDrill(null)}
              charts={<ProjectsCharts rows={sheets?.mainDataset} onDrill={setDrill} />}
              table={
                <WorkbookTable
                  title="Main Dataset"
                  rows={sheets?.mainDataset}
                  columns={[
                    "Region",
                    "Department / Industry",
                    "Sub-Sector",
                    "Investment Project / Initiative",
                    "Investment Value (INR Cr)",
                    "Projected Vacancies",
                    "Hiring Period",
                    "Location",
                    "Confidence Level",
                  ]}
                />
              }
            />
          )}

          {active === "skills" && (
            <WorkbookTab
              drill={drill}
              onClearDrill={() => setDrill(null)}
              charts={<SkillsCharts rows={sheets?.skillDemandForecast} onDrill={setDrill} />}
              table={
                <WorkbookTable
                  title="Skill Demand Forecast"
                  rows={sheets?.skillDemandForecast}
                  columns={[
                    "Skill Category",
                    "Industry",
                    "Region",
                    "Demand Level",
                    "Projected Openings 2026-2035",
                    "Average Salary Range (INR LPA)",
                    "Training Programmes / Certification",
                  ]}
                />
              }
            />
          )}

          {active === "opportunities" && (
            <WorkbookTab
              drill={drill}
              onClearDrill={() => setDrill(null)}
              charts={<OpportunitiesCharts rows={sheets?.topOpportunities} onDrill={setDrill} />}
              table={
                <WorkbookTable
                  title="Top 50 Opportunities"
                  rows={sheets?.topOpportunities}
                  columns={[
                    "Rank",
                    "Region",
                    "Industry / Sector",
                    "Specific Opportunity",
                    "Investment (INR Cr)",
                    "Jobs Generated",
                    "Ease of Hiring",
                    "5Y Growth Potential",
                    "Automation Risk",
                    "Overall Score",
                  ]}
                />
              }
            />
          )}

          {active === "ranking" && (
            <WorkbookTab
              drill={drill}
              onClearDrill={() => setDrill(null)}
              charts={<RankingCharts rows={sheets?.employmentRanking} onDrill={setDrill} />}
              table={
                <WorkbookTable
                  title="Employment Ranking"
                  rows={sheets?.employmentRanking}
                  columns={[
                    "Rank",
                    "Region",
                    "Industry",
                    "Total Projected Jobs",
                    "Investment (INR Cr)",
                    "Automation Risk",
                    "AI Disruption Risk",
                    "Employment Tier",
                  ]}
                />
              }
            />
          )}

          {active === "summary" && (
            <WorkbookTab
              drill={drill}
              onClearDrill={() => setDrill(null)}
              charts={<SummaryCharts rows={sheets?.executiveSummary} onDrill={setDrill} />}
              table={
                <WorkbookTable
                  title="Executive Summary"
                  rows={sheets?.executiveSummary}
                  columns={[
                    "Region",
                    "Industry",
                    "Total Investment (INR Cr)",
                    "Projected Jobs (Total)",
                    "Major Locations",
                    "Growth Outlook",
                    "Investment Priority",
                    "Key Drivers",
                  ]}
                />
              }
            />
          )}

          {active === "recommendations" && aiData && (
            <PortalRecommendationsDashboard data={aiData} />
          )}

          {active === "recommendations" && !aiData && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="portal-spinner mb-4" />
              <p className="text-sm font-semibold text-slate-700">Loading recommendations…</p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

function WorkbookTab({
  charts,
  table,
  drill,
  onClearDrill,
}: {
  charts: React.ReactNode;
  table: React.ReactNode;
  drill?: DrillState | null;
  onClearDrill?: () => void;
}) {
  return (
    <div className="space-y-4">
      {charts}
      {drill && <DrillPanel drill={drill} onClear={onClearDrill} />}
      {table}
    </div>
  );
}

function ProjectsCharts({
  rows,
  onDrill,
}: {
  rows?: Record<string, unknown>[];
  onDrill: (drill: DrillState) => void;
}) {
  const sourceRows = rows ?? [];
  const industryData = aggregateRows(rows, "Department / Industry", [
    ["investment", "Investment Value (INR Cr)"],
    ["jobs", "Projected Vacancies"],
  ]).slice(0, 10);
  const regionData = aggregateRows(rows, "Region", [["jobs", "Projected Vacancies"]]);
  const columns = [
    "Region",
    "Department / Industry",
    "Sub-Sector",
    "Investment Project / Initiative",
    "Investment Value (INR Cr)",
    "Projected Vacancies",
    "Location",
    "Key Skills Required",
    "Confidence Level",
  ];

  return (
    <div className="grid gap-3 xl:grid-cols-2">
      <ChartPanel title="Top Industries by Investment">
        <StableChartContainer height={260} className="px-2 pb-4">
          <BarChart data={industryData} layout="vertical" margin={{ left: 12, right: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={formatShort} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={128} />
            <Tooltip formatter={(v: number) => [formatShort(v), "Investment (Cr)"]} />
            <Bar
              dataKey="investment"
              fill="#f97316"
              radius={[0, 6, 6, 0]}
              cursor="pointer"
              onClick={(payload) => {
                const fullName = String(
                  (payload as { fullName?: string; payload?: { fullName?: string } }).fullName ??
                    (payload as { payload?: { fullName?: string } }).payload?.fullName ??
                    ""
                );
                if (fullName) {
                  const selected = filterRows(sourceRows, "Department / Industry", fullName);
                  onDrill(buildDrill("Project Drill-down", "Industry", fullName, selected, columns, [
                    ["Investment", "Investment Value (INR Cr)", "cr"],
                    ["Vacancies", "Projected Vacancies", "count"],
                    ["Projects", null, "count"],
                  ]));
                }
              }}
            />
          </BarChart>
        </StableChartContainer>
      </ChartPanel>
      <ChartPanel title="Projected Jobs by Region">
        <StableChartContainer height={260} className="px-2 pb-4">
          <PieChart>
            <Pie
              data={regionData}
              dataKey="jobs"
              nameKey="name"
              innerRadius="45%"
              outerRadius="72%"
              paddingAngle={2}
              cursor="pointer"
              onClick={(_, index) => {
                const item = regionData[index];
                if (item?.fullName) {
                  const selected = filterRows(sourceRows, "Region", String(item.fullName));
                  onDrill(buildDrill("Project Drill-down", "Region", String(item.fullName), selected, columns, [
                    ["Investment", "Investment Value (INR Cr)", "cr"],
                    ["Vacancies", "Projected Vacancies", "count"],
                    ["Projects", null, "count"],
                  ]));
                }
              }}
            >
              {regionData.map((entry, i) => (
                <Cell key={entry.name} fill={CHART_COLORS[i % CHART_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(v: number) => [v.toLocaleString("en-IN"), "Jobs"]} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
          </PieChart>
        </StableChartContainer>
      </ChartPanel>
    </div>
  );
}

function SkillsCharts({
  rows,
  onDrill,
}: {
  rows?: Record<string, unknown>[];
  onDrill: (drill: DrillState) => void;
}) {
  const sourceRows = rows ?? [];
  const openings = aggregateRows(rows, "Skill Category", [["jobs", "Projected Openings 2026-2035"]]).slice(0, 10);
  const demand = aggregateRows(rows, "Demand Level", [["count", null]]);
  const columns = [
    "Skill Category",
    "Industry",
    "Region",
    "Demand Level",
    "Projected Openings 2026-2035",
    "Average Salary Range (INR LPA)",
    "Training Programmes / Certification",
  ];

  return (
    <div className="grid gap-3 xl:grid-cols-2">
      <ChartPanel title="Projected Openings by Skill">
        <StableChartContainer height={260} className="px-2 pb-4">
          <BarChart data={openings} layout="vertical" margin={{ left: 12, right: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={formatShort} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={150} />
            <Tooltip formatter={(v: number) => [v.toLocaleString("en-IN"), "Openings"]} />
            <Bar
              dataKey="jobs"
              fill="#2563eb"
              radius={[0, 6, 6, 0]}
              cursor="pointer"
              onClick={(payload) => {
                const fullName = String(
                  (payload as { fullName?: string; payload?: { fullName?: string } }).fullName ??
                    (payload as { payload?: { fullName?: string } }).payload?.fullName ??
                    ""
                );
                if (fullName) {
                  const selected = filterRows(sourceRows, "Skill Category", fullName);
                  onDrill(buildDrill("Skill Drill-down", "Skill", fullName, selected, columns, [
                    ["Openings", "Projected Openings 2026-2035", "count"],
                    ["Industries", "Industry", "unique"],
                    ["Rows", null, "count"],
                  ]));
                }
              }}
            />
          </BarChart>
        </StableChartContainer>
      </ChartPanel>
      <ChartPanel title="Demand Level Mix">
        <StableChartContainer height={260} className="px-2 pb-4">
          <PieChart>
            <Pie
              data={demand}
              dataKey="count"
              nameKey="name"
              outerRadius="72%"
              paddingAngle={2}
              cursor="pointer"
              onClick={(_, index) => {
                const item = demand[index];
                if (item?.fullName) {
                  const selected = filterRows(sourceRows, "Demand Level", String(item.fullName));
                  onDrill(buildDrill("Skill Drill-down", "Demand level", String(item.fullName), selected, columns, [
                    ["Openings", "Projected Openings 2026-2035", "count"],
                    ["Skills", "Skill Category", "unique"],
                    ["Rows", null, "count"],
                  ]));
                }
              }}
            >
              {demand.map((entry, i) => (
                <Cell key={entry.name} fill={CHART_COLORS[i % CHART_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend wrapperStyle={{ fontSize: 11 }} />
          </PieChart>
        </StableChartContainer>
      </ChartPanel>
    </div>
  );
}

function OpportunitiesCharts({
  rows,
  onDrill,
}: {
  rows?: Record<string, unknown>[];
  onDrill: (drill: DrillState) => void;
}) {
  const sourceRows = rows ?? [];
  const scores = (rows ?? [])
    .map((row) => ({
      name: shortLabel(String(row["Industry / Sector"] ?? row["Specific Opportunity"] ?? "Unknown"), 18),
      industry: String(row["Industry / Sector"] ?? ""),
      fullName: String(row["Specific Opportunity"] ?? ""),
      score: readNumber(row["Overall Score"]),
      jobs: readNumber(row["Jobs Generated"]),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 12);
  const risks = aggregateRows(rows, "Automation Risk", [["count", null]]);
  const columns = [
    "Rank",
    "Region",
    "Industry / Sector",
    "Specific Opportunity",
    "Investment (INR Cr)",
    "Jobs Generated",
    "Ease of Hiring",
    "5Y Growth Potential",
    "Automation Risk",
    "Overall Score",
  ];

  return (
    <div className="grid gap-3 xl:grid-cols-2">
      <ChartPanel title="Top Opportunity Scores">
        <StableChartContainer height={260} className="px-2 pb-4">
          <BarChart data={scores} margin={{ bottom: 56, left: -10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 9 }} angle={-35} textAnchor="end" height={64} interval={0} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip formatter={(v: number) => [v, "Score"]} labelFormatter={(_, payload) => payload?.[0]?.payload?.fullName ?? ""} />
            <Bar
              dataKey="score"
              fill="#10b981"
              radius={[6, 6, 0, 0]}
              cursor="pointer"
              onClick={(payload) => {
                const fullName = String(
                  (payload as { fullName?: string; payload?: { fullName?: string } }).fullName ??
                    (payload as { payload?: { fullName?: string } }).payload?.fullName ??
                    ""
                );
                const industry = String(
                  (payload as { industry?: string; payload?: { industry?: string } }).industry ??
                    (payload as { payload?: { industry?: string } }).payload?.industry ??
                    ""
                );
                const selected = sourceRows.filter(
                  (row) =>
                    String(row["Specific Opportunity"] ?? "") === fullName ||
                    String(row["Industry / Sector"] ?? "") === industry
                );
                if (selected.length) {
                  onDrill(buildDrill("Opportunity Drill-down", "Opportunity", industry || fullName, selected, columns, [
                    ["Investment", "Investment (INR Cr)", "cr"],
                    ["Jobs", "Jobs Generated", "count"],
                    ["Avg score", "Overall Score", "avg"],
                  ]));
                }
              }}
            />
          </BarChart>
        </StableChartContainer>
      </ChartPanel>
      <ChartPanel title="Automation Risk Mix">
        <StableChartContainer height={260} className="px-2 pb-4">
          <PieChart>
            <Pie
              data={risks}
              dataKey="count"
              nameKey="name"
              innerRadius="42%"
              outerRadius="72%"
              paddingAngle={2}
              cursor="pointer"
              onClick={(_, index) => {
                const item = risks[index];
                if (item?.fullName) {
                  const selected = filterRows(sourceRows, "Automation Risk", String(item.fullName));
                  onDrill(buildDrill("Opportunity Drill-down", "Automation risk", String(item.fullName), selected, columns, [
                    ["Investment", "Investment (INR Cr)", "cr"],
                    ["Jobs", "Jobs Generated", "count"],
                    ["Rows", null, "count"],
                  ]));
                }
              }}
            >
              {risks.map((entry, i) => (
                <Cell key={entry.name} fill={CHART_COLORS[i % CHART_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend wrapperStyle={{ fontSize: 11 }} />
          </PieChart>
        </StableChartContainer>
      </ChartPanel>
    </div>
  );
}

function RankingCharts({
  rows,
  onDrill,
}: {
  rows?: Record<string, unknown>[];
  onDrill: (drill: DrillState) => void;
}) {
  const sourceRows = rows ?? [];
  const tierData = aggregateRows(rows, "Employment Tier", [["jobs", "Total Projected Jobs"]]).slice(0, 8);
  const aiRiskData = aggregateRows(rows, "AI Disruption Risk", [["count", null]]);
  const columns = [
    "Rank",
    "Region",
    "Industry",
    "Total Projected Jobs",
    "Investment (INR Cr)",
    "Automation Risk",
    "AI Disruption Risk",
    "Employment Tier",
  ];

  return (
    <div className="grid gap-3 xl:grid-cols-2">
      <ChartPanel title="Jobs by Employment Tier">
        <StableChartContainer height={260} className="px-2 pb-4">
          <BarChart data={tierData} layout="vertical" margin={{ left: 12, right: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={formatShort} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 9 }} width={160} />
            <Tooltip formatter={(v: number) => [v.toLocaleString("en-IN"), "Jobs"]} />
            <Bar
              dataKey="jobs"
              fill="#8b5cf6"
              radius={[0, 6, 6, 0]}
              cursor="pointer"
              onClick={(payload) => {
                const fullName = String(
                  (payload as { fullName?: string; payload?: { fullName?: string } }).fullName ??
                    (payload as { payload?: { fullName?: string } }).payload?.fullName ??
                    ""
                );
                if (fullName) {
                  const selected = filterRows(sourceRows, "Employment Tier", fullName);
                  onDrill(buildDrill("Employment Ranking Drill-down", "Tier", fullName, selected, columns, [
                    ["Jobs", "Total Projected Jobs", "count"],
                    ["Investment", "Investment (INR Cr)", "cr"],
                    ["Industries", "Industry", "unique"],
                  ]));
                }
              }}
            />
          </BarChart>
        </StableChartContainer>
      </ChartPanel>
      <ChartPanel title="AI Disruption Risk Mix">
        <StableChartContainer height={260} className="px-2 pb-4">
          <PieChart>
            <Pie
              data={aiRiskData}
              dataKey="count"
              nameKey="name"
              outerRadius="72%"
              paddingAngle={2}
              cursor="pointer"
              onClick={(_, index) => {
                const item = aiRiskData[index];
                if (item?.fullName) {
                  const selected = filterRows(sourceRows, "AI Disruption Risk", String(item.fullName));
                  onDrill(buildDrill("Employment Ranking Drill-down", "AI risk", String(item.fullName), selected, columns, [
                    ["Jobs", "Total Projected Jobs", "count"],
                    ["Investment", "Investment (INR Cr)", "cr"],
                    ["Industries", "Industry", "unique"],
                  ]));
                }
              }}
            >
              {aiRiskData.map((entry, i) => (
                <Cell key={entry.name} fill={CHART_COLORS[i % CHART_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend wrapperStyle={{ fontSize: 11 }} />
          </PieChart>
        </StableChartContainer>
      </ChartPanel>
    </div>
  );
}

function SummaryCharts({
  rows,
  onDrill,
}: {
  rows?: Record<string, unknown>[];
  onDrill: (drill: DrillState) => void;
}) {
  const sourceRows = rows ?? [];
  const industries = aggregateRows(rows, "Industry", [
    ["investment", "Total Investment (INR Cr)"],
    ["jobs", "Projected Jobs (Total)"],
  ]).slice(0, 10);
  const regions = aggregateRows(rows, "Region", [["investment", "Total Investment (INR Cr)"]]);
  const columns = [
    "Region",
    "Industry",
    "Total Investment (INR Cr)",
    "Projected Jobs (Total)",
    "Major Locations",
    "Growth Outlook",
    "Investment Priority",
    "Key Drivers",
  ];

  return (
    <div className="grid gap-3 xl:grid-cols-2">
      <ChartPanel title="Executive Summary: Investment by Industry">
        <StableChartContainer height={260} className="px-2 pb-4">
          <BarChart data={industries} layout="vertical" margin={{ left: 12, right: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={formatShort} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={140} />
            <Tooltip formatter={(v: number) => [formatShort(v), "Investment (Cr)"]} />
            <Bar
              dataKey="investment"
              fill="#f97316"
              radius={[0, 6, 6, 0]}
              cursor="pointer"
              onClick={(payload) => {
                const fullName = String(
                  (payload as { fullName?: string; payload?: { fullName?: string } }).fullName ??
                    (payload as { payload?: { fullName?: string } }).payload?.fullName ??
                    ""
                );
                if (fullName) {
                  const selected = filterRows(sourceRows, "Industry", fullName);
                  onDrill(buildDrill("Executive Summary Drill-down", "Industry", fullName, selected, columns, [
                    ["Investment", "Total Investment (INR Cr)", "cr"],
                    ["Jobs", "Projected Jobs (Total)", "count"],
                    ["Rows", null, "count"],
                  ]));
                }
              }}
            />
          </BarChart>
        </StableChartContainer>
      </ChartPanel>
      <ChartPanel title="Investment Share by Region">
        <StableChartContainer height={260} className="px-2 pb-4">
          <PieChart>
            <Pie
              data={regions}
              dataKey="investment"
              nameKey="name"
              innerRadius="42%"
              outerRadius="72%"
              paddingAngle={2}
              cursor="pointer"
              onClick={(_, index) => {
                const item = regions[index];
                if (item?.fullName) {
                  const selected = filterRows(sourceRows, "Region", String(item.fullName));
                  onDrill(buildDrill("Executive Summary Drill-down", "Region", String(item.fullName), selected, columns, [
                    ["Investment", "Total Investment (INR Cr)", "cr"],
                    ["Jobs", "Projected Jobs (Total)", "count"],
                    ["Industries", "Industry", "unique"],
                  ]));
                }
              }}
            >
              {regions.map((entry, i) => (
                <Cell key={entry.name} fill={CHART_COLORS[i % CHART_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(v: number) => [formatShort(v), "Investment (Cr)"]} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
          </PieChart>
        </StableChartContainer>
      </ChartPanel>
    </div>
  );
}

function ChartPanel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="portal-panel">
      <div className="portal-panel-header">
        <h3 className="portal-panel-title">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function DrillPanel({ drill, onClear }: { drill: DrillState; onClear?: () => void }) {
  return (
    <div className="rounded-xl border border-blue-100 bg-blue-50/40 p-3">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wide text-blue-700">
            {drill.title}
          </p>
          <h3 className="mt-0.5 text-base font-bold text-slate-900">
            {drill.groupLabel}: {drill.groupValue}
          </h3>
          <p className="text-xs text-slate-500">
            {drill.rows.length} source row{drill.rows.length === 1 ? "" : "s"} matched from the workbook
          </p>
        </div>
        <button type="button" className="portal-btn-ghost text-xs" onClick={onClear}>
          Clear drill-down
        </button>
      </div>

      <div className="mb-3 grid gap-2 sm:grid-cols-3">
        {drill.metrics.map((metric) => (
          <div key={metric.label} className="rounded-lg border border-white/80 bg-white px-3 py-2">
            <p className="text-[10px] font-bold uppercase text-slate-500">{metric.label}</p>
            <p className={`mt-0.5 text-lg font-extrabold tabular-nums ${metric.tone ?? "text-slate-900"}`}>
              {metric.value}
            </p>
          </div>
        ))}
      </div>

      <WorkbookTable
        title="Matched workbook rows"
        rows={drill.rows}
        columns={drill.columns}
        compact
      />
    </div>
  );
}

function WorkbookTable({
  title,
  rows,
  columns,
  compact = false,
}: {
  title: string;
  rows?: Record<string, unknown>[];
  columns: string[];
  compact?: boolean;
}) {
  const displayRows = rows ?? [];
  const hasSourceLinks = displayRows.some((row) => Boolean(row.sourceUrl));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-slate-900">{title}</h3>
          <p className="text-xs text-slate-500">{displayRows.length} workbook rows</p>
        </div>
      </div>
      <div className="overflow-x-auto rounded-xl border border-slate-100 bg-white">
        <table className="portal-growth-table w-full min-w-[920px] text-left text-sm">
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column}>{column}</th>
              ))}
              {hasSourceLinks && <th>Details</th>}
            </tr>
          </thead>
          <tbody>
            {(compact ? displayRows.slice(0, 12) : displayRows).map((row, index) => (
              <tr key={index}>
                {columns.map((column) => (
                  <td key={column} className="max-w-[280px] align-top">
                    <span className="line-clamp-3">
                      {formatCell(row[column])}
                    </span>
                  </td>
                ))}
                {hasSourceLinks && (
                  <td className="align-top whitespace-nowrap">
                    {row.sourceUrl ? (
                      <a
                        href={String(row.sourceUrl)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-semibold text-[#2563eb] hover:text-[#1d4ed8]"
                      >
                        View details
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    ) : (
                      "—"
                    )}
                  </td>
                )}
              </tr>
            ))}
            {compact && displayRows.length > 12 && (
              <tr>
                <td colSpan={columns.length + (hasSourceLinks ? 1 : 0)} className="py-3 text-center text-xs font-semibold text-slate-500">
                  Showing 12 of {displayRows.length} matched rows
                </td>
              </tr>
            )}
            {displayRows.length === 0 && (
              <tr>
                <td colSpan={columns.length + (hasSourceLinks ? 1 : 0)} className="py-10 text-center text-slate-500">
                  No workbook rows found for this sheet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function formatCell(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "number") return value.toLocaleString("en-IN");
  return String(value);
}

function readNumber(value: unknown): number {
  if (typeof value === "number") return value;
  const parsed = Number(String(value ?? "").replace(/[^0-9.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function shortLabel(value: string, max = 16): string {
  return value.length > max ? `${value.slice(0, max - 1)}…` : value;
}

function formatShort(value: number): string {
  if (value >= 100000) return `${(value / 100000).toFixed(1)}L`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}k`;
  return value.toLocaleString("en-IN");
}

function aggregateRows(
  rows: Record<string, unknown>[] | undefined,
  groupKey: string,
  metrics: [outputKey: string, sourceKey: string | null][]
) {
  const map = new Map<string, Record<string, number | string>>();
  for (const row of rows ?? []) {
    const rawName = String(row[groupKey] ?? "Unknown").trim() || "Unknown";
    const name = shortLabel(rawName, 22);
    const existing = map.get(rawName) ?? { name, fullName: rawName };
    for (const [outputKey, sourceKey] of metrics) {
      existing[outputKey] = Number(existing[outputKey] ?? 0) + (sourceKey ? readNumber(row[sourceKey]) : 1);
    }
    map.set(rawName, existing);
  }

  const sortKey = metrics[0]?.[0] ?? "count";
  return Array.from(map.values()).sort(
    (a, b) => Number(b[sortKey] ?? 0) - Number(a[sortKey] ?? 0)
  ) as Array<Record<string, number | string> & { name: string; fullName: string }>;
}

function filterRows(rows: Record<string, unknown>[], key: string, value: string) {
  return rows.filter((row) => String(row[key] ?? "").trim() === value);
}

function buildDrill(
  title: string,
  groupLabel: string,
  groupValue: string,
  rows: Record<string, unknown>[],
  columns: string[],
  metricDefs: [label: string, sourceKey: string | null, mode: "count" | "cr" | "avg" | "unique"][]
): DrillState {
  return {
    title,
    groupLabel,
    groupValue,
    rows,
    columns,
    metrics: metricDefs.map(([label, sourceKey, mode]) => ({
      label,
      value: metricValue(rows, sourceKey, mode),
      tone: mode === "cr" ? "text-orange-600" : mode === "avg" ? "text-emerald-600" : "text-blue-700",
    })),
  };
}

function metricValue(
  rows: Record<string, unknown>[],
  sourceKey: string | null,
  mode: "count" | "cr" | "avg" | "unique"
): string {
  if (!sourceKey) return rows.length.toLocaleString("en-IN");
  if (mode === "unique") {
    return new Set(rows.map((row) => String(row[sourceKey] ?? "").trim()).filter(Boolean)).size.toLocaleString("en-IN");
  }

  const values = rows.map((row) => readNumber(row[sourceKey]));
  const total = values.reduce((sum, value) => sum + value, 0);
  if (mode === "avg") {
    return rows.length ? Math.round(total / rows.length).toLocaleString("en-IN") : "0";
  }
  if (mode === "cr") return `Rs ${formatShort(total)} Cr`;
  return total.toLocaleString("en-IN");
}
