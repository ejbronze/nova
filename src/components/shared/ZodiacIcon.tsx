"use client";

import { cn } from "@/lib/utils";
import type { ZodiacSign } from "@/lib/themes";

function ZodiacGlyph({ sign }: { sign: ZodiacSign }) {
  const common = {
    stroke: "currentColor",
    strokeWidth: 1.6,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    fill: "none",
  };

  switch (sign) {
    case "aries":
      return <path {...common} d="M7 16c0-3.4 1.8-6.7 5-8.8 3.2 2.1 5 5.4 5 8.8M9 16c0-1.9-.8-3.7-2.1-5.1M15 16c0-1.9.8-3.7 2.1-5.1" />;
    case "taurus":
      return (
        <>
          <circle cx="12" cy="14" r="4.4" {...common} />
          <path {...common} d="M8.2 8.6C8.8 6.8 10 5.8 12 5.8c2 0 3.2 1 3.8 2.8M7 9.8C6 8.2 5.6 7 5.6 5.9M17 9.8c1-1.6 1.4-2.8 1.4-3.9" />
        </>
      );
    case "gemini":
      return <path {...common} d="M8 6.5h8M8 17.5h8M9.3 6.8v10.4M14.7 6.8v10.4" />;
    case "cancer":
      return (
        <>
          <circle cx="9" cy="9.5" r="2.2" {...common} />
          <circle cx="15" cy="14.5" r="2.2" {...common} />
          <path {...common} d="M11 8.5c1.1-1.8 2.8-2.8 4.8-2.8 1.7 0 3 .5 3.7 1.4M13 15.5c-1.1 1.8-2.8 2.8-4.8 2.8-1.7 0-3-.5-3.7-1.4" />
        </>
      );
    case "leo":
      return (
        <>
          <path {...common} d="M10.2 9.4A3.6 3.6 0 1 1 8 15.9" />
          <path {...common} d="M10.3 9.2c1.6-.8 3.1-.7 4.4.2 1.6 1.2 2.5 3 2.5 5 0 1.6-.5 2.9-1.5 3.9" />
          <circle cx="8.1" cy="16.1" r="1.8" {...common} />
        </>
      );
    case "virgo":
      return <path {...common} d="M7.5 7.2v9.5M11 7.2v9.5M14.5 7.2v9.5M7.5 10c.9-1.6 2-2.4 3.5-2.4 1.6 0 2.8.8 3.5 2.4m0 0c.8-1.6 1.9-2.4 3.3-2.4v4.7c0 2.2-1.2 3.7-3.6 4.5" />;
    case "libra":
      return (
        <>
          <path {...common} d="M6.5 16.5h11" />
          <path {...common} d="M8.2 12.5c.5-2.3 1.9-3.5 3.8-3.5s3.3 1.2 3.8 3.5" />
          <path {...common} d="M5.7 12.5h12.6" />
        </>
      );
    case "scorpio":
      return <path {...common} d="M7.5 7.2v9.5M11 7.2v9.5M14.5 7.2v9.5M7.5 10c.9-1.6 2-2.4 3.5-2.4 1.6 0 2.8.8 3.5 2.4m0 0c.8-1.6 1.9-2.4 3.3-2.4v6.5M17.8 14.2l1.6 1.6-1.6 1.6" />;
    case "sagittarius":
      return (
        <>
          <path {...common} d="M7 17L17 7M11 7h6v6" />
          <path {...common} d="M7.5 10.5l6 6" />
        </>
      );
    case "capricorn":
      return <path {...common} d="M7 7.2v8.9M10.5 7.2v8.9M7 10c.8-1.6 1.8-2.4 3.1-2.4 1.6 0 2.8.8 3.6 2.4m0 0c.8-1.6 1.9-2.4 3.3-2.4 1.8 0 3 1.2 3 3.2 0 3-2 5.1-5.8 5.9" />;
    case "aquarius":
      return (
        <>
          <path {...common} d="M6 10c1.4 0 2.2-1.2 3.6-1.2S11.8 10 13.2 10s2.2-1.2 3.6-1.2S18.2 10 19.6 10" />
          <path {...common} d="M6 14.6c1.4 0 2.2-1.2 3.6-1.2s2.2 1.2 3.6 1.2 2.2-1.2 3.6-1.2 2.2 1.2 3.6 1.2" />
        </>
      );
    case "pisces":
      return (
        <>
          <path {...common} d="M8.6 8.2c1.5 1.2 2.3 2.5 2.3 3.8 0 1.3-.8 2.6-2.3 3.8M15.4 8.2c-1.5 1.2-2.3 2.5-2.3 3.8 0 1.3.8 2.6 2.3 3.8M8 12h8" />
        </>
      );
  }
}

export function ZodiacIcon({
  sign,
  size = 28,
  className,
}: {
  sign: ZodiacSign;
  size?: number;
  className?: string;
}) {
  return (
    <span
      className={cn("inline-flex items-center justify-center rounded-[28%] border border-current/12 bg-white/5", className)}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <svg viewBox="0 0 24 24" width={size * 0.72} height={size * 0.72} fill="none">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.18" />
        <ZodiacGlyph sign={sign} />
      </svg>
    </span>
  );
}
