"use client";

import { useMemo } from "react";
import type { InvestmentPredictionsResponse } from "@/lib/investmentTypes";
import {
  buildDistrictRows,
  computeGrowthKpis,
} from "@/lib/investmentPortalAnalytics";
import PortalGrowthKpiRow from "./PortalGrowthKpiRow";
import PortalGrowthCharts from "./PortalGrowthCharts";
import PortalDistrictTable from "./PortalDistrictTable";

interface Props {
  data: InvestmentPredictionsResponse;
  onOpenDetailedAnalysis: () => void;
  syncing?: boolean;
  onSync?: () => void;
}

export default function PortalGrowthDashboard({
  data,
  onOpenDetailedAnalysis,
  syncing,
  onSync,
}: Props) {
  const kpis = useMemo(() => computeGrowthKpis(data), [data]);
  const districtRows = useMemo(() => buildDistrictRows(data), [data]);

  return (
    <div className="space-y-5 pb-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Growth &amp; Investment Overview</h2>
          <p className="text-xs text-slate-500">
            Sector investment forecasts · {data.summary.sectorCount} sectors tracked
          </p>
        </div>
        {onSync && (
          <button
            type="button"
            className="portal-btn-primary text-xs"
            onClick={onSync}
            disabled={syncing}
          >
            {syncing ? "Refreshing…" : "Refresh data"}
          </button>
        )}
      </div>

      <PortalGrowthKpiRow kpis={kpis} />

      <PortalGrowthCharts data={data} />

      <PortalDistrictTable rows={districtRows} />

      <button
        type="button"
        onClick={onOpenDetailedAnalysis}
        className="portal-btn-primary portal-btn-blinker w-full justify-center py-3"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        Get Detailed Analysis
      </button>
    </div>
  );
}
