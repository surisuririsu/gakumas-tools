import { SITE_URL } from "@/utils/localeUrls";

export const SITE_HOST = new URL(SITE_URL).host;

export const COLORS = {
  page: "#f2f2f5",
  panel: "#ffffff",
  alt: "#f7f7f9",
  border: "#e3e3e9",
  edge: "#dadae1",
  ink: "#1c1c22",
  muted: "#63636b",
  faint: "#a1a1aa",
  fillMuted: "#ebebee",
  brand: "#f39800",
  brandEdge: "#d27f00",
  accentInk: "#ec8a00",
  accentTint: "#fff1df",
  accentEdge: "#ffcb8a",
  iconEdge: "rgba(20, 20, 40, 0.16)",
  emptyBorder: "#d4d4dc",
  emptyFill: "#ececf0",
  vocalTint: "#fdedf4",
  danceTint: "#eaf3fd",
  visualTint: "#fff5d4",
  staminaTint: "#e7f8ee",
};

export const SCENARIO_COLORS = {
  hajime: { color: "#e06840", edge: "#ba451e" },
  nia: { color: "#7a5bff", edge: "#4013ff" },
  hif: { color: "#4a6db8", edge: "#354f86" },
};

export const CARD_SHADOW = `0 2px 0 ${COLORS.border}, 0 6px 16px rgba(20, 20, 40, 0.05)`;

export const FONT_FAMILY = "Inter, Noto Sans";
export const WATERMARK_FONT_FAMILY = "Noto Sans JP";
