"use client";

import { useMemo, useState } from "react";
import type { ExtendedAnalytics } from "@/lib/jobAnalytics";
import { formatCount } from "@/lib/jobAnalytics";
import { LABOUR_COLORS, PIE_PALETTE } from "@/lib/chartTheme";
import { ZoneShell, Paginator, usePagination } from "@/components/vacancy/VacancyZoneParts";
import {
  BoardRecruiterCard,
  collapseToTopWithOther,
  HorizontalVacancyChart,
  ShareDonutChart,
  VacancyKpiStrip,
} from "@/components/vacancy/charts/VacancyZoneCharts";

const PAGE_SIZE = 4;

interface Props {
  analytics: ExtendedAnalytics;
  onDrillDown: (dimension: string, key: string) => void;
  embedded?: boolean;
}

export default function RecruitersZone({ analytics, onDrillDown, embedded = false }: Props) {
  const chartH = embedded ? 210 : 240;
  const stretch = !embedded;
  const [page, setPage] = useState(1);
  const boards = analytics.boardVacancyBars;
  const { pageItems, totalPages, safePage } = usePagination(boards, PAGE_SIZE, page);

  const listingsByBoard = useMemo(() => {
    const map = new Map(analytics.byBoard.map((b) => [b.key, b.count]));
    return map;
  }, [analytics.byBoard]);

  const avgSkilledPct = useMemo(() => {
    if (!boards.length) return 0;
    const total = boards.reduce((s, b) => s + b.skilled + b.unskilled, 0) || 1;
    return Math.round((boards.reduce((s, b) => s + b.skilled, 0) / total) * 100);
  }, [boards]);

  const applicationPie = analytics.applicationBars.map((item, i) => ({
    key: item.key,
    name: item.name,
    value: item.vacancies,
    fill: PIE_PALETTE[(i + 2) % PIE_PALETTE.length],
  }));

  const boardChartData = useMemo(
    () =>
      collapseToTopWithOther(
        boards.map((b) => ({ key: b.key, name: b.name, vacancies: b.vacancies })),
        8
      ),
    [boards]
  );

  return (
    <ZoneShell compact>
      <div className={`flex flex-col gap-3 ${embedded ? "" : "h-full min-h-0"}`}>
        <VacancyKpiStrip
          accent="#2563eb"
          items={[
            { label: "Boards", value: String(boards.length) },
            { label: "Top board", value: boards[0]?.name?.slice(0, 16) || "—", hint: boards[0] ? formatCount(boards[0].vacancies) : undefined },
            { label: "Avg skilled", value: `${avgSkilledPct}%`, color: LABOUR_COLORS.skilled },
          ]}
        />

        <div className={`grid grid-cols-1 gap-3 md:grid-cols-2 ${stretch ? "min-h-0 flex-1" : ""}`}>
          <HorizontalVacancyChart
            title="Recruitment boards"
            data={boardChartData}
            height={chartH}
            fillHeight={stretch}
            fill="#2563eb"
            onClick={(key) => {
              if (key !== "__other__") onDrillDown("board", key);
            }}
          />
          <ShareDonutChart
            title="How to apply"
            data={applicationPie}
            height={chartH}
            fill={stretch}
            onClick={(key) => onDrillDown("applicationType", key)}
          />
        </div>

        <div className="grid shrink-0 grid-cols-2 gap-2 lg:grid-cols-4">
          {pageItems.map((board) => (
            <BoardRecruiterCard
              key={board.key}
              board={board}
              listings={listingsByBoard.get(board.key) ?? 0}
              accent="#2563eb"
              avgSkilledPct={avgSkilledPct}
              onClick={() => onDrillDown("board", board.key)}
            />
          ))}
        </div>
        <Paginator page={safePage} totalPages={totalPages} onPage={setPage} />
      </div>
    </ZoneShell>
  );
}
