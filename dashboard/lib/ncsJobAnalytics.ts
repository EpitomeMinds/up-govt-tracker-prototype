import type { NcsDashboardFilters, NcsJob } from "./ncsJobTypes";

export const DEFAULT_NCS_FILTERS: NcsDashboardFilters = {
  q: "",
  city: "",
  state: "",
  jobType: "",
  functionalArea: "",
  industry: "",
  organization: "",
  functionalRole: "",
  jobTitle: "",
  salaryBand: "",
  experienceBand: "",
  minSalary: "",
  maxSalary: "",
  minExperience: "",
  maxExperience: "",
  sort: "published_at",
  order: "desc",
};

export function applyNcsFilters(jobs: NcsJob[], filters: NcsDashboardFilters): NcsJob[] {
  return jobs.filter((job) => {
    if (filters.q) {
      const q = filters.q.toLowerCase();
      const haystack = [
        job.job_title,
        job.organization_name,
        job.functional_area,
        job.job_description,
        job.city,
        job.state,
        ...(job.required_skills || []),
      ]
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    if (filters.city && job.city !== filters.city) return false;
    if (filters.state && job.state !== filters.state) return false;
    if (filters.jobType && job.job_type !== filters.jobType) return false;
    if (filters.functionalArea && job.functional_area !== filters.functionalArea) return false;
    if (filters.industry && job.industry !== filters.industry) return false;
    if (filters.organization && job.organization_name !== filters.organization) return false;
    if (filters.functionalRole && job.functional_role !== filters.functionalRole) return false;
    if (filters.jobTitle && job.job_title !== filters.jobTitle) return false;
    if (filters.minSalary && (job.max_salary == null || job.max_salary < Number(filters.minSalary))) {
      return false;
    }
    if (filters.maxSalary && (job.min_salary == null || job.min_salary > Number(filters.maxSalary))) {
      return false;
    }
    if (
      filters.minExperience &&
      (job.max_experience == null || job.max_experience < Number(filters.minExperience))
    ) {
      return false;
    }
    if (
      filters.maxExperience &&
      (job.min_experience == null || job.min_experience > Number(filters.maxExperience))
    ) {
      return false;
    }
    return true;
  });
}

export function sortNcsJobs(jobs: NcsJob[], sort: string, order: string): NcsJob[] {
  const dir = order === "asc" ? 1 : -1;
  const copy = [...jobs];
  copy.sort((a, b) => {
    if (sort === "salary") {
      const av = a.max_salary ?? a.min_salary ?? 0;
      const bv = b.max_salary ?? b.min_salary ?? 0;
      return (av - bv) * dir;
    }
    if (sort === "experience") {
      return ((a.min_experience ?? 0) - (b.min_experience ?? 0)) * dir;
    }
    if (sort === "applicants") {
      return ((a.applicant_count ?? 0) - (b.applicant_count ?? 0)) * dir;
    }
    if (sort === "title") {
      return a.job_title.localeCompare(b.job_title) * dir;
    }
    const av = a.published_at ? new Date(a.published_at).getTime() : 0;
    const bv = b.published_at ? new Date(b.published_at).getTime() : 0;
    return (av - bv) * dir;
  });
  return copy;
}
