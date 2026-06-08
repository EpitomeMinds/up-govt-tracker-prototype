"use client";

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
        <header className="mb-2 shrink-0">
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
      <button type="button" className="btn-ghost disabled:opacity-40" disabled={page <= 1} onClick={() => onPage(page - 1)}>
        ← Prev
      </button>
      <span className="text-[11px] tabular-nums text-bi-muted">Page {page} / {totalPages}</span>
      <button type="button" className="btn-ghost disabled:opacity-40" disabled={page >= totalPages} onClick={() => onPage(page + 1)}>
        Next →
      </button>
    </div>
  );
}

export function usePagination<T>(items: T[], pageSize: number, page: number) {
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;
  return { pageItems: items.slice(start, start + pageSize), totalPages, safePage };
}
