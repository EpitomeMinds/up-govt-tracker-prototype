export const NCS_INDUSTRY_BUCKETS = [
  "Manufacturing",
  "Finance & Insurance",
  "IT & Communication",
  "Transport & Logistics",
  "Retail & Sales",
  "Healthcare",
  "Professional Services",
  "Other Services",
] as const;

export type NcsIndustryBucket = (typeof NCS_INDUSTRY_BUCKETS)[number];

export function isIndustryBucketKey(value: string): boolean {
  return NCS_INDUSTRY_BUCKETS.includes(value.trim() as NcsIndustryBucket);
}

export function normalizeNcsDashboardFilters<
  T extends { functionalArea?: string; industry?: string }
>(filters: T): T {
  const next = { ...filters };

  if (next.functionalArea && isIndustryBucketKey(next.functionalArea)) {
    if (!next.industry) {
      next.industry = next.functionalArea.trim();
    }
    next.functionalArea = "";
  }

  if (
    next.industry &&
    next.functionalArea &&
    next.industry.trim() === next.functionalArea.trim()
  ) {
    next.functionalArea = "";
  }

  return next;
}
