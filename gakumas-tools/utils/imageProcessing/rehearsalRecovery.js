// Pure, DOM-free reconstruction of overlapping-million rehearsal scores.
//
// When two adjacent per-character scores are both >= 1,000,000 the game renders
// them so close that the right number's leading digit ("1" or "2") visually
// collides with the left number's last digit. OCR then drops the right number's
// leading digit and may misread the left number's units digit. The result screen
// also shows, per stage, an isolated total that never overlaps anything, and the
// game guarantees the exact identity
//
//     stage_total = c1 + c2 + c3 + floor(max(c1, c2, c3) / 5)
//
// (the bonus badge is floor(max/5)), so the true scores can be reconstructed from
// the total alone via a small exhaustive search. The bonus, when available, is
// only an optional cross-check; this module is driven by the total.
//
// The invariants relied on:
//   1. A per-character score is at most ~2,000,000 today; MAX_SCORE (3,000,000)
//      is the hard ceiling used to bound in-collision recovery.
//   2. An overlap happens only between two side-by-side scores both >= 1,000,000.
//   3. The damage is bounded: the right number loses its leading digit, and the
//      left number's units digit may be misread. Everything else is intact.
//   4/5. stage_total = c1 + c2 + c3 + floor(max/5).
//   6. A dropped leading "1," can leave a leading-zero group (1,062,741 ->
//      062,741), a definitive "a leading 1 was lost here" marker.

// Hard ceiling (exclusive) for in-collision recovery candidates (invariant 1).
export const MAX_SCORE = 3_000_000;

// Dash-like characters that mark a missing/blank character slot.
const DASH = "\\-\\u2014\\u2013\\u2015\\u2500\\u30FC\\u4E00";

// Capped score-token pattern. GLOBAL (not sticky) so matchAll skips stray
// separators between tokens (e.g. a doubled comma), recovering correct number
// boundaries even when OCR glues a >= 1,000,000 score to its neighbour. A legal
// token is: a millions score `D,DDD,DDD` (leading [1-9], so a clean 2,XXX,XXX is
// not mis-split); or a sub-million `DDD,DDD` / bare `\d{1,3}`; or a run of dashes.
export const SCORE_TOKEN_REGEX = new RegExp(
  `[1-9][,.]\\d{3}[,.]\\d{3}|\\d{1,3}(?:[,.]\\d{3})?|[${DASH}]+`,
  "g",
);
const DASH_ONLY = new RegExp(`^[${DASH}]+$`);

// Largest comma-grouped number in a line (4-7 digits), or null. Matches the
// stage total (e.g. "3,661,912Pt") while ignoring a trailing non-grouped
// "Pt"-leak digit (it lacks a comma) and any letters.
const TOTAL_NUMBER_REGEX = /[1-9]\d{0,2}(?:[,.]\d{3}){1,2}/g;

// Parse one token to a number; a dash (missing slot) becomes 0.
export function parseScoreToken(tok) {
  if (DASH_ONLY.test(tok)) return 0;
  const digits = tok.replace(/[^\d]/g, "");
  return digits ? parseInt(digits, 10) : 0;
}

// All score/dash tokens in a line, as matched strings.
export function allTokens(text) {
  return [...text.matchAll(SCORE_TOKEN_REGEX)].map((m) => m[0]);
}

// floor(max/5) — the bonus the game would render for this combo.
function derivedBonus(combo) {
  return Math.floor(Math.max(combo[0], combo[1], combo[2]) / 5);
}

// Deterministic lexicographic order on triples.
function comboCompare(a, b) {
  for (let i = 0; i < 3; i++) if (a[i] !== b[i]) return a[i] - b[i];
  return 0;
}

// Candidate value set for one slot. Always the raw value; if the raw is a
// plausible victim of a dropped leading digit (>= 1000 and < 1,000,000), also
// raw + d*1,000,000 for each leading digit d keeping the result below MAX_SCORE;
// for every base >= 100,000, the ten units-digit variants. A dash slot (0) only
// contributes {0}.
function candidates(v) {
  if (v === 0) return [0];
  const bases = [v];
  if (v >= 1000 && v < 1_000_000) {
    for (let d = 1; d <= 9; d++) {
      const r = v + d * 1_000_000;
      if (r >= MAX_SCORE) break;
      bases.push(r);
    }
  }
  const out = [v];
  for (const b of bases) {
    if (b < MAX_SCORE) out.push(b);
    if (b >= 100_000) {
      const floor10 = Math.floor(b / 10) * 10;
      for (let d = 0; d <= 9; d++) {
        const variant = floor10 + d;
        if (variant < MAX_SCORE) out.push(variant);
      }
    }
  }
  return [...new Set(out)].sort((x, y) => x - y);
}

// Reject physically-impossible reconstructions. A slot is "restored" if raw < 1M
// but combo >= 1M; a restore requires a >= 1M LEFT neighbour and is never the
// leftmost slot (invariants 2-3). This eliminates spurious million-trades.
function physicallyValid(combo, raw) {
  for (let i = 0; i < 3; i++) {
    const restored = raw[i] < 1_000_000 && combo[i] >= 1_000_000;
    if (restored && (i === 0 || combo[i - 1] < 1_000_000)) return false;
  }
  return true;
}

// Corruption-aware cost. NOT a plain edit count: +1 per restored slot; a units
// change costs +1 only when the slot is immediately LEFT of a restored slot (the
// expected victim), else +3. This breaks unit-trade ties toward the physically
// correct reconstruction.
function cost(chosen, raw) {
  const restored = [0, 1, 2].map(
    (i) => raw[i] < 1_000_000 && chosen[i] >= 1_000_000,
  );
  let c = 0;
  for (let i = 0; i < 3; i++) {
    if (restored[i]) c += 1;
    if (chosen[i] % 10 !== raw[i] % 10) {
      const leftOfRestored = i + 1 < 3 && restored[i + 1];
      c += leftOfRestored ? 1 : 3;
    }
  }
  return c;
}

// Structural-only fallback when no usable total is available. Without the
// checksum we cannot recover from the values alone, so the raw scores are
// returned. A total that was provided but rejected as garbage is suspicious
// (flagged), as is a collision-prone stage (a >= 1M slot with >= 2 non-zero
// slots) whose sum we cannot verify; an absent total with a corroborating (or
// absent) bonus is treated as a clean read (ok).
function structuralOnly(ocrScores, totalProvided, bonusOk) {
  const bonusDisagrees = bonusOk != null && derivedBonus(ocrScores) !== bonusOk;
  const nonzero = ocrScores.filter((s) => s > 0).length;
  const hasMillion = ocrScores.some((s) => s >= 1_000_000);
  const collisionProne = hasMillion && nonzero >= 2;
  const recovery =
    totalProvided || bonusDisagrees || collisionProne ? "flagged" : "ok";
  return [ocrScores.slice(), recovery];
}

// Reconstruct one stage from raw OCR scores + optional total/bonus.
// Returns [ [a, b, c], "ok" | "repaired" | "flagged" ].
export function reconcileStage(ocrScores, total, bonus) {
  const totalProvided = total != null;
  const maxRaw = Math.max(ocrScores[0], ocrScores[1], ocrScores[2]);
  const totalOk =
    total != null && total <= 9_999_999 && total >= maxRaw && total > 0
      ? total
      : null;
  const bonusOk =
    bonus != null && bonus < 1_000_000 && (totalOk == null || bonus < totalOk)
      ? bonus
      : null;

  if (totalOk == null) return structuralOnly(ocrScores, totalProvided, bonusOk);

  const cand = [
    candidates(ocrScores[0]),
    candidates(ocrScores[1]),
    candidates(ocrScores[2]),
  ];
  const solutions = [];
  for (const a of cand[0])
    for (const b of cand[1])
      for (const c of cand[2]) {
        const combo = [a, b, c];
        if (!physicallyValid(combo, ocrScores)) continue;
        const mx = Math.max(a, b, c);
        if (a + b + c + Math.floor(mx / 5) === totalOk)
          solutions.push([combo, cost(combo, ocrScores)]);
      }

  if (solutions.length === 0) return [ocrScores.slice(), "flagged"];

  const minCost = Math.min(...solutions.map((s) => s[1]));
  let best = solutions.filter((s) => s[1] === minCost).map((s) => s[0]);
  if (best.length > 1 && bonusOk != null) {
    const corro = best.filter((c) => derivedBonus(c) === bonusOk);
    if (corro.length) best = corro;
  }
  best.sort(comboCompare);
  const chosen = best[0];
  const tie = best.length > 1;
  const bonusDisagrees = bonusOk != null && derivedBonus(chosen) !== bonusOk;
  const recovery =
    tie || bonusDisagrees ? "flagged" : minCost === 0 ? "ok" : "repaired";
  return [chosen, recovery];
}

// All ways to write n as k ordered parts, each in [min, max].
function compositions(n, k, min, max) {
  const res = [];
  const cur = [];
  function rec(nn, kk) {
    if (kk === 0) {
      if (nn === 0) res.push(cur.slice());
      return;
    }
    for (let len = min; len <= Math.min(max, nn); len++) {
      const rem = nn - len;
      if (rem < (kk - 1) * min || rem > (kk - 1) * max) continue;
      cur.push(len);
      rec(rem, kk - 1);
      cur.pop();
    }
  }
  rec(n, k);
  return res;
}

// Reconstruct a stage directly from the score row's raw digit stream (all
// commas/spaces removed), guided by the total. This is the fallback for the
// two-collision case (three adjacent >= 1M scores) where scrambled commas make
// the per-number tokenization lose interior digits. The digits usually survive
// in order, so this re-partitions the stream into k consecutive scores,
// optionally restoring a dropped leading digit on a non-first 6-digit part,
// searches each junction's left-neighbour units, and keeps only partitions that
// satisfy the exact total (and bonus, when present). Returns
// [ [a, b, c], recovery ] or null. Requires a usable total.
export function reconstructFromDigits(digits, total, bonus) {
  if (total == null || total < 1 || total > 9_999_999) return null;
  const ds = (String(digits).match(/\d/g) || []).map((d) => d.charCodeAt(0));
  const n = ds.length;
  if (n === 0 || n > 21) return null;
  const bonusOk =
    bonus != null && bonus < 1_000_000 && bonus < total ? bonus : null;
  const str = (arr) => String.fromCharCode(...arr);

  const solutions = [];
  for (let k = 1; k <= Math.min(3, n); k++) {
    for (const comp of compositions(n, k, 1, 7)) {
      const parts = [[], [], []];
      let off = 0;
      for (let i = 0; i < k; i++) {
        parts[i] = ds.slice(off, off + comp[i]);
        off += comp[i];
      }
      const popts = [[], [], []];
      let compValid = true;
      for (let i = 0; i < k; i++) {
        const v = parseInt(str(parts[i]), 10);
        if (v < MAX_SCORE) popts[i].push([v, false]);
        if (i > 0 && comp[i] === 6) {
          for (let d = 1; d <= 9; d++) {
            const rv = d * 1_000_000 + v;
            if (rv >= MAX_SCORE) break;
            popts[i].push([rv, true]);
          }
        }
        if (popts[i].length === 0) {
          compValid = false;
          break;
        }
      }
      if (!compValid) continue;

      const sizes = [
        Math.max(1, popts[0].length),
        Math.max(1, popts[1].length),
        Math.max(1, popts[2].length),
      ];
      let comboCount = 1;
      for (let i = 0; i < k; i++) comboCount *= sizes[i];
      for (let sel = 0; sel < comboCount; sel++) {
        const base = [0, 0, 0];
        const restored = [false, false, false];
        let x = sel;
        for (let i = 0; i < k; i++) {
          const [val, isr] = popts[i][x % sizes[i]];
          x = Math.floor(x / sizes[i]);
          base[i] = val;
          restored[i] = isr;
        }
        let bad = false;
        for (let i = 0; i < k; i++)
          if (restored[i] && (i === 0 || base[i - 1] < 1_000_000)) {
            bad = true;
            break;
          }
        if (bad) continue;

        const corrupt = [];
        for (let i = 0; i < k; i++)
          if (i + 1 < k && restored[i + 1]) corrupt.push(i);
        const restores = restored.filter(Boolean).length;

        const limit = Math.pow(10, corrupt.length);
        for (let a = 0; a < limit; a++) {
          const c = base.slice();
          let xx = a;
          let unitsChanges = 0;
          let ok = true;
          for (const slot of corrupt) {
            const d = xx % 10;
            xx = Math.floor(xx / 10);
            const nv = Math.floor(base[slot] / 10) * 10 + d;
            if (nv >= MAX_SCORE) {
              ok = false;
              break;
            }
            if (d !== base[slot] % 10) unitsChanges++;
            c[slot] = nv;
          }
          if (!ok) continue;
          const mx = Math.max(c[0], c[1], c[2]);
          if (c[0] + c[1] + c[2] + Math.floor(mx / 5) !== total) continue;
          if (bonusOk != null && Math.floor(mx / 5) !== bonusOk) continue;
          solutions.push([c.slice(), restores + unitsChanges]);
        }
      }
    }
  }

  if (solutions.length === 0) return null;
  const minCost = Math.min(...solutions.map((s) => s[1]));
  let atMin = solutions.filter((s) => s[1] === minCost).map((s) => s[0]);
  atMin.sort(comboCompare);
  atMin = atMin.filter((c, i) => i === 0 || comboCompare(c, atMin[i - 1]) !== 0);
  const chosen = atMin[0];
  const recovery =
    atMin.length > 1 ? "flagged" : minCost === 0 ? "ok" : "repaired";
  return [chosen, recovery];
}

// The stage-total value encoded in a line of OCR text, or null. A stage total is
// a single isolated 6-7 digit number (e.g. "3,542,572Pt"); the digits survive OCR
// even when the comma/space grouping is mangled ("4,055,07 4+" -> 4055074), so the
// most robust read is to concatenate every digit in the line. An 8-digit result
// is a trailing "Pt"-leak (one extra digit appended) -> take the first 7. Lines
// with too few/many digits fall back to the largest clean comma-grouped match (so
// a multi-number line never yields a bogus glued total).
export function lineNumber(text) {
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
    if (lineNumber(ln.text) == null) continue;
    if (ln.bbox.y1 > bestY) {
      bestY = ln.bbox.y1;
      best = ln;
    }
  }
  return best;
}

// The numeric value of the paired stage total, or null. (Thin wrapper kept for
// callers/tests that only need the value.)
export function pairTotal(row, allLines, excluded) {
  const ln = pairTotalLine(row, allLines, excluded);
  return ln ? lineNumber(ln.text) : null;
}

// The strict comma-grouped value in a line (e.g. "3,542,572"), or null if the
// line has no cleanly-grouped number. Unlike `lineNumber` (which concatenates all
// digits to survive mangled grouping), this only matches intact "X,XXX,XXX"
// grouping, so it is the basis for deciding whether a total read is trustworthy.
export function cleanCommaNumber(text) {
  const m = text.match(/[1-9]\d{0,2}(?:[,.]\d{3}){1,2}/);
  return m ? parseInt(m[0].replace(/[^\d]/g, ""), 10) : null;
}

// A stage total is "reliable" when its cleanly-grouped read agrees with its
// digit-concatenation read: that means OCR neither broke the grouping nor leaked
// a stray digit (e.g. a "Pt" suffix misread). "3,542,572Pt" is reliable;
// "559,03 25" (a 6-digit total split with a leaked digit) is not. Only a reliable
// total is trusted enough to *contradict* (and thus blank) an otherwise-clean row.
export function totalIsReliable(text) {
  const clean = cleanCommaNumber(text);
  return clean != null && clean === lineNumber(text);
}
