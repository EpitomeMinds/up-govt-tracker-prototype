import type { DashboardFilters } from "./jobAnalytics";
import type { CityAggregate } from "./upCities";
import type { State } from "./types";
import { filterLabel } from "./jobAnalytics";

export function buildDrillDownLabel(
  filters: DashboardFilters,
  states: State[],
  cities: CityAggregate[]
): string {
  const parts: string[] = [];

  const stateName =
    states.find((s) => s.code === filters.state)?.name || filters.state;
  parts.push(stateName);

  if (filters.city) {
    const city = cities.find((c) => c.cityId === filters.city);
    parts.push(city?.cityName || filters.city);
  } else if (filters.district) {
    parts.push(`District: ${filters.district}`);
  }

  if (filters.labourType) {
    parts.push(filterLabel("labourType", filters.labourType));
  }
  if (filters.postCategory) {
    parts.push(filterLabel("postCategory", filters.postCategory));
  }
  if (filters.educationTier) {
    parts.push(filterLabel("educationTier", filters.educationTier));
  }
  if (filters.qualification) parts.push(filters.qualification);
  if (filters.board) parts.push(filters.board);
  if (filters.applicationType) {
    parts.push(filterLabel("applicationType", filters.applicationType));
  }
  if (filters.q) parts.push(`"${filters.q}"`);
  if (filters.closingSoon) parts.push("Closing this week");
  if (filters.minPosts) parts.push(`${filters.minPosts}+ posts`);

  if (parts.length === 1) return `${stateName} · All openings`;
  return parts.join(" · ");
}

export function isDrillDownActive(filters: DashboardFilters): boolean {
  return !!(
    filters.q ||
    filters.board ||
    filters.city ||
    filters.district ||
    filters.educationTier ||
    filters.labourType ||
    filters.postCategory ||
    filters.qualification ||
    filters.applicationType ||
    filters.closingSoon ||
    filters.minPosts
  );
}
