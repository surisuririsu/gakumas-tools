export const PREVIEW_WIDTH = 720;
export const PREVIEW_PADDING = 16;
export const TIER_LABEL_WIDTH = 88;
export const ITEM_SIZE = 60;
export const ITEM_GAP = 6;
export const ITEMS_PADDING = 10;
export const MIN_ROW_HEIGHT = 80;

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
    borderRadius: "10px",
    backgroundColor: "#ffffff",
    overflow: "hidden",
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
    boxShadow: "inset 0 0 0 2px #ccc",
    borderRadius: "8%",
    backgroundColor: "#eee",
    overflow: "hidden",
  },
  itemImg: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
};

export default styles;
