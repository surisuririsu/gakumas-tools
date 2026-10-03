const GLYPH_WIDTH = 10;
const GLYPH_HEIGHT = 14;

export function maskOf({ data, width }, area, predicate) {
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

export function segmentGlyphs(imageData, area, predicate) {
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

export function readNumber(glyphs, templates) {
  if (!glyphs.length) return null;
  return parseInt(glyphs.map((g) => classifyGlyph(g, templates)).join(""), 10);
}
