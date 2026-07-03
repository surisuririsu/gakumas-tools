// Turning raw OCR text/lines into numbers: tokenizing a score row, and finding
// and reading the stage-total line that pairs with it. No recovery/repair logic
// lives here — that's candidateSolver.js and digitStreamSolver.js.

// Dash-like characters that mark a missing/blank character slot.
const DASH = "\\-\\u2014\\u2013\\u2015\\u2500\\u30FC\\u4E00";

// GLOBAL (not sticky) so matchAll skips stray separators between tokens (e.g. a
// doubled comma), recovering number boundaries even when OCR glues a
// >= 1,000,000 score to its neighbour. Matches a millions score `D,DDD,DDD`
// (leading [1-9], so a clean 2,XXX,XXX isn't mis-split), a sub-million
// `DDD,DDD`/bare `\d{1,3}`, or a run of dashes.
const SCORE_TOKEN_REGEX = new RegExp(
  `[1-9][,.]\\d{3}[,.]\\d{3}|\\d{1,3}(?:[,.]\\d{3})?|[${DASH}]+`,
  "g",
);
const DASH_ONLY = new RegExp(`^[${DASH}]+$`);

// Largest comma-grouped number in a line (4-7 digits), or null. Matches the
// stage total (e.g. "3,661,912Pt") while ignoring a trailing non-grouped
// "Pt"-leak digit (it lacks a comma) and any letters.
const TOTAL_NUMBER_REGEX = /[1-9]\d{0,2}(?:[,.]\d{3}){1,2}/g;

// A dash (missing slot) parses to 0.
export function parseScoreToken(tok) {
  if (DASH_ONLY.test(tok)) return 0;
  const digits = tok.replace(/[^\d]/g, "");
  return digits ? parseInt(digits, 10) : 0;
}

export function allTokens(text) {
  return [...text.matchAll(SCORE_TOKEN_REGEX)].map((m) => m[0]);
}

// The stage-total value encoded in a line of OCR text, or null. A stage total is
// a single isolated 6-7 digit number (e.g. "3,542,572Pt"); the digits survive OCR
// even when the comma/space grouping is mangled ("4,055,07 4+" -> 4055074), so the
// most robust read is to concatenate every digit in the line. An 8-digit result
// is a trailing "Pt"-leak (one extra digit appended) -> take the first 7. Lines
// with too few/many digits fall back to the largest clean comma-grouped match (so
// a multi-number line never yields a bogus glued total).
function lineNumber(text) {
  const digits = text.replace(/\D/g, "");
  if (digits.length === 6 || digits.length === 7) return parseInt(digits, 10);
  if (digits.length === 8) return parseInt(digits.slice(0, 7), 10);
  let best = null;
  for (const m of text.matchAll(TOTAL_NUMBER_REGEX)) {
    const v = parseInt(m[0].replace(/[^\d]/g, ""), 10);
    if (best == null || v > best) best = v;
  }
  return best;
}

// lineNumber memoized per line object: pairTotalLine re-scans every line once per
// stage (3x), so each line's text would otherwise be regex-parsed 3-4 times. The
// WeakMap keys on the line so entries are freed with the OCR result.
const lineNumberCache = new WeakMap();
export function numberOf(line) {
  let v = lineNumberCache.get(line);
  if (v === undefined) {
    v = lineNumber(line.text);
    lineNumberCache.set(line, v);
  }
  return v;
}

// Find a score row's stage-total LINE: the nearest number-bearing line directly
// ABOVE the row, horizontally overlapping it. `excluded` is the Set of lines
// already chosen as score rows (so a higher stage's row is not taken as this
// row's total). Size-agnostic: uses bounding boxes only, no fixed crop fractions.
export function pairTotalLine(row, allLines, excluded) {
  let best = null;
  let bestY = -Infinity;
  for (const ln of allLines) {
    if (excluded && excluded.has(ln)) continue;
    if (!ln.bbox) continue;
    if (ln.bbox.y1 > row.bbox.y0) continue; // must be above the row
    const overlap =
      Math.min(ln.bbox.x1, row.bbox.x1) - Math.max(ln.bbox.x0, row.bbox.x0);
    if (overlap <= 0) continue; // must overlap horizontally
    if (numberOf(ln) == null) continue;
    if (ln.bbox.y1 > bestY) {
      bestY = ln.bbox.y1;
      best = ln;
    }
  }
  return best;
}

// The strict comma-grouped value in a line (e.g. "3,542,572"), or null if the
// line has no cleanly-grouped number. Unlike `lineNumber` (which concatenates all
// digits to survive mangled grouping), this only matches intact "X,XXX,XXX"
// grouping, so it is the basis for deciding whether a total read is trustworthy.
function cleanCommaNumber(text) {
  const m = text.match(/[1-9]\d{0,2}(?:[,.]\d{3}){1,2}/);
  return m ? parseInt(m[0].replace(/[^\d]/g, ""), 10) : null;
}

// A stage total is "reliable" when its cleanly-grouped read agrees with its
// digit-concatenation read: that means OCR neither broke the grouping nor leaked
// a stray digit (e.g. a "Pt" suffix misread). "3,542,572Pt" is reliable;
// "559,03 25" (a 6-digit total split with a leaked digit) is not. Only a reliable
// total is trusted enough to *contradict* (and thus blank) an otherwise-clean row.
// `value` is the already-parsed lineNumber(text), threaded in to avoid re-parsing.
export function totalIsReliable(text, value) {
  const clean = cleanCommaNumber(text);
  return clean != null && clean === value;
}
