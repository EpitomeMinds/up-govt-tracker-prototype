import type { NcsDashboardFilters } from "./ncsJobTypes";
import type { NcsAnalyticsDimension, NcsAnalyticsFilter, NcsFrameId } from "./ncsAnalyticsTypes";

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

export const NCS_FRAME_DRILL_PATHS: Record<NcsFrameId, NcsAnalyticsDimension[]> = {
  geography: ["state", "city", "functionalArea"],
  employers: ["organization", "functionalArea", "city"],
  employment: ["industry", "functionalArea", "functionalRole", "jobTitle"],
  salary: ["salaryBand", "functionalArea", "city"],
  experience: ["experienceBand", "functionalArea", "jobType"],
};

export function isGlobalDrillDimension(dimension: NcsAnalyticsDimension): boolean {
  return (
    NCS_GLOBAL_DRILL_DIMENSIONS.has(dimension) ||
    dimension === "functionalRole" ||
    dimension === "jobTitle"
  );
}

export function isLocalDrillDimension(dimension: NcsAnalyticsDimension): boolean {
  return dimension === "salaryBand" || dimension === "experienceBand" || dimension === "month";
}

export function serializeNcsScopeKey(filters: NcsDashboardFilters): string {
  return JSON.stringify(ncsDashboardToScopeFilters(filters));
}

function dashboardFilterForPathDimension(
  filters: NcsDashboardFilters,
  dimension: NcsAnalyticsDimension
): NcsAnalyticsFilter | null {
  switch (dimension) {
    case "state":
      return filters.state ? { dimension: "state", value: filters.state } : null;
    case "city":
      return filters.city ? { dimension: "city", value: filters.city } : null;
    case "functionalArea":
      return filters.functionalArea
        ? { dimension: "functionalArea", value: filters.functionalArea }
        : null;
    case "jobType":
      return filters.jobType ? { dimension: "jobType", value: filters.jobType } : null;
    case "industry":
      return filters.industry ? { dimension: "industry", value: filters.industry } : null;
    case "organization":
    case "functionalRole":
    case "jobTitle":
      return filters.q.trim() ? { dimension, value: filters.q.trim() } : null;
    default:
      return null;
  }
}

export function frameDrillStackFromDashboard(
  frameId: NcsFrameId,
  filters: NcsDashboardFilters
): NcsAnalyticsFilter[] {
  const path = NCS_FRAME_DRILL_PATHS[frameId];
  const stack: NcsAnalyticsFilter[] = [];
  for (const dimension of path) {
    if (isLocalDrillDimension(dimension)) break;
    const entry = dashboardFilterForPathDimension(filters, dimension);
    if (!entry) break;
    stack.push(entry);
  }
  return stack;
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

export function hasNcsScopeFilters(filters: NcsDashboardFilters): boolean {
  return ncsDashboardToScopeFilters(filters).length > 0;
}

export function mergeLocalDrillKey(
  scopeKey: string,
  localDrills: NcsAnalyticsFilter[] = []
): string {
  return `${scopeKey}|${JSON.stringify(localDrills)}`;
}
