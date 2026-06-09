export const EPITOME_LOGO = "/epitome-minds-logo.png";

interface Props {
  className?: string;
}

export default function EpitomeMindsBrand({ className = "" }: Props) {
  return (
    <div className={`portal-epitome-brand notranslate ${className}`} translate="no">
      <img
        src={EPITOME_LOGO}
        alt="Epitome Minds — Transforming Thoughts"
        className="portal-epitome-brand-img"
      />
    </div>
  );
}
