export interface NcsJobLocation {
  city: string;
  state: string;
  pincode?: string;
  latitude?: number;
  longitude?: number;
  isPrimary?: boolean;
}

export interface NcsJob {
  id: number;
  job_title: string;
  organization_name: string;
  functional_area: string;
  functional_role: string;
  industry: string;
  job_type: string;
  job_description: string;
  required_skills: string[];
  city: string;
  state: string;
  locations: NcsJobLocation[];
  min_experience: number | null;
  max_experience: number | null;
  min_salary: number | null;
  max_salary: number | null;
  hide_salary_range: boolean;
  no_of_vacancies: number | null;
  applicant_count: number;
  gender_preference: string;
  is_government_job: boolean;
  published_at: string;
  expired_at: string;
  created_at: string;
  link: string;
  source: string;
  scraped_at: string;
  is_active: boolean;
}

export interface NcsJobsResponse {
  data: NcsJob[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface NcsFacetItem {
  name?: string;
  city?: string;
  state?: string;
  area?: string;
  type?: string;
  count: number;
}

export interface NcsRanking {
  name: string;
  postings: number;
  vacancies: number;
  applicants: number;
  value: number;
}

export interface NcsStats {
  total: number;
  totalPostings: number;
  totalVacancies: number;
  totalApplicants: number;
  statesCovered: number;
  employers: number;
  newThisWeek: number;
  topIndustriesByPostings: NcsRanking[];
  topIndustriesByVacancies: NcsRanking[];
  topIndustriesByApplicants: NcsRanking[];
  topStatesByVacancies: NcsRanking[];
  topCities: { city: string; count: number }[];
  topFunctionalAreas: { area: string; count: number }[];
  jobTypes: { type: string; count: number }[];
  sectorBreakdown: { name: string; postings: number; vacancies: number }[];
  lastSync: {
    synced_at: string;
    job_count: number;
    status: string;
  } | null;
}

export interface NcsFacetsResponse {
  facets: {
    cities: { city: string; count: number }[];
    states: { state: string; count: number }[];
    functionalAreas: { name: string; count: number }[];
    industries: { name: string; count: number }[];
    jobTypes: { name: string; count: number }[];
  };
  filterOptions: Record<string, unknown> | null;
  scrapedAt: string | null;
}

export interface NcsDashboardFilters {
  q: string;
  city: string;
  state: string;
  jobType: string;
  functionalArea: string;
  industry: string;
  minSalary: string;
  maxSalary: string;
  minExperience: string;
  maxExperience: string;
  sort: string;
  order: string;
}
