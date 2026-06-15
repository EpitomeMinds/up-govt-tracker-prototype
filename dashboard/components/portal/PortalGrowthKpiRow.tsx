"use client";

import type { GrowthKpis } from "@/lib/investmentPortalAnalytics";
import { formatCount, formatInvestmentCr } from "@/lib/investmentPortalAnalytics";

interface Props {
  kpis: GrowthKpis;
}

export default function PortalGrowthKpiRow({ kpis }: Props) {
  const cards = [
    {
      label: "Total Investment",
      value: formatInvestmentCr(kpis.totalInvestmentCr),
      delta: `+${kpis.investmentGrowthPct}% from last year`,
      className: "portal-growth-kpi-orange",
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      label: "Projected Jobs",
      value: formatCount(kpis.projectedJobs),
      delta: "2026-2035 projection",
      className: "portal-growth-kpi-blue",
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      label: "Active Projects",
      value: formatCount(kpis.activeProjects),
      delta: `${kpis.industryCount} industries · ${kpis.districtCount} districts`,
      className: "portal-growth-kpi-green",
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
    },
    {
      label: "Top Opportunities",
      value: String(kpis.topOpportunities),
      delta: "Ranked workbook rows",
      className: "portal-growth-kpi-purple",
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <div key={card.label} className={`portal-growth-kpi ${card.className}`}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium opacity-90">{card.label}</p>
              <p className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">{card.value}</p>
              <p className="mt-1 text-xs font-medium opacity-80">{card.delta}</p>
            </div>
            <div className="portal-growth-kpi-icon">{card.icon}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
