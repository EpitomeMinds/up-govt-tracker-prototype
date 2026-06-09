"use client";

import type { ExtendedAnalytics } from "@/lib/jobAnalytics";
import { formatCount } from "@/lib/jobAnalytics";
import KpiCard from "@/components/KpiCard";
import { KpiIconChart, KpiIconClock, KpiIconPeople, KpiIconSkilled } from "@/components/KpiIcons";
import { ZoneShell } from "@/components/vacancy/VacancyZoneParts";
import {
  buildOverviewCharts,
  HorizontalVacancyChart,
  LabourClusteredChart,
  ShareDonutChart,
} from "@/components/vacancy/charts/VacancyZoneCharts";

interface Props {
  analytics: ExtendedAnalytics;
  onDrillDown: (dimension: string, key: string) => void;
  embedded?: boolean;
}

export default function OverviewZone({ analytics, onDrillDown, embedded = false }: Props) {
  const { categoryBars, applicationPie, educationPie } = buildOverviewCharts(analytics);
  const chartH = embedded ? 210 : 240;
  const stretch = !embedded;

  return (
    <ZoneShell compact>
      <div className={`flex flex-col gap-3 ${embedded ? "" : "h-full min-h-0"}`}>
        <div className="grid shrink-0 grid-cols-2 gap-3 xl:grid-cols-4">
          <KpiCard label="Total vacancies" value={formatCount(analytics.totalVacancies)} delta={`${analytics.totalListings} listings`} accent="blue" icon={<KpiIconChart />} />
          <KpiCard label="Skilled" value={formatCount(analytics.labourMetrics.skilled.vacancies)} delta={`${analytics.skilledVacancyPct}% share`} accent="teal" icon={<KpiIconSkilled />} />
          <KpiCard label="Unskilled" value={formatCount(analytics.labourMetrics.unskilled.vacancies)} delta={`${analytics.unskilledVacancyPct}% share`} accent="coral" icon={<KpiIconPeople />} />
          <KpiCard label="Closing soon" value={formatCount(analytics.closingSoon)} delta="Urgent deadlines" accent="amber" icon={<KpiIconClock />} />
        </div>

        <div className={`grid grid-cols-1 gap-3 md:grid-cols-2 ${stretch ? "min-h-0 flex-1 grid-rows-2" : ""}`}>
          <LabourClusteredChart
            data={analytics.labourChartData}
            height={chartH}
            fill={stretch}
            onClick={(key) => onDrillDown("labourType", key)}
          />
          <HorizontalVacancyChart
            title="Vacancies by sector"
            data={categoryBars}
            height={chartH}
            fillHeight={stretch}
            maxItems={7}
            fill="#2563eb"
            onClick={(key) => onDrillDown("postCategory", key)}
          />
          <ShareDonutChart
            title="Education tier split"
            data={educationPie}
            height={chartH}
            fill={stretch}
            onClick={(key) => onDrillDown("educationTier", key)}
          />
          <ShareDonutChart
            title="How to apply"
            data={applicationPie}
            height={chartH}
            fill={stretch}
            onClick={(key) => onDrillDown("applicationType", key)}
          />
        </div>
      </div>
    </ZoneShell>
  );
}
