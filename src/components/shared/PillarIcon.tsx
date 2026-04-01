"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Pillar = "money" | "health" | "life";

const PILLAR_STYLES: Record<Pillar, { accent: string; tint: string }> = {
  money: { accent: "#4F7CFF", tint: "rgba(79,124,255,0.14)" },
  health: { accent: "#5BB88A", tint: "rgba(91,184,138,0.14)" },
  life: { accent: "#F5A623", tint: "rgba(245,166,35,0.16)" },
};

export function PillarIcon({
  pillar,
  className = "",
  size = 18,
}: {
  pillar: Pillar;
  className?: string;
  size?: number;
}) {
  const { accent, tint } = PILLAR_STYLES[pillar];

  return (
    <span
      className={cn("inline-flex items-center justify-center rounded-full", className)}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <svg viewBox="0 0 24 24" width={size} height={size} fill="none">
        <circle cx="12" cy="12" r="10" fill={tint} />
        <path d="M12 6.2L7.2 15h9.6L12 6.2Z" stroke={accent} strokeWidth="1.4" strokeLinejoin="round" />
        <circle cx={pillar === "money" ? 12 : pillar === "health" ? 7.2 : 16.8} cy={pillar === "money" ? 6.2 : 15} r="2.55" fill={accent} />
      </svg>
    </span>
  );
}

export function PillarLabel({
  pillar,
  children,
  className = "",
  iconSize = 16,
}: {
  pillar: Pillar;
  children: ReactNode;
  className?: string;
  iconSize?: number;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <PillarIcon pillar={pillar} size={iconSize} />
      <span>{children}</span>
    </span>
  );
}
