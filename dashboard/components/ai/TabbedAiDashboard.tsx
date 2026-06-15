"use client";

import { useMemo, useState } from "react";
import AiDashboardSidebar, {
  type AiZoneItem,
  IconAnalytics,
  IconBoards,
  IconInitiatives,
  IconOverview,
  IconRegions,
  IconSectors,
} from "@/components/ai/AiDashboardSidebar";
import AiOverviewZone from "@/components/ai/zones/AiOverviewZone";
import AiBoardsZone from "@/components/ai/zones/AiBoardsZone";
import AiInitiativesZone from "@/components/ai/zones/AiInitiativesZone";
import AiSectorsZone from "@/components/ai/zones/AiSectorsZone";
import AiRegionsZone from "@/components/ai/zones/AiRegionsZone";
import AiAnalyticsZone from "@/components/ai/zones/AiAnalyticsZone";
import type { AiRecommendationsResponse, AiRecommendationFilters, AiZoneId } from "@/lib/aiRecommendationsTypes";
import { formatWorkforce } from "@/lib/aiRecommendationsApi";

interface Props {
  data: AiRecommendationsResponse;
  stateCode: string;
  stateName: string;
  toolbar: React.ReactNode;
  onFilterChange: (next: Partial<AiRecommendationFilters>) => void;
  selectedId: number | null;
  onSelect: (id: number | null) => void;
}

export default function TabbedAiDashboard({
  data,
  stateCode,
  stateName,
  toolbar,
  onFilterChange,
  selectedId,
  onSelect,
}: Props) {
  const [activeZone, setActiveZone] = useState<AiZoneId>("overview");

  const zones: AiZoneItem[] = useMemo(
    () => [
      { id: "overview", label: "Overview", hint: "KPIs & summary", icon: <IconOverview /> },
      { id: "boards", label: "Clusters", hint: "Industries by cluster", icon: <IconBoards /> },
      { id: "initiatives", label: "Projects", hint: "List & details", icon: <IconInitiatives /> },
      { id: "sectors", label: "Industries", hint: "Industry breakdown", icon: <IconSectors /> },
      { id: "regions", label: "Regions", hint: "Geographic view", icon: <IconRegions /> },
      { id: "analytics", label: "Analytics", hint: "Charts & pipeline", icon: <IconAnalytics /> },
    ],
    []
  );

  const activeLabel = zones.find((z) => z.id === activeZone)?.label ?? "AI";

  const zoneSubtitle = useMemo(() => {
    const s = data.summary;
    switch (activeZone) {
      case "overview":
        return `${s.totalRecommendations} projects · ${s.boardCount} industries · ${formatWorkforce(s.totalRequired)} vacancies`;
      case "boards":
        return `${s.boardCount} industries · ${s.categoryCount} clusters`;
      case "initiatives":
        return `${data.recommendations.length} matching projects`;
      case "sectors":
        return `${s.sectorCount} industries`;
      case "regions":
        return `${s.regionCount} regions`;
      case "analytics":
        return `${s.byActionType.length} skill types`;
      default:
        return "";
    }
  }, [activeZone, data]);

  return (
    <>
      <AiDashboardSidebar
        zones={zones}
        active={activeZone}
        onChange={setActiveZone}
        stateCode={stateCode}
        stateName={stateName}
      />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {toolbar}
        <main className="bi-canvas flex min-h-0 flex-1 flex-col overflow-hidden px-6 py-4">
          <div className="bi-breadcrumb">
            <span className="bi-breadcrumb-path">AI Growth & Recommendations</span>
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
              <AiOverviewZone data={data} onFilterChange={onFilterChange} />
            )}
            {activeZone === "boards" && (
              <AiBoardsZone
                data={data}
                onFilterChange={onFilterChange}
                onGoInitiatives={() => setActiveZone("initiatives")}
              />
            )}
            {activeZone === "initiatives" && (
              <AiInitiativesZone
                recommendations={data.recommendations}
                selectedId={selectedId}
                onSelect={onSelect}
                onFilterChange={onFilterChange}
              />
            )}
            {activeZone === "sectors" && (
              <AiSectorsZone data={data} onFilterChange={onFilterChange} />
            )}
            {activeZone === "regions" && (
              <AiRegionsZone data={data} onFilterChange={onFilterChange} />
            )}
            {activeZone === "analytics" && (
              <AiAnalyticsZone
                data={data}
                onFilterChange={onFilterChange}
                onSelect={(id) => {
                  onSelect(id);
                  setActiveZone("initiatives");
                }}
              />
            )}
          </div>
        </main>
      </div>
    </>
  );
}
