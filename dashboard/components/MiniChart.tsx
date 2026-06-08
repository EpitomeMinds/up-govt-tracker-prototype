"use client";

interface Props {
  title: string;
  children: React.ReactNode;
  className?: string;
}

export default function MiniChart({ title, children, className = "" }: Props) {
  return (
    <div
      className={`mini-chart flex min-h-0 flex-col overflow-hidden rounded-lg border border-slate-200/80 bg-white shadow-sm ${className}`}
    >
      <p className="shrink-0 border-b border-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-700">
        {title}
      </p>
      <div className="min-h-0 flex-1 p-1">{children}</div>
    </div>
  );
}
