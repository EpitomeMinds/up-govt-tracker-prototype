"use client";

import UPCityMap from "@/components/map/MapWrapper";
import type { ExtendedAnalytics, JobEnriched } from "@/lib/jobAnalytics";
import { formatCount } from "@/lib/jobAnalytics";
import { ZoneShell } from "@/components/vacancy/VacancyZoneParts";
import {
  CityRankingPanel,
  CityShareDonutChart,
  VacancyKpiStrip,
} from "@/components/vacancy/charts/VacancyZoneCharts";

interface Props {
  enriched: JobEnriched[];
  analytics: ExtendedAnalytics;
  selectedCityId: string;
  selectedDistrict: string;
  onSelectCity: (id: string) => void;
  onSelectDistrict: (district: string) => void;
  onDrillDown: (dimension: string, key: string) => void;
  embedded?: boolean;
}

export default function MapZone({
  enriched,
  analytics,
  selectedCityId,
  selectedDistrict,
  onSelectCity,
  onSelectDistrict,
  onDrillDown,
  embedded = false,
}: Props) {
  const cities = analytics.byCity;
  const chartH = embedded ? 200 : 240;

  return (
    <ZoneShell compact>
      <div className={`flex flex-col gap-3 ${embedded ? "" : "h-full min-h-0"}`}>
        <VacancyKpiStrip
          accent="#0891b2"
          items={[
            { label: "Cities", value: String(cities.length) },
            {
              label: "Top city",
              value: cities[0]?.name?.slice(0, 16) || "—",
              hint: cities[0] ? formatCount(cities[0].vacancies) : undefined,
              color: "#0891b2",
            },
            {
              label: "Vacancies",
              value: formatCount(cities.reduce((s, c) => s + c.vacancies, 0)),
            },
          ]}
        />

        <div
          className={`grid gap-3 ${embedded ? "grid-cols-1 xl:grid-cols-12" : "min-h-0 flex-1 grid-cols-12"}`}
        >
          <div className={`bi-widget overflow-hidden ${embedded ? "xl:col-span-7" : "col-span-7 min-h-0"}`}>
            <UPCityMap
              jobs={enriched}
              selectedCityId={selectedCityId}
              selectedDistrict={selectedDistrict}
              onSelectCity={onSelectCity}
              onSelectDistrict={onSelectDistrict}
              compact={embedded}
            />
          </div>

          <div
            className={`flex flex-col gap-3 ${embedded ? "xl:col-span-5" : "col-span-5 min-h-0"}`}
          >
            <CityShareDonutChart
              data={cities}
              height={chartH}
              fill={false}
              onClick={(key) => onDrillDown("city", key)}
            />
            <CityRankingPanel
              cities={cities}
              selectedCityId={selectedCityId}
              onSelect={(key) => onDrillDown("city", key)}
              maxHeight={embedded ? 260 : undefined}
            />
          </div>
        </div>
      </div>
    </ZoneShell>
  );
}
