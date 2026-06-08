"use client";

import type { CityDetailStats } from "@/lib/upCities";
import CityDetailPanel from "./CityDetailPanel";

interface Props {
  detail: CityDetailStats;
  onClear: () => void;
  onFilterLabour: (type: string) => void;
  onFilterCategory: (cat: string) => void;
  onFilterEducation?: (tier: string) => void;
}

/** Reuses city detail layout for district-level drill-down */
export default function DistrictDetailPanel(props: Props) {
  return (
    <div className="h-full">
      <div className="mb-2 rounded-t-xl bg-sky-50 px-3 py-1.5 text-center text-[10px] font-semibold uppercase tracking-wide text-sky-700">
        District view
      </div>
      <CityDetailPanel {...props} label="District snapshot" />
    </div>
  );
}
