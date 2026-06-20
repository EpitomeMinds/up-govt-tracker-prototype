"use client";

import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { GrowthWorkbookSheetDef } from "@/lib/growthWorkbookSheetRegistry";
import {
  aggregateSheetRows,
  countByColumn,
  filterSheetDataRows,
  findColumn,
  readSheetNumber,
  sheetColumns,
  shortSheetLabel,
} from "@/lib/growthWorkbookSheetUtils";
import StableChartContainer from "@/components/charts/StableChartContainer";

const CHART_COLORS = ["#2563eb", "#f97316", "#10b981", "#8b5cf6", "#ec4899", "#06b6d4", "#64748b"];

function formatShort(value: number): string {
  if (value >= 100000) return `${(value / 100000).toFixed(1)}L`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}k`;
  return value.toLocaleString("en-IN");
}

function formatCell(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "number") return value.toLocaleString("en-IN");
  return String(value);
}

export default function GrowthWorkbookSheetView({
  def,
  rows,
}: {
  def: GrowthWorkbookSheetDef;
  rows?: Record<string, unknown>[];
}) {
  const sourceRows = rows ?? [];
  const dataRows = useMemo(() => filterSheetDataRows(sourceRows), [sourceRows]);
  const columns = useMemo(() => sheetColumns(dataRows.length ? dataRows : sourceRows), [dataRows, sourceRows]);

  const limit = def.chartLimit ?? 12;

  const barData = useMemo(() => {
    if (!def.groupBy?.length) return [];
    const groupKey = findColumn(dataRows, ...def.groupBy);
    const metricKey = def.barMetric?.length ? findColumn(dataRows, ...def.barMetric) : undefined;
    if (!groupKey) return [];
    if (metricKey) return aggregateSheetRows(dataRows, groupKey, metricKey, limit);
    return countByColumn(dataRows, groupKey, limit);
  }, [dataRows, def, limit]);

  const bar2Data = useMemo(() => {
    if (!def.secondaryBar) return [];
    const groupKey = findColumn(dataRows, ...def.secondaryBar.groupBy);
    const metricKey = findColumn(dataRows, ...def.secondaryBar.metric);
    if (!groupKey || !metricKey) return [];
    return aggregateSheetRows(dataRows, groupKey, metricKey, def.chartLimit ?? limit);
  }, [dataRows, def, limit]);

  const pieData = useMemo(() => {
    if (!def.pieGroup?.length || def.secondaryBar) return [];
    const groupKey = findColumn(dataRows, ...def.pieGroup);
    if (!groupKey) return [];
    const metricKey = def.pieMetric?.length ? findColumn(dataRows, ...def.pieMetric) : undefined;
    if (metricKey) return aggregateSheetRows(dataRows, groupKey, metricKey, 8);
    return countByColumn(dataRows, groupKey, 8);
  }, [dataRows, def]);

  if (def.kind === "filters") {
    return (
      <div className="space-y-4">
        <FilterPanel rows={sourceRows} />
        <SheetTable title={def.label} rows={sourceRows} columns={columns} />
      </div>
    );
  }

  if (def.kind === "text") {
    return <TextPanel title={def.label} rows={sourceRows} />;
  }

  if (def.kind === "heatmap") {
    return (
      <div className="space-y-4">
        <HeatmapPanel rows={sourceRows.length ? sourceRows : dataRows} />
        <SheetTable title={def.label} rows={dataRows} columns={columns} />
      </div>
    );
  }

  const barLabel = def.barValueLabel ?? "Value";
  const showSecondaryBar = bar2Data.length > 0;
  const showPie = pieData.length > 0 && !showSecondaryBar;

  return (
    <div className="space-y-4">
      {(barData.length > 0 || showSecondaryBar || showPie) && (
        <div className="grid gap-3 xl:grid-cols-2">
          {barData.length > 0 && (
            <ChartPanel title={def.barTitle ?? `${def.label} — top values`}>
              <StableChartContainer height={280} className="px-2 pb-4">
                <BarChart data={barData} layout="vertical" margin={{ left: 12, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={formatShort} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 9 }} width={150} />
                  <Tooltip
                    formatter={(v: number) => [formatShort(v), barLabel]}
                    labelFormatter={(_, payload) =>
                      String((payload?.[0]?.payload as { fullName?: string })?.fullName ?? "")
                    }
                  />
                  <Bar dataKey="value" fill="#2563eb" radius={[0, 6, 6, 0]} />
                </BarChart>
              </StableChartContainer>
            </ChartPanel>
          )}
          {showSecondaryBar && (
            <ChartPanel title={def.secondaryBar!.title}>
              <StableChartContainer height={280} className="px-2 pb-4">
                <BarChart data={bar2Data} layout="vertical" margin={{ left: 12, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={formatShort} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 9 }} width={150} />
                  <Tooltip
                    formatter={(v: number) => [
                      formatShort(v),
                      def.secondaryBar!.valueLabel ?? "Value",
                    ]}
                    labelFormatter={(_, payload) =>
                      String((payload?.[0]?.payload as { fullName?: string })?.fullName ?? "")
                    }
                  />
                  <Bar dataKey="value" fill="#10b981" radius={[0, 6, 6, 0]} />
                </BarChart>
              </StableChartContainer>
            </ChartPanel>
          )}
          {showPie && (
            <ChartPanel title={def.pieTitle ?? `${def.label} — distribution`}>
              <StableChartContainer height={280} className="px-2 pb-4">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius="42%"
                    outerRadius="72%"
                    paddingAngle={2}
                  >
                    {pieData.map((entry, i) => (
                      <Cell key={entry.fullName} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => [formatShort(v), def.barValueLabel ?? "Value"]} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </StableChartContainer>
            </ChartPanel>
          )}
        </div>
      )}
      <SheetTable title={def.label} rows={dataRows} columns={columns} />
    </div>
  );
}

function ChartPanel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="portal-panel">
      <div className="portal-panel-header">
        <h3 className="portal-panel-title">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function SheetTable({
  title,
  rows,
  columns,
}: {
  title: string;
  rows: Record<string, unknown>[];
  columns: string[];
}) {
  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-sm font-bold text-slate-900">{title}</h3>
        <p className="text-xs text-slate-500">{rows.length} rows</p>
      </div>
      <div className="overflow-x-auto rounded-xl border border-slate-100 bg-white">
        <table className="portal-growth-table w-full min-w-[920px] text-left text-sm">
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column}>{column}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={index}>
                {columns.map((column) => (
                  <td key={column} className="max-w-[280px] align-top">
                    <span className="line-clamp-4">{formatCell(row[column])}</span>
                  </td>
                ))}
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={Math.max(columns.length, 1)} className="py-10 text-center text-slate-500">
                  No data rows available.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FilterPanel({ rows }: { rows: Record<string, unknown>[] }) {
  const filters = rows.filter((row) => {
    const label = String(Object.values(row)[0] ?? "").trim();
    return label && !/^(control panel|filter selections)/i.test(label) && label.length < 80;
  });

  return (
    <div className="portal-panel">
      <div className="portal-panel-header">
        <h3 className="portal-panel-title">Control Panel — Filters</h3>
      </div>
      <div className="grid gap-2 p-3 sm:grid-cols-2 lg:grid-cols-3">
        {filters.slice(0, 18).map((row, i) => {
          const entries = Object.entries(row).filter(([, v]) => v != null && v !== "");
          const label = String(entries[0]?.[1] ?? "").trim();
          const value = entries.slice(1).map(([, v]) => formatCell(v)).filter(Boolean).join(" · ");
          if (!label) return null;
          return (
            <div key={i} className="rounded-lg border border-slate-100 bg-slate-50/80 px-3 py-2">
              <p className="text-[10px] font-bold uppercase text-slate-500">{label}</p>
              <p className="mt-0.5 text-xs font-semibold text-slate-800">{value || "—"}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TextPanel({ title, rows }: { title: string; rows: Record<string, unknown>[] }) {
  const blocks = rows
    .map((row) =>
      Object.values(row)
        .map((v) => String(v ?? "").trim())
        .filter(Boolean)
        .join(" — ")
    )
    .filter((text) => text.length > 2);

  return (
    <div className="portal-panel p-4">
      <h3 className="portal-panel-title mb-3">{title}</h3>
      <div className="space-y-3 text-sm leading-relaxed text-slate-700">
        {blocks.map((text, i) => (
          <p key={i}>{text}</p>
        ))}
        {blocks.length === 0 && <p className="text-slate-500">No methodology content imported.</p>}
      </div>
    </div>
  );
}

function HeatmapPanel({ rows }: { rows: Record<string, unknown>[] }) {
  const stateKey = findColumn(rows, "state") ?? "State";
  const sectorCols = sheetColumns(rows).filter((c) => c !== stateKey && c !== "State / Sector");

  const matrixRows = rows.filter((row) => {
    const state = String(row[stateKey] ?? row["State / Sector"] ?? "").trim();
    return state && state.length < 48;
  });

  const topStates = matrixRows.slice(0, 12);
  const topSectors = sectorCols.slice(0, 8);

  return (
    <div className="portal-panel overflow-x-auto p-3">
      <h3 className="portal-panel-title mb-3">Hiring intensity heatmap</h3>
      <table className="w-full min-w-[640px] border-collapse text-xs">
        <thead>
          <tr>
            <th className="border border-slate-200 bg-slate-50 px-2 py-1 text-left">State</th>
            {topSectors.map((col) => (
              <th key={col} className="border border-slate-200 bg-slate-50 px-2 py-1 text-left">
                {shortSheetLabel(col, 16)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {topStates.map((row, i) => {
            const state = String(row[stateKey] ?? row["State / Sector"] ?? "");
            return (
              <tr key={i}>
                <td className="border border-slate-200 px-2 py-1 font-semibold text-slate-800">{state}</td>
                {topSectors.map((col) => {
                  const val = readSheetNumber(row[col]);
                  const intensity = Math.min(1, val / 100);
                  return (
                    <td
                      key={col}
                      className="border border-slate-200 px-2 py-1 tabular-nums"
                      style={{ backgroundColor: `rgba(37, 99, 235, ${0.08 + intensity * 0.72})` }}
                    >
                      {val ? val.toFixed(1) : "—"}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
