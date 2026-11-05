/**
 * Oversized black tee used in the hero. Drawn in SVG so the homepage keeps
 * the studio-lighting look without stock photography or external assets.
 */
export function HeroTee({ label }: { label: string }) {
  return (
    <svg
      viewBox="0 0 600 680"
      role="img"
      aria-label={label}
      className="h-auto w-full"
    >
      <defs>
        <linearGradient id="mw-shirt" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#262626" />
          <stop offset="38%" stopColor="#151515" />
          <stop offset="100%" stopColor="#050505" />
        </linearGradient>
        <linearGradient id="mw-sheen" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="48%" stopColor="#ffffff" stopOpacity="0.14" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
        <filter id="mw-shadow-blur" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="18" />
        </filter>
        <filter id="mw-fold-blur" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="5" />
        </filter>
        <clipPath id="mw-tee-clip">
          <path d="M242 128C258 168 342 168 358 128L418 146 498 196 532 278 452 320 420 300 428 566C400 574 200 574 172 566L180 300 148 320 68 278 102 196 182 146Z" />
        </clipPath>
        <pattern id="mw-fabric" width="7" height="7" patternUnits="userSpaceOnUse">
          <circle cx="1.5" cy="1.5" r="0.7" fill="#ffffff" opacity="0.05" />
        </pattern>
      </defs>

      {/* Soft studio shadow on the floor */}
      <ellipse
        cx="300"
        cy="612"
        rx="196"
        ry="26"
        fill="#111111"
        opacity="0.18"
        filter="url(#mw-shadow-blur)"
      />

      <g>
        <path
          d="M242 128C258 168 342 168 358 128L418 146 498 196 532 278 452 320 420 300 428 566C400 574 200 574 172 566L180 300 148 320 68 278 102 196 182 146Z"
          fill="url(#mw-shirt)"
          stroke="#ffffff"
          strokeOpacity="0.07"
          strokeWidth="1.5"
        />

        <g clipPath="url(#mw-tee-clip)">
          {/* Fabric base texture and broad light falloff */}
          <rect x="60" y="120" width="480" height="470" fill="url(#mw-fabric)" />
          <rect x="60" y="120" width="480" height="470" fill="url(#mw-sheen)" opacity="0.34" />
          <ellipse
            cx="232"
            cy="330"
            rx="86"
            ry="176"
            fill="#ffffff"
            opacity="0.055"
            filter="url(#mw-fold-blur)"
          />
          <ellipse
            cx="414"
            cy="410"
            rx="80"
            ry="180"
            fill="#000000"
            opacity="0.4"
            filter="url(#mw-fold-blur)"
          />

          {/* Fold structure */}
          <path
            d="M226 268c-12 74-16 170-6 292"
            stroke="#000000"
            strokeOpacity="0.4"
            strokeWidth="11"
            fill="none"
            filter="url(#mw-fold-blur)"
          />
          <path
            d="M374 250c14 88 18 186 6 308"
            stroke="#000000"
            strokeOpacity="0.34"
            strokeWidth="12"
            fill="none"
            filter="url(#mw-fold-blur)"
          />
          <path
            d="M294 230c8 66 6 132-2 192"
            stroke="#ffffff"
            strokeOpacity="0.05"
            strokeWidth="26"
            fill="none"
            filter="url(#mw-fold-blur)"
          />
          <path
            d="M198 470c58 22 146 22 204-2"
            stroke="#ffffff"
            strokeOpacity="0.06"
            strokeWidth="16"
            fill="none"
            filter="url(#mw-fold-blur)"
          />

          {/* Sleeve and hem seams */}
          <path
            d="M82 282 150 320M528 282 460 320"
            stroke="#ffffff"
            strokeOpacity="0.14"
            strokeWidth="2"
          />
          <path
            d="M178 556c82 10 162 10 244 0"
            stroke="#ffffff"
            strokeOpacity="0.16"
            strokeWidth="2"
          />
          <path
            d="M184 304c14-58 26-114 52-158M416 304c-14-58-26-114-52-158"
            stroke="#ffffff"
            strokeOpacity="0.08"
            strokeWidth="2"
          />

          {/* Chest sample print */}
          <g opacity="0.94">
            <text
              x="300"
              y="304"
              textAnchor="middle"
              fill="#f5f5f5"
              fontSize="54"
              fontWeight="400"
              letterSpacing="9"
              fontFamily="var(--font-anton), var(--font-cairo), sans-serif"
            >
              MW
            </text>
            <text
              x="300"
              y="330"
              textAnchor="middle"
              fill="#f5f5f5"
              fillOpacity="0.55"
              fontSize="9"
              fontWeight="600"
              letterSpacing="5"
              fontFamily="var(--font-cairo), sans-serif"
            >
              MAKE IT YOURS.
            </text>
          </g>
        </g>

        {/* Neck ribbing sits above the clip so it keeps a crisp edge */}
        <path
          d="M242 128C258 170 342 170 358 128"
          fill="none"
          stroke="#303030"
          strokeWidth="18"
          strokeLinecap="round"
        />
        <path
          d="M249 132C263 162 337 162 351 132"
          fill="none"
          stroke="#0a0a0a"
          strokeWidth="7"
          strokeLinecap="round"
        />
        <path
          d="M242 128 182 146M358 128 418 146"
          stroke="#ffffff"
          strokeOpacity="0.1"
          strokeWidth="2"
        />
      </g>
    </svg>
  );
}
