import { SkillCards } from "gakumas-data";
import { DEBUG, loadImageFromFile } from "./common";
import { extractEntities } from "./memory";
import { loadSkillCardModel } from "./models";

const WHITE_THRESHOLD = 240;
const PANEL_ROW_WHITE_FRAC = 0.3;
const PANEL_COL_WHITE_FRAC = 0.2;
// Allow for the card row to interrupt the white panel up to this many rows.
const PANEL_ROW_GAP_TOLERANCE = 150;

const SATURATION_THRESHOLD = 40;
// Card rows saturate 15%+ of panel width; text rows above/below the cards
// only reach ~12% so a 0.15 threshold cleanly separates them.
const CARD_ROW_SAT_FRAC = 0.15;
const CARD_ROW_GAP_TOLERANCE = 15;
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

  const panel = detectPanel(imageData);
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

function getImageData(img) {
  const canvas = document.createElement("canvas");
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(img, 0, 0);
  return ctx.getImageData(0, 0, img.width, img.height);
}

function isWhite(data, i) {
  return (
    data[i] > WHITE_THRESHOLD &&
    data[i + 1] > WHITE_THRESHOLD &&
    data[i + 2] > WHITE_THRESHOLD
  );
}

function saturation(data, i) {
  const r = data[i];
  const g = data[i + 1];
  const b = data[i + 2];
  return Math.max(r, g, b) - Math.min(r, g, b);
}

function groupContiguous(indices, gapTolerance) {
  if (!indices.length) return [];
  const groups = [];
  let start = indices[0];
  let prev = start;
  for (let i = 1; i < indices.length; i++) {
    if (indices[i] - prev > gapTolerance) {
      groups.push([start, prev]);
      start = indices[i];
    }
    prev = indices[i];
  }
  groups.push([start, prev]);
  return groups;
}

function largestGroup(groups) {
  return groups.reduce((best, cur) =>
    cur[1] - cur[0] > best[1] - best[0] ? cur : best,
  );
}

function detectPanel({ data, width, height }) {
  const rowThreshold = width * PANEL_ROW_WHITE_FRAC;
  const rows = [];
  for (let y = 0; y < height; y++) {
    let count = 0;
    const rowStart = y * width * 4;
    for (let x = 0; x < width; x++) {
      if (isWhite(data, rowStart + x * 4)) count++;
    }
    if (count > rowThreshold) rows.push(y);
  }
  if (!rows.length) return null;

  const [yTop, yBottom] = largestGroup(
    groupContiguous(rows, PANEL_ROW_GAP_TOLERANCE),
  );
  const panelHeight = yBottom - yTop + 1;
  const colThreshold = panelHeight * PANEL_COL_WHITE_FRAC;

  let xLeft = -1;
  let xRight = -1;
  for (let x = 0; x < width; x++) {
    let count = 0;
    for (let y = yTop; y <= yBottom; y++) {
      if (isWhite(data, (y * width + x) * 4)) count++;
    }
    if (count > colThreshold) {
      if (xLeft === -1) xLeft = x;
      xRight = x;
    }
  }
  if (xLeft === -1) return null;

  return {
    x: xLeft,
    y: yTop,
    width: xRight - xLeft + 1,
    height: panelHeight,
  };
}

function detectCardRow({ data, width }, panel) {
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

  const [yTop, yBottom] = largestGroup(
    groupContiguous(rows, CARD_ROW_GAP_TOLERANCE),
  );
  const rowHeight = yBottom - yTop + 1;
  const colThreshold = rowHeight * CARD_COL_SAT_FRAC;

  let xLeft = -1;
  let xRight = -1;
  for (let x = panel.x; x < panel.x + panel.width; x++) {
    let count = 0;
    for (let y = yTop; y <= yBottom; y++) {
      if (saturation(data, (y * width + x) * 4) > SATURATION_THRESHOLD) count++;
    }
    if (count > colThreshold) {
      if (xLeft === -1) xLeft = x;
      xRight = x;
    }
  }
  if (xLeft === -1) return null;

  return { x: xLeft, y: yTop, width: xRight - xLeft + 1, height: rowHeight };
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
function findSplitBoundaries({ data, width }, row) {
  const xStart = row.x;
  const xEnd = row.x + row.width - 1;
  const yEnd = row.y + row.height - 1;
  const whiteFracThreshold = GAP_WHITE_FRAC * row.height;

  const gapCols = [];
  for (let x = xStart; x <= xEnd; x++) {
    let whiteCount = 0;
    for (let y = row.y; y <= yEnd; y++) {
      if (isWhite(data, (y * width + x) * 4)) whiteCount++;
    }
    if (whiteCount > whiteFracThreshold) gapCols.push(x);
  }
  const gaps = groupContiguous(gapCols, GAP_MERGE_TOLERANCE).filter(
    ([a, b]) => b - a >= MIN_GAP_WIDTH,
  );

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
