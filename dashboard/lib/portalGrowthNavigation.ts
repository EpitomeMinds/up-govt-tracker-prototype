export type GrowthAnalysisSectionId =
  | "overview"
  | "sectors"
  | "districts"
  | "trends"
  | "projects"
  | "skills"
  | "opportunities"
  | "ranking"
  | "summary"
  | "recommendations";

/** Where a chart click should navigate in the growth detailed view. */
export interface GrowthDrillNavigation {
  section: GrowthAnalysisSectionId;
  /** Workbook column to filter on (e.g. "Department / Industry"). */
  filterKey?: string;
  filterValue?: string;
}

export interface GrowthOverviewDrillHandlers {
  onSectorClick?: (sectorName: string) => void;
  onYearClick?: (year: string) => void;
  onDistrictClick?: (district: string) => void;
}

/** Map industry bar click → Projects tab filtered by industry. */
export function sectorDrillNav(sectorName: string): GrowthDrillNavigation {
  return {
    section: "projects",
    filterKey: "Department / Industry",
    filterValue: sectorName,
  };
}

/** Map timeline year click → Projects tab filtered by hiring period. */
export function yearDrillNav(year: string): GrowthDrillNavigation {
  return {
    section: "projects",
    filterKey: "Hiring Period",
    filterValue: year,
  };
}

/** Map district row click → Projects tab filtered by location. */
export function districtDrillNav(district: string): GrowthDrillNavigation {
  return {
    section: "projects",
    filterKey: "Location",
    filterValue: district,
  };
}
