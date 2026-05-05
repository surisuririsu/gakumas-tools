import {
  detectWhitePanel,
  groupContiguous,
  isWhite,
  largestGroup,
  saturation,
} from "./common";

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
// Across all known screenshots, the cards' vertical center sits at ≤80% of
// the modal panel height, while the action-button row (受け取る etc.) sits at
// ≥94%. Anything past 85% is therefore a button/badge row, not the cards.
// Without this filter, a tall solid-color button can outweigh the cards' less
// uniform saturation profile and steal the "largest group" pick.
const CARD_ROW_MAX_PANEL_FRAC = 0.85;

// Inter-card gap detection. A column inside the saturated band is a "gap
// column" if at least this fraction of its pixels are white — that is, it
// lies in the white panel gutter between two cards. Cards' interior
// columns dip below this fraction (card art may have white highlights or
// near-white sky), so a relatively high threshold avoids splitting cards.
const GAP_COL_WHITE_FRAC = 0.75;
// Tolerate sub-pixel anti-aliasing on either side of the gap.
const GAP_MERGE_TOLERANCE = 3;
// Anything shorter than this isn't a real inter-card gap (just a stray
// near-white run inside a card).
const MIN_GAP_WIDTH = 5;

// Across the FULL cards-row x range (all 3 cards together), a row counts
// as a card row if non-white pixels cover at least this fraction. Cards
// fill the band (~90-95% non-white when summed across 3 cards); pill rows
// only reach ~50-60% (3 pills, each narrower than its card); text rows
// above sit around 45-55%. 0.7 cleanly separates cards from both.
const CARDS_ROW_NONWHITE_FRAC = 0.7;

// Locate the modal panel, the cards row within it, and a tight bounding box
// for each of the 3 cards. All inputs are pixel data; no DOM/canvas
// required, so this is shared between the browser entry point and the Node
// regression harness.
export function detectDraftPickBoxes(imageData) {
  const panel = detectWhitePanel(imageData, PANEL_OPTS);
  if (!panel) throw new Error("Could not locate modal panel in screenshot");

  const cardRow = detectCardRow(imageData, panel);
  if (!cardRow) throw new Error("Could not locate card row in screenshot");

  const boxes = detectIndividualCards(imageData, cardRow, panel);
  return { panel, cardRow, boxes };
}

// Returns the rough saturated band that contains the cards. This is the
// search region for the per-card refinement; it does not need to match each
// card's exact bounds (that's `detectIndividualCards`'s job).
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

  const cardRowGroup = pickCardRowGroup(
    groupContiguous(rows, CARD_ROW_GAP_TOLERANCE),
    panel,
  );
  if (!cardRowGroup) return null;
  const [yTop, yBottom] = cardRowGroup;
  const colThreshold = (yBottom - yTop + 1) * CARD_COL_SAT_FRAC;

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

  return { x: xLeft, y: yTop, width: xRight - xLeft + 1, height: yBottom - yTop + 1 };
}

// Pick the row group most likely to be the cards row. Filters out groups
// whose vertical center sits below CARD_ROW_MAX_PANEL_FRAC of the panel
// (where the action-button row lives), then returns the tallest of what's
// left. Falls back to the tallest group overall if nothing qualifies, so we
// degrade gracefully on unexpected layouts.
function pickCardRowGroup(groups, panel) {
  if (!groups.length) return null;
  const cutoff = panel.y + panel.height * CARD_ROW_MAX_PANEL_FRAC;
  const eligible = groups.filter(([yT, yB]) => (yT + yB) / 2 <= cutoff);
  return largestGroup(eligible.length ? eligible : groups);
}

// All 3 cards live in the same row, so they share a y position and a
// height. We compute the y span ONCE over the full cards-row x range
// (rather than once per card), then split horizontally using the white
// inter-card gutters. Doing y per-card lets pill content under one card
// pull that card's window down independently — sharing y forces all
// boxes to align like the actual cards do.
function detectIndividualCards(imageData, cardRow, panel) {
  const xStart = cardRow.x;
  const xEnd = cardRow.x + cardRow.width - 1;
  const cardXRanges = splitByGaps(imageData, xStart, xEnd, cardRow.y, cardRow.y + cardRow.height - 1);

  // Cards are uniform-width; estimate from the average split width and
  // use it as the (square) window height for y detection.
  const avgWidth = Math.round(
    cardXRanges.reduce((s, [a, b]) => s + (b - a + 1), 0) / cardXRanges.length,
  );

  const [yT, yB] = findSharedYExtent(
    imageData,
    xStart,
    xEnd,
    panel.y,
    panel.y + panel.height - 1,
    Math.round(cardRow.y + cardRow.height / 2),
    avgWidth,
  );

  return cardXRanges.map(([xL, xR]) => ({
    x: xL,
    y: yT,
    width: xR - xL + 1,
    height: yB - yT + 1,
  }));
}

// Split the saturated band [xStart..xEnd] into 3 cards by locating the 2
// inter-card gutters — runs of mostly-white columns. The cards span the
// full saturated x range (which already excludes the white panel margin
// outside cards), so each card's bounds come straight from the gaps.
// Falls back to even thirds if detection finds the wrong number of gaps.
function splitByGaps({ data, width }, xStart, xEnd, yStart, yEnd) {
  const rangeHeight = yEnd - yStart + 1;
  const minWhite = rangeHeight * GAP_COL_WHITE_FRAC;
  const whiteCols = [];
  for (let x = xStart; x <= xEnd; x++) {
    let count = 0;
    for (let y = yStart; y <= yEnd; y++) {
      if (isWhite(data, (y * width + x) * 4)) count++;
    }
    if (count >= minWhite) whiteCols.push(x);
  }
  const gaps = groupContiguous(whiteCols, GAP_MERGE_TOLERANCE).filter(
    ([a, b]) => b - a + 1 >= MIN_GAP_WIDTH,
  );

  if (gaps.length >= 2) {
    // Take the 2 widest gaps (defends against a stray narrow gap inside
    // a card with a light-on-light region).
    const [g0, g1] = gaps
      .slice()
      .sort((a, b) => b[1] - b[0] - (a[1] - a[0]))
      .slice(0, 2)
      .sort((a, b) => a[0] - b[0]);
    return [
      [xStart, g0[0] - 1],
      [g0[1] + 1, g1[0] - 1],
      [g1[1] + 1, xEnd],
    ];
  }

  const step = (xEnd - xStart + 1) / 3;
  return [0, 1, 2].map((i) => [
    Math.round(xStart + i * step),
    Math.round(xStart + (i + 1) * step) - 1,
  ]);
}

// Slide a square (size = avgCardWidth) window across the panel y range so
// it contains `anchorY`, and pick the position with the most card-like
// rows. A row is card-like if non-white pixels cover ≥ CARDS_ROW_NONWHITE_FRAC
// of the FULL cards-row x range — over all 3 cards together, cards reach
// ~90-95% non-white while pills/text/badges only hit ~50-60%, giving a
// clean separator.
function findSharedYExtent(
  { data, width },
  xStart,
  xEnd,
  ySearchStart,
  ySearchEnd,
  anchorY,
  avgCardWidth,
) {
  const rangeWidth = xEnd - xStart + 1;
  const minNonWhite = rangeWidth * CARDS_ROW_NONWHITE_FRAC;
  const len = ySearchEnd - ySearchStart + 1;
  const cardLike = new Uint8Array(len);
  for (let y = ySearchStart; y <= ySearchEnd; y++) {
    let count = 0;
    for (let x = xStart; x <= xEnd; x++) {
      if (!isWhite(data, (y * width + x) * 4)) count++;
    }
    if (count >= minNonWhite) cardLike[y - ySearchStart] = 1;
  }

  const windowH = avgCardWidth;
  const minStart = Math.max(ySearchStart, anchorY - windowH + 1);
  const maxStart = Math.min(ySearchEnd - windowH + 1, anchorY);
  if (maxStart < minStart) return [anchorY, anchorY];

  let count = 0;
  for (let y = minStart; y < minStart + windowH; y++) count += cardLike[y - ySearchStart];
  let bestStart = minStart;
  let bestCount = count;
  for (let yT = minStart + 1; yT <= maxStart; yT++) {
    count -= cardLike[yT - 1 - ySearchStart];
    count += cardLike[yT + windowH - 1 - ySearchStart];
    if (count > bestCount) {
      bestCount = count;
      bestStart = yT;
    }
  }
  return [bestStart, bestStart + windowH - 1];
}
