import { writeFileSync } from "node:fs";
import {
  inferCustomizations,
  predictBadges,
} from "../gakumas-tools/utils/inferCustomizations.js";

const KEYS = ["dot", "score", "genki", "cost"];
const FONTS = { dot: "dot", score: "dark", genki: "white", cost: "white" };

export function buildBadgeTemplates(samples, path) {
  const sums = { dot: {}, white: {}, dark: {} };
  for (const { glyphs, label } of samples) {
    KEYS.forEach((key, k) => {
      const found = glyphs[key];
      if (!found || !label[k]) return;
      const digits = String(label[k]);
      if (found.length !== digits.length) return;
      found.forEach((glyph, i) => {
        const sum = (sums[FONTS[key]][digits[i]] ??= { n: 0, pixels: [] });
        sum.n++;
        glyph.pixels.forEach(
          (v, j) => (sum.pixels[j] = (sum.pixels[j] || 0) + v),
        );
      });
    });
  }
  const templates = {};
  for (const [font, digits] of Object.entries(sums)) {
    templates[font] = {};
    for (const digit of Object.keys(digits).sort()) {
      const { n, pixels } = digits[digit];
      templates[font][digit] = pixels.map(
        (v) => Math.round((v / n) * 100) / 100,
      );
    }
  }
  writeFileSync(path, JSON.stringify(templates) + "\n");
  console.log(`Wrote badge templates to ${path}`);
}

export function closestIcon(distances) {
  if (!distances) return null;
  return Object.entries(distances).reduce((a, b) => (b[1] < a[1] ? b : a))[0];
}

export function compareBadges(where, cardId, read, label) {
  const misread = [];
  let unread = 0;
  KEYS.forEach((key, k) => {
    if (read[key] === undefined) unread++;
    else if (read[key] !== label[k]) {
      misread.push(`${where} ${key} read ${read[key]} shown ${label[k]}`);
    }
  });
  const shownIcon = label[KEYS.length];
  const readIcon = closestIcon(read.icon);
  if (shownIcon !== undefined && readIcon !== shownIcon) {
    misread.push(`${where} icon read ${readIcon} shown ${shownIcon}`);
  }
  const predicted = predictBadges(cardId, inferCustomizations(cardId, read));
  const consistent =
    KEYS.every((key, k) => predicted[key] === label[k]) &&
    (shownIcon === undefined || predicted.icon === shownIcon);
  return {
    read: KEYS.length - unread,
    misread,
    unread,
    inconsistent: consistent
      ? null
      : `${where} inferred badges ${[...KEYS, "icon"].map((key) => predicted[key])} shown ${label}`,
  };
}
