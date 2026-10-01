import DIGIT_TEMPLATES from "./contestLoadoutDigits.json";

const GLYPH_WIDTH = 10;
const GLYPH_HEIGHT = 14;

const NUMBER_X = [4.35, 5.3];
const PERCENT_X = [5.3, 6.25];
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

function maskOf({ data, width }, area, predicate) {
  const w = Math.max(0, area.x1 - area.x0);
  const h = Math.max(0, area.y1 - area.y0);
  const mask = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = ((area.y0 + y) * width + area.x0 + x) * 4;
      mask[y * w + x] = predicate(data[i], data[i + 1], data[i + 2]) ? 1 : 0;
    }
  }
  return { mask, w, h };
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

function segmentGlyphs(imageData, area, predicate) {
  const { mask, w, h } = maskOf(imageData, area, predicate);
  const glyphs = [];
  let glyph = null;
  for (let x = 0; x <= w; x++) {
    let top = -1;
    let bottom = -1;
    for (let y = 0; x < w && y < h; y++) {
      if (mask[y * w + x]) {
        if (top === -1) top = y;
        bottom = y;
      }
    }
    if (top !== -1) {
      if (!glyph) glyph = { x0: x, x1: x, y0: top, y1: bottom };
      glyph.x1 = x;
      glyph.y0 = Math.min(glyph.y0, top);
      glyph.y1 = Math.max(glyph.y1, bottom);
    } else if (glyph) {
      glyphs.push(glyph);
      glyph = null;
    }
  }
  const tallest = Math.max(0, ...glyphs.map((g) => g.y1 - g.y0 + 1));
  return glyphs
    .filter((g) => g.y1 - g.y0 + 1 >= 0.8 * tallest)
    .flatMap((g) => splitTouching(mask, w, g))
    .map((g) => normalizeGlyph(mask, w, g));
}

const MAX_GLYPH_ASPECT = 1.15;

function splitTouching(mask, w, g) {
  const width = g.x1 - g.x0 + 1;
  const height = g.y1 - g.y0 + 1;
  if (width <= MAX_GLYPH_ASPECT * height) return [g];
  let cut = -1;
  let least = Infinity;
  for (
    let x = g.x0 + Math.round(width * 0.3);
    x <= g.x1 - Math.round(width * 0.3);
    x++
  ) {
    let ink = 0;
    for (let y = g.y0; y <= g.y1; y++) ink += mask[y * w + x];
    if (ink < least) {
      least = ink;
      cut = x;
    }
  }
  return [
    ...splitTouching(mask, w, { ...g, x1: cut - 1 }),
    ...splitTouching(mask, w, { ...g, x0: cut + 1 }),
  ];
}

function normalizeGlyph(mask, w, g) {
  const gh = g.y1 - g.y0 + 1;
  const gw = g.x1 - g.x0 + 1;
  const scale = gh / GLYPH_HEIGHT;
  const cellsWide = Math.min(GLYPH_WIDTH, gw / scale);
  const offset = (GLYPH_WIDTH - cellsWide) / 2;
  const out = new Float32Array(GLYPH_WIDTH * GLYPH_HEIGHT);
  for (let cy = 0; cy < GLYPH_HEIGHT; cy++) {
    for (let cx = 0; cx < GLYPH_WIDTH; cx++) {
      const sx0 = g.x0 + (cx - offset) * scale;
      const sy0 = g.y0 + cy * scale;
      let sum = 0;
      let n = 0;
      for (let sy = Math.floor(sy0); sy < Math.ceil(sy0 + scale); sy++) {
        for (let sx = Math.floor(sx0); sx < Math.ceil(sx0 + scale); sx++) {
          n++;
          if (sx >= g.x0 && sx <= g.x1 && sy >= g.y0 && sy <= g.y1) {
            sum += mask[sy * w + sx];
          }
        }
      }
      out[cy * GLYPH_WIDTH + cx] = n ? sum / n : 0;
    }
  }
  return { pixels: out, aspect: gw / gh };
}

function classifyGlyph(glyph, templates) {
  let best = null;
  let bestDistance = Infinity;
  for (const [digit, template] of Object.entries(templates)) {
    let distance = 0;
    for (let i = 0; i < template.length; i++) {
      const d = glyph.pixels[i] - template[i];
      distance += d * d;
    }
    if (distance < bestDistance) {
      bestDistance = distance;
      best = digit;
    }
  }
  return best;
}

function readNumber(glyphs, templates) {
  if (!glyphs.length) return null;
  return parseInt(glyphs.map((g) => classifyGlyph(g, templates)).join(""), 10);
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
