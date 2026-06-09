"use client";

import type { ExtendedAnalytics } from "@/lib/jobAnalytics";
import { formatCount } from "@/lib/jobAnalytics";
import { LABOUR_COLORS } from "@/lib/chartTheme";
import { ZoneShell } from "@/components/vacancy/VacancyZoneParts";
import {
  LabourClusteredChart,
  LabourTypeCard,
  ShareDonutChart,
  VacancyKpiStrip,
} from "@/components/vacancy/charts/VacancyZoneCharts";

interface Props {
  analytics: ExtendedAnalytics;
  onDrillDown: (dimension: string, key: string) => void;
  embedded?: boolean;
}

export default function WorkforceZone({ analytics, onDrillDown, embedded = false }: Props) {
  const chartH = embedded ? 210 : 240;
  const stretch = !embedded;
  const labourPie = analytics.labourChartData.map((item) => ({
    key: item.key,
    name: item.name,
    value: item.vacancies,
    fill: LABOUR_COLORS[item.key as keyof typeof LABOUR_COLORS] || "#64748b",
  }));

  return (
    <ZoneShell compact>
      <div className={`flex flex-col gap-3 ${embedded ? "" : "h-full min-h-0"}`}>
        <VacancyKpiStrip
          accent={LABOUR_COLORS.skilled}
          items={analytics.labourChartData.map((l) => ({
            label: l.name,
            value: formatCount(l.vacancies),
            hint: `${l.listings} listings`,
            color: LABOUR_COLORS[l.key as keyof typeof LABOUR_COLORS],
          }))}
        />

        <div className={`grid grid-cols-1 gap-3 md:grid-cols-2 ${stretch ? "min-h-0 flex-1" : ""}`}>
          <LabourClusteredChart
            data={analytics.labourChartData}
            height={chartH}
            fill={stretch}
            onClick={(key) => onDrillDown("labourType", key)}
          />
          <ShareDonutChart
            title="Vacancy share"
            data={labourPie}
            height={chartH}
            fill={stretch}
            onClick={(key) => onDrillDown("labourType", key)}
          />
        </div>

        <div className="grid shrink-0 grid-cols-2 gap-2 lg:grid-cols-4">
          {analytics.labourChartData.map((item) => (
            <LabourTypeCard
              key={item.key}
              item={item}
              totalVacancies={analytics.totalVacancies}
              onClick={() => onDrillDown("labourType", item.key)}
            />
          ))}
        </div>
      </div>
    </ZoneShell>
  );
}
