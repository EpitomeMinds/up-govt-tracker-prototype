import type { NcsDashboardFilters } from "./ncsJobTypes";
import type { NcsAnalyticsDimension, NcsAnalyticsFilter } from "./ncsAnalyticsTypes";

export const NCS_GLOBAL_DRILL_DIMENSIONS = new Set<NcsAnalyticsDimension>([
  "state",
  "city",
  "functionalArea",
  "jobType",
  "industry",
  "organization",
]);

export function ncsDashboardToScopeFilters(filters: NcsDashboardFilters): NcsAnalyticsFilter[] {
  const scope: NcsAnalyticsFilter[] = [];
  if (filters.state) scope.push({ dimension: "state", value: filters.state });
  if (filters.city) scope.push({ dimension: "city", value: filters.city });
  if (filters.functionalArea) scope.push({ dimension: "functionalArea", value: filters.functionalArea });
  if (filters.jobType) scope.push({ dimension: "jobType", value: filters.jobType });
  if (filters.industry) scope.push({ dimension: "industry", value: filters.industry });
  if (filters.q.trim()) scope.push({ dimension: "search", value: filters.q.trim() });
  if (filters.minSalary) scope.push({ dimension: "minSalary", value: filters.minSalary });
  if (filters.maxSalary) scope.push({ dimension: "maxSalary", value: filters.maxSalary });
  if (filters.minExperience) scope.push({ dimension: "minExperience", value: filters.minExperience });
  if (filters.maxExperience) scope.push({ dimension: "maxExperience", value: filters.maxExperience });
  return scope;
}

export function hasNcsScopeFilters(filters: NcsDashboardFilters): boolean {
  return ncsDashboardToScopeFilters(filters).length > 0;
}

export function ncsDashboardToDrillFilters(filters: NcsDashboardFilters): NcsAnalyticsFilter[] {
  const drill: NcsAnalyticsFilter[] = [];
  if (filters.state) drill.push({ dimension: "state", value: filters.state });
  if (filters.city) drill.push({ dimension: "city", value: filters.city });
  if (filters.functionalArea) drill.push({ dimension: "functionalArea", value: filters.functionalArea });
  if (filters.jobType) drill.push({ dimension: "jobType", value: filters.jobType });
  if (filters.industry) drill.push({ dimension: "industry", value: filters.industry });
  return drill;
}

export function drillFiltersToDashboardPatch(
  stack: NcsAnalyticsFilter[]
): Partial<NcsDashboardFilters> {
  const patch: Partial<NcsDashboardFilters> = {
    state: "",
    city: "",
    functionalArea: "",
    jobType: "",
    industry: "",
    q: "",
  };

  for (const filter of stack) {
    if (filter.dimension === "state") patch.state = filter.value;
    if (filter.dimension === "city") patch.city = filter.value;
    if (filter.dimension === "functionalArea") patch.functionalArea = filter.value;
    if (filter.dimension === "jobType") patch.jobType = filter.value;
    if (filter.dimension === "industry") patch.industry = filter.value;
    if (
      filter.dimension === "organization" ||
      filter.dimension === "functionalRole" ||
      filter.dimension === "jobTitle"
    ) {
      patch.q = filter.value;
    }
  }

  return patch;
}

export function drillDimensionToDashboardPatch(
  dimension: NcsAnalyticsDimension,
  value: string
): Partial<NcsDashboardFilters> {
  switch (dimension) {
    case "state":
      return { state: value, city: "" };
    case "city":
      return { city: value };
    case "functionalArea":
      return { functionalArea: value };
    case "jobType":
      return { jobType: value };
    case "industry":
      return { industry: value };
    case "organization":
    case "functionalRole":
    case "jobTitle":
      return { q: value };
    default:
      return {};
  }
}

export function clearDrillDimensionPatch(
  dimension: NcsAnalyticsDimension
): Partial<NcsDashboardFilters> {
  switch (dimension) {
    case "state":
      return { state: "", city: "" };
    case "city":
      return { city: "" };
    case "functionalArea":
      return { functionalArea: "" };
    case "jobType":
      return { jobType: "" };
    case "industry":
      return { industry: "" };
    case "organization":
    case "functionalRole":
    case "jobTitle":
      return { q: "" };
    default:
      return {};
  }
}

export function clearDrillStackDashboardPatch(
  stack: NcsAnalyticsFilter[]
): Partial<NcsDashboardFilters> {
  const patch: Partial<NcsDashboardFilters> = {};
  for (const filter of stack) {
    Object.assign(patch, clearDrillDimensionPatch(filter.dimension));
  }
  return patch;
}

export function mergeDrillFilters(
  shared: NcsAnalyticsFilter[],
  frameLocal: NcsAnalyticsFilter[] = []
): NcsAnalyticsFilter[] {
  return [...shared, ...frameLocal];
}
