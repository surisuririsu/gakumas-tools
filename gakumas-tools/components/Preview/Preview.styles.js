import { CARD_SHADOW, COLORS } from "@/components/OgImage/theme";

export const PREVIEW_PADDING = 16;
export const CARD_PADDING = 14;
export const ITEM_SIZE = 48;
export const CARD_SIZE = 68;
export const ICON_GAP = 6;
export const EDGE = 2;
const GROUP_GAP = 12;
const COST_GAP = 8;
const COST_HEIGHT = 24;
const FOOTER_GAP = 12;
export const FOOTER_SIZE = 20;
const FOOTER_HEIGHT = 22;

export const PREVIEW_WIDTH =
  PREVIEW_PADDING * 2 + CARD_PADDING * 2 + CARD_SIZE * 6 + ICON_GAP * 5;

export function previewHeight(groupCount, isEmpty) {
  const group =
    GROUP_GAP +
    CARD_SIZE +
    EDGE +
    (isEmpty ? 0 : COST_GAP + COST_HEIGHT + EDGE);
  return (
    PREVIEW_PADDING * 2 +
    CARD_PADDING * 2 +
    ITEM_SIZE +
    EDGE +
    group * groupCount +
    FOOTER_GAP +
    FOOTER_HEIGHT
  );
}

const styles = {
  preview: {
    flexDirection: "column",
    gap: FOOTER_GAP,
    padding: PREVIEW_PADDING,
  },
  card: {
    display: "flex",
    flexDirection: "column",
    gap: GROUP_GAP,
    padding: CARD_PADDING,
    borderRadius: 18,
    backgroundColor: COLORS.panel,
    boxShadow: CARD_SHADOW,
  },
  footer: {
    height: FOOTER_HEIGHT,
    padding: "0 4px",
  },
  row: { display: "flex", gap: ICON_GAP },
  cardGroup: { display: "flex", flexDirection: "column", gap: COST_GAP },
  icon: {
    position: "relative",
    justifyContent: "center",
    backgroundColor: COLORS.panel,
    backgroundRepeat: "no-repeat",
  },
  empty: {
    display: "flex",
    flexShrink: 0,
    marginBottom: EDGE,
    border: `2px dashed ${COLORS.emptyBorder}`,
    backgroundColor: COLORS.emptyFill,
  },
  customizations: {
    position: "absolute",
    top: "60%",
    display: "flex",
    gap: "2px",
  },
  customization: {
    width: "20px",
    height: "20px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "50%",
    color: "white",
    fontSize: "14px",
    fontWeight: 600,
  },
  effect: {
    backgroundColor: "#ca5cfe",
    border: "1px solid #ebc1ff",
    boxShadow: "0 0 6px #ca5cfe",
  },
  cost: {
    backgroundColor: "#02e28f",
    border: "1px solid #4dfdbc",
    boxShadow: "0 0 6px #02e28f",
  },
  buff: {
    backgroundColor: "#09bfff",
    border: "1px solid #6fdaff",
    boxShadow: "0 0 6px #09bfff",
  },
  score: {
    backgroundColor: "#ff3482",
    border: "1px solid #ff9ac1",
    boxShadow: "0 0 6px #ff3482",
  },
  genki: {
    backgroundColor: "#00b1e2",
    border: "1px solid #49d8ff",
    boxShadow: "0 0 6px #00b1e2",
  },
  costChip: {
    alignItems: "center",
    gap: 6,
    height: COST_HEIGHT,
    padding: "0 11px",
    backgroundColor: COLORS.fillMuted,
    color: COLORS.muted,
    fontSize: 13,
    fontWeight: 700,
  },
  costValue: { color: COLORS.ink },
};

export default styles;
