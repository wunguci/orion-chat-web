export const APPEARANCE_COLORS = {
  green: {
    primary: "#226262",
    primaryHover: "#004444",
    primaryBg: "#D6F2F2",
    surfaceBg: "#F4FFFF",
    border: "#D6F2F2",
    message: "#007c7c",
  },
  teal: {
    primary: "#2ab3b3",
    primaryHover: "#168787",
    primaryBg: "#D8F5F5",
    surfaceBg: "#F4FFFF",
    border: "#C8EEEE",
    message: "#2ab3b3",
  },
  orange: {
    primary: "#ee652b",
    primaryHover: "#c74c18",
    primaryBg: "#fcede6",
    surfaceBg: "#fdfaf9",
    border: "#fbe7df",
    message: "#ee652b",
  },
  blue: {
    primary: "#0068ff",
    primaryHover: "#0052cc",
    primaryBg: "#e6f2ff",
    surfaceBg: "#f6fbff",
    border: "#cfe5ff",
    message: "#0068ff",
  },
  purple: {
    primary: "#6366f1",
    primaryHover: "#4f46e5",
    primaryBg: "#ececff",
    surfaceBg: "#fbfaff",
    border: "#ddd6fe",
    message: "#6366f1",
  },
  red: {
    primary: "#ab2346",
    primaryHover: "#881337",
    primaryBg: "#fde8ee",
    surfaceBg: "#fff8fa",
    border: "#f8c9d6",
    message: "#ab2346",
  },
  gray: {
    primary: "#505050",
    primaryHover: "#303030",
    primaryBg: "#edf0f4",
    surfaceBg: "#f8fafc",
    border: "#d8dee8",
    message: "#505050",
  },
} as const;

export type AppearanceColor = keyof typeof APPEARANCE_COLORS;
export type AppearanceThemeVars = Record<`--${string}`, string>;
export const APPEARANCE_THEME_CHANGED_EVENT = "appearance:theme-changed";

export type AppearanceThemeChangeDetail = {
  theme?: string | null;
  appearanceColor?: string | null;
};

export const WALLPAPER_APPEARANCE_COLOR_MAP: Record<string, AppearanceColor> = {
  teal: "teal",
  orange: "orange",
  purple: "purple",
  green: "green",
  red: "red",
  gray: "gray",
  "light-gray": "gray",
};

export function normalizeAppearanceColor(
  appearanceColor?: string | null,
): AppearanceColor {
  const normalized = (appearanceColor || "green").trim().toLowerCase();
  return normalized in APPEARANCE_COLORS
    ? (normalized as AppearanceColor)
    : "green";
}

export function getAppearanceColorFromWallpaper(
  wallpaper?: string | null,
): AppearanceColor {
  return WALLPAPER_APPEARANCE_COLOR_MAP[wallpaper || ""] || "green";
}

export function getSystemPrefersDark(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  );
}

export function buildAppearanceThemeVars({
  theme,
  appearanceColor,
  prefix = "app",
}: {
  theme?: string | null;
  appearanceColor?: string | null;
  prefix?: string;
}): AppearanceThemeVars {
  const palette = APPEARANCE_COLORS[normalizeAppearanceColor(appearanceColor)];
  const isDark =
    theme === "dark" ||
    ((theme === "auto" || theme === "system") && getSystemPrefersDark());

  return {
    [`--${prefix}-overlay`]: isDark
      ? "rgba(0, 0, 0, 0.62)"
      : "rgba(0, 0, 0, 0.3)",
    [`--${prefix}-surface`]: isDark ? "#111827" : "#ffffff",
    [`--${prefix}-content`]: isDark ? "#0f172a" : "#ffffff",
    [`--${prefix}-text`]: isDark ? "#e5e7eb" : "#505050",
    [`--${prefix}-muted`]: isDark ? "#cbd5e1" : "#505050",
    [`--${prefix}-close-hover`]: isDark ? "#1f2937" : "#f3f4f6",
    [`--${prefix}-primary`]: palette.primary,
    [`--${prefix}-primary-hover`]: palette.primaryHover,
    [`--${prefix}-primary-bg`]: isDark
      ? `${palette.primary}2E`
      : palette.primaryBg,
    [`--${prefix}-surface-bg`]: isDark ? "#142322" : palette.surfaceBg,
    [`--${prefix}-primary-border`]: isDark
      ? `${palette.primary}66`
      : palette.border,
    [`--${prefix}-message-sent`]: palette.message,
  };
}

export function notifyAppearanceThemeChanged(
  detail: AppearanceThemeChangeDetail,
) {
  if (typeof window === "undefined") return;

  window.dispatchEvent(
    new CustomEvent<AppearanceThemeChangeDetail>(
      APPEARANCE_THEME_CHANGED_EVENT,
      { detail },
    ),
  );
}
