"use client";

import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { InvestmentPredictionsResponse } from "@/lib/investmentTypes";
import type { AiRecommendationsResponse } from "@/lib/aiRecommendationsTypes";
import {
  buildDistrictRows,
  buildSectorJobData,
  buildTrendData,
  computeGrowthKpis,
  formatCount,
} from "@/lib/investmentPortalAnalytics";
import { formatWorkforce } from "@/lib/aiRecommendationsApi";
import PortalGrowthKpiRow from "./PortalGrowthKpiRow";
import PortalGrowthCharts from "./PortalGrowthCharts";
import PortalDistrictTable from "./PortalDistrictTable";

export type GrowthAnalysisSectionId =
  | "overview"
  | "sectors"
  | "districts"
  | "trends"
  | "recommendations"
  | "projects";

const SECTIONS: { id: GrowthAnalysisSectionId; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "sectors", label: "Sectors" },
  { id: "districts", label: "Districts" },
  { id: "trends", label: "Trends" },
  { id: "recommendations", label: "Recommendations" },
  { id: "projects", label: "Projects" },
];

const SIGNAL_COLORS = {
  high: "#2563eb",
  medium: "#f97316",
  low: "#94a3b8",
};

interface Props {
  data: InvestmentPredictionsResponse;
  aiData?: AiRecommendationsResponse | null;
  stateName: string;
  onBack: () => void;
}

export default function PortalGrowthDetailedAnalysis({
  data,
  aiData,
  stateName,
  onBack,
}: Props) {
  const [active, setActive] = useState<GrowthAnalysisSectionId>("overview");

  const kpis = useMemo(() => computeGrowthKpis(data), [data]);
  const districtRows = useMemo(() => buildDistrictRows(data), [data]);
  const trendData = useMemo(() => buildTrendData(data), [data]);
  const sectorData = useMemo(() => buildSectorJobData(data), [data]);

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
          <p className="text-xs text-slate-500">{stateName} · Growth &amp; Investment</p>
        </div>
      </div>

      <div className="portal-analysis-tabs mb-3">
        {SECTIONS.map((section) => (
          <button
            key={section.id}
            type="button"
            onClick={() => setActive(section.id)}
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
              <PortalGrowthCharts data={data} compact />
            </div>
          )}

          {active === "sectors" && (
            <div className="space-y-4">
              <div className="portal-panel">
                <div className="portal-panel-header">
                  <h3 className="portal-panel-title">Sector Forecast</h3>
                </div>
                <div className="h-[240px] px-2 pb-4">
                  <ResponsiveContainer width="100%" height="100%" minWidth={0}>
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
                      <Bar dataKey="jobs" radius={[6, 6, 0, 0]}>
                        {sectorData.map((entry) => (
                          <Cell key={entry.fullName} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
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
                  </div>
                ))}
              </div>
            </div>
          )}

          {active === "districts" && <PortalDistrictTable rows={districtRows} />}

          {active === "trends" && (
            <div className="portal-panel">
              <div className="portal-panel-header">
                <h3 className="portal-panel-title">Investment vs Job Creation Trend</h3>
              </div>
              <div className="h-[320px] px-2 pb-4">
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
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
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {active === "recommendations" && (
            <div className="space-y-3">
              {aiData?.recommendations?.length ? (
                aiData.recommendations.slice(0, 12).map((rec) => (
                  <div
                    key={rec.id}
                    className="rounded-xl border border-slate-100 bg-slate-50/50 p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <p className="text-sm font-bold text-slate-900">{rec.title}</p>
                      <span className="rounded-md bg-blue-100 px-2 py-0.5 text-[11px] font-semibold text-blue-700">
                        {rec.priority}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      {rec.sector} · {rec.region} · {rec.department}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-4 text-xs">
                      <span>
                        Skill gap:{" "}
                        <strong className="text-orange-600">
                          {formatWorkforce(rec.skillGap)}
                        </strong>
                      </span>
                      <span>
                        Budget: <strong>{rec.budgetCr} Cr</strong>
                      </span>
                      <span>
                        AI confidence: <strong>{rec.aiConfidence}%</strong>
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-xl border border-dashed border-slate-200 py-12 text-center text-sm text-slate-500">
                  AI recommendations will appear here when available.
                </div>
              )}
            </div>
          )}

          {active === "projects" && (
            <div className="overflow-x-auto">
              <table className="portal-growth-table w-full min-w-[680px] text-left text-sm">
                <thead>
                  <tr>
                    <th>Sector / Project</th>
                    <th>Investment Signal</th>
                    <th>Score</th>
                    <th>6M Jobs</th>
                    <th>12M Jobs</th>
                    <th>Confidence</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.sectors.map((sector) => (
                    <tr key={sector.id}>
                      <td className="font-semibold text-slate-800">{sector.name}</td>
                      <td>
                        <span
                          className="rounded-md px-2 py-0.5 text-[11px] font-semibold capitalize"
                          style={{
                            backgroundColor: `${SIGNAL_COLORS[sector.investmentSignal]}18`,
                            color: SIGNAL_COLORS[sector.investmentSignal],
                          }}
                        >
                          {sector.investmentSignal}
                        </span>
                      </td>
                      <td>{sector.investmentScore}</td>
                      <td className="text-emerald-600">
                        {sector.predictedOpenings6m.toLocaleString("en-IN")}
                      </td>
                      <td className="text-orange-500">
                        {sector.predictedOpenings12m.toLocaleString("en-IN")}
                      </td>
                      <td>{sector.confidence}%</td>
                      <td>
                        <span className="inline-flex items-center gap-1.5 text-xs">
                          <span
                            className={`h-2 w-2 rounded-full ${
                              sector.liveOnSite ? "bg-emerald-500" : "bg-amber-400"
                            }`}
                          />
                          {sector.liveOnSite ? "Active" : "Pipeline"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
