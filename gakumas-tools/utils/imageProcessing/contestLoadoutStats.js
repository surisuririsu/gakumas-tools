import DIGIT_TEMPLATES from "./contestLoadoutDigits.json";
import { maskOf, readNumber, segmentGlyphs } from "./glyphs";

const NUMBER_X = [4.35, 5.3];
const PERCENT_X = [5.3, 7.3];
const PANEL_Y = [-3.6, -0.9];
const MIN_LINE_HEIGHT = 0.08;
const STAT_LINES = 4;

function isDarkText(r, g, b) {
  const max = Math.max(r, g, b);
  return max < 110 && max - Math.min(r, g, b) < 30;
}

function isColoredText(r, g, b) {
  return Math.max(r, g, b) - Math.min(r, g, b) > 90;
}

function region(mainRow, [x0, x1], [y0, y1], { width, height }) {
  return {
    x0: Math.max(0, Math.round(mainRow.x + x0 * mainRow.pitch)),
    x1: Math.min(width, Math.round(mainRow.x + x1 * mainRow.pitch)),
    y0: Math.max(0, Math.round(mainRow.y + y0 * mainRow.pitch)),
    y1: Math.min(height, Math.round(mainRow.y + y1 * mainRow.pitch)),
  };
}

function findStatLines(imageData, mainRow) {
  const area = region(mainRow, NUMBER_X, PANEL_Y, imageData);
  const { mask, w, h } = maskOf(imageData, area, isDarkText);
  const lines = [];
  let start = -1;
  for (let y = 0; y <= h; y++) {
    let on = false;
    for (let x = 0; y < h && x < w && !on; x++) on = mask[y * w + x] === 1;
    if (on && start === -1) start = y;
    if (!on && start !== -1) {
      if (y - start > MIN_LINE_HEIGHT * mainRow.pitch) {
        lines.push({ y0: area.y0 + start, y1: area.y0 + y });
      }
      start = -1;
    }
  }
  return lines;
}

export function statGlyphs(imageData, mainRow) {
  const lines = findStatLines(imageData, mainRow).slice(-STAT_LINES);
  if (lines.length < STAT_LINES) {
    throw new Error("Could not locate the Vo/Da/Vi/stamina values");
  }
  const numberX = region(mainRow, NUMBER_X, PANEL_Y, imageData);
  const percentX = region(mainRow, PERCENT_X, PANEL_Y, imageData);
  return lines.map((line, i) => {
    const pad = Math.round((line.y1 - line.y0) * 0.3);
    const y0 = Math.max(0, line.y0 - pad);
    const y1 = Math.min(imageData.height, line.y1 + pad);
    return {
      value: segmentGlyphs(
        imageData,
        { x0: numberX.x0, x1: numberX.x1, y0: line.y0, y1: line.y1 },
        isDarkText,
      ),
      percent:
        i < STAT_LINES - 1
          ? segmentGlyphs(
              imageData,
              { x0: percentX.x0, x1: percentX.x1, y0, y1 },
              isColoredText,
              true,
            )
          : null,
    };
  });
}

export function readStats(imageData, mainRow, templates = DIGIT_TEMPLATES) {
  const lines = statGlyphs(imageData, mainRow);
  return {
    params: lines.map((l) => readNumber(l.value, templates.value)),
    percents: lines
      .slice(0, 3)
      .map((l) => readNumber(l.percent, templates.percent)),
  };
}
