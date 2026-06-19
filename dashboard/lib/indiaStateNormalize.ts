export const GEO_STATE_NAMES = [
  "Andaman & Nicobar",
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chandigarh",
  "Chhattisgarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jammu & Kashmir",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Ladakh",
  "Lakshadweep",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Puducherry",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
] as const;

/** Blue ramp from light tint to deep navy — every step is visibly different. */
export const VACANCY_HEAT_RAMP = [
  "#dbeafe",
  "#bfdbfe",
  "#93c5fd",
  "#60a5fa",
  "#3b82f6",
  "#2563eb",
  "#1d4ed8",
  "#1e40af",
] as const;

const NO_DATA_COLOR = "#cbd5e1";

/** Rank-based quantile colors so skewed outliers don't wash out other states. */
export function buildVacancyHeatColorMap(
  entries: { key: string; value: number }[]
): Map<string, string> {
  const ranked = entries
    .filter((e) => e.value > 0)
    .sort((a, b) => a.value - b.value);

  const colorMap = new Map<string, string>();
  const steps = VACANCY_HEAT_RAMP.length;

  ranked.forEach(({ key, value }, i) => {
    const rankT = ranked.length === 1 ? 1 : i / (ranked.length - 1);
    const sqrtT = Math.sqrt(value) / Math.sqrt(ranked[ranked.length - 1].value);
    const blended = 0.55 * rankT + 0.45 * sqrtT;
    const idx = Math.min(steps - 1, Math.round(blended * (steps - 1)));
    colorMap.set(key, VACANCY_HEAT_RAMP[idx]);
  });

  return colorMap;
}

export function vacancyHeatColor(value: number, max: number): string {
  if (!max || value <= 0) return NO_DATA_COLOR;
  const t = Math.min(1, Math.sqrt(value) / Math.sqrt(max));
  const boosted = 0.2 + 0.8 * t;
  const idx = Math.min(
    VACANCY_HEAT_RAMP.length - 1,
    Math.round(boosted * (VACANCY_HEAT_RAMP.length - 1))
  );
  return VACANCY_HEAT_RAMP[idx];
}
