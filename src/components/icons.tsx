import type { ReactNode } from "react";

type IconProps = {
  className?: string;
  size?: number;
  strokeWidth?: number;
};

function StrokeIcon({
  children,
  className,
  size = 20,
  strokeWidth = 1.75,
}: IconProps & { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  );
}

function SolidIcon({
  children,
  className,
  size = 20,
}: IconProps & { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="currentColor"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  );
}

export function TruckIcon(props: IconProps) {
  return (
    <StrokeIcon {...props}>
      <path d="M14 18V6a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v11a1 1 0 0 0 1 1h1" />
      <path d="M14 9h4l3 3v5a1 1 0 0 1-1 1h-1" />
      <circle cx="7" cy="18" r="2" />
      <circle cx="17" cy="18" r="2" />
      <path d="M9 18h6" />
    </StrokeIcon>
  );
}

export function SearchIcon(props: IconProps) {
  return (
    <StrokeIcon {...props}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.6-3.6" />
    </StrokeIcon>
  );
}

export function UserIcon(props: IconProps) {
  return (
    <StrokeIcon {...props}>
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </StrokeIcon>
  );
}

export function BagIcon(props: IconProps) {
  return (
    <StrokeIcon {...props}>
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
      <path d="M3 6h18" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </StrokeIcon>
  );
}

export function ArrowRightIcon(props: IconProps) {
  return (
    <StrokeIcon {...props}>
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </StrokeIcon>
  );
}

export function ArrowLeftIcon(props: IconProps) {
  return (
    <StrokeIcon {...props}>
      <path d="M19 12H5" />
      <path d="m11 18-6-6 6-6" />
    </StrokeIcon>
  );
}

export function ArrowUpRightIcon(props: IconProps) {
  return (
    <StrokeIcon {...props}>
      <path d="M7 17 17 7" />
      <path d="M7 7h10v10" />
    </StrokeIcon>
  );
}

export function MenuIcon(props: IconProps) {
  return (
    <StrokeIcon {...props}>
      <path d="M4 7h16" />
      <path d="M4 12h16" />
      <path d="M4 17h16" />
    </StrokeIcon>
  );
}

export function CloseIcon(props: IconProps) {
  return (
    <StrokeIcon {...props}>
      <path d="m6 6 12 12" />
      <path d="m18 6-12 12" />
    </StrokeIcon>
  );
}

export function SparklesIcon(props: IconProps) {
  return (
    <StrokeIcon {...props}>
      <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z" />
      <path d="M5 3v4" />
      <path d="M3 5h4" />
    </StrokeIcon>
  );
}

export function ShirtIcon(props: IconProps) {
  return (
    <StrokeIcon {...props}>
      <path d="M20.4 3.5 16 2a4 4 0 0 1-8 0L3.6 3.5a2 2 0 0 0-1.3 2.2l.6 3.5a1 1 0 0 0 1 .8H6v10a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V10h2.1a1 1 0 0 0 1-.8l.6-3.5a2 2 0 0 0-1.3-2.2Z" />
    </StrokeIcon>
  );
}

export function PaletteIcon(props: IconProps) {
  return (
    <StrokeIcon {...props}>
      <path d="M12 22a10 10 0 1 1 10-10c0 2.2-1.8 4-4 4h-2.3a2 2 0 0 0-1.5 3.3l.2.2A2 2 0 0 1 12 22Z" />
      <circle cx="7.5" cy="11.5" r="1" />
      <circle cx="10" cy="7" r="1" />
      <circle cx="15" cy="7.5" r="1" />
      <circle cx="17" cy="12" r="1" />
    </StrokeIcon>
  );
}

export function TypeIcon(props: IconProps) {
  return (
    <StrokeIcon {...props}>
      <path d="M4 7V4h16v3" />
      <path d="M9 20h6" />
      <path d="M12 4v16" />
    </StrokeIcon>
  );
}

export function ImageIcon(props: IconProps) {
  return (
    <StrokeIcon {...props}>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="9" cy="9" r="2" />
      <path d="m21 15-5-5L5 21" />
    </StrokeIcon>
  );
}

export function UploadIcon(props: IconProps) {
  return (
    <StrokeIcon {...props}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <path d="m17 8-5-5-5 5" />
      <path d="M12 3v12" />
    </StrokeIcon>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <StrokeIcon {...props}>
      <path d="M20 6 9 17l-5-5" />
    </StrokeIcon>
  );
}

export function WalletIcon(props: IconProps) {
  return (
    <StrokeIcon {...props}>
      <path d="M3 7a2 2 0 0 1 2-2h13a1 1 0 0 1 1 1v2" />
      <path d="M3 7v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2H4" />
      <path d="M16 13h3" />
    </StrokeIcon>
  );
}

export function RefreshIcon(props: IconProps) {
  return (
    <StrokeIcon {...props}>
      <path d="M21 12a9 9 0 0 1-9 9 9 9 0 0 1-7.5-4.1" />
      <path d="M3 12a9 9 0 0 1 9-9 9 9 0 0 1 7.5 4.1" />
      <path d="M3 4v4h4" />
      <path d="M21 20v-4h-4" />
    </StrokeIcon>
  );
}

export function SquareIcon(props: IconProps) {
  return (
    <StrokeIcon {...props}>
      <rect x="4" y="4" width="16" height="16" rx="2" />
    </StrokeIcon>
  );
}

export function CircleIcon(props: IconProps) {
  return (
    <StrokeIcon {...props}>
      <circle cx="12" cy="12" r="8" />
    </StrokeIcon>
  );
}

export function SlidersIcon(props: IconProps) {
  return (
    <StrokeIcon {...props}>
      <path d="M4 21v-7" />
      <path d="M4 10V3" />
      <path d="M12 21v-9" />
      <path d="M12 8V3" />
      <path d="M20 21v-5" />
      <path d="M20 12V3" />
      <path d="M1 14h6" />
      <path d="M9 8h6" />
      <path d="M17 16h6" />
    </StrokeIcon>
  );
}

export function InstagramIcon({ className, size = 20 }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function TikTokIcon({ className, size = 20 }: IconProps) {
  return (
    <SolidIcon className={className} size={size}>
      <path d="M16.6 2h-3.2v13.1a2.6 2.6 0 1 1-2.2-2.6V9.3a5.7 5.7 0 1 0 5.4 5.7V8.6a6.6 6.6 0 0 0 3.6 1.1V6.5a3.5 3.5 0 0 1-3.6-3.5V2Z" />
    </SolidIcon>
  );
}

export function FacebookIcon({ className, size = 20 }: IconProps) {
  return (
    <SolidIcon className={className} size={size}>
      <path d="M13.5 22v-8.5h2.9l.4-3.3h-3.3V8.1c0-.95.27-1.6 1.63-1.6h1.74V3.55A23 23 0 0 0 14.32 3.4c-2.53 0-4.27 1.54-4.27 4.38v2.42H7.1v3.3h2.95V22h3.45Z" />
    </SolidIcon>
  );
}

export function MoonIcon(props: IconProps) {
  return (
    <StrokeIcon {...props}>
      <path d="M20.5 14.3A8.5 8.5 0 0 1 9.7 3.5a8.5 8.5 0 1 0 10.8 10.8Z" />
    </StrokeIcon>
  );
}

export function SunIcon(props: IconProps) {
  return (
    <StrokeIcon {...props}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </StrokeIcon>
  );
}

/** Maps the icon keys stored in the dictionary to a rendered icon. */
export function FeatureIcon({ name, ...props }: IconProps & { name: string }) {
  switch (name) {
    case "truck":
      return <TruckIcon {...props} />;
    case "bag":
      return <BagIcon {...props} />;
    case "palette":
      return <PaletteIcon {...props} />;
    case "shirt":
      return <ShirtIcon {...props} />;
    default:
      return <SparklesIcon {...props} />;
  }
}
