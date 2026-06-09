"use client";

import type { JobEnriched } from "@/lib/jobAnalytics";
import { formatCount } from "@/lib/jobAnalytics";
import { formatDate } from "@/lib/api";

interface Props {
  jobs: JobEnriched[];
}

function labourTagClass(type: string) {
  if (type === "skilled") return "portal-tag-skilled";
  if (type === "unskilled") return "portal-tag-unskilled";
  if (type === "semi_skilled") return "portal-tag-semi";
  return "portal-tag-general";
}

function estimateSalary(job: JobEnriched): string {
  if (job.educationTier === "professional") return "₹55,000 per month";
  if (job.educationTier === "post_graduate" || job.educationTier === "graduate")
    return "₹35,000 – ₹45,000 per month";
  if (job.educationTier === "iti_diploma") return "₹18,000 – ₹25,000 per month";
  return "As per govt pay scale";
}

export default function PortalVacancyList({ jobs }: Props) {
  return (
    <div className="portal-panel portal-vacancy-panel">
      <div className="portal-panel-header shrink-0">
        <h2 className="portal-panel-title">Vacancies</h2>
        <span className="shrink-0 text-xs text-slate-500">{jobs.length} listings</span>
      </div>

      <div className="portal-vacancy-list">
        {jobs.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-500">No vacancies match your filters.</p>
        ) : (
          jobs.map((job) => (
            <article key={job.id} className="portal-vacancy-card">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex flex-wrap gap-2">
                    <span className={labourTagClass(job.labourType)}>{job.labourLabel}</span>
                    <span className="portal-tag-permanent">
                      {job.applicationType === "walk_in" ? "Walk-in" : "Permanent"}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900">{job.title}</h3>
                  <p className="mt-0.5 text-sm text-slate-500">
                    {job.post_board || "UP Govt"} • {job.cityName || job.districtName || "Uttar Pradesh"}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-4 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5z" />
                      </svg>
                      {job.educationLabel}
                    </span>
                    <span className="flex items-center gap-1">
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {job.postCount ? `${formatCount(job.postCount)} Posts` : "Multiple Posts"}
                    </span>
                    <span className="flex items-center gap-1">
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {formatDate(job.last_date_parsed)}
                    </span>
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm text-slate-600">
                    {job.qualification || job.categoryLabel} — {job.applicationLabel} recruitment by{" "}
                    {job.post_board || "UP Government"}.
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2">
                  <p className="text-right text-sm font-bold text-slate-800">{estimateSalary(job)}</p>
                  <a
                    href={job.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="portal-btn-view"
                  >
                    View Details
                  </a>
                </div>
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  );
}
