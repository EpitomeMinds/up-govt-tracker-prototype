"use client";

interface Props {
  title: string;
  children: React.ReactNode;
  className?: string;
  height?: number;
  fill?: boolean;
  minChartHeight?: number;
}

export default function ChartCard({
  title,
  children,
  className = "",
  height = 320,
  fill = false,
  minChartHeight = 200,
}: Props) {
  return (
    <div className={`bi-widget flex flex-col ${fill ? "h-full min-h-0" : ""} ${className}`}>
      <div className="bi-widget-header shrink-0 py-2.5">
        <div className="flex items-center gap-2.5">
          <span className="bi-widget-dot" />
          <h3 className="bi-widget-title">{title}</h3>
        </div>
      </div>
      <div
        className={`bi-widget-body min-h-0 ${fill ? "flex-1" : ""}`}
        style={fill ? { minHeight: minChartHeight } : { height }}
      >
        {children}
      </div>
    </div>
  );
}
