"use client";

import UpGovtLogo from "./UpGovtLogo";
import EpitomeMindsBrand from "./EpitomeMindsBrand";
export type PortalNavId = "dashboard" | "investment" | "users";

interface NavItem {
  id: PortalNavId;
  label: string;
  icon: React.ReactNode;
  disabled?: boolean;
}

interface Props {
  active: PortalNavId;
  onChange: (id: PortalNavId) => void;
  lastSync?: string | null;
  isAuthenticated?: boolean;
  onLogout?: () => void;
}

function syncLabel(lastSync?: string | null) {
  if (!lastSync) return "Not synced yet";
  const mins = Math.floor((Date.now() - new Date(lastSync).getTime()) / 60000);
  if (mins < 1) return "Last sync: just now";
  if (mins < 60) return `Last sync: ${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  return `Last sync: ${hrs} hr ago`;
}

export default function PortalSidebar({
  active,
  onChange,
  lastSync,
  isAuthenticated = true,
  onLogout,
}: Props) {
  const mainNav: NavItem[] = [
    {
      id: "investment",
      label: "Growth & Recommendations",
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      ),
    },
    {
      id: "users",
      label: "User Management",
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
    },
  ];

  const renderItem = (item: NavItem) => {
    const isActive = active === item.id;
    return (
      <button
        key={item.id}
        type="button"
        disabled={item.disabled}
        onClick={() => !item.disabled && onChange(item.id)}
        className={`portal-nav-item ${isActive ? "portal-nav-item-active" : ""} ${item.disabled ? "portal-nav-item-disabled" : ""}`}
      >
        {item.icon}
        <span>{item.label}</span>
      </button>
    );
  };

  return (
    <aside className="portal-sidebar">
      <div className="portal-sidebar-brand">
        <UpGovtLogo size="sm" />
        <div>
          <p className="text-sm font-bold text-white">Employment Portal</p>
          <p className="text-[11px] text-slate-400">Employment Dashboard</p>
        </div>
      </div>

      <nav className="portal-sidebar-nav">
        {mainNav.map(renderItem)}
        <button
          type="button"
          disabled={!isAuthenticated}
          onClick={() => isAuthenticated && onLogout?.()}
          className={`portal-nav-item ${!isAuthenticated ? "portal-nav-item-disabled" : ""}`}
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span>Logout</span>
        </button>
      </nav>

      <div className="portal-sidebar-footer">
        <div className="flex items-center gap-2">
          <span className="portal-status-dot" />
          <span className="text-xs font-medium text-emerald-400">System Online</span>
        </div>
        <p className="mt-1 text-[11px] text-slate-500">{syncLabel(lastSync)}</p>
        <EpitomeMindsBrand className="mt-4 border-t border-white/10 pt-4" />
      </div>
    </aside>
  );
}
