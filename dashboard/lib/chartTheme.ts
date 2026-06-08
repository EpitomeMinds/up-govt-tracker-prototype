export const LABOUR_COLORS = {
  skilled: "#0d9488",
  semi_skilled: "#f59e0b",
  unskilled: "#ef4444",
  general: "#64748b",
} as const;

export const LABOUR_LABELS: Record<string, string> = {
  skilled: "Skilled",
  semi_skilled: "Semi-skilled",
  unskilled: "Unskilled",
  general: "General",
};

export const CHART_COLORS = {
  primary: "#2563eb",
  secondary: "#7c3aed",
  accent: "#0d9488",
  listings: "#2563eb",
  vacancies: "#7c3aed",
  grid: "#e2e8f0",
  axis: "#64748b",
};

export const EDUCATION_COLORS = [
  "#64748b",
  "#f59e0b",
  "#0d9488",
  "#2563eb",
  "#7c3aed",
  "#ef4444",
  "#ec4899",
];

export const PIE_PALETTE = [
  "#2563eb",
  "#7c3aed",
  "#0d9488",
  "#f59e0b",
  "#ef4444",
  "#ec4899",
  "#3b82f6",
  "#64748b",
];

export function truncateLabel(label: string, max = 22): string {
  if (label.length <= max) return label;
  return `${label.slice(0, max - 1)}…`;
}

export function formatAxisNumber(value: number): string {
  if (value >= 1000) return `${(value / 1000).toFixed(1)}k`;
  return String(value);
}
