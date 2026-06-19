"use client";

import type { NcsJob } from "@/lib/ncsJobTypes";
import {
  formatExperience,
  formatJobType,
  formatSalaryLpa,
  timeAgo,
} from "@/lib/ncsJobsApi";

interface Props {
  jobs: NcsJob[];
  totalCount?: number;
}

function locationLabel(job: NcsJob): string {
  if (job.city && job.state) return `${job.city}, ${job.state}`;
  if (job.city) return job.city;
  if (job.state) return job.state;
  const loc = job.locations?.[0];
  if (loc?.city && loc?.state) return `${loc.city}, ${loc.state}`;
  return "India";
}

export default function PortalNcsVacancyList({ jobs, totalCount }: Props) {
  return (
    <div className="portal-panel portal-vacancy-panel">
      <div className="portal-panel-header shrink-0">
        <h2 className="portal-panel-title">Vacancies</h2>
        <span className="shrink-0 text-xs text-slate-500">
          {(totalCount ?? jobs.length).toLocaleString("en-IN")} private sector listings
        </span>
      </div>

      <div className="portal-vacancy-list">
        {jobs.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-500">
            No vacancies match your filters. Run sync to fetch all available jobs nationally.
          </p>
        ) : (
          jobs.map((job) => (
            <article key={job.id} className="portal-vacancy-card">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex flex-wrap gap-2">
                    {job.job_type && (
                      <span className="portal-tag-permanent">{formatJobType(job.job_type)}</span>
                    )}
                    {job.functional_area && (
                      <span className="portal-tag-skilled">{job.functional_area}</span>
                    )}
                    {job.industry && (
                      <span className="portal-tag-semi">{job.industry}</span>
                    )}
                  </div>

                  <h3 className="text-base font-bold text-slate-900">{job.job_title}</h3>
                  <p className="mt-0.5 text-sm text-slate-500">
                    {job.organization_name || "Private employer"} • {locationLabel(job)}
                  </p>

                  <div className="mt-2 flex flex-wrap gap-4 text-xs text-slate-500">
                    <span>{formatExperience(job.min_experience, job.max_experience)}</span>
                    <span>
                      {formatSalaryLpa(job.min_salary, job.max_salary, job.hide_salary_range)}
                    </span>
                    {job.no_of_vacancies != null && job.no_of_vacancies > 0 && (
                      <span>{job.no_of_vacancies} openings</span>
                    )}
                    <span>{job.applicant_count} applicants</span>
                    <span>Posted {timeAgo(job.published_at)}</span>
                  </div>

                  {job.functional_role && (
                    <p className="mt-1 text-xs font-medium text-slate-600">{job.functional_role}</p>
                  )}

                  <p className="mt-2 line-clamp-3 text-sm text-slate-600">{job.job_description}</p>

                  {job.required_skills?.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {job.required_skills.slice(0, 6).map((skill) => (
                        <span
                          key={skill}
                          className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}

                  {job.expired_at && (
                    <p className="mt-2 text-xs text-slate-400">
                      Closes {new Date(job.expired_at).toLocaleDateString("en-IN")}
                    </p>
                  )}
                </div>

                <div className="flex shrink-0 flex-col items-end gap-2">
                  <a
                    href={job.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="portal-btn-view"
                  >
                    View job
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
