"use client";

import type { NcsStats } from "@/lib/ncsJobTypes";

interface Props {
  stats: NcsStats | null;
}

export default function PortalNcsAnalyticsPanel({ stats }: Props) {
  return (
    <div className="portal-panel">
      <div className="portal-panel-header">
        <h2 className="portal-panel-title">NCS Overview</h2>
      </div>
      <div className="space-y-4 p-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-slate-50 p-3">
            <p className="text-xs text-slate-500">Synced jobs</p>
            <p className="text-xl font-bold text-slate-900">
              {(stats?.total ?? 0).toLocaleString("en-IN")}
            </p>
          </div>
          <div className="rounded-xl bg-slate-50 p-3">
            <p className="text-xs text-slate-500">Job types</p>
            <p className="text-xl font-bold text-slate-900">{stats?.jobTypes?.length ?? 0}</p>
          </div>
        </div>

        {stats?.topCities?.length ? (
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Top cities
            </p>
            <ul className="space-y-1.5">
              {stats.topCities.slice(0, 6).map((row) => (
                <li key={row.city} className="flex justify-between text-sm text-slate-700">
                  <span>{row.city}</span>
                  <span className="font-medium">{row.count}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {stats?.topFunctionalAreas?.length ? (
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Top sectors
            </p>
            <ul className="space-y-1.5">
              {stats.topFunctionalAreas.slice(0, 6).map((row) => (
                <li key={row.area} className="flex justify-between text-sm text-slate-700">
                  <span className="truncate pr-2">{row.area}</span>
                  <span className="shrink-0 font-medium">{row.count}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {stats?.lastSync && (
          <p className="text-xs text-slate-400">
            Last sync: {new Date(stats.lastSync.synced_at).toLocaleString("en-IN")} (
            {stats.lastSync.job_count.toLocaleString("en-IN")} jobs)
          </p>
        )}
      </div>
    </div>
  );
}
