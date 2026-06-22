import { isAggregateSectorLabel } from "./growthKpiSectorBreakdown";

export function readSheetNumber(value: unknown): number {
  if (typeof value === "number") return value;
  const parsed = Number(String(value ?? "").replace(/[^0-9.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

export function sheetColumns(rows: Record<string, unknown>[]): string[] {
  const seen = new Set<string>();
  const cols: string[] = [];
  for (const row of rows) {
    for (const key of Object.keys(row)) {
      if (!seen.has(key)) {
        seen.add(key);
        cols.push(key);
      }
    }
  }
  return cols;
}

export function findColumn(rows: Record<string, unknown>[], ...needles: string[]): string | undefined {
  const cols = sheetColumns(rows);
  const normalized = needles.map((n) => n.toLowerCase());
  for (const col of cols) {
    const lower = col.toLowerCase();
    if (normalized.every((n) => lower.includes(n))) return col;
  }
  for (const col of cols) {
    const lower = col.toLowerCase();
    if (normalized.some((n) => lower.includes(n))) return col;
  }
  return undefined;
}

export function isWorkbookNoiseRow(row: Record<string, unknown>): boolean {
  const texts = Object.values(row)
    .filter((v) => v != null && v !== "")
    .map((v) => String(v).trim())
    .filter(Boolean);
  if (!texts.length) return true;

  const primary = texts[0];
  if (isAggregateSectorLabel(primary)) return true;

  const lower = primary.toLowerCase();
  if (/^[a-d]\.\s/.test(lower)) return true;
  if (lower.startsWith("source:") || lower.includes("source: dpiit") || lower.includes("source: pib")) {
    return true;
  }
  if (/^(filter selections|control panel|national pli summary|financial year|metric|sector_id|state_id|project_id|alert_id|insight_id)/i.test(lower)) {
    const hasNumber = Object.values(row).some((v) => typeof v === "number");
    if (!hasNumber) return true;
  }

  const numbers = Object.values(row).filter((v) => typeof v === "number") as number[];
  const hasNumeric = numbers.some((n) => Number.isFinite(n) && n !== 0);
  if (hasNumeric) return false;

  if (primary.length > 90) return true;
  if (texts.length === 1 && !hasNumeric) return true;

  return false;
}

export function filterSheetDataRows(rows: Record<string, unknown>[]): Record<string, unknown>[] {
  return rows.filter((row) => !isWorkbookNoiseRow(row));
}

export function shortSheetLabel(value: string, max = 22): string {
  return value.length > max ? `${value.slice(0, max - 1)}…` : value;
}

export function aggregateSheetRows(
  rows: Record<string, unknown>[],
  groupKey: string,
  metricKey: string,
  limit = 10
) {
  const map = new Map<string, { name: string; fullName: string; value: number }>();
  for (const row of rows) {
    const rawName = String(row[groupKey] ?? "").trim();
    if (!rawName || isAggregateSectorLabel(rawName)) continue;
    const name = shortSheetLabel(rawName);
    const existing = map.get(rawName) ?? { name, fullName: rawName, value: 0 };
    existing.value += readSheetNumber(row[metricKey]);
    map.set(rawName, existing);
  }
  return Array.from(map.values())
    .sort((a, b) => b.value - a.value)
    .slice(0, limit);
}

const STATE_COLUMN_PATTERN = /^(state|region)(\s|\/)|$|^state\s*\//i;

function stateLikeValues(row: Record<string, unknown>): string[] {
  const values: string[] = [];
  for (const [key, value] of Object.entries(row)) {
    if (value == null || value === "") continue;
    if (STATE_COLUMN_PATTERN.test(key.trim())) {
      values.push(String(value).trim());
    }
  }
  return values;
}

export function sheetHasStateColumn(rows: Record<string, unknown>[]): boolean {
  if (!rows.length) return false;
  return sheetColumns(rows).some((col) => STATE_COLUMN_PATTERN.test(col.trim()));
}

export function rowMatchesState(row: Record<string, unknown>, state: string): boolean {
  if (!state) return true;
  const target = state.trim().toLowerCase();
  if (!target) return true;

  for (const raw of stateLikeValues(row)) {
    const value = raw.toLowerCase();
    if (value === target) return true;
    if (value.includes(target) || target.includes(value)) return true;
  }
  return false;
}

export function filterWorkbookRowsByState(
  rows: Record<string, unknown>[] | undefined,
  state: string
): Record<string, unknown>[] {
  if (!rows?.length) return rows ?? [];
  if (!state.trim()) return rows;
  if (!sheetHasStateColumn(rows)) return rows;
  return rows.filter((row) => rowMatchesState(row, state));
}

export function countByColumn(rows: Record<string, unknown>[], groupKey: string, limit = 8) {
  const map = new Map<string, { name: string; fullName: string; value: number }>();
  for (const row of rows) {
    const rawName = String(row[groupKey] ?? "").trim();
    if (!rawName || isAggregateSectorLabel(rawName)) continue;
    const name = shortSheetLabel(rawName);
    const existing = map.get(rawName) ?? { name, fullName: rawName, value: 0 };
    existing.value += 1;
    map.set(rawName, existing);
  }
  return Array.from(map.values())
    .sort((a, b) => b.value - a.value)
    .slice(0, limit);
}
