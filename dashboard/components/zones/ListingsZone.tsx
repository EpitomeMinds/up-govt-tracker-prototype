"use client";

import { useState } from "react";
import type { JobEnriched } from "@/lib/jobAnalytics";
import { formatCount, computeExtendedAnalytics } from "@/lib/jobAnalytics";
import JobsTable from "@/components/JobsTable";
import { ZoneShell, Paginator, usePagination } from "@/components/vacancy/VacancyZoneParts";
import { VacancyKpiStrip } from "@/components/vacancy/charts/VacancyZoneCharts";
import { LABOUR_COLORS } from "@/lib/chartTheme";

const PAGE_SIZE = 20;

type ViewMode = "scroll" | "pages";

interface Props {
  jobs: JobEnriched[];
}

export default function ListingsZone({ jobs }: Props) {
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<ViewMode>("scroll");
  const analytics = computeExtendedAnalytics(jobs);
  const { pageItems, totalPages, safePage } = usePagination(jobs, PAGE_SIZE, page);
  const displayJobs = viewMode === "scroll" ? jobs : pageItems;

  return (
    <ZoneShell compact>
      <div className="flex h-full min-h-0 flex-col gap-3">
        <VacancyKpiStrip
          accent="#2563eb"
          items={[
            { label: "Showing", value: String(jobs.length), hint: "After filters" },
            { label: "Vacancies", value: formatCount(analytics.totalVacancies) },
            { label: "Skilled", value: formatCount(analytics.labourMetrics.skilled.vacancies), color: LABOUR_COLORS.skilled },
            { label: "Closing soon", value: formatCount(analytics.closingSoon), color: "#f59e0b" },
          ]}
        />

        <div className="bi-widget flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="flex shrink-0 items-center justify-between gap-3 border-b border-bi-border/60 px-4 py-2.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-bi-muted">View</span>
              <div className="flex rounded-lg bg-bi-canvas p-0.5 ring-1 ring-bi-border/60">
                <button
                  type="button"
                  onClick={() => setViewMode("scroll")}
                  className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                    viewMode === "scroll"
                      ? "bg-white text-bi-accent shadow-sm ring-1 ring-bi-border/60"
                      : "text-bi-muted hover:text-bi-title"
                  }`}
                >
                  Scroll all
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("pages")}
                  className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                    viewMode === "pages"
                      ? "bg-white text-bi-accent shadow-sm ring-1 ring-bi-border/60"
                      : "text-bi-muted hover:text-bi-title"
                  }`}
                >
                  Paginated
                </button>
              </div>
            </div>
            <span className="text-xs text-bi-muted">
              {viewMode === "scroll"
                ? `${jobs.length} listings · scroll to browse`
                : `Page ${safePage} of ${totalPages} · ${PAGE_SIZE} per page`}
            </span>
          </div>

          <div className="min-h-0 flex-1 overflow-auto">
            <JobsTable jobs={displayJobs} loading={false} embedded stickyHeader />
          </div>

          {viewMode === "pages" && (
            <Paginator page={safePage} totalPages={totalPages} onPage={setPage} />
          )}
        </div>
      </div>
    </ZoneShell>
  );
}
