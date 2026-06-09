export const UP_GOVT_LOGO = "/up-govt-logo.svg";

interface Props {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const SIZES = {
  sm: "h-10 w-10",
  md: "h-14 w-14",
  lg: "h-16 w-16",
};

export default function UpGovtLogo({ size = "sm", className = "" }: Props) {
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white p-1 ring-1 ring-white/20 ${SIZES[size]} ${className}`}
    >
      <img
        src={UP_GOVT_LOGO}
        alt="Government of Uttar Pradesh"
        className="h-full w-full object-contain"
      />
    </span>
  );
}
