"use client";

import { useMemo, useState } from "react";
import type { DistrictImpactRow } from "@/lib/investmentPortalAnalytics";
import { exportDistrictCsv, formatInvestmentCr } from "@/lib/investmentPortalAnalytics";

interface Props {
  rows: DistrictImpactRow[];
  compact?: boolean;
  onDistrictClick?: (district: string) => void;
  selectedDistrict?: string;
}

const SECTOR_BADGE: Record<string, string> = {
  default: "bg-blue-50 text-blue-700",
};

function sectorBadgeClass(_sector: string) {
  return SECTOR_BADGE.default;
}

export default function PortalDistrictTable({ rows, compact, onDistrictClick, selectedDistrict }: Props) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        r.district.toLowerCase().includes(q) ||
        r.topSector.toLowerCase().includes(q)
    );
  }, [rows, query]);

  const displayRows = compact ? filtered.slice(0, 8) : filtered;

  return (
    <div className="portal-panel">
      <div className="portal-panel-header">
        <h2 className="portal-panel-title min-w-0 flex-1 truncate pr-3">
          District-wise Investment &amp; Job Impact
        </h2>
        {onDistrictClick && (
          <span className="hidden text-[10px] font-medium text-slate-500 sm:inline">
            Click a row to drill down
          </span>
        )}
        <div className="flex shrink-0 items-center gap-2">
          <input
            type="text"
            inputMode="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search district…"
            className="portal-input w-36 text-sm sm:w-44"
          />
          <button
            type="button"
            onClick={() => exportDistrictCsv(filtered)}
            className="portal-btn-primary shrink-0 whitespace-nowrap text-xs"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="portal-growth-table w-full min-w-[980px] text-left text-sm">
          <thead>
            <tr>
              <th>District</th>
              <th>Investment</th>
              <th title="Investment sectors led from this district (each sector counted once statewide)">
                Projects
              </th>
              <th>Jobs Projected</th>
              <th>Top Sector</th>
              <th>Skill Type</th>
              <th>Growth</th>
              <th>Key Projects</th>
              <th>Policy</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {displayRows.map((row) => (
              <tr
                key={row.district}
                className={
                  onDistrictClick
                    ? `cursor-pointer transition-colors hover:bg-blue-50/60 ${
                        selectedDistrict === row.district ? "bg-blue-50" : ""
                      }`
                    : undefined
                }
                onClick={() => onDistrictClick?.(row.district)}
              >
                <td className="font-semibold text-slate-800">{row.district}</td>
                <td>{formatInvestmentCr(row.investmentCr)}</td>
                <td>{row.projects}</td>
                <td className="font-semibold text-orange-500">
                  {row.jobsProjected.toLocaleString("en-IN")}
                </td>
                <td>
                  <span
                    className={`rounded-md px-2 py-0.5 text-[11px] font-semibold ${sectorBadgeClass(row.topSector)}`}
                  >
                    {row.topSector.length > 22
                      ? `${row.topSector.slice(0, 21)}…`
                      : row.topSector}
                  </span>
                </td>
                <td>{row.skillType || "—"}</td>
                <td>{row.growthOutlook || "—"}</td>
                <td className="max-w-[220px]">
                  <span className="line-clamp-2">{row.keyProjects || "—"}</span>
                </td>
                <td className="max-w-[220px]">
                  <span className="line-clamp-2">{row.policy || "—"}</span>
                </td>
                <td>
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600">
                    <span
                      className={`h-2 w-2 rounded-full ${
                        row.status === "Active" ? "bg-emerald-500" : "bg-amber-400"
                      }`}
                    />
                    {row.status}
                  </span>
                </td>
              </tr>
            ))}
            {displayRows.length === 0 && (
              <tr>
                <td colSpan={10} className="py-8 text-center text-slate-500">
                  No districts match your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
