"use client";

import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  PORTAL_USERS,
  REGISTRATION_TREND,
  ROLE_BADGE,
  ROLE_CHART_DATA,
  STATUS_DOT,
  USER_SUMMARY,
  type PortalUser,
} from "@/lib/userManagementData";

export default function PortalUserManagement() {
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return PORTAL_USERS.filter((user) => {
      if (roleFilter && user.role !== roleFilter) return false;
      if (statusFilter && user.status !== statusFilter) return false;
      if (!q) return true;
      return (
        user.name.toLowerCase().includes(q) ||
        user.email.toLowerCase().includes(q) ||
        user.district.toLowerCase().includes(q)
      );
    });
  }, [query, roleFilter, statusFilter]);

  const summaryCards = [
    {
      label: "Total Users",
      value: String(USER_SUMMARY.totalUsers),
      color: "text-[#2563eb]",
      icon: (
        <svg className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
    {
      label: "Active Today",
      value: String(USER_SUMMARY.activeToday),
      color: "text-emerald-600",
      icon: (
        <svg className="h-6 w-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
    },
    {
      label: "New Registrations",
      value: String(USER_SUMMARY.newRegistrations),
      color: "text-orange-500",
      icon: (
        <svg className="h-6 w-6 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
        </svg>
      ),
    },
    {
      label: "Pending Verification",
      value: String(USER_SUMMARY.pendingVerification),
      color: "text-red-500",
      icon: (
        <svg className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="space-y-5 pb-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900">User Management</h2>
          <p className="text-sm text-slate-500">Manage applicants, officers, and system users</p>
        </div>
        <button type="button" className="portal-btn-primary">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add User
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => (
          <div key={card.label} className="portal-kpi-card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">{card.label}</p>
                <p className={`mt-1 text-3xl font-bold tracking-tight ${card.color}`}>{card.value}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-50">
                {card.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="portal-panel">
        <div className="portal-panel-header flex-wrap gap-3 border-b border-slate-100">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search users…"
            className="portal-input w-full max-w-xs text-sm"
          />
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="portal-select text-sm"
            >
              <option value="">All Roles</option>
              <option value="Applicant">Applicant</option>
              <option value="Dept Officer">Dept Officer</option>
              <option value="Admin">Admin</option>
              <option value="Verifier">Verifier</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="portal-select text-sm"
            >
              <option value="">All Status</option>
              <option value="Active">Active</option>
              <option value="Pending">Pending</option>
              <option value="Inactive">Inactive</option>
            </select>
            <button type="button" className="portal-btn-primary text-xs">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export
            </button>
            <button type="button" className="portal-btn-icon">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="portal-users-table w-full min-w-[960px] text-left text-sm">
            <thead>
              <tr>
                <th className="w-10">
                  <input type="checkbox" aria-label="Select all" />
                </th>
                <th>User</th>
                <th>Role</th>
                <th>Department</th>
                <th>District</th>
                <th>Registered</th>
                <th>Last Active</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((user) => (
                <UserRow key={user.id} user={user} />
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-10 text-center text-slate-500">
                    No users match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-5 py-3 text-sm text-slate-500">
          <span>
            Showing 1–{filtered.length} of {USER_SUMMARY.totalUsers} users
          </span>
          <div className="flex items-center gap-1">
            <button type="button" className="portal-btn-icon h-8 w-8" disabled aria-label="Previous page">
              ‹
            </button>
            <button type="button" className="portal-users-page-btn portal-users-page-btn-active">
              1
            </button>
            <button type="button" className="portal-btn-icon h-8 w-8" disabled aria-label="Next page">
              ›
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <div className="portal-panel">
          <div className="portal-panel-header">
            <h3 className="portal-panel-title">User Role Distribution</h3>
          </div>
          <div className="h-[260px] px-4 pb-4">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <PieChart>
                <Pie
                  data={ROLE_CHART_DATA}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="45%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                >
                  {ROLE_CHART_DATA.map((entry) => (
                    <Cell key={entry.name} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number, name: string) => [v, name]} />
                <Legend wrapperStyle={{ fontSize: 12 }} iconSize={10} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="portal-panel">
          <div className="portal-panel-header">
            <h3 className="portal-panel-title">Registration Trend (Last 6 Months)</h3>
          </div>
          <div className="h-[260px] px-2 pb-4">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <AreaChart data={REGISTRATION_TREND}>
                <defs>
                  <linearGradient id="regTrendFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2563eb" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#2563eb" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#64748b" }} />
                <YAxis tick={{ fontSize: 10, fill: "#64748b" }} allowDecimals={false} />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="count"
                  name="Registrations"
                  stroke="#2563eb"
                  fill="url(#regTrendFill)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

function UserRow({ user }: { user: PortalUser }) {
  return (
    <tr>
      <td>
        <input type="checkbox" aria-label={`Select ${user.name}`} />
      </td>
      <td>
        <div className="flex items-center gap-3">
          <div className="portal-user-avatar">{user.initials}</div>
          <div>
            <p className="font-semibold text-slate-900">{user.name}</p>
            <p className="text-xs text-slate-500">{user.email}</p>
          </div>
        </div>
      </td>
      <td>
        <span className={ROLE_BADGE[user.role]}>{user.role}</span>
      </td>
      <td className="text-slate-600">{user.department}</td>
      <td className="text-slate-600">{user.district}</td>
      <td className="text-slate-600">{user.registered}</td>
      <td className="text-slate-600">{user.lastActive}</td>
      <td>
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600">
          <span className={`h-2 w-2 rounded-full ${STATUS_DOT[user.status]}`} />
          {user.status}
        </span>
      </td>
      <td>
        <div className="flex items-center gap-2">
          <button type="button" className="portal-btn-icon h-8 w-8" aria-label={`Edit ${user.name}`}>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button type="button" className="portal-btn-icon h-8 w-8" aria-label={`Disable ${user.name}`}>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
          </button>
        </div>
      </td>
    </tr>
  );
}
