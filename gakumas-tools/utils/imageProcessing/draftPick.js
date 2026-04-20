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
const CARD_ROW_SAT_FRAC = 0.08;
const CARD_ROW_GAP_TOLERANCE = 15;
const CARD_COL_SAT_FRAC = 0.2;

export async function getDraftPickFromFile(file) {
  const img = await loadImageFromFile(file);
  const imageData = getImageData(img);

  const panel = detectPanel(imageData);
  if (!panel) throw new Error("Could not locate modal panel in screenshot");

  const cardRow = detectCardRow(imageData, panel);
  if (!cardRow) throw new Error("Could not locate card row in screenshot");

  const boxes = splitIntoThreeCards(cardRow);

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
