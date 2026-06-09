"use client";

import { useState } from "react";
import OverviewZone from "@/components/zones/OverviewZone";
import MapZone from "@/components/zones/MapZone";
import WorkforceZone from "@/components/zones/WorkforceZone";
import QualificationsZone from "@/components/zones/QualificationsZone";
import RecruitersZone from "@/components/zones/RecruitersZone";
import ListingsZone from "@/components/zones/ListingsZone";
import type { ExtendedAnalytics, JobEnriched } from "@/lib/jobAnalytics";

export type AnalysisSectionId =
  | "overview"
  | "geography"
  | "workforce"
  | "qualifications"
  | "recruiters"
  | "listings";

const SECTIONS: { id: AnalysisSectionId; label: string; hidden?: boolean }[] = [
  { id: "overview", label: "Overview" },
  { id: "geography", label: "Geography" },
  { id: "workforce", label: "Workforce" },
  { id: "qualifications", label: "Qualifications" },
  { id: "recruiters", label: "Recruiters" },
  { id: "listings", label: "Listings" },
];

interface Props {
  analytics: ExtendedAnalytics;
  filtered: JobEnriched[];
  enriched: JobEnriched[];
  stateCode: string;
  stateName: string;
  showMap: boolean;
  selectedCityId: string;
  selectedDistrict: string;
  onSelectCity: (id: string) => void;
  onSelectDistrict: (district: string) => void;
  onDrillDown: (dimension: string, key: string) => void;
  onBack: () => void;
}

export default function PortalDetailedAnalysis({
  analytics,
  filtered,
  enriched,
  stateCode,
  stateName,
  showMap,
  selectedCityId,
  selectedDistrict,
  onSelectCity,
  onSelectDistrict,
  onDrillDown,
  onBack,
}: Props) {
  const visibleSections = SECTIONS.filter((s) => !(s.id === "geography" && !showMap));
  const [active, setActive] = useState<AnalysisSectionId>("overview");

  const safeActive =
    active === "geography" && !showMap ? "overview" : active;

  return (
    <div className="flex min-h-0 flex-col">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <button
            type="button"
            onClick={onBack}
            className="mb-1 inline-flex items-center gap-1.5 text-sm font-semibold text-[#2563eb] hover:text-[#1d4ed8]"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Back to dashboard
          </button>
          <h2 className="text-lg font-bold text-slate-900">Detailed Analysis</h2>
          <p className="text-xs text-slate-500">
            {stateName} · {stateCode}
          </p>
        </div>
      </div>

      <div className="portal-analysis-tabs mb-3">
        {visibleSections.map((section) => (
          <button
            key={section.id}
            type="button"
            onClick={() => setActive(section.id)}
            className={`portal-analysis-tab ${safeActive === section.id ? "portal-analysis-tab-active" : ""}`}
          >
            {section.label}
          </button>
        ))}
      </div>

      <div className="portal-panel overflow-y-auto p-3">
        <div className="portal-analysis-body">
          {safeActive === "overview" && (
            <OverviewZone analytics={analytics} onDrillDown={onDrillDown} embedded />
          )}
          {safeActive === "geography" && showMap && (
            <MapZone
              enriched={enriched}
              analytics={analytics}
              selectedCityId={selectedCityId}
              selectedDistrict={selectedDistrict}
              onSelectCity={onSelectCity}
              onSelectDistrict={onSelectDistrict}
              onDrillDown={onDrillDown}
              embedded
            />
          )}
          {safeActive === "workforce" && (
            <WorkforceZone analytics={analytics} onDrillDown={onDrillDown} embedded />
          )}
          {safeActive === "qualifications" && (
            <QualificationsZone analytics={analytics} onDrillDown={onDrillDown} embedded />
          )}
          {safeActive === "recruiters" && (
            <RecruitersZone analytics={analytics} onDrillDown={onDrillDown} embedded />
          )}
          {safeActive === "listings" && <ListingsZone jobs={filtered} embedded />}
        </div>
      </div>
    </div>
  );
}
