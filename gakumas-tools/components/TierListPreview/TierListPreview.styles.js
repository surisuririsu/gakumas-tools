import { CARD_SHADOW, COLORS } from "@/components/OgImage/theme";

export const PREVIEW_WIDTH = 720;
const PREVIEW_PADDING = 16;
const CARD_PADDING = 8;
const ROW_GAP = 8;
const TIER_LABEL_WIDTH = 84;
const LABEL_GAP = 8;
export const ITEM_SIZE = 60;
export const ITEM_EDGE = 2;
const ITEM_GAP = 6;
const ITEMS_PADDING = 10;
const MIN_ROW_HEIGHT = 80;
const FOOTER_GAP = 12;
export const FOOTER_SIZE = 22;
const FOOTER_HEIGHT = 24;

const ITEM_COLUMNS = Math.floor(
  (PREVIEW_WIDTH -
    PREVIEW_PADDING * 2 -
    CARD_PADDING * 2 -
    TIER_LABEL_WIDTH -
    LABEL_GAP -
    ITEMS_PADDING * 2 +
    ITEM_GAP) /
    (ITEM_SIZE + ITEM_GAP),
);

export function rowHeight(tileCount) {
  if (tileCount === 0) return MIN_ROW_HEIGHT;
  const lines = Math.ceil(tileCount / ITEM_COLUMNS);
  const tilesHeight =
    lines * (ITEM_SIZE + ITEM_EDGE) +
    (lines - 1) * ITEM_GAP +
    ITEMS_PADDING * 2;
  return Math.max(MIN_ROW_HEIGHT, tilesHeight);
}

export function tileCount(list, rank) {
  return list.items[rank].length + (list.overflow[rank] > 0 ? 1 : 0);
}

export function previewHeight(list) {
  const rows = list.tiers.map((rank) => rowHeight(tileCount(list, rank)));
  return (
    PREVIEW_PADDING * 2 +
    CARD_PADDING * 2 +
    rows.reduce((acc, cur) => acc + cur, 0) +
    ROW_GAP * (rows.length - 1) +
    FOOTER_GAP +
    FOOTER_HEIGHT
  );
}

const PRISM = `linear-gradient(135deg, ${COLORS.danceTint}, ${COLORS.vocalTint})`;

export const RANK_BACKGROUNDS = {
  S5: { backgroundImage: PRISM },
  "S4+": { backgroundImage: PRISM },
  S4: { backgroundImage: PRISM },
  "SSS+": { backgroundColor: COLORS.danceTint },
  SSS: { backgroundColor: COLORS.danceTint },
  "SS+": { backgroundColor: COLORS.danceTint },
  SS: { backgroundColor: COLORS.danceTint },
  "S+": { backgroundColor: COLORS.visualTint },
  S: { backgroundColor: COLORS.visualTint },
  "A+": { backgroundColor: COLORS.vocalTint },
  A: { backgroundColor: COLORS.vocalTint },
  "B+": { backgroundColor: COLORS.accentTint },
  B: { backgroundColor: COLORS.accentTint },
  "C+": { backgroundColor: COLORS.staminaTint },
  C: { backgroundColor: COLORS.staminaTint },
  D: { backgroundColor: COLORS.danceTint },
  E: { backgroundColor: COLORS.fillMuted },
  F: { backgroundColor: COLORS.fillMuted },
};

// resvg re-rasterizes a clipped group for every filtered child, so nothing
// here clips with `overflow: hidden`, and the tiles' hard edges are layers
// (see Raised) rather than box-shadows.

const styles = {
  preview: {
    flexDirection: "column",
    gap: FOOTER_GAP,
    padding: PREVIEW_PADDING,
  },
  card: {
    display: "flex",
    flexDirection: "column",
    gap: ROW_GAP,
    padding: CARD_PADDING,
    borderRadius: 18,
    backgroundColor: COLORS.panel,
    boxShadow: CARD_SHADOW,
  },
  footer: {
    height: FOOTER_HEIGHT,
    padding: "0 4px",
  },
  row: {
    display: "flex",
    gap: LABEL_GAP,
  },
  tierLabel: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: TIER_LABEL_WIDTH,
    flexShrink: 0,
    borderRadius: 14,
  },
  rankIcon: {
    width: 52,
    height: 52,
    objectFit: "contain",
  },
  items: {
    flex: 1,
    display: "flex",
    flexWrap: "wrap",
    alignContent: "center",
    gap: ITEM_GAP,
    padding: ITEMS_PADDING,
    borderRadius: 14,
    backgroundColor: COLORS.alt,
  },
  item: {
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    backgroundColor: COLORS.panel,
    backgroundSize: `${ITEM_SIZE}px ${ITEM_SIZE}px`,
    backgroundRepeat: "no-repeat",
  },
  overflow: {
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.fillMuted,
    color: COLORS.muted,
    fontSize: 20,
    fontWeight: 800,
  },
};

export default styles;
