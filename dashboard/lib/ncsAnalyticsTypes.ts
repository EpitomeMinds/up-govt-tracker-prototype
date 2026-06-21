export type NcsAnalyticsDimension =
  | "state"
  | "city"
  | "industry"
  | "organization"
  | "functionalArea"
  | "functionalRole"
  | "jobTitle"
  | "jobType"
  | "salaryBand"
  | "experienceBand"
  | "month"
  | "search"
  | "minSalary"
  | "minExperience";

export interface NcsAnalyticsFilter {
  dimension: NcsAnalyticsDimension;
  value: string;
}

export interface NcsAnalyticsDatum {
  key: string;
  label: string;
  postings: number;
  vacancies: number;
  applicants: number;
}

export interface NcsAnalyticsBreadcrumb {
  label: string;
  level: number;
  filters: NcsAnalyticsFilter[];
}

export interface NcsFrameAnalytics {
  frameId: string;
  level: number;
  dimension: NcsAnalyticsDimension;
  nextDimension: NcsAnalyticsDimension | null;
  drillable: boolean;
  chartType: "bar" | "horizontalBar" | "pie" | "line" | "map" | "openings";
  title: string;
  hint?: string;
  breadcrumb: NcsAnalyticsBreadcrumb[];
  filters: NcsAnalyticsFilter[];
  summary: {
    postings: number;
    vacancies: number;
    applicants: number;
  };
  data: NcsAnalyticsDatum[];
  /** Full drill list for filter picker (chart shows top 5 only). */
  pickerOptions?: NcsAnalyticsDatum[];
}

export type NcsFrameId =
  | "geography"
  | "employers"
  | "employment"
  | "salary"
  | "experience";

export const NCS_FRAME_IDS = [
  "employers",
  "employment",
  "salary",
  "experience",
] as const satisfies readonly NcsFrameId[];
