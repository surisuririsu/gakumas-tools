import { SkillCards } from "gakumas-data";
import {
  DEBUG,
  detectWhitePanel,
  getImageData,
  groupContiguous,
  isWhite,
  largestGroup,
  loadImageFromFile,
  saturation,
} from "./common";
import { extractEntities } from "./memory";
import { loadSkillCardModel } from "./models";

const PANEL_OPTS = {
  rowWhiteFrac: 0.3,
  colWhiteFrac: 0.2,
  // Allow the card row to interrupt the white panel up to this many rows.
  rowGapTolerance: 150,
};

const SATURATION_THRESHOLD = 40;
// Card rows saturate 15%+ of panel width; text rows above/below the cards
// only reach ~12% so a 0.15 threshold cleanly separates them.
const CARD_ROW_SAT_FRAC = 0.15;
// Some card art has a light/white mid-band where per-row saturation briefly
// dips below threshold for up to ~16 rows; bridge those gaps. The next group
// below the card row (the bottom action buttons) sits ~60+ rows away, so 25
// leaves comfortable margin.
const CARD_ROW_GAP_TOLERANCE = 25;
// Require a column to be saturated across most of the card row height; this
// rejects decorative corner brackets that only touch the top + bottom of a
// card and pull the outer bounds wider than the card body.
const CARD_COL_SAT_FRAC = 0.5;

// Inter-card gaps: columns within the card row whose pixels are mostly white.
const GAP_WHITE_FRAC = 0.75;
const MIN_GAP_WIDTH = 5;
const GAP_MERGE_TOLERANCE = 3;

export async function getDraftPickFromFile(file) {
  const img = await loadImageFromFile(file);
  const imageData = getImageData(img);

  const panel = detectWhitePanel(imageData, PANEL_OPTS);
  if (!panel) throw new Error("Could not locate modal panel in screenshot");

  const cardRow = detectCardRow(imageData, panel);
  if (!cardRow) throw new Error("Could not locate card row in screenshot");

  const boxes = splitIntoThreeCards(imageData, cardRow);

  if (DEBUG) debugOverlay(img, panel, cardRow, boxes);

  const { session, classes } = await loadSkillCardModel();
  const ids = await extractEntities(img, boxes, session, classes);
  console.log(
    "Extracted draft pick cards:",
    ids.map((id) => SkillCards.getById(id)?.name || id),
  );
  return ids;
}

function detectCardRow(imageData, panel) {
  const { data, width } = imageData;
  const rowThreshold = panel.width * CARD_ROW_SAT_FRAC;
  const rows = [];
  for (let y = panel.y; y < panel.y + panel.height; y++) {
    let count = 0;
    for (let x = panel.x; x < panel.x + panel.width; x++) {
      if (saturation(data, (y * width + x) * 4) > SATURATION_THRESHOLD) count++;
    }
    if (count > rowThreshold) rows.push(y);
  }
  if (!rows.length) return null;

  const [yTop, yBottomCoarse] = largestGroup(
    groupContiguous(rows, CARD_ROW_GAP_TOLERANCE),
  );
  const coarseHeight = yBottomCoarse - yTop + 1;
  const colThreshold = coarseHeight * CARD_COL_SAT_FRAC;

  let xLeft = -1;
  let xRight = -1;
  for (let x = panel.x; x < panel.x + panel.width; x++) {
    let count = 0;
    for (let y = yTop; y <= yBottomCoarse; y++) {
      if (saturation(data, (y * width + x) * 4) > SATURATION_THRESHOLD) count++;
    }
    if (count > colThreshold) {
      if (xLeft === -1) xLeft = x;
      xRight = x;
    }
  }
  if (xLeft === -1) return null;

  // Cards are square, so each card's height equals its width. Measure the
  // first card's width from the leftmost inter-card gap and clamp the row
  // height to that, so decorations below the cards (like おすすめ pills) don't
  // inflate the crop.
  const gaps = findColumnGaps(imageData, xLeft, xRight, yTop, yBottomCoarse);
  const rowWidth = xRight - xLeft + 1;
  const cardWidth = gaps.length
    ? gaps[0][0] - xLeft
    : Math.round(rowWidth / 3);
  const height = Math.min(coarseHeight, cardWidth);

  return { x: xLeft, y: yTop, width: rowWidth, height };
}

function splitIntoThreeCards(imageData, row) {
  const boundaries = findSplitBoundaries(imageData, row);
  const boxes = [];
  for (let i = 0; i < 3; i++) {
    const x = Math.round(boundaries[i]);
    const x1 = Math.round(boundaries[i + 1]);
    boxes.push({ x, y: row.y, width: x1 - x, height: row.height });
  }
  return boxes;
}

// Find the two column positions that split the card row into 3 cards.
// Prefer detected inter-card gaps (mostly-white columns); fall back to
// mirroring a single gap through the row center; otherwise divide equally.
function findSplitBoundaries(imageData, row) {
  const xStart = row.x;
  const xEnd = row.x + row.width - 1;
  const yEnd = row.y + row.height - 1;
  const gaps = findColumnGaps(imageData, xStart, xEnd, row.y, yEnd);

  const center = (xStart + xEnd) / 2;

  if (gaps.length >= 2) {
    const [g0, g1] = gaps
      .slice()
      .sort((a, b) => b[1] - b[0] - (a[1] - a[0]))
      .slice(0, 2)
      .sort((a, b) => a[0] - b[0]);
    return [xStart, (g0[0] + g0[1]) / 2, (g1[0] + g1[1]) / 2, xEnd + 1];
  }

  if (gaps.length === 1) {
    const g = gaps[0];
    const gCenter = (g[0] + g[1]) / 2;
    const mirrored = 2 * center - gCenter;
    const [a, b] = [gCenter, mirrored].sort((x, y) => x - y);
    return [xStart, a, b, xEnd + 1];
  }

  const step = row.width / 3;
  return [xStart, xStart + step, xStart + 2 * step, xEnd + 1];
}

// Columns within [xStart, xEnd] that are mostly white across [yStart, yEnd],
// grouped into contiguous runs wider than MIN_GAP_WIDTH. Groups are returned
// left-to-right.
function findColumnGaps({ data, width }, xStart, xEnd, yStart, yEnd) {
  const rangeHeight = yEnd - yStart + 1;
  const whiteFracThreshold = GAP_WHITE_FRAC * rangeHeight;
  const gapCols = [];
  for (let x = xStart; x <= xEnd; x++) {
    let whiteCount = 0;
    for (let y = yStart; y <= yEnd; y++) {
      if (isWhite(data, (y * width + x) * 4)) whiteCount++;
    }
    if (whiteCount > whiteFracThreshold) gapCols.push(x);
  }
  return groupContiguous(gapCols, GAP_MERGE_TOLERANCE).filter(
    ([a, b]) => b - a >= MIN_GAP_WIDTH,
  );
}

function debugOverlay(img, panel, cardRow, boxes) {
  const canvas = document.createElement("canvas");
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0);
  ctx.lineWidth = 3;
  ctx.strokeStyle = "green";
  ctx.strokeRect(panel.x, panel.y, panel.width, panel.height);
  ctx.strokeStyle = "orange";
  ctx.strokeRect(cardRow.x, cardRow.y, cardRow.width, cardRow.height);
  ctx.strokeStyle = "red";
  for (const box of boxes) {
    ctx.strokeRect(box.x, box.y, box.width, box.height);
  }
  document.body.append(canvas);
}
