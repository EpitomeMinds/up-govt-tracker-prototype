"use client";

interface Props {
  rows: Record<string, unknown>[];
  onOpenDetailed?: () => void;
}

export default function PortalGrowthProjectList({ rows, onOpenDetailed }: Props) {
  return (
    <div className="portal-panel overflow-hidden">
      <div className="portal-panel-header">
        <div>
          <h2 className="portal-panel-title">Project pipeline</h2>
          <p className="text-[10px] text-slate-500">
            {rows.length} project(s) · click row for details
          </p>
        </div>
        {onOpenDetailed && (
          <button type="button" className="portal-btn-ghost text-xs" onClick={onOpenDetailed}>
            Detailed analysis
          </button>
        )}
      </div>
      <div className="max-h-[420px] overflow-y-auto">
        <table className="portal-growth-table w-full min-w-[800px] text-left text-sm">
          <thead>
            <tr>
              <th>Project</th>
              <th>Sector</th>
              <th>State</th>
              <th>Investment (Cr)</th>
              <th>Jobs</th>
              <th>Stage</th>
              <th>Confidence</th>
            </tr>
          </thead>
          <tbody>
            {rows.slice(0, 50).map((row, i) => (
              <tr key={i}>
                <td className="max-w-[240px]">
                  <span className="line-clamp-2 font-semibold text-slate-900">
                    {String(row["Investment Project / Initiative"] ?? "")}
                  </span>
                  <span className="text-[10px] text-slate-500">{String(row["City/District"] ?? row.Location ?? "")}</span>
                </td>
                <td>{String(row.Sector ?? row["Department / Industry"] ?? "")}</td>
                <td>{String(row.State ?? row.Region ?? "")}</td>
                <td className="tabular-nums">{formatNum(row["Investment Value (INR Cr)"])}</td>
                <td className="tabular-nums">{formatNum(row["Projected Vacancies"])}</td>
                <td>{String(row["Project Stage"] ?? row["Job Category"] ?? "")}</td>
                <td>{String(row["Confidence Level"] ?? "")}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="py-10 text-center text-slate-500">
                  No pipeline projects match filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function formatNum(v: unknown): string {
  const n = Number(String(v ?? "").replace(/[^0-9.-]/g, ""));
  if (!Number.isFinite(n)) return "—";
  return n.toLocaleString("en-IN");
}
