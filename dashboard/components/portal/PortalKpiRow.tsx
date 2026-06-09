"use client";

import { formatCount } from "@/lib/jobAnalytics";

interface Props {
  activeVacancies: number;
  newThisWeek: number;
  departmentCount: number;
  investmentJobs: number;
  applicationsToday: number;
}

export default function PortalKpiRow({
  activeVacancies,
  newThisWeek,
  departmentCount,
  investmentJobs,
  applicationsToday,
}: Props) {
  const cards = [
    {
      label: "Active Vacancies",
      value: formatCount(activeVacancies),
      delta: `+${formatCount(newThisWeek)} this week`,
      deltaClass: "text-emerald-600",
      iconBg: "bg-blue-50 text-blue-600",
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      label: "Departments",
      value: String(departmentCount),
      delta: "All UP Govt Depts",
      deltaClass: "text-slate-500",
      iconBg: "bg-emerald-50 text-emerald-600",
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
    },
    {
      label: "Predicted Jobs",
      value: formatCount(investmentJobs),
      delta: "+10% increase",
      deltaClass: "text-emerald-600",
      iconBg: "bg-violet-50 text-violet-600",
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
        </svg>
      ),
    },
    {
      label: "Applications Today",
      value: formatCount(applicationsToday),
      delta: "Across all portals",
      deltaClass: "text-slate-500",
      iconBg: "bg-orange-50 text-orange-500",
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <div key={card.label} className="portal-kpi-card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">{card.label}</p>
              <p className="mt-1 text-3xl font-bold tracking-tight text-slate-900">{card.value}</p>
              <p className={`mt-1 text-xs font-medium ${card.deltaClass}`}>{card.delta}</p>
            </div>
            <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${card.iconBg}`}>
              {card.icon}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
