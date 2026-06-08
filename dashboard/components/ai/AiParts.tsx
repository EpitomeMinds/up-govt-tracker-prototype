"use client";

import type { AiRecommendation, AiRecommendationFilters } from "@/lib/aiRecommendationsTypes";
import {
  formatBudgetCr,
  formatWorkforce,
  PRIORITY_COLORS,
  STATUS_COLORS,
} from "@/lib/aiRecommendationsApi";
import { BOARD_CATEGORY_COLORS } from "@/lib/aiRecommendationsTypes";

export function PriorityBadge({ priority }: { priority: string }) {
  return (
    <span
      className="rounded-full px-2 py-0.5 text-[9px] font-bold uppercase"
      style={{
        backgroundColor: `${PRIORITY_COLORS[priority] || "#64748b"}18`,
        color: PRIORITY_COLORS[priority] || "#64748b",
      }}
    >
      {priority}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className="rounded-full px-2 py-0.5 text-[9px] font-bold uppercase"
      style={{
        backgroundColor: `${STATUS_COLORS[status] || "#8b95ad"}18`,
        color: STATUS_COLORS[status] || "#8b95ad",
      }}
    >
      {status}
    </span>
  );
}

export function BoardBadge({ category }: { category: string }) {
  const color = BOARD_CATEGORY_COLORS[category] || "#64748b";
  return (
    <span
      className="rounded-full px-2 py-0.5 text-[9px] font-bold"
      style={{ backgroundColor: `${color}18`, color }}
    >
      {category}
    </span>
  );
}

export function RecommendationDetail({
  rec,
  onDrillSector,
  onDrillBoard,
}: {
  rec: AiRecommendation;
  onDrillSector?: (s: string) => void;
  onDrillBoard?: (d: string) => void;
}) {
  return (
    <div className="bi-widget flex h-full flex-col overflow-hidden">
      <div className="bi-widget-header shrink-0">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <PriorityBadge priority={rec.priority} />
            <StatusBadge status={rec.status} />
          </div>
          <h3 className="bi-widget-title mt-2 line-clamp-2">{rec.title}</h3>
        </div>
      </div>
      <div className="min-h-0 flex-1 space-y-3 overflow-hidden p-4">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            { label: "Required", value: formatWorkforce(rec.requiredWorkforce) },
            { label: "Available", value: formatWorkforce(rec.currentlyAvailable) },
            { label: "Skill gap", value: `${formatWorkforce(rec.skillGap)} (${rec.gapPercent}%)` },
            { label: "Budget", value: formatBudgetCr(rec.budgetCr) },
            { label: "Duration", value: `${rec.durationMonths} mo` },
            { label: "Start", value: String(rec.startYear) },
            { label: "AI conf.", value: `${rec.aiConfidence}%` },
            { label: "Impact", value: String(rec.impactScore) },
          ].map((m) => (
            <div key={m.label} className="rounded-lg bg-bi-canvas/80 px-2.5 py-2">
              <p className="text-[9px] font-bold uppercase text-bi-muted">{m.label}</p>
              <p className="text-sm font-extrabold tabular-nums text-bi-title">{m.value}</p>
            </div>
          ))}
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <InfoCell label="Board / Department">
            {onDrillBoard ? (
              <button
                type="button"
                className="font-semibold text-bi-accent hover:underline"
                onClick={() => onDrillBoard(rec.department)}
              >
                {rec.department}
              </button>
            ) : (
              rec.department
            )}
          </InfoCell>
          <InfoCell label="Sector">
            {onDrillSector ? (
              <button
                type="button"
                className="font-semibold text-bi-accent hover:underline"
                onClick={() => onDrillSector(rec.sector)}
              >
                {rec.sector}
              </button>
            ) : (
              rec.sector
            )}
          </InfoCell>
          <InfoCell label="Region">{rec.region}</InfoCell>
          <InfoCell label="Action">{rec.actionType}</InfoCell>
        </div>
      </div>
    </div>
  );
}

function InfoCell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg bg-bi-canvas/60 px-3 py-2">
      <p className="text-[9px] font-bold uppercase text-bi-muted">{label}</p>
      <p className="truncate text-sm font-medium text-bi-title">{children}</p>
    </div>
  );
}

export function ZoneShell({
  title,
  description,
  badge,
  compact = false,
  children,
}: {
  title?: string;
  description?: string;
  badge?: string;
  compact?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      {!compact && title && (
        <header className="mb-3 shrink-0">
          {badge && <span className="bi-zone-badge mb-1 inline-block">{badge}</span>}
          <h2 className="text-lg font-extrabold text-bi-title">{title}</h2>
          {description && <p className="text-xs text-bi-muted">{description}</p>}
        </header>
      )}
      <div className="min-h-0 flex-1 overflow-hidden">{children}</div>
    </div>
  );
}

export function Paginator({
  page,
  totalPages,
  onPage,
}: {
  page: number;
  totalPages: number;
  onPage: (p: number) => void;
}) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex shrink-0 items-center justify-between border-t border-bi-border px-3 py-2">
      <button
        type="button"
        className="btn-ghost disabled:opacity-40"
        disabled={page <= 1}
        onClick={() => onPage(page - 1)}
      >
        ← Prev
      </button>
      <span className="text-[11px] tabular-nums text-bi-muted">
        Page {page} / {totalPages}
      </span>
      <button
        type="button"
        className="btn-ghost disabled:opacity-40"
        disabled={page >= totalPages}
        onClick={() => onPage(page + 1)}
      >
        Next →
      </button>
    </div>
  );
}

export function usePagination<T>(items: T[], pageSize: number, page: number) {
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;
  return {
    pageItems: items.slice(start, start + pageSize),
    totalPages,
    safePage,
  };
}
