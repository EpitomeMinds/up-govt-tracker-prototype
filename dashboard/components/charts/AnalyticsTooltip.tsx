"use client";

interface TooltipPayload {
  name: string;
  value: number;
  color: string;
  dataKey?: string;
}

interface Props {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string;
  valueLabel?: string;
}

export default function AnalyticsTooltip({
  active,
  payload,
  label,
  valueLabel = "Value",
}: Props) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-lg border border-bi-border bg-white px-3 py-2 shadow-widget">
      {label && (
        <p className="mb-1.5 max-w-[200px] truncate text-xs font-semibold text-slate-800">
          {label}
        </p>
      )}
      <div className="space-y-1">
        {payload.map((entry) => (
          <div
            key={`${entry.name}-${entry.dataKey}`}
            className="flex items-center justify-between gap-4 text-xs"
          >
            <span className="flex items-center gap-1.5 text-slate-600">
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              {entry.name}
            </span>
            <span className="font-semibold tabular-nums text-slate-900">
              {Number(entry.value).toLocaleString("en-IN")}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
