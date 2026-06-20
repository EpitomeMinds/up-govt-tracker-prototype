/** Format numbers like the Excel Dashboard sheet (Indian grouping). */
export function formatIndianCount(n: number): string {
  if (!Number.isFinite(n)) return "0";
  if (n >= 10000000) return `${(n / 10000000).toFixed(2).replace(/\.?0+$/, "")} Cr`;
  if (n >= 100000) return `${(n / 100000).toFixed(2).replace(/\.?0+$/, "")} L`;
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  return n.toLocaleString("en-IN");
}

export function formatInvestmentCr(cr: number): string {
  if (!Number.isFinite(cr) || cr <= 0) return "₹0 Cr";
  if (cr >= 100000) return `₹${(cr / 100000).toFixed(2)}L Cr`;
  if (cr >= 1000) return `₹${(cr / 1000).toFixed(1)}k Cr`;
  return `₹${Math.round(cr).toLocaleString("en-IN")} Cr`;
}

export function formatUsdBn(usd: number): string {
  if (!Number.isFinite(usd) || usd <= 0) return "US$0 Bn";
  return `US$${usd.toFixed(2)} Bn`;
}

/** Approximate USD/INR for workbook KPI display (FY25-26). */
export const USD_TO_INR = 83.5;

/** Convert USD billions to INR crore and format like pipeline investment KPIs. */
export function formatUsdBnAsInrCr(usdBn: number): string {
  if (!Number.isFinite(usdBn) || usdBn <= 0) return "₹0 Cr";
  const inrCr = usdBn * 1000 * USD_TO_INR;
  return formatInvestmentCr(inrCr);
}
