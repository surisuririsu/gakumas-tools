export const PREVIEW_WIDTH = 720;
export const PREVIEW_PADDING = 16;
export const TIER_LABEL_WIDTH = 88;
export const ITEM_SIZE = 60;
export const ITEM_GAP = 6;
export const ITEMS_PADDING = 10;
export const MIN_ROW_HEIGHT = 80;
const PANEL_RADIUS = 10;

// Rendering notes: resvg re-rasterizes a clipped group for every filtered
// child inside it, so a rounded `overflow: hidden` panel plus an inset
// box-shadow (an SVG filter) on each tile made a 160-icon list take ~25s.
// The panel is left unclipped (the first/last tier labels round their own
// corners) and tiles use a plain border: same look, ~1s.

const styles = {
  container: {
    width: "100%",
    display: "flex",
    flexDirection: "column",
    padding: `${PREVIEW_PADDING}px`,
    backgroundColor: "#ffffff",
  },
  panel: {
    display: "flex",
    flexDirection: "column",
    border: "1px solid #dfe2e3",
    borderRadius: `${PANEL_RADIUS}px`,
    backgroundColor: "#ffffff",
  },
  row: {
    display: "flex",
    alignItems: "stretch",
    borderBottom: "1px solid #dfe2e3",
  },
  rowLast: {
    display: "flex",
    alignItems: "stretch",
  },
  tierLabel: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: `${TIER_LABEL_WIDTH}px`,
    flexShrink: 0,
    padding: "8px",
    backgroundColor: "#eef0f1",
    borderRight: "1px solid #dfe2e3",
  },
  tierLabelFirst: {
    borderTopLeftRadius: `${PANEL_RADIUS - 1}px`,
  },
  tierLabelLast: {
    borderBottomLeftRadius: `${PANEL_RADIUS - 1}px`,
  },
  rankIcon: {
    width: "48px",
    height: "48px",
    objectFit: "contain",
  },
  items: {
    flex: 1,
    display: "flex",
    flexWrap: "wrap",
    alignContent: "center",
    gap: `${ITEM_GAP}px`,
    padding: `${ITEMS_PADDING}px`,
  },
  item: {
    width: `${ITEM_SIZE}px`,
    height: `${ITEM_SIZE}px`,
    display: "flex",
    border: "2px solid #ccc",
    borderRadius: "8%",
    backgroundColor: "#eee",
    backgroundSize: `${ITEM_SIZE}px ${ITEM_SIZE}px`,
    backgroundRepeat: "no-repeat",
  },
  overflow: {
    width: `${ITEM_SIZE}px`,
    height: `${ITEM_SIZE}px`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "8%",
    backgroundColor: "#eef0f1",
    color: "#5f6b73",
    fontSize: "20px",
    fontWeight: 700,
  },
};

export default styles;
