import { PItems, SkillCards } from "gakumas-data";
import {
  DEBUG,
  getImageData,
  groupContiguous,
  loadImageFromFile,
  saturation,
} from "./common";
import { extractEntities } from "./memory";
import { loadPItemModel, loadSkillCardModel } from "./models";

// Simulator-screen card art is more pastel than draft/memory screens, so the
// saturation threshold is relaxed from 40.
const SATURATION_THRESHOLD = 25;
const ROW_SAT_FRAC = 0.25;
// Small tolerance so main + sub card rows merge (often touching, 5-10px gap)
// but p-items stay separate (50px+ above main).
const ROW_GAP_TOLERANCE = 15;
const MIN_BAND_HEIGHT = 40;

const COL_SAT_FRAC = 0.3;
// The PC client has a colored chrome strip at x=0 that saturates every row.
// Skip the leftmost columns when computing horizontal bounds.
const EDGE_MARGIN = 5;

// Icon grid vs thumbnail: icon rows have regular vertical whitespace columns
// between items. Thumbnails are continuous images with 0-1 gaps.
const MIN_GRID_GAPS = 3;
const GAP_COL_SAT_FRAC = 0.2;
const GAP_MERGE_TOL = 3;
// Grid-detection uses a width of 3 (interior gaps are 3-4px); slot-split uses
// 2 because some main-row gaps can be as narrow as 2px.
const MIN_GAP_WIDTH = 3;
const MIN_SLOT_GAP_WIDTH = 2;

const P_ITEMS_PER_ROW = 4;
const SKILL_CARDS_PER_ROW = 6;
// How far above main row to look for p-items.
const INFER_MAX_GAP = 120;
// For finding p-items bounds: "gap" is a truly empty row (sat frac <2.5%);
// "content" is any row with more than ~7% saturated pixels. P-items have
// low internal saturation dips at ~6%, so a middle threshold avoids false
// gap detection within the row.
const PITEM_GAP_SAT_FRAC = 0.025;
const PITEM_CONTENT_SAT_FRAC = 0.07;
// A run of this many consecutive gap rows marks the top of the p-items row.
const PITEM_TOP_GAP_RUN = 5;

export async function getSimulatorLoadoutFromFile(file) {
  const img = await loadImageFromFile(file);
  // Kick off model loads in parallel with pixel work — cold start dominates
  // first-use latency and the two are independent.
  const modelsPromise = Promise.all([loadPItemModel(), loadSkillCardModel()]);
  const imageData = getImageData(img);

  const bands = detectIconBands(imageData);
  const gridBands = bands.filter((b) => hasIconGridPattern(imageData, b));
  if (!gridBands.length) {
    throw new Error(
      "Could not locate any icon rows. Is this a simulator loadout screenshot?",
    );
  }

  const skillBand = gridBands[gridBands.length - 1];
  const skillBounds = bandHorizontalBounds(imageData, skillBand);
  if (!skillBounds) throw new Error("Could not locate skill card row bounds");
  const slotWidth = (skillBounds.xRight - skillBounds.xLeft + 1) / SKILL_CARDS_PER_ROW;
  const isMerged = skillBand.height > slotWidth * 1.3;

  let mainRow, subRow, mainBounds, subBounds;
  if (isMerged) {
    // Find the horizontal gap between the two card rows so main and sub
    // don't include the empty rows between them.
    const { mainBottom, subTop } = findHorizontalSplit(imageData, skillBand);
    mainRow = {
      yTop: skillBand.yTop,
      yBottom: mainBottom,
      height: mainBottom - skillBand.yTop + 1,
    };
    subRow = {
      yTop: subTop,
      yBottom: skillBand.yBottom,
      height: skillBand.yBottom - subTop + 1,
    };
    // Main and sub rows have different horizontal extents (sub is shifted
    // right by the "+" add-row button), so compute bounds per row.
    mainBounds = bandHorizontalBounds(imageData, mainRow);
    subBounds = bandHorizontalBounds(imageData, subRow);
    if (!mainBounds) throw new Error("Could not locate main skill card bounds");
    if (!subBounds) throw new Error("Could not locate sub skill card bounds");
  } else {
    if (gridBands.length < 2) {
      throw new Error(
        "Only one skill card row detected. Is this a simulator loadout screenshot?",
      );
    }
    subRow = skillBand;
    mainRow = gridBands[gridBands.length - 2];
    subBounds = skillBounds;
    mainBounds = bandHorizontalBounds(imageData, mainRow);
    if (!mainBounds) throw new Error("Could not locate main skill card bounds");
  }

  const singleRowHeight = mainRow.height;

  // P-items row: use the next grid band above main if one exists and is close
  // enough; otherwise scan upward from mainRow to locate it.
  const mainIdx = isMerged
    ? gridBands.length - 1
    : gridBands.length - 2;
  const candidatePItems =
    mainIdx > 0 && gridBands[mainIdx - 1].yBottom < mainRow.yTop
      ? gridBands[mainIdx - 1]
      : null;
  let pItemsBand =
    candidatePItems && mainRow.yTop - candidatePItems.yBottom <= INFER_MAX_GAP
      ? candidatePItems
      : inferPItemsBand(imageData, mainRow.yTop, singleRowHeight);
  if (!pItemsBand) {
    throw new Error("Could not locate p-items row above skill cards");
  }
  const pItemsBounds = bandHorizontalBounds(imageData, pItemsBand);
  if (!pItemsBounds) throw new Error("Could not locate p-items row bounds");
  // Tighten the p-items y range: the inferred band may extend above or below
  // the actual icons (when no gap run was found during scan). Re-scan for
  // saturated rows within the detected x bounds to get the real icon height.
  // Horizontal bounds are unaffected by y-tightening since icon columns are
  // uniform top-to-bottom, so the same pItemsBounds is reused for splitting.
  const tightY = tightVerticalBounds(imageData, pItemsBand, pItemsBounds);
  if (tightY) pItemsBand = tightY;

  const mainBoxes = splitBandBySlots(
    imageData,
    mainRow,
    mainBounds,
    SKILL_CARDS_PER_ROW,
  );
  const subBoxes = splitBandBySlots(
    imageData,
    subRow,
    subBounds,
    SKILL_CARDS_PER_ROW,
  );
  const pItemBoxes = splitBandBySlots(
    imageData,
    pItemsBand,
    pItemsBounds,
    P_ITEMS_PER_ROW,
  );

  if (DEBUG) {
    debugOverlay(img, [...pItemBoxes, ...mainBoxes, ...subBoxes]);
  }

  const [
    { session: pItemSession, classes: pItemClasses },
    { session: skillCardSession, classes: skillCardClasses },
  ] = await modelsPromise;

  // onnxruntime-web's WASM runtime is shared across sessions — concurrent
  // session.run calls throw "Session already started", so these must run
  // sequentially. Batching by session avoids the per-call setup overhead.
  const skillCardIds = await extractEntities(
    img,
    [...mainBoxes, ...subBoxes],
    skillCardSession,
    skillCardClasses,
  );
  const pItemIds = await extractEntities(
    img,
    pItemBoxes,
    pItemSession,
    pItemClasses,
  );
  const mainIds = skillCardIds.slice(0, mainBoxes.length);
  const subIds = skillCardIds.slice(mainBoxes.length);

  if (DEBUG) {
    console.log(
      "Extracted p-items:",
      pItemIds.map((id) => PItems.getById(id)?.name || id),
    );
    console.log(
      "Extracted main skill cards:",
      mainIds.map((id) => SkillCards.getById(id)?.name || id),
    );
    console.log(
      "Extracted sub skill cards:",
      subIds.map((id) => SkillCards.getById(id)?.name || id),
    );
  }

  return {
    pItemIds,
    skillCardIdGroups: [mainIds, subIds],
  };
}

function detectIconBands({ data, width, height }) {
  const rowThreshold = width * ROW_SAT_FRAC;
  const rows = [];
  for (let y = 0; y < height; y++) {
    let count = 0;
    for (let x = 0; x < width; x++) {
      if (saturation(data, (y * width + x) * 4) > SATURATION_THRESHOLD) count++;
    }
    if (count > rowThreshold) rows.push(y);
  }
  if (!rows.length) return [];

  return groupContiguous(rows, ROW_GAP_TOLERANCE)
    .filter(([a, b]) => b - a + 1 >= MIN_BAND_HEIGHT)
    .map(([yTop, yBottom]) => ({ yTop, yBottom, height: yBottom - yTop + 1 }));
}

function hasIconGridPattern(imageData, band) {
  const { data, width } = imageData;
  const bounds = bandHorizontalBounds(imageData, band);
  if (!bounds) return false;
  const gapCols = [];
  for (let x = bounds.xLeft; x <= bounds.xRight; x++) {
    let sat = 0;
    for (let y = band.yTop; y <= band.yBottom; y++) {
      if (saturation(data, (y * width + x) * 4) > SATURATION_THRESHOLD) sat++;
    }
    if (sat < band.height * GAP_COL_SAT_FRAC) gapCols.push(x);
  }
  const gaps = groupContiguous(gapCols, GAP_MERGE_TOL).filter(
    ([a, b]) => b - a + 1 >= MIN_GAP_WIDTH,
  );
  // A band's own outer margins count as "gaps" when scanned, so subtract up to
  // 2 outer gaps before checking the icon count.
  const interior = gaps.filter(
    ([a, b]) => a > bounds.xLeft + 2 && b < bounds.xRight - 2,
  );
  return interior.length >= MIN_GRID_GAPS;
}

// Scan upward from just above the main skill card row, through the small gap,
// to find the p-items row bounds. P-items are more pastel than skill cards
// and the row has internal saturation dips, so we use a permissive content
// threshold and only treat a sustained run of empty rows as the true top.
// Count saturated pixels in row y across the image (excluding the EDGE_MARGIN
// columns on each side, which are polluted by app-chrome artifacts).
function rowSaturationCount(data, width, y) {
  let sat = 0;
  for (let x = EDGE_MARGIN; x < width - EDGE_MARGIN; x++) {
    if (saturation(data, (y * width + x) * 4) > SATURATION_THRESHOLD) sat++;
  }
  return sat;
}

function inferPItemsBand({ data, width }, mainYTop, singleRowHeight) {
  const gapThreshold = width * PITEM_GAP_SAT_FRAC;
  const contentThreshold = width * PITEM_CONTENT_SAT_FRAC;

  // Find the gap immediately above main, then the first content row above it.
  let gapFound = false;
  let pItemsBottom = -1;
  const scanLimit = Math.max(0, mainYTop - INFER_MAX_GAP);
  for (let y = mainYTop - 1; y >= scanLimit; y--) {
    const sat = rowSaturationCount(data, width, y);
    if (sat < gapThreshold) {
      gapFound = true;
    } else if (gapFound && sat > contentThreshold) {
      pItemsBottom = y;
      break;
    }
  }
  if (pItemsBottom === -1) return null;

  // P-items has internal low-saturation rows, so look for a sustained run of
  // empty rows (PITEM_TOP_GAP_RUN) before declaring the top of the row.
  let pItemsTop = Math.max(0, pItemsBottom - singleRowHeight + 1);
  let gapRun = 0;
  for (let y = pItemsBottom - 1; y >= scanLimit; y--) {
    if (rowSaturationCount(data, width, y) < gapThreshold) {
      gapRun++;
      if (gapRun >= PITEM_TOP_GAP_RUN) {
        pItemsTop = y + PITEM_TOP_GAP_RUN;
        break;
      }
    } else {
      gapRun = 0;
    }
  }
  return {
    yTop: pItemsTop,
    yBottom: pItemsBottom,
    height: pItemsBottom - pItemsTop + 1,
  };
}

// Find the horizontal gap between main and sub skill card rows. The gap is a
// run of rows with near-zero saturation. Returns the mainBottom (last row of
// main) and subTop (first row of sub) so the detected boxes exclude the gap.
function findHorizontalSplit({ data, width }, band) {
  const margin = Math.floor(band.height * 0.3);
  const scanStart = band.yTop + margin;
  const scanEnd = band.yBottom - margin;
  let minSat = Infinity;
  for (let y = scanStart; y <= scanEnd; y++) {
    const s = rowSaturationCount(data, width, y);
    if (s < minSat) minSat = s;
  }
  const tolerance = Math.max(2, Math.floor(width * 0.01));
  let runStart = -1;
  let runEnd = -1;
  for (let y = scanStart; y <= scanEnd; y++) {
    if (rowSaturationCount(data, width, y) <= minSat + tolerance) {
      if (runStart === -1) runStart = y;
      runEnd = y;
    } else if (runStart !== -1) {
      break;
    }
  }
  return { mainBottom: runStart - 1, subTop: runEnd + 1 };
}

// Given a rough band and its horizontal content bounds, compute the tight
// vertical extent of actual icon content — the top and bottom rows within
// the band that have substantial saturation inside the x bounds. Used to
// correct p-items bands that were inferred too tall.
const TIGHT_ROW_SAT_FRAC = 0.1;

function tightVerticalBounds({ data, width }, band, bounds) {
  const innerWidth = bounds.xRight - bounds.xLeft + 1;
  const threshold = innerWidth * TIGHT_ROW_SAT_FRAC;
  let yTop = -1;
  let yBottom = -1;
  for (let y = band.yTop; y <= band.yBottom; y++) {
    let sat = 0;
    for (let x = bounds.xLeft; x <= bounds.xRight; x++) {
      if (saturation(data, (y * width + x) * 4) > SATURATION_THRESHOLD) sat++;
    }
    if (sat > threshold) {
      if (yTop === -1) yTop = y;
      yBottom = y;
    }
  }
  if (yTop === -1) return null;
  return { yTop, yBottom, height: yBottom - yTop + 1 };
}

function bandHorizontalBounds({ data, width }, band) {
  const colThreshold = band.height * COL_SAT_FRAC;
  let xLeft = -1;
  let xRight = -1;
  for (let x = EDGE_MARGIN; x < width - EDGE_MARGIN; x++) {
    let count = 0;
    for (let y = band.yTop; y <= band.yBottom; y++) {
      if (saturation(data, (y * width + x) * 4) > SATURATION_THRESHOLD) count++;
    }
    if (count > colThreshold) {
      if (xLeft === -1) xLeft = x;
      xRight = x;
    }
  }
  return xLeft === -1 ? null : { xLeft, xRight };
}

// Split a band into slot boxes, one per icon. For each expected boundary
// (at regular intervals), snap to the nearest detected inter-icon gap within
// ~35% of a slot width. If no nearby gap exists (e.g., a card's internal art
// creates a spurious gap elsewhere), fall back to the expected boundary.
// This keeps slot widths roughly equal, rejecting false gaps from low-sat
// regions inside an icon.
const SLOT_SNAP_FRAC = 0.35;

function splitBandBySlots(imageData, band, bounds, numSlots) {
  if (!bounds || bounds.xRight === -1) return [];
  const { data, width } = imageData;
  const { xLeft, xRight } = bounds;

  const gapCols = [];
  for (let x = xLeft; x <= xRight; x++) {
    let sat = 0;
    for (let y = band.yTop; y <= band.yBottom; y++) {
      if (saturation(data, (y * width + x) * 4) > SATURATION_THRESHOLD) sat++;
    }
    if (sat < band.height * GAP_COL_SAT_FRAC) gapCols.push(x);
  }
  const gaps = groupContiguous(gapCols, GAP_MERGE_TOL).filter(
    ([a, b]) =>
      b - a + 1 >= MIN_SLOT_GAP_WIDTH &&
      a > xLeft + 1 &&
      b < xRight - 1,
  );

  const slotWidth = (xRight - xLeft + 1) / numSlots;
  const snapWindow = slotWidth * SLOT_SNAP_FRAC;
  const boundaries = [];
  for (let i = 1; i < numSlots; i++) {
    const expected = xLeft + i * slotWidth;
    let best = null;
    let bestDist = snapWindow + 1;
    for (const gap of gaps) {
      const center = (gap[0] + gap[1]) / 2;
      const dist = Math.abs(center - expected);
      if (dist < bestDist) {
        bestDist = dist;
        best = gap;
      }
    }
    boundaries.push(best);
  }

  const boxes = [];
  let slotStart = xLeft;
  for (let i = 0; i < numSlots; i++) {
    let slotEnd;
    let nextStart;
    if (i < numSlots - 1) {
      const gap = boundaries[i];
      if (gap) {
        slotEnd = gap[0] - 1;
        nextStart = gap[1] + 1;
      } else {
        const pos = Math.round(xLeft + (i + 1) * slotWidth);
        slotEnd = pos - 1;
        nextStart = pos;
      }
    } else {
      slotEnd = xRight;
    }
    boxes.push({
      x: slotStart,
      y: band.yTop,
      width: slotEnd - slotStart + 1,
      height: band.height,
    });
    if (i < numSlots - 1) slotStart = nextStart;
  }
  return boxes;
}

function debugOverlay(img, boxes) {
  const canvas = document.createElement("canvas");
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0);
  ctx.lineWidth = 3;
  ctx.strokeStyle = "red";
  for (const box of boxes) {
    ctx.strokeRect(box.x, box.y, box.width, box.height);
  }
  document.body.append(canvas);
}
