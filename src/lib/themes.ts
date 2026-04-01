export type ZodiacSign =
  | "aries" | "taurus" | "gemini" | "cancer"
  | "leo" | "virgo" | "libra" | "scorpio"
  | "sagittarius" | "capricorn" | "aquarius" | "pisces";

export type BentoLayout = "balanced" | "money-dominant" | "health-dominant";

export interface ZodiacTheme {
  sign: ZodiacSign;
  name: string;
  symbol: string;
  dates: string;
  element: "fire" | "earth" | "air" | "water";
  navBg: string;
  navText: string;
  navBorder: string;
  accent: string;
  accentText: string;
  accentLight: string;
  layout: BentoLayout;
  dark: boolean; // true = dark nav background
  description: string;
}

export const ZODIAC_THEMES: ZodiacTheme[] = [
  {
    sign: "aries",
    name: "Aries",
    symbol: "♈",
    dates: "Mar 21 – Apr 19",
    element: "fire",
    navBg: "#170505",
    navText: "#FFD6D6",
    navBorder: "#3D1010",
    accent: "#DC2626",
    accentText: "#FFFFFF",
    accentLight: "#FEE2E2",
    layout: "money-dominant",
    dark: true,
    description: "Bold & driven",
  },
  {
    sign: "taurus",
    name: "Taurus",
    symbol: "♉",
    dates: "Apr 20 – May 20",
    element: "earth",
    navBg: "#051209",
    navText: "#C3F0D2",
    navBorder: "#1A3D22",
    accent: "#16A34A",
    accentText: "#FFFFFF",
    accentLight: "#DCFCE7",
    layout: "money-dominant",
    dark: true,
    description: "Grounded & prosperous",
  },
  {
    sign: "gemini",
    name: "Gemini",
    symbol: "♊",
    dates: "May 21 – Jun 20",
    element: "air",
    navBg: "#FFFBF0",
    navText: "#3B1F6B",
    navBorder: "#EDE9FE",
    accent: "#7C3AED",
    accentText: "#FFFFFF",
    accentLight: "#EDE9FE",
    layout: "balanced",
    dark: false,
    description: "Curious & adaptable",
  },
  {
    sign: "cancer",
    name: "Cancer",
    symbol: "♋",
    dates: "Jun 21 – Jul 22",
    element: "water",
    navBg: "#05101E",
    navText: "#93C5FD",
    navBorder: "#1E3A5F",
    accent: "#2563EB",
    accentText: "#FFFFFF",
    accentLight: "#DBEAFE",
    layout: "health-dominant",
    dark: true,
    description: "Intuitive & nurturing",
  },
  {
    sign: "leo",
    name: "Leo",
    symbol: "♌",
    dates: "Jul 23 – Aug 22",
    element: "fire",
    navBg: "#150D00",
    navText: "#FCD34D",
    navBorder: "#3D2D00",
    accent: "#D97706",
    accentText: "#FFFFFF",
    accentLight: "#FEF3C7",
    layout: "money-dominant",
    dark: true,
    description: "Radiant & regal",
  },
  {
    sign: "virgo",
    name: "Virgo",
    symbol: "♍",
    dates: "Aug 23 – Sep 22",
    element: "earth",
    navBg: "#F2F6EE",
    navText: "#2A3B22",
    navBorder: "#C8D9BC",
    accent: "#4D7C0F",
    accentText: "#FFFFFF",
    accentLight: "#ECFCCB",
    layout: "balanced",
    dark: false,
    description: "Precise & refined",
  },
  {
    sign: "libra",
    name: "Libra",
    symbol: "♎",
    dates: "Sep 23 – Oct 22",
    element: "air",
    navBg: "#FFF0F7",
    navText: "#881337",
    navBorder: "#FBCFE8",
    accent: "#E11D74",
    accentText: "#FFFFFF",
    accentLight: "#FCE7F3",
    layout: "health-dominant",
    dark: false,
    description: "Balanced & aesthetic",
  },
  {
    sign: "scorpio",
    name: "Scorpio",
    symbol: "♏",
    dates: "Oct 23 – Nov 21",
    element: "water",
    navBg: "#06030F",
    navText: "#DDD6FE",
    navBorder: "#1A1228",
    accent: "#7C3AED",
    accentText: "#FFFFFF",
    accentLight: "#EDE9FE",
    layout: "money-dominant",
    dark: true,
    description: "Intense & powerful",
  },
  {
    sign: "sagittarius",
    name: "Sagittarius",
    symbol: "♐",
    dates: "Nov 22 – Dec 21",
    element: "fire",
    navBg: "#0C0520",
    navText: "#C4B5FD",
    navBorder: "#2E1A6B",
    accent: "#8B5CF6",
    accentText: "#FFFFFF",
    accentLight: "#F5F3FF",
    layout: "balanced",
    dark: true,
    description: "Free & adventurous",
  },
  {
    sign: "capricorn",
    name: "Capricorn",
    symbol: "♑",
    dates: "Dec 22 – Jan 19",
    element: "earth",
    navBg: "#0F172A",
    navText: "#CBD5E1",
    navBorder: "#1E293B",
    accent: "#475569",
    accentText: "#FFFFFF",
    accentLight: "#F1F5F9",
    layout: "money-dominant",
    dark: true,
    description: "Disciplined & strategic",
  },
  {
    sign: "aquarius",
    name: "Aquarius",
    symbol: "♒",
    dates: "Jan 20 – Feb 18",
    element: "air",
    navBg: "#03091A",
    navText: "#67E8F9",
    navBorder: "#083344",
    accent: "#0891B2",
    accentText: "#FFFFFF",
    accentLight: "#CFFAFE",
    layout: "health-dominant",
    dark: true,
    description: "Innovative & visionary",
  },
  {
    sign: "pisces",
    name: "Pisces",
    symbol: "♓",
    dates: "Feb 19 – Mar 20",
    element: "water",
    navBg: "#F0FEFA",
    navText: "#134E4A",
    navBorder: "#99F6E4",
    accent: "#0D9488",
    accentText: "#FFFFFF",
    accentLight: "#F0FDFA",
    layout: "balanced",
    dark: false,
    description: "Dreamy & flowing",
  },
];

export function applyTheme(theme: ZodiacTheme | undefined) {
  const root = document.documentElement;
  if (!theme) {
    root.style.removeProperty("--theme-nav-bg");
    root.style.removeProperty("--theme-nav-text");
    root.style.removeProperty("--theme-nav-border");
    root.style.removeProperty("--theme-accent");
    root.style.removeProperty("--theme-accent-text");
    root.style.removeProperty("--theme-accent-light");
    return;
  }
  root.style.setProperty("--theme-nav-bg", theme.navBg);
  root.style.setProperty("--theme-nav-text", theme.navText);
  root.style.setProperty("--theme-nav-border", theme.navBorder);
  root.style.setProperty("--theme-accent", theme.accent);
  root.style.setProperty("--theme-accent-text", theme.accentText);
  root.style.setProperty("--theme-accent-light", theme.accentLight);
}

export function getTheme(sign: ZodiacSign | undefined): ZodiacTheme | undefined {
  return ZODIAC_THEMES.find(t => t.sign === sign);
}

export const ELEMENT_EMOJI: Record<string, string> = {
  fire: "🔥", earth: "🌍", air: "💨", water: "🌊",
};
