import { SkillCards } from "gakumas-data";
import { DEBUG, loadImageFromFile } from "./common";
import { extractEntities } from "./memory";

// Detection heuristic:
// 1. Find the white modal panel (contiguous rows with majority-white pixels,
//    tolerating card-row interruptions of up to ~150px).
// 2. Within the panel, find the tallest contiguous band with saturated
//    content — that's the 3-card row.
// 3. Find the horizontal extent of that band, then divide into 3 equal cells.

const WHITE_THRESHOLD = 240;
const PANEL_ROW_WHITE_FRAC = 0.3;
const PANEL_COL_WHITE_FRAC = 0.2;
const PANEL_ROW_GAP_TOLERANCE = 150;

const SATURATION_THRESHOLD = 40;
const CARD_ROW_SAT_FRAC = 0.08;
const CARD_ROW_GAP_TOLERANCE = 15;
const CARD_COL_SAT_FRAC = 0.2;

export async function getDraftPickFromFile(file, session, classes) {
  const img = await loadImageFromFile(file);
  const { width, height } = img;
  const imageData = getImageData(img);

  const panel = detectPanel(imageData, width, height);
  if (!panel) throw new Error("Could not locate modal panel in screenshot");

  const cardRow = detectCardRow(imageData, width, panel);
  if (!cardRow) throw new Error("Could not locate card row in screenshot");

  const boxes = splitIntoThreeCards(cardRow);

  if (DEBUG) {
    debugOverlay(img, panel, cardRow, boxes);
  }

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
  return ctx.getImageData(0, 0, img.width, img.height).data;
}

function rowWhiteCount(data, width, y) {
  let count = 0;
  const rowStart = y * width * 4;
  for (let x = 0; x < width; x++) {
    const i = rowStart + x * 4;
    if (
      data[i] > WHITE_THRESHOLD &&
      data[i + 1] > WHITE_THRESHOLD &&
      data[i + 2] > WHITE_THRESHOLD
    ) {
      count++;
    }
  }
  return count;
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

function detectPanel(data, width, height) {
  const panelRowThreshold = width * PANEL_ROW_WHITE_FRAC;
  const rows = [];
  for (let y = 0; y < height; y++) {
    if (rowWhiteCount(data, width, y) > panelRowThreshold) rows.push(y);
  }
  if (!rows.length) return null;

  const groups = groupContiguous(rows, PANEL_ROW_GAP_TOLERANCE);
  const [yTop, yBottom] = groups.reduce((best, cur) =>
    cur[1] - cur[0] > best[1] - best[0] ? cur : best,
  );

  const panelHeight = yBottom - yTop + 1;
  const colThreshold = panelHeight * PANEL_COL_WHITE_FRAC;
  const cols = [];
  for (let x = 0; x < width; x++) {
    let c = 0;
    for (let y = yTop; y <= yBottom; y++) {
      const i = (y * width + x) * 4;
      if (
        data[i] > WHITE_THRESHOLD &&
        data[i + 1] > WHITE_THRESHOLD &&
        data[i + 2] > WHITE_THRESHOLD
      ) {
        c++;
      }
    }
    if (c > colThreshold) cols.push(x);
  }
  if (!cols.length) return null;

  return {
    x: cols[0],
    y: yTop,
    width: cols[cols.length - 1] - cols[0] + 1,
    height: panelHeight,
  };
}

function detectCardRow(data, width, panel) {
  const satRowThreshold = panel.width * CARD_ROW_SAT_FRAC;
  const rows = [];
  for (let y = panel.y; y < panel.y + panel.height; y++) {
    let count = 0;
    for (let x = panel.x; x < panel.x + panel.width; x++) {
      const i = (y * width + x) * 4;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const sat = Math.max(r, g, b) - Math.min(r, g, b);
      if (sat > SATURATION_THRESHOLD) count++;
    }
    if (count > satRowThreshold) rows.push(y);
  }
  if (!rows.length) return null;

  const groups = groupContiguous(rows, CARD_ROW_GAP_TOLERANCE);
  const [yTop, yBottom] = groups.reduce((best, cur) =>
    cur[1] - cur[0] > best[1] - best[0] ? cur : best,
  );

  const rowHeight = yBottom - yTop + 1;
  const colThreshold = rowHeight * CARD_COL_SAT_FRAC;
  let xLeft = -1;
  let xRight = -1;
  for (let x = panel.x; x < panel.x + panel.width; x++) {
    let count = 0;
    for (let y = yTop; y <= yBottom; y++) {
      const i = (y * width + x) * 4;
      const sat =
        Math.max(data[i], data[i + 1], data[i + 2]) -
        Math.min(data[i], data[i + 1], data[i + 2]);
      if (sat > SATURATION_THRESHOLD) count++;
    }
    if (count > colThreshold) {
      if (xLeft === -1) xLeft = x;
      xRight = x;
    }
  }
  if (xLeft === -1) return null;

  return { x: xLeft, y: yTop, width: xRight - xLeft + 1, height: rowHeight };
}

function splitIntoThreeCards(row) {
  const cardWidth = row.width / 3;
  const boxes = [];
  for (let i = 0; i < 3; i++) {
    boxes.push({
      x: Math.round(row.x + i * cardWidth),
      y: row.y,
      width: Math.round(cardWidth),
      height: row.height,
    });
  }
  return boxes;
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
