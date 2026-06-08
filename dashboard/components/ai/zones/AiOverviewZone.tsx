"use client";

import type { AiRecommendationsResponse, AiRecommendationFilters } from "@/lib/aiRecommendationsTypes";
import { formatWorkforce, formatBudgetCr } from "@/lib/aiRecommendationsApi";
import KpiCard from "@/components/KpiCard";
import { ZoneShell } from "@/components/ai/AiParts";
import {
  SkillGapByPriorityChart,
  SkillGapTrendChart,
} from "@/components/ai/charts/AiChartComponents";

interface Props {
  data: AiRecommendationsResponse;
  onFilterChange: (next: Partial<AiRecommendationFilters>) => void;
}

export default function AiOverviewZone({ data, onFilterChange }: Props) {
  const s = data.summary;

  return (
    <ZoneShell compact>
      <div className="grid h-full min-h-0 grid-rows-[auto_1fr] gap-3">
        <div className="grid shrink-0 grid-cols-2 gap-2 xl:grid-cols-4">
          <KpiCard label="Skill gap" value={formatWorkforce(s.totalSkillGap)} delta={`${s.avgGapPercent}% avg`} accent="coral" icon={<span>⚠</span>} />
          <KpiCard label="Workforce req." value={formatWorkforce(s.totalRequired)} delta={formatWorkforce(s.totalAvailable) + " avail."} accent="teal" icon={<span>👥</span>} />
          <KpiCard label="Budget" value={formatBudgetCr(s.totalBudgetCr)} delta={`${s.criticalCount} critical`} accent="violet" icon={<span>₹</span>} />
          <KpiCard label="AI confidence" value={`${s.avgConfidence}%`} delta={`Impact ${s.avgImpact}`} accent="amber" icon={<span>✦</span>} />
        </div>
        <div className="grid min-h-0 grid-cols-2 gap-3">
          <SkillGapByPriorityChart
            data={s.byPriority}
            height={280}
            onFilter={(priority) => onFilterChange({ priority })}
          />
          <SkillGapTrendChart
            data={s.byStartYear}
            height={280}
            onFilter={(startYear) => onFilterChange({ startYear })}
          />
        </div>
      </div>
    </ZoneShell>
  );
}
