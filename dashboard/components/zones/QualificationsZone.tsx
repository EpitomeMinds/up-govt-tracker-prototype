"use client";

import { useMemo, useState } from "react";
import type { ExtendedAnalytics } from "@/lib/jobAnalytics";
import { formatCount } from "@/lib/jobAnalytics";
import { EDUCATION_COLORS } from "@/lib/chartTheme";
import { ZoneShell, Paginator, usePagination } from "@/components/vacancy/VacancyZoneParts";
import {
  collapseToTopWithOther,
  HorizontalVacancyChart,
  QualDemandCard,
  ShareDonutChart,
  VacancyKpiStrip,
} from "@/components/vacancy/charts/VacancyZoneCharts";

const PAGE_SIZE = 4;

interface Props {
  analytics: ExtendedAnalytics;
  onDrillDown: (dimension: string, key: string) => void;
}

export default function QualificationsZone({ analytics, onDrillDown }: Props) {
  const [page, setPage] = useState(1);
  const qualItems = analytics.qualDemandBars;
  const { pageItems, totalPages, safePage } = usePagination(qualItems, PAGE_SIZE, page);
  const maxQualVac = qualItems[0]?.vacancies ?? 1;

  const educationPie = analytics.educationBars.map((item, i) => ({
    key: item.key,
    name: item.name,
    value: item.vacancies,
    fill: EDUCATION_COLORS[i % EDUCATION_COLORS.length],
  }));

  const qualChartData = useMemo(
    () => collapseToTopWithOther(analytics.qualDemandBars, 12),
    [analytics.qualDemandBars]
  );

  return (
    <ZoneShell compact>
      <div className="flex h-full min-h-0 flex-col gap-3">
        <VacancyKpiStrip
          accent="#6c5ce7"
          items={[
            { label: "Top tier", value: analytics.educationBars[0]?.name?.slice(0, 14) || "—", hint: analytics.educationBars[0] ? formatCount(analytics.educationBars[0].vacancies) : undefined, color: "#6c5ce7" },
            { label: "Top qual", value: analytics.qualDemandBars[0]?.name?.slice(0, 14) || "—", hint: analytics.qualDemandBars[0] ? formatCount(analytics.qualDemandBars[0].vacancies) : undefined },
          ]}
        />

        <div className="grid min-h-0 flex-1 grid-cols-2 gap-3">
          <ShareDonutChart
            title="Education tier split"
            data={educationPie}
            fill
            onClick={(key) => onDrillDown("educationTier", key)}
          />
          <HorizontalVacancyChart
            title="Qualification tags"
            data={qualChartData}
            fillHeight
            fill="#7c3aed"
            onClick={(key) => {
              if (key !== "__other__") onDrillDown("qualification", key);
            }}
          />
        </div>

        <div className="grid shrink-0 grid-cols-2 gap-2 lg:grid-cols-4">
          {pageItems.map((q, i) => (
            <QualDemandCard
              key={q.key}
              item={q}
              rank={(safePage - 1) * PAGE_SIZE + i + 1}
              maxVacancies={maxQualVac}
              onClick={() => onDrillDown("qualification", q.key)}
            />
          ))}
        </div>
        <Paginator page={safePage} totalPages={totalPages} onPage={setPage} />
      </div>
    </ZoneShell>
  );
}
