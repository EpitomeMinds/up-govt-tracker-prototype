"use client";

import type { ExtendedAnalytics } from "@/lib/jobAnalytics";
import { formatCount } from "@/lib/jobAnalytics";
import UPCityMap from "@/components/map/MapWrapper";
import SinglePageCharts from "@/components/SinglePageCharts";
import type { JobEnriched } from "@/lib/jobAnalytics";

interface Props {
  analytics: ExtendedAnalytics;
  enriched: JobEnriched[];
  stateCode: string;
  showMap: boolean;
  selectedCityId: string;
  selectedDistrict: string;
  onSelectCity: (id: string) => void;
  onSelectDistrict: (district: string) => void;
  onDrillDown: (dimension: string, key: string) => void;
}

export default function SinglePageDashboard({
  analytics,
  enriched,
  stateCode,
  showMap,
  selectedCityId,
  selectedDistrict,
  onSelectCity,
  onSelectDistrict,
  onDrillDown,
}: Props) {
  const kpis = [
    { label: "Vacancies", value: formatCount(analytics.totalVacancies), accent: "text-slate-900" },
    { label: "Skilled", value: formatCount(analytics.labourMetrics.skilled.vacancies), accent: "text-emerald-600" },
    { label: "Unskilled", value: formatCount(analytics.labourMetrics.unskilled.vacancies), accent: "text-red-600" },
    { label: "Closing soon", value: formatCount(analytics.closingSoon), accent: "text-amber-600" },
    { label: "Listings", value: String(analytics.totalListings), accent: "text-blue-600" },
  ];

  return (
    <div className="single-page-grid grid h-full min-h-0 grid-cols-12 grid-rows-[2rem_1fr_1fr_1fr] gap-1.5">
      <div className="col-span-12 grid grid-cols-5 gap-1.5">
        {kpis.map((k) => (
          <div
            key={k.label}
            className="flex items-center justify-between rounded-lg border border-slate-200/80 bg-white px-2.5 py-1 shadow-sm"
          >
            <span className="text-[10px] font-medium uppercase text-slate-400">{k.label}</span>
            <span className={`text-sm font-bold tabular-nums ${k.accent}`}>{k.value}</span>
          </div>
        ))}
      </div>

      {showMap ? (
        <div className="col-span-4 row-span-3 min-h-0 overflow-hidden rounded-lg border border-slate-200/80 bg-white shadow-sm">
          <UPCityMap
            compact
            jobs={enriched}
            selectedCityId={selectedCityId}
            selectedDistrict={selectedDistrict}
            onSelectCity={onSelectCity}
            onSelectDistrict={onSelectDistrict}
          />
        </div>
      ) : (
        <div className="col-span-4 row-span-3 flex min-h-0 items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 text-xs text-slate-400">
          Map available for {stateCode}
        </div>
      )}

      <SinglePageCharts analytics={analytics} onDrillDown={onDrillDown} />
    </div>
  );
}
