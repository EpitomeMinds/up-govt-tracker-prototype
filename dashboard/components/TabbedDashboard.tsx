"use client";

import { useMemo, useState } from "react";
import DashboardSidebar, {
  type ZoneId,
  type ZoneItem,
  IconListings,
  IconMap,
  IconOverview,
  IconQualifications,
  IconRecruiters,
  IconWorkforce,
} from "@/components/DashboardSidebar";
import OverviewZone from "@/components/zones/OverviewZone";
import MapZone from "@/components/zones/MapZone";
import WorkforceZone from "@/components/zones/WorkforceZone";
import QualificationsZone from "@/components/zones/QualificationsZone";
import RecruitersZone from "@/components/zones/RecruitersZone";
import ListingsZone from "@/components/zones/ListingsZone";
import type { ExtendedAnalytics } from "@/lib/jobAnalytics";
import { formatCount } from "@/lib/jobAnalytics";
import type { JobEnriched } from "@/lib/jobAnalytics";

interface Props {
  analytics: ExtendedAnalytics;
  filtered: JobEnriched[];
  enriched: JobEnriched[];
  stateCode: string;
  stateName: string;
  showMap: boolean;
  lastSync?: string | null;
  selectedCityId: string;
  selectedDistrict: string;
  onSelectCity: (id: string) => void;
  onSelectDistrict: (district: string) => void;
  onDrillDown: (dimension: string, key: string) => void;
  toolbar: React.ReactNode;
  loading?: boolean;
  sidebarMode?: "vacancy" | "investment" | "ai-recommendations";
}

export default function TabbedDashboard({
  analytics,
  filtered,
  enriched,
  stateCode,
  stateName,
  showMap,
  lastSync,
  selectedCityId,
  selectedDistrict,
  onSelectCity,
  onSelectDistrict,
  onDrillDown,
  toolbar,
  loading,
  sidebarMode = "vacancy",
}: Props) {
  const [activeZone, setActiveZone] = useState<ZoneId>("overview");

  const zones: ZoneItem[] = useMemo(
    () => [
      {
        id: "overview",
        label: "Overview",
        hint: "KPIs & summary charts",
        icon: <IconOverview />,
      },
      {
        id: "map",
        label: "Geography",
        hint: "District map & cities",
        icon: <IconMap />,
        hidden: !showMap,
      },
      {
        id: "workforce",
        label: "Workforce",
        hint: "Skilled vs unskilled",
        icon: <IconWorkforce />,
      },
      {
        id: "qualifications",
        label: "Qualifications",
        hint: "Education breakdown",
        icon: <IconQualifications />,
      },
      {
        id: "recruiters",
        label: "Recruiters",
        hint: "Boards & applications",
        icon: <IconRecruiters />,
      },
      {
        id: "listings",
        label: "Listings",
        hint: "Browse all jobs",
        icon: <IconListings />,
      },
    ],
    [showMap]
  );

  const activeLabel = zones.find((z) => z.id === activeZone)?.label ?? "Dashboard";

  const zoneSubtitle = useMemo(() => {
    switch (activeZone) {
      case "overview":
        return `${stateCode}${lastSync ? ` · synced ${new Date(lastSync).toLocaleDateString("en-IN")}` : ""} · ${formatCount(analytics.totalVacancies)} vacancies · ${analytics.totalListings} listings`;
      case "workforce":
        return `${formatCount(analytics.labourMetrics.skilled.vacancies)} skilled · ${formatCount(analytics.labourMetrics.unskilled.vacancies)} unskilled`;
      case "qualifications":
        return `${analytics.educationBars.length} education tiers · ${analytics.qualDemandBars.length} qual tags`;
      case "recruiters":
        return `${analytics.boardVacancyBars.length} boards · ${analytics.byCity.length} cities`;
      case "listings":
        return `${filtered.length} filtered · ${formatCount(analytics.totalVacancies)} vacancies`;
      case "map":
        return `${stateName} district map`;
      default:
        return "";
    }
  }, [activeZone, analytics, filtered.length, lastSync, stateCode, stateName]);

  return (
    <>
      <DashboardSidebar
        zones={zones}
        active={activeZone}
        onChange={setActiveZone}
        stateCode={stateCode}
        stateName={stateName}
        lastSync={lastSync}
        mode={sidebarMode}
      />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {toolbar}

        <main className="bi-canvas flex min-h-0 flex-1 flex-col overflow-hidden px-6 py-4">
          {loading ? (
            <div className="flex h-full min-h-0 flex-1 items-center justify-center">
              <div className="bi-widget px-14 py-12 text-center">
                <div className="bi-spinner mx-auto mb-4" />
                <p className="text-sm font-semibold text-bi-title">Loading data…</p>
                <p className="mt-1 text-xs text-bi-muted">Fetching latest vacancy records</p>
              </div>
            </div>
          ) : (
            <>
              <div className="bi-breadcrumb">
                <span className="bi-breadcrumb-path">Dashboard</span>
                <span className="text-bi-border">/</span>
                <span className="bi-breadcrumb-active">{activeLabel}</span>
                {zoneSubtitle && (
                  <>
                    <span className="hidden text-bi-border sm:inline">·</span>
                    <span className="bi-breadcrumb-meta">{zoneSubtitle}</span>
                  </>
                )}
              </div>

              <div className="min-h-0 flex-1 overflow-hidden">
              {activeZone === "overview" && (
            <OverviewZone
              analytics={analytics}
              onDrillDown={onDrillDown}
            />
          )}
          {activeZone === "map" && showMap && (
            <MapZone
              enriched={enriched}
              analytics={analytics}
              selectedCityId={selectedCityId}
              selectedDistrict={selectedDistrict}
              onSelectCity={onSelectCity}
              onSelectDistrict={onSelectDistrict}
              onDrillDown={onDrillDown}
            />
          )}
          {activeZone === "workforce" && (
            <WorkforceZone analytics={analytics} onDrillDown={onDrillDown} />
          )}
          {activeZone === "qualifications" && (
            <QualificationsZone analytics={analytics} onDrillDown={onDrillDown} />
          )}
          {activeZone === "recruiters" && (
            <RecruitersZone analytics={analytics} onDrillDown={onDrillDown} />
          )}
          {activeZone === "listings" && <ListingsZone jobs={filtered} />}
              </div>
            </>
          )}
        </main>
      </div>
    </>
  );
}
