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
}

export default function MapZone({
  enriched,
  analytics,
  selectedCityId,
  selectedDistrict,
  onSelectCity,
  onSelectDistrict,
  onDrillDown,
}: Props) {
  const cities = analytics.byCity;

  return (
    <ZoneShell compact>
      <div className="flex h-full min-h-0 flex-col gap-3">
        <VacancyKpiStrip
          accent="#0891b2"
          items={[
            { label: "Cities", value: String(cities.length) },
            { label: "Top city", value: cities[0]?.name?.slice(0, 16) || "—", hint: cities[0] ? formatCount(cities[0].vacancies) : undefined, color: "#0891b2" },
            { label: "Vacancies", value: formatCount(cities.reduce((s, c) => s + c.vacancies, 0)) },
          ]}
        />

        <div className="grid min-h-0 flex-1 grid-cols-12 gap-3">
          <div className="bi-widget col-span-7 min-h-0 overflow-hidden">
            <UPCityMap
              jobs={enriched}
              selectedCityId={selectedCityId}
              selectedDistrict={selectedDistrict}
              onSelectCity={onSelectCity}
              onSelectDistrict={onSelectDistrict}
            />
          </div>

          <div className="col-span-5 flex min-h-0 flex-col gap-3">
            <CityShareDonutChart
              data={cities}
              fill
              onClick={(key) => onDrillDown("city", key)}
            />
            <CityRankingPanel
              cities={cities}
              selectedCityId={selectedCityId}
              onSelect={(key) => onDrillDown("city", key)}
            />
          </div>
        </div>
      </div>
    </ZoneShell>
  );
}
