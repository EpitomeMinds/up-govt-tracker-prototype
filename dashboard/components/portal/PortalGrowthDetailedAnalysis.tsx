"use client";

import { useMemo, useState } from "react";
import type { InvestmentPredictionsResponse } from "@/lib/investmentTypes";
import type { GrowthDrillNavigation } from "@/lib/portalGrowthNavigation";
import {
  GROWTH_WORKBOOK_SHEETS,
  resolveGrowthSheetId,
  type GrowthWorkbookSheetId,
} from "@/lib/growthWorkbookSheetRegistry";
import GrowthWorkbookSheetView from "./GrowthWorkbookSheetView";

export type { GrowthWorkbookSheetId as GrowthAnalysisSectionId };

interface Props {
  data: InvestmentPredictionsResponse;
  initialNav?: GrowthDrillNavigation | null;
  onBack: () => void;
}

export default function PortalGrowthDetailedAnalysis({
  data,
  initialNav,
  onBack,
}: Props) {
  const [active, setActive] = useState<GrowthWorkbookSheetId>(
    resolveGrowthSheetId(initialNav?.section)
  );

  const sheets = data.workbook?.sheets;
  const activeDef = GROWTH_WORKBOOK_SHEETS.find((s) => s.id === active);
  const activeRows = activeDef ? sheets?.[activeDef.sheetKey] : undefined;

  const tabs = useMemo(
    () => GROWTH_WORKBOOK_SHEETS.map((sheet) => ({ id: sheet.id, label: sheet.label })),
    []
  );

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
            Back to growth dashboard
          </button>
          <h2 className="text-lg font-bold text-slate-900">Detailed Analysis</h2>
        </div>
      </div>

      <div className="portal-analysis-tabs mb-3 overflow-x-auto">
        {tabs.map((section) => (
          <button
            key={section.id}
            type="button"
            onClick={() => setActive(section.id as GrowthWorkbookSheetId)}
            className={`portal-analysis-tab whitespace-nowrap ${active === section.id ? "portal-analysis-tab-active" : ""}`}
          >
            {section.label}
          </button>
        ))}
      </div>

      <div className="portal-panel overflow-y-auto p-3">
        <div className="portal-analysis-body">
          {activeDef && (
            <GrowthWorkbookSheetView
              def={activeDef}
              rows={activeRows as Record<string, unknown>[] | undefined}
            />
          )}
        </div>
      </div>
    </div>
  );
}
