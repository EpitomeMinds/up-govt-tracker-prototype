"use client";

import {
  Cell,
  Legend,
  Pie,
  PieChart,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { formatCount } from "@/lib/jobAnalytics";
import ChartCard from "./ChartCard";

export interface SliceItem {
  key: string;
  name: string;
  value: number;
  fill: string;
}

interface DonutCardProps {
  title: string;
  data: SliceItem[];
  height?: number;
  dimension: string;
  onDrillDown: (dimension: string, key: string) => void;
  centerLabel?: string;
}

export function DonutChartCard({
  title,
  data,
  height = 300,
  dimension,
  onDrillDown,
  centerLabel,
}: DonutCardProps) {
  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <ChartCard title={title} height={height}>
      {total === 0 ? (
        <p className="flex h-full items-center justify-center text-xs text-slate-400">
          No data available
        </p>
      ) : (
        <div className="relative h-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="46%"
                innerRadius="52%"
                outerRadius="78%"
                paddingAngle={2}
                cursor="pointer"
                onClick={(_, index) => {
                  const item = data[index];
                  if (item) onDrillDown(dimension, item.key);
                }}
              >
                {data.map((entry) => (
                  <Cell
                    key={entry.key}
                    fill={entry.fill}
                    stroke="#fff"
                    strokeWidth={2}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number, name: string) => [
                  `${formatCount(value)} (${Math.round((value / total) * 100)}%)`,
                  name,
                ]}
              />
              <Legend
                wrapperStyle={{ fontSize: 11, paddingTop: 4 }}
                iconType="circle"
                iconSize={8}
              />
            </PieChart>
          </ResponsiveContainer>
          {centerLabel && (
            <div className="pointer-events-none absolute left-1/2 top-[38%] -translate-x-1/2 -translate-y-1/2 text-center">
              <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
                Total
              </p>
              <p className="text-lg font-bold tabular-nums text-slate-800">
                {centerLabel}
              </p>
            </div>
          )}
        </div>
      )}
    </ChartCard>
  );
}

interface PieCardProps {
  title: string;
  data: SliceItem[];
  height?: number;
  dimension: string;
  onDrillDown: (dimension: string, key: string) => void;
}

export function PieChartCard({
  title,
  data,
  height = 320,
  dimension,
  onDrillDown,
}: PieCardProps) {
  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <ChartCard title={title} height={height}>
      {total === 0 ? (
        <p className="flex h-full items-center justify-center text-xs text-slate-400">
          No data available
        </p>
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius="72%"
              paddingAngle={1}
              cursor="pointer"
              label={({ name, percent }) =>
                percent >= 0.08 ? `${name} ${Math.round(percent * 100)}%` : ""
              }
              labelLine={{ strokeWidth: 1 }}
              onClick={(_, index) => {
                const item = data[index];
                if (item) onDrillDown(dimension, item.key);
              }}
            >
              {data.map((entry) => (
                <Cell
                  key={entry.key}
                  fill={entry.fill}
                  stroke="#fff"
                  strokeWidth={2}
                />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number, name: string) => [
                `${formatCount(value)} (${Math.round((value / total) * 100)}%)`,
                name,
              ]}
            />
          </PieChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  );
}

interface RadialItem {
  key: string;
  name: string;
  vacancies: number;
  fill: string;
}

interface RadialCardProps {
  title: string;
  data: RadialItem[];
  height?: number;
  dimension: string;
  onDrillDown: (dimension: string, key: string) => void;
}

export function RadialRankChart({
  title,
  data,
  height = 380,
  dimension,
  onDrillDown,
}: RadialCardProps) {
  const sorted = [...data]
    .sort((a, b) => b.vacancies - a.vacancies)
    .slice(0, 8)
    .map((d, i) => ({
      ...d,
      rank: i + 1,
      displayName: d.name.length > 14 ? `${d.name.slice(0, 13)}…` : d.name,
    }));

  const max = sorted[0]?.vacancies || 1;

  return (
    <ChartCard title={title} height={height}>
      {sorted.length === 0 ? (
        <p className="flex h-full items-center justify-center text-xs text-slate-400">
          No data available
        </p>
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            cx="50%"
            cy="50%"
            innerRadius="18%"
            outerRadius="95%"
            barSize={12}
            data={sorted}
            startAngle={90}
            endAngle={-270}
          >
            <RadialBar
              background={{ fill: "#f1f5f9" }}
              dataKey="vacancies"
              cornerRadius={6}
              cursor="pointer"
              onClick={(d) => {
                const key = d?.key ?? d?.payload?.key;
                if (key) onDrillDown(dimension, String(key));
              }}
            >
              {sorted.map((entry) => (
                <Cell key={entry.key} fill={entry.fill} />
              ))}
            </RadialBar>
            <Tooltip
              formatter={(value: number, _name: string, props) => [
                `${formatCount(value)} vacancies (${Math.round((value / max) * 100)}% of top)`,
                props.payload.displayName,
              ]}
            />
            <Legend
              wrapperStyle={{ fontSize: 10 }}
              iconType="circle"
              iconSize={8}
              formatter={(_value, entry) => {
                const p = entry.payload as { displayName?: string; vacancies?: number };
                return `${p?.displayName ?? ""} · ${formatCount(p?.vacancies ?? 0)}`;
              }}
            />
          </RadialBarChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  );
}
