"use client";

import { Cell, CartesianGrid, Legend, Pie, PieChart, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis, ZAxis } from "recharts";
import type { AiRecommendationsResponse, AiRecommendationFilters } from "@/lib/aiRecommendationsTypes";
import { PRIORITY_COLORS, STATUS_COLORS } from "@/lib/aiRecommendationsApi";
import ChartCard from "@/components/charts/ChartCard";
import { ZoneShell } from "@/components/ai/AiParts";
import { ActionTypePieChart } from "@/components/ai/charts/AiChartComponents";

interface Props {
  data: AiRecommendationsResponse;
  onFilterChange: (next: Partial<AiRecommendationFilters>) => void;
  onSelect: (id: number) => void;
}

export default function AiAnalyticsZone({ data, onFilterChange, onSelect }: Props) {
  const scatter = data.recommendations.slice(0, 60).map((r) => ({
    id: r.id,
    x: r.aiConfidence,
    y: r.impactScore,
    z: r.skillGap,
    priority: r.priority,
  }));

  return (
    <ZoneShell compact>
      <div className="grid h-full min-h-0 grid-cols-12 gap-3">
        <div className="col-span-7 min-h-0">
          <ActionTypePieChart
            data={data.summary.byActionType}
            height={380}
            onFilter={(actionType) => onFilterChange({ actionType })}
          />
        </div>
        <div className="col-span-5 grid min-h-0 grid-rows-2 gap-3">
          <ChartCard title="Confidence mix" height={182}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.summary.byStatus.map((s) => ({
                    name: s.name,
                    value: s.count,
                    fill: STATUS_COLORS[s.name] || "#94a3b8",
                  }))}
                  dataKey="value"
                  innerRadius="40%"
                  outerRadius="68%"
                  paddingAngle={2}
                  cursor="pointer"
                  onClick={(_, i) => {
                    const s = data.summary.byStatus[i];
                    if (s) onFilterChange({ status: s.name });
                  }}
                >
                  {data.summary.byStatus.map((s) => (
                    <Cell key={s.name} fill={STATUS_COLORS[s.name] || "#94a3b8"} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 9 }} iconSize={6} />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
          <ChartCard title="Confidence vs impact" height={182}>
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ bottom: 4, left: 0, right: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e8ebf2" />
                <XAxis type="number" dataKey="x" domain={[40, 100]} tick={{ fontSize: 8 }} />
                <YAxis type="number" dataKey="y" domain={[40, 100]} tick={{ fontSize: 8 }} />
                <ZAxis type="number" dataKey="z" range={[24, 140]} />
                <Tooltip cursor={{ strokeDasharray: "3 3" }} />
                <Scatter
                  data={scatter}
                  cursor="pointer"
                  onClick={(d) => {
                    const id = (d as { id?: number; payload?: { id?: number } }).id ?? (d as { payload?: { id?: number } }).payload?.id;
                    if (id) onSelect(Number(id));
                  }}
                >
                  {scatter.map((e) => (
                    <Cell key={e.id} fill={PRIORITY_COLORS[e.priority] || "#64748b"} fillOpacity={0.75} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      </div>
    </ZoneShell>
  );
}
