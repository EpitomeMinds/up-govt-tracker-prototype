import type { GrowthWorkbookSheetId } from "./growthWorkbookSheetRegistry";

/** Where a chart click should navigate in the growth detailed view. */
export interface GrowthDrillNavigation {
  section: GrowthWorkbookSheetId | string;
  /** Workbook column to filter on (e.g. "Sector"). */
  filterKey?: string;
  filterValue?: string;
  /** Pre-selected state for detailed analysis filters. */
  state?: string;
}

export interface GrowthOverviewDrillHandlers {
  onSectorClick?: (sectorName: string) => void;
  onYearClick?: (year: string) => void;
  onDistrictClick?: (district: string) => void;
}

/** Map industry bar click → Top Employers sheet. */
export function sectorDrillNav(sectorName: string): GrowthDrillNavigation {
  return {
    section: "topOpportunities",
    filterKey: "Sector",
    filterValue: sectorName,
  };
}

/** Map timeline year click → Job Forecast sheet. */
export function yearDrillNav(year: string): GrowthDrillNavigation {
  return {
    section: "jobForecast",
    filterKey: "Sector",
    filterValue: year,
  };
}

/** Map district row click → Vacancy Gap sheet. */
export function districtDrillNav(district: string): GrowthDrillNavigation {
  return {
    section: "vacancyGapAnalysis",
    filterKey: "State",
    filterValue: district,
  };
}

export type GrowthAnalysisSectionId = GrowthWorkbookSheetId;
