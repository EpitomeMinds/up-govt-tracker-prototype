"use client";

interface Props {
  label: string;
  value: string;
  delta: string;
  accent: "blue" | "teal" | "violet" | "coral" | "amber" | "slate";
  icon: React.ReactNode;
  small?: boolean;
}

const ACCENTS = {
  blue: {
    strip: "bg-bi-accent",
    icon: "bg-bi-accentSoft text-bi-accent",
    value: "text-bi-accent",
  },
  teal: {
    strip: "bg-bi-teal",
    icon: "bg-teal-50 text-bi-teal",
    value: "text-bi-teal",
  },
  violet: {
    strip: "bg-bi-violet",
    icon: "bg-violet-50 text-bi-violet",
    value: "text-bi-violet",
  },
  coral: {
    strip: "bg-bi-coral",
    icon: "bg-red-50 text-bi-coral",
    value: "text-bi-coral",
  },
  amber: {
    strip: "bg-bi-amber",
    icon: "bg-amber-50 text-bi-amber",
    value: "text-bi-amber",
  },
  slate: {
    strip: "bg-slate-400",
    icon: "bg-slate-100 text-slate-500",
    value: "text-bi-title",
  },
};

export default function KpiCard({
  label,
  value,
  delta,
  accent,
  icon,
  small,
}: Props) {
  const style = ACCENTS[accent];

  return (
    <div className="bi-kpi group">
      <div className={`bi-kpi-accent ${style.strip}`} />
      <div className="bi-kpi-body">
        <div className="flex items-start justify-between gap-2">
          <p className="bi-kpi-label">{label}</p>
          <span className={`bi-kpi-icon ${style.icon}`}>{icon}</span>
        </div>
        <p
          className={`bi-kpi-value ${small ? "!text-base leading-snug" : ""} ${style.value}`}
        >
          {value}
        </p>
        <p className="bi-kpi-delta">{delta}</p>
      </div>
    </div>
  );
}
