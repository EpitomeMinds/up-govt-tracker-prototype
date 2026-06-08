"use client";

export type AiZoneId =
  | "overview"
  | "boards"
  | "initiatives"
  | "sectors"
  | "regions"
  | "analytics";

export interface AiZoneItem {
  id: AiZoneId;
  label: string;
  hint: string;
  icon: React.ReactNode;
}

interface Props {
  zones: AiZoneItem[];
  active: AiZoneId;
  onChange: (id: AiZoneId) => void;
  stateCode: string;
  stateName: string;
}

export default function AiDashboardSidebar({
  zones,
  active,
  onChange,
  stateCode,
  stateName,
}: Props) {
  return (
    <aside className="bi-sidebar">
      <div className="bi-sidebar-brand">
        <div className="flex items-center gap-3">
          <div
            className="flex h-11 w-11 items-center justify-center rounded-2xl text-sm font-extrabold text-white shadow-lg"
            style={{ background: "linear-gradient(135deg, #7c3aed, #2563eb)" }}
          >
            AI
          </div>
          <div>
            <p className="text-sm font-extrabold tracking-tight text-white">Epitome Minds</p>
            <p className="text-[11px] font-medium text-slate-400">Workforce Intel</p>
          </div>
        </div>
        <p className="mt-3 truncate rounded-lg bg-white/[0.04] px-2.5 py-1.5 text-xs text-slate-400">
          {stateName} · {stateCode}
        </p>
      </div>

      <nav className="bi-sidebar-nav">
        <p className="mb-2 px-2 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">
          AI views
        </p>
        {zones.map((zone) => {
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
                <span className="block text-[13px] font-semibold leading-tight">{zone.label}</span>
                <span className="mt-0.5 block truncate text-[10px] font-normal text-slate-500">
                  {zone.hint}
                </span>
              </span>
            </button>
          );
        })}
      </nav>

      <div className="bi-sidebar-footer">
        <p>UP AI Recommendations</p>
        <p className="mt-1 text-slate-600">250 workforce initiatives</p>
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

export function IconBoards() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  );
}

export function IconInitiatives() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
  );
}

export function IconSectors() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
    </svg>
  );
}

export function IconRegions() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l5.447 2.724A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
    </svg>
  );
}

export function IconAnalytics() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  );
}
