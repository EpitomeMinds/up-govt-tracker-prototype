"use client";

import type { MainTab } from "@/lib/aiRecommendationsTypes";

interface StateOption {
  code: string;
  name: string;
}

interface Props {
  active: MainTab;
  onChange: (tab: MainTab) => void;
  onSync?: () => void;
  syncing?: boolean;
  stateCode?: string;
  states?: StateOption[];
  onStateChange?: (code: string) => void;
}

const TABS: { id: MainTab; label: string; hint: string; icon: React.ReactNode }[] = [
  {
    id: "vacancy",
    label: "Vacancy Analytics",
    hint: "Openings & breakdowns",
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    id: "ai-recommendations",
    label: "AI Recommendations",
    hint: "Workforce & skilling",
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
  },
];

export default function MainTabNav({
  active,
  onChange,
  onSync,
  syncing = false,
  stateCode,
  states = [],
  onStateChange,
}: Props) {
  return (
    <nav className="bi-main-tabs flex flex-wrap items-center justify-between gap-3">
      <div className="flex gap-1 rounded-xl bg-bi-canvas/80 p-1 ring-1 ring-bi-border/60">
        {TABS.map((tab) => {
          const isActive = active === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              className={`flex items-center gap-2.5 rounded-lg px-4 py-2 text-left transition-all duration-200 ${
                isActive
                  ? "bg-white text-bi-title shadow-sm ring-1 ring-bi-border/80"
                  : "text-bi-muted hover:text-bi-title"
              }`}
            >
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-lg transition ${
                  isActive
                    ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-sm"
                    : "bg-white/60 text-bi-muted"
                }`}
              >
                {tab.icon}
              </span>
              <span>
                <span className={`block text-sm font-bold ${isActive ? "text-bi-title" : ""}`}>
                  {tab.label}
                </span>
                <span className="block text-[11px] text-bi-muted">{tab.hint}</span>
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {states.length > 0 && onStateChange && (
          <select
            className="bi-select"
            value={stateCode}
            onChange={(e) => onStateChange(e.target.value)}
          >
            {states.map((s) => (
              <option key={s.code} value={s.code}>
                {s.name}
              </option>
            ))}
          </select>
        )}
        {onSync && (
          <button
            type="button"
            className="btn-primary px-4 py-2 text-xs"
            onClick={onSync}
            disabled={syncing}
          >
            {syncing ? "Syncing…" : "Sync now"}
          </button>
        )}
      </div>
    </nav>
  );
}
