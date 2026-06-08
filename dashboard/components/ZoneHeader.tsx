"use client";

interface Props {
  title: string;
  description: string;
  badge?: string;
}

export default function ZoneHeader({ title, description, badge }: Props) {
  return (
    <header className="bi-zone-header">
      {badge && (
        <span className="bi-zone-badge mb-2 inline-block">{badge}</span>
      )}
      <h2 className="bi-zone-title">{title}</h2>
      <p className="bi-zone-desc">{description}</p>
    </header>
  );
}
