"use client";

export type ZoneId =
  | "overview"
  | "map"
  | "workforce"
  | "qualifications"
  | "recruiters"
  | "listings";

export interface ZoneItem {
  id: ZoneId;
  label: string;
  hint: string;
  icon: React.ReactNode;
  hidden?: boolean;
}

interface Props {
  zones: ZoneItem[];
  active: ZoneId;
  onChange: (id: ZoneId) => void;
  stateCode: string;
  stateName: string;
  lastSync?: string | null;
  mode?: "vacancy" | "investment" | "ai-recommendations";
}

export default function DashboardSidebar({
  zones,
  active,
  onChange,
  stateCode,
  stateName,
  lastSync,
  mode = "vacancy",
}: Props) {
  return (
    <aside className="bi-sidebar">
      <div className="bi-sidebar-brand">
        <div className="flex items-center gap-3">
          <div
            className="flex h-11 w-11 items-center justify-center rounded-2xl text-sm font-extrabold text-white shadow-lg"
            style={{ background: "linear-gradient(135deg, #3b82f6, #7c3aed)" }}
          >
            {stateCode}
          </div>
          <div>
            <p className="text-sm font-extrabold tracking-tight text-white">Epitome Minds</p>
            <p className="text-[11px] font-medium text-slate-400">Government Jobs Intel</p>
          </div>
        </div>
        <p className="mt-3 truncate rounded-lg bg-white/[0.04] px-2.5 py-1.5 text-xs text-slate-400">
          {stateName}
        </p>
      </div>

      <nav className="bi-sidebar-nav">
        {mode === "vacancy" ? (
          <>
            <p className="mb-2 px-2 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">
              Analytics
            </p>
            {zones.map((zone) => {
              if (zone.hidden) return null;
              const isActive = active === zone.id;
              return (
                <button
                  key={zone.id}
                  type="button"
                  onClick={() => onChange(zone.id)}
                  className={`bi-nav-item ${isActive ? "bi-nav-item-active" : "bi-nav-item-inactive"}`}
                >
                  <span
                    className={`bi-nav-icon ${isActive ? "bi-nav-icon-active" : "bi-nav-icon-inactive"}`}
                  >
                    {zone.icon}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13px] font-semibold leading-tight">
                      {zone.label}
                    </span>
                    <span className="mt-0.5 block truncate text-[11px] font-normal text-slate-500">
                      {zone.hint}
                    </span>
                  </span>
                </button>
              );
            })}
          </>
        ) : mode === "ai-recommendations" ? (
          <div className="px-3 py-2">
            <div className="bi-nav-item bi-nav-item-active cursor-default">
              <span className="bi-nav-icon bi-nav-icon-active">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[13px] font-semibold">AI Recommendations</span>
                <span className="mt-0.5 block text-[10px] text-slate-500">
                  250 workforce initiatives
                </span>
              </span>
            </div>
            <p className="mt-4 px-2 text-[10px] leading-relaxed text-slate-500">
              Uttar Pradesh AI workforce recommendations — skill gaps, budgets, and regional
              hiring forecasts from official planning data.
            </p>
          </div>
        ) : null}
      </nav>

      <div className="bi-sidebar-footer">
        {lastSync ? (
          <p>
            Synced{" "}
            {new Date(lastSync).toLocaleTimeString("en-IN", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        ) : (
          <p>Awaiting sync</p>
        )}
        <p className="mt-1 font-semibold text-slate-400">Epitome Minds</p>
      </div>
    </aside>
  );
}

export function IconOverview() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    </svg>
  );
}

export function IconMap() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l5.447 2.724A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
    </svg>
  );
}

export function IconWorkforce() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

export function IconQualifications() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path d="M12 14l9-5-9-5-9 5 9 5z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824 2.998 12.078 12.078 0 01.665-6.479L12 14z" />
    </svg>
  );
}

export function IconRecruiters() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  );
}

export function IconListings() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
    </svg>
  );
}
