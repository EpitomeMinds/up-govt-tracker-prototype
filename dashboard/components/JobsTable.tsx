"use client";

import type { JobEnriched } from "@/lib/jobAnalytics";
import { formatCount } from "@/lib/jobAnalytics";

interface Props {
  jobs: JobEnriched[];
  loading?: boolean;
  embedded?: boolean;
  stickyHeader?: boolean;
}

const LABOUR_BADGE: Record<string, string> = {
  skilled: "bi-badge-teal",
  semi_skilled: "bi-badge-amber",
  unskilled: "bi-badge-coral",
  general: "bi-badge-slate",
};

const TIER_BADGE: Record<string, string> = {
  below_10: "bi-badge-slate",
  "10th": "bi-badge-amber",
  "12th": "bi-badge-teal",
  iti_diploma: "bi-badge-blue",
  graduate: "bi-badge-blue",
  post_graduate: "bi-badge-violet",
  professional: "bi-badge-violet",
};

export default function JobsTable({ jobs, loading, embedded = false, stickyHeader = false }: Props) {
  if (loading) {
    return (
      <div className="bi-widget flex items-center justify-center p-16 text-bi-muted">
        <div className="text-center">
          <div className="bi-spinner mx-auto mb-3" />
          <p className="text-sm font-medium">Loading jobs…</p>
        </div>
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="bi-widget flex flex-col items-center justify-center p-16 text-center">
        <p className="text-sm font-semibold text-bi-title">No matching jobs</p>
        <p className="mt-1 max-w-sm text-xs text-bi-muted">
          Try clearing filters or adjust your search criteria.
        </p>
      </div>
    );
  }

  const table = (
    <div className={embedded ? "min-h-0" : "bi-widget overflow-hidden"}>
      <div className={embedded ? "overflow-visible" : "overflow-x-auto"}>
        <table className="bi-grid w-full min-w-[1200px] text-left text-sm">
          <thead className={stickyHeader ? "sticky top-0 z-10 bg-slate-50/95 backdrop-blur-sm shadow-sm" : undefined}>
            <tr>
              <th className="px-4 py-3.5">Posted</th>
              <th className="px-4 py-3.5">City</th>
              <th className="px-4 py-3.5">District</th>
              <th className="px-4 py-3.5">Board</th>
              <th className="px-4 py-3.5">Post</th>
              <th className="px-4 py-3.5">Category</th>
              <th className="px-4 py-3.5">Labour</th>
              <th className="px-4 py-3.5">Education</th>
              <th className="px-4 py-3.5">Qualification</th>
              <th className="px-4 py-3.5 text-center">Posts</th>
              <th className="px-4 py-3.5">Last Date</th>
              <th className="px-4 py-3.5">Apply</th>
            </tr>
          </thead>
          <tbody>
            {jobs.map((job) => (
              <tr key={job.id}>
                <td className="whitespace-nowrap px-4 py-3.5 text-bi-muted">
                  {job.post_date || "—"}
                </td>
                <td className="whitespace-nowrap px-4 py-3.5">
                  <span className="bi-badge bi-badge-blue">{job.cityName}</span>
                </td>
                <td className="whitespace-nowrap px-4 py-3.5">
                  <span className="bi-badge bi-badge-violet">{job.districtName}</span>
                </td>
                <td className="max-w-[120px] px-4 py-3.5">
                  <span className="font-semibold text-bi-title">{job.post_board}</span>
                </td>
                <td className="max-w-[200px] px-4 py-3.5">
                  <p className="font-semibold text-bi-title">{job.title}</p>
                  {job.advt_no && job.advt_no !== "–" && (
                    <p className="mt-0.5 text-xs text-bi-muted">{job.advt_no}</p>
                  )}
                </td>
                <td className="whitespace-nowrap px-4 py-3.5">
                  <span className="bi-badge bi-badge-slate">{job.categoryLabel}</span>
                </td>
                <td className="whitespace-nowrap px-4 py-3.5">
                  <span className={`bi-badge ${LABOUR_BADGE[job.labourType] || LABOUR_BADGE.general}`}>
                    {job.labourLabel}
                  </span>
                </td>
                <td className="whitespace-nowrap px-4 py-3.5">
                  <span className={`bi-badge ${TIER_BADGE[job.educationTier] || TIER_BADGE.graduate}`}>
                    {job.educationLabel}
                  </span>
                </td>
                <td className="max-w-[180px] px-4 py-3.5">
                  <div className="flex flex-wrap gap-1">
                    {job.qualTags.slice(0, 4).map((tag) => (
                      <span key={tag} className="bi-badge bi-badge-slate text-[10px]">
                        {tag}
                      </span>
                    ))}
                    {job.qualTags.length > 4 && (
                      <span className="text-[10px] text-bi-muted">+{job.qualTags.length - 4}</span>
                    )}
                  </div>
                </td>
                <td className="whitespace-nowrap px-4 py-3.5 text-center">
                  <span className="inline-block min-w-[2rem] rounded-lg bg-bi-accentSoft px-2.5 py-0.5 text-sm font-bold tabular-nums text-bi-accent">
                    {job.postCount !== null ? formatCount(job.postCount) : "—"}
                  </span>
                </td>
                <td className="whitespace-nowrap px-4 py-3.5">
                  <div>
                    <span
                      className={
                        job.isClosingSoon
                          ? "bi-badge bi-badge-coral"
                          : "text-bi-muted"
                      }
                    >
                      {job.last_date || "—"}
                    </span>
                    <p className="mt-0.5 text-[10px] text-bi-muted">{job.applicationLabel}</p>
                  </div>
                </td>
                <td className="px-4 py-3.5">
                  {job.link ? (
                    <a
                      href={job.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="whitespace-nowrap text-xs font-semibold text-bi-accent hover:underline"
                    >
                      Open →
                    </a>
                  ) : (
                    "—"
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return table;
}
