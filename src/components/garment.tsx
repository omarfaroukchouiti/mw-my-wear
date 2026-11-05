import type { GarmentType } from "@/lib/products";

function isLight(hex: string): boolean {
  const value = hex.replace("#", "");
  const full =
    value.length === 3
      ? value
          .split("")
          .map((char) => char + char)
          .join("")
      : value;
  const r = parseInt(full.slice(0, 2), 16) / 255;
  const g = parseInt(full.slice(2, 4), 16) / 255;
  const b = parseInt(full.slice(4, 6), 16) / 255;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.62;
}

type GarmentProps = {
  type: GarmentType;
  color: string;
  className?: string;
  mark?: boolean;
};

/**
 * Flat-lay garment silhouettes drawn in SVG so the catalogue never depends on
 * external mockup images. Later these get replaced by real product photography.
 */
export function Garment({ type, color, className, mark = true }: GarmentProps) {
  const detail = isLight(color) ? "#0b0b0a" : "#ffffff";
  const shade = isLight(color) ? "#0b0b0a" : "#ffffff";

  return (
    <svg
      viewBox="0 0 400 470"
      className={className}
      role="img"
      aria-hidden="true"
      fill="none"
    >
      <ellipse cx="200" cy="446" rx="118" ry="10" fill="#0b0b0a" opacity="0.07" />

      {type === "tee" && (
        <g>
          <path
            d="M152 62 118 72 58 122l34 78 36-18v258h144V182l36 18 34-78-60-50-30-10c-10 42-86 42-96 0Z"
            fill={color}
            stroke={detail}
            strokeOpacity="0.14"
            strokeWidth="2"
          />
          <path
            d="M152 62c10 42 86 42 96 0"
            stroke={detail}
            strokeOpacity="0.35"
            strokeWidth="7"
          />
          <path d="M126 418h148" stroke={detail} strokeOpacity="0.16" strokeWidth="2" />
          {mark && (
            <text
              x="200"
              y="216"
              textAnchor="middle"
              fill={shade}
              fillOpacity="0.85"
              fontSize="26"
              fontWeight="700"
              letterSpacing="4"
              fontFamily="var(--font-cairo), sans-serif"
            >
              MW
            </text>
          )}
        </g>
      )}

      {type === "oversized" && (
        <g>
          <path
            d="M150 58 110 70 38 128l42 86 34-18v250h172V196l34 18 42-86-72-58-40-12c-8 44-92 44-100 0Z"
            fill={color}
            stroke={detail}
            strokeOpacity="0.14"
            strokeWidth="2"
          />
          <path
            d="M150 58c8 44 92 44 100 0"
            stroke={detail}
            strokeOpacity="0.35"
            strokeWidth="7"
          />
          <path d="M112 420h176" stroke={detail} strokeOpacity="0.16" strokeWidth="2" />
          {mark && (
            <text
              x="200"
              y="238"
              textAnchor="middle"
              fill={shade}
              fillOpacity="0.85"
              fontSize="28"
              fontWeight="700"
              letterSpacing="5"
              fontFamily="var(--font-cairo), sans-serif"
            >
              MW
            </text>
          )}
        </g>
      )}

      {type === "hoodie" && (
        <g>
          <path
            d="M142 108c-4-52 30-78 58-78s62 26 58 78l16 8 46 32-22 56-30-16v236H132V188l-30 16-22-56 46-32 16-8Z"
            fill={color}
            stroke={detail}
            strokeOpacity="0.14"
            strokeWidth="2"
          />
          <path
            d="M152 118c2 30 22 46 48 46s46-16 48-46"
            stroke={detail}
            strokeOpacity="0.32"
            strokeWidth="6"
          />
          <path
            d="M168 96c10 22 54 22 64 0"
            stroke={detail}
            strokeOpacity="0.18"
            strokeWidth="2"
          />
          <path
            d="M154 344h92v44h-92z"
            stroke={detail}
            strokeOpacity="0.2"
            strokeWidth="2"
          />
          <path
            d="M186 168v46M214 168v46"
            stroke={detail}
            strokeOpacity="0.5"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <path d="M132 404h136" stroke={detail} strokeOpacity="0.18" strokeWidth="4" />
          {mark && (
            <text
              x="200"
              y="258"
              textAnchor="middle"
              fill={shade}
              fillOpacity="0.85"
              fontSize="26"
              fontWeight="700"
              letterSpacing="4"
              fontFamily="var(--font-cairo), sans-serif"
            >
              MW
            </text>
          )}
        </g>
      )}

      {type === "sweatshirt" && (
        <g>
          <path
            d="M150 64 116 74 56 126l28 74 36-18 2 240h156l2-240 36 18 28-74-60-52-34-10c-10 40-88 40-98 0Z"
            fill={color}
            stroke={detail}
            strokeOpacity="0.14"
            strokeWidth="2"
          />
          <path
            d="M150 64c10 40 88 40 98 0"
            stroke={detail}
            strokeOpacity="0.34"
            strokeWidth="8"
          />
          <path
            d="M128 376h144"
            stroke={detail}
            strokeOpacity="0.18"
            strokeWidth="10"
          />
          <path d="M128 420h144" stroke={detail} strokeOpacity="0.16" strokeWidth="2" />
          {mark && (
            <text
              x="200"
              y="224"
              textAnchor="middle"
              fill={shade}
              fillOpacity="0.85"
              fontSize="26"
              fontWeight="700"
              letterSpacing="4"
              fontFamily="var(--font-cairo), sans-serif"
            >
              MW
            </text>
          )}
        </g>
      )}

      {type === "cap" && (
        <g>
          <path
            d="M96 292c0-98 46-140 104-140s104 42 104 140H96Z"
            fill={color}
            stroke={detail}
            strokeOpacity="0.14"
            strokeWidth="2"
          />
          <path
            d="M88 292h224c26 0 40 14 40 30s-18 28-46 28H120c-20 0-32-12-32-30v-28Z"
            fill={color}
            stroke={detail}
            strokeOpacity="0.2"
            strokeWidth="2"
          />
          <path
            d="M200 154v138M152 170l14 122M248 170l-14 122"
            stroke={detail}
            strokeOpacity="0.18"
            strokeWidth="2"
          />
          <circle cx="200" cy="152" r="7" fill={detail} fillOpacity="0.35" />
          {mark && (
            <text
              x="200"
              y="252"
              textAnchor="middle"
              fill={shade}
              fillOpacity="0.85"
              fontSize="30"
              fontWeight="700"
              letterSpacing="5"
              fontFamily="var(--font-cairo), sans-serif"
            >
              MW
            </text>
          )}
        </g>
      )}
    </svg>
  );
}
