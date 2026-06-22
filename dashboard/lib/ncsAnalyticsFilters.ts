import type { NcsDashboardFilters } from "./ncsJobTypes";
import type { NcsAnalyticsDimension, NcsAnalyticsFilter, NcsFrameId } from "./ncsAnalyticsTypes";
import { isIndustryBucketKey } from "./ncsFilterNormalize";

export const NCS_GLOBAL_DRILL_DIMENSIONS = new Set<NcsAnalyticsDimension>([
  "state",
  "city",
  "functionalArea",
  "jobType",
  "industry",
  "organization",
  "functionalRole",
  "jobTitle",
  "salaryBand",
  "experienceBand",
]);

export function ncsDashboardToScopeFilters(filters: NcsDashboardFilters): NcsAnalyticsFilter[] {
  const scope: NcsAnalyticsFilter[] = [];
  if (filters.state) scope.push({ dimension: "state", value: filters.state });
  if (filters.city) scope.push({ dimension: "city", value: filters.city });
  if (filters.functionalArea) scope.push({ dimension: "functionalArea", value: filters.functionalArea });
  if (filters.jobType) scope.push({ dimension: "jobType", value: filters.jobType });
  if (filters.industry) scope.push({ dimension: "industry", value: filters.industry });
  if (filters.organization) scope.push({ dimension: "organization", value: filters.organization });
  if (filters.functionalRole) scope.push({ dimension: "functionalRole", value: filters.functionalRole });
  if (filters.jobTitle) scope.push({ dimension: "jobTitle", value: filters.jobTitle });
  if (filters.salaryBand) scope.push({ dimension: "salaryBand", value: filters.salaryBand });
  if (filters.experienceBand) scope.push({ dimension: "experienceBand", value: filters.experienceBand });
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
  return NCS_GLOBAL_DRILL_DIMENSIONS.has(dimension);
}

export function isLocalDrillDimension(dimension: NcsAnalyticsDimension): boolean {
  return dimension === "month";
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
      return filters.organization ? { dimension: "organization", value: filters.organization } : null;
    case "functionalRole":
      return filters.functionalRole ? { dimension: "functionalRole", value: filters.functionalRole } : null;
    case "jobTitle":
      return filters.jobTitle ? { dimension: "jobTitle", value: filters.jobTitle } : null;
    case "salaryBand":
      return filters.salaryBand ? { dimension: "salaryBand", value: filters.salaryBand } : null;
    case "experienceBand":
      return filters.experienceBand
        ? { dimension: "experienceBand", value: filters.experienceBand }
        : null;
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
  if (filters.organization) drill.push({ dimension: "organization", value: filters.organization });
  if (filters.functionalRole) drill.push({ dimension: "functionalRole", value: filters.functionalRole });
  if (filters.jobTitle) drill.push({ dimension: "jobTitle", value: filters.jobTitle });
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
    organization: "",
    functionalRole: "",
    jobTitle: "",
    salaryBand: "",
    experienceBand: "",
    q: "",
  };

  for (const filter of stack) {
    if (filter.dimension === "state") patch.state = filter.value;
    if (filter.dimension === "city") patch.city = filter.value;
    if (filter.dimension === "functionalArea") patch.functionalArea = filter.value;
    if (filter.dimension === "jobType") patch.jobType = filter.value;
    if (filter.dimension === "industry") patch.industry = filter.value;
    if (filter.dimension === "organization") patch.organization = filter.value;
    if (filter.dimension === "functionalRole") patch.functionalRole = filter.value;
    if (filter.dimension === "jobTitle") patch.jobTitle = filter.value;
    if (filter.dimension === "salaryBand") patch.salaryBand = filter.value;
    if (filter.dimension === "experienceBand") patch.experienceBand = filter.value;
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
      if (isIndustryBucketKey(value)) {
        return { industry: value, functionalArea: "" };
      }
      return { functionalArea: value };
    case "jobType":
      return { jobType: value };
    case "industry":
      return { industry: value, functionalArea: "" };
    case "organization":
      return { organization: value, q: "" };
    case "functionalRole":
      return { functionalRole: value, jobTitle: "", q: "" };
    case "jobTitle":
      return { jobTitle: value, functionalRole: "", q: "" };
    case "salaryBand":
      return { salaryBand: value };
    case "experienceBand":
      return { experienceBand: value };
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
      return { organization: "" };
    case "functionalRole":
      return { functionalRole: "" };
    case "jobTitle":
      return { jobTitle: "" };
    case "salaryBand":
      return { salaryBand: "" };
    case "experienceBand":
      return { experienceBand: "" };
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
