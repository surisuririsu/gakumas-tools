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
//   4/5. The stage-total identity above holds exactly.
//   6. A dropped leading "1," can leave a leading-zero group (1,062,741 ->
//      062,741), a definitive "a leading 1 was lost here" marker.

// Hard ceiling (exclusive) for in-collision recovery candidates (invariant 1).
const MAX_SCORE = 3_000_000;

// Largest plausible stage total: a total above this is OCR garbage, not a real
// checksum, and is never trusted.
const MAX_TOTAL = 9_999_999;

// A per-character score is at most 7 digits (one below MAX_SCORE), so a stage
// row's digit stream holds at most three such scores' worth of digits.
const MAX_SCORE_DIGITS = 7;
const MAX_STREAM_DIGITS = 3 * MAX_SCORE_DIGITS;

// Dash-like characters that mark a missing/blank character slot.
const DASH = "\\-\\u2014\\u2013\\u2015\\u2500\\u30FC\\u4E00";

// Capped score-token pattern. GLOBAL (not sticky) so matchAll skips stray
// separators between tokens (e.g. a doubled comma), recovering correct number
// boundaries even when OCR glues a >= 1,000,000 score to its neighbour. A legal
// token is: a millions score `D,DDD,DDD` (leading [1-9], so a clean 2,XXX,XXX is
// not mis-split); or a sub-million `DDD,DDD` / bare `\d{1,3}`; or a run of dashes.
const SCORE_TOKEN_REGEX = new RegExp(
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

// The game's stage-total identity (invariant 4/5). The whole module's premise.
function checksumOk(combo, total) {
  return combo[0] + combo[1] + combo[2] + derivedBonus(combo) === total;
}

// A set of restored slots is physical only if each restore has a >= 1M LEFT
// neighbour and is never leftmost (invariants 2-3). `vals` supplies the neighbour
// magnitudes. Shared by physicallyValid (combo-derived restores) and the
// digit-stream solver (explicit restores).
function restoreValid(restored, vals) {
  for (let i = 0; i < restored.length; i++)
    if (restored[i] && (i === 0 || vals[i - 1] < 1_000_000)) return false;
  return true;
}

// Deterministic lexicographic order on triples.
function comboCompare(a, b) {
  for (let i = 0; i < 3; i++) if (a[i] !== b[i]) return a[i] - b[i];
  return 0;
}

// Every way to pick one item from each list (cartesian product). cartesian([])
// is [[]] — one empty pick. Here the lists are tiny (<= 3 parts, <= 10 options
// each), so the product stays small.
function cartesian(lists) {
  return lists.reduce(
    (combos, list) =>
      combos.flatMap((combo) => list.map((item) => [...combo, item])),
    [[]],
  );
}

// Pick the lowest-cost solution from [[combo, cost], ...] and label the recovery,
// or null if there are none. When several tie at min cost, an optional bonus value
// disambiguates (callers that already filtered by bonus pass null); an unresolved
// tie is "flagged", a zero-cost win is "ok", any repair is "repaired".
function pickBest(solutions, bonusOk) {
  if (solutions.length === 0) return null;
  const minCost = solutions.reduce((m, s) => Math.min(m, s[1]), Infinity);
  let best = solutions.filter((s) => s[1] === minCost).map((s) => s[0]);
  if (best.length > 1 && bonusOk != null) {
    const corro = best.filter((c) => derivedBonus(c) === bonusOk);
    if (corro.length) best = corro;
  }
  best.sort(comboCompare);
  best = best.filter((c, i) => i === 0 || comboCompare(c, best[i - 1]) !== 0);
  const chosen = best[0];
  const bonusDisagrees = bonusOk != null && derivedBonus(chosen) !== bonusOk;
  const recovery =
    best.length > 1 || bonusDisagrees
      ? "flagged"
      : minCost === 0
        ? "ok"
        : "repaired";
  return [chosen, recovery];
}

// Every value one OCR slot could really be. A dash slot (0) is only ever 0.
// Otherwise: the raw reading, plus — if it could be a sub-million victim of a
// dropped leading digit — each leading-digit restoration below MAX_SCORE, and for
// every base >= 100,000 the ten units-digit variants (the units may be misread).
function candidates(value) {
  if (value === 0) return [0];

  const bases = [value];
  if (value >= 1000 && value < 1_000_000) {
    for (let leadingDigit = 1; leadingDigit <= 9; leadingDigit++) {
      const restored = value + leadingDigit * 1_000_000;
      if (restored >= MAX_SCORE) break;
      bases.push(restored);
    }
  }

  // The Set dedups: a duplicate candidate would create a duplicate min-cost
  // solution and spuriously flag a tie. Order does not matter (ties break on
  // whole solutions, not slots).
  const out = new Set([value]);
  for (const base of bases) {
    if (base < MAX_SCORE) out.add(base);
    if (base >= 100_000) {
      const tens = Math.floor(base / 10) * 10;
      for (let unitsDigit = 0; unitsDigit <= 9; unitsDigit++) {
        if (tens + unitsDigit < MAX_SCORE) out.add(tens + unitsDigit);
      }
    }
  }
  return [...out];
}

// Reject physically-impossible reconstructions. A slot is "restored" if raw < 1M
// but combo >= 1M; a restore requires a >= 1M LEFT neighbour and is never the
// leftmost slot (invariants 2-3). This eliminates spurious million-trades.
function physicallyValid(combo, raw) {
  const restored = combo.map((v, i) => raw[i] < 1_000_000 && v >= 1_000_000);
  return restoreValid(restored, combo);
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
function reconcileStage(ocrScores, total, bonus) {
  const totalProvided = total != null;
  const maxRaw = Math.max(ocrScores[0], ocrScores[1], ocrScores[2]);
  const totalOk =
    total != null && total <= MAX_TOTAL && total >= maxRaw && total > 0
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
        if (physicallyValid(combo, ocrScores) && checksumOk(combo, totalOk))
          solutions.push([combo, cost(combo, ocrScores)]);
      }

  return pickBest(solutions, bonusOk) ?? [ocrScores.slice(), "flagged"];
}

const DIGITS_0_9 = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

// All ways to write `sum` as `partCount` ordered part-lengths, each in
// [min, max]. E.g. compositions(4, 2, 1, 7) -> [[1,3],[2,2],[3,1]].
function compositions(sum, partCount, min, max) {
  const results = [];
  const current = [];
  function extend(remaining, partsLeft) {
    if (partsLeft === 0) {
      if (remaining === 0) results.push(current.slice());
      return;
    }
    for (let len = min; len <= Math.min(max, remaining); len++) {
      const rest = remaining - len;
      if (rest < (partsLeft - 1) * min || rest > (partsLeft - 1) * max) continue;
      current.push(len);
      extend(rest, partsLeft - 1);
      current.pop();
    }
  }
  extend(sum, partCount);
  return results;
}

// Split a digit string into consecutive substrings of the given lengths.
function splitByLengths(stream, lengths) {
  const parts = [];
  let offset = 0;
  for (const len of lengths) {
    parts.push(stream.slice(offset, offset + len));
    offset += len;
  }
  return parts;
}

// The values one digit-stream part could represent: its literal reading, plus —
// for a non-first 6-digit part that may have lost a leading "1,"/"2," — each
// leading-digit restoration below MAX_SCORE. Each option carries a `restored`
// flag. Empty when even the literal reading is out of range.
function partOptions(partDigits, isFirstPart) {
  const literal = parseInt(partDigits, 10);
  const options = [];
  if (literal < MAX_SCORE) options.push({ value: literal, restored: false });
  if (!isFirstPart && partDigits.length === 6) {
    for (let leadingDigit = 1; leadingDigit <= 9; leadingDigit++) {
      const restoredValue = leadingDigit * 1_000_000 + literal;
      if (restoredValue >= MAX_SCORE) break;
      options.push({ value: restoredValue, restored: true });
    }
  }
  return options;
}

// For one candidate partition (already restore-validated), try every replacement
// units digit on each slot immediately LEFT of a restored slot — the collision
// can misread that slot's units. Append every variant satisfying the total (and
// bonus) to `solutions`, costed as (#restores + #changed units digits).
function recordUnitsVariants(scores, restored, total, bonusOk, solutions) {
  const corruptSlots = [];
  for (let i = 0; i < 2; i++) if (restored[i + 1]) corruptSlots.push(i);
  const restoreCount = restored.filter(Boolean).length;

  for (const unitsDigits of cartesian(corruptSlots.map(() => DIGITS_0_9))) {
    const combo = scores.slice();
    let unitsChanges = 0;
    let inRange = true;
    corruptSlots.forEach((slot, idx) => {
      const replaced = Math.floor(scores[slot] / 10) * 10 + unitsDigits[idx];
      if (replaced >= MAX_SCORE) inRange = false;
      if (unitsDigits[idx] !== scores[slot] % 10) unitsChanges++;
      combo[slot] = replaced;
    });
    if (!inRange) continue;
    if (!checksumOk(combo, total)) continue;
    if (bonusOk != null && derivedBonus(combo) !== bonusOk) continue;
    solutions.push([combo, restoreCount + unitsChanges]);
  }
}

// Reconstruct a stage directly from the score row's raw digit stream (commas and
// spaces removed), guided by the total. This is the fallback for the two-collision
// case (three adjacent >= 1M scores) where scrambled commas make the per-number
// tokenization lose interior digits. The digits usually survive in order, so this
// tries every way to split the stream into up to three consecutive scores,
// restoring a dropped leading digit on non-first 6-digit parts and searching each
// collision junction's left-neighbour units, keeping only splits that satisfy the
// exact total (and bonus). Returns [ [c1, c2, c3], recovery ] or null. Requires a
// usable total.
function reconstructFromDigits(digits, total, bonus) {
  if (total == null || total < 1 || total > MAX_TOTAL) return null;
  const stream = String(digits).replace(/\D/g, "");
  if (stream.length === 0 || stream.length > MAX_STREAM_DIGITS) return null;
  const bonusOk =
    bonus != null && bonus < 1_000_000 && bonus < total ? bonus : null;

  const solutions = [];
  const maxParts = Math.min(3, stream.length);
  for (let partCount = 1; partCount <= maxParts; partCount++) {
    const splits = compositions(stream.length, partCount, 1, MAX_SCORE_DIGITS);
    for (const lengths of splits) {
      const parts = splitByLengths(stream, lengths);
      const optionsPerPart = parts.map((part, i) => partOptions(part, i === 0));
      if (optionsPerPart.some((opts) => opts.length === 0)) continue;

      for (const choice of cartesian(optionsPerPart)) {
        const scores = [0, 0, 0];
        const restored = [false, false, false];
        choice.forEach((opt, i) => {
          scores[i] = opt.value;
          restored[i] = opt.restored;
        });
        if (!restoreValid(restored, scores)) continue;

        recordUnitsVariants(scores, restored, total, bonusOk, solutions);
      }
    }
  }

  // Bonus is already applied per-variant, so pickBest needs no bonus disambiguation.
  return pickBest(solutions, null);
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
function numberOf(line) {
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
function totalIsReliable(text, value) {
  const clean = cleanCommaNumber(text);
  return clean != null && clean === value;
}

// Is `total` a usable stage total for these raw scores? Same bounds reconcileStage
// trusts before folding the total into the checksum.
function totalUsable(total, raw) {
  return (
    total != null &&
    total > 0 &&
    total <= MAX_TOTAL &&
    total >= Math.max(raw[0], raw[1], raw[2])
  );
}

// Recover one stage's [c1, c2, c3] from its OCR row text + raw tokens + paired
// stage-total line (or null). Owns the full per-stage policy: checksum reconcile,
// the digit-stream fallback for the two-collision case, and the decision to trust
// a clean read versus blank it. Returns three scores, using [0, 0, 0] when the row
// is unreadable and a reliable total disproves it (so the user fixes it in the
// table) rather than storing fragments or dropping the stage out of place.
export function recoverStage(rowText, raw, cleanThree, totalLine) {
  const total = totalLine ? numberOf(totalLine) : null;
  let [fixed, recovery] = reconcileStage(raw, total, null);
  if (recovery === "flagged" && total != null) {
    const digits = rowText.replace(/[^\d]/g, "");
    const alt = reconstructFromDigits(digits, total, null);
    if (alt && alt[1] !== "flagged") [fixed, recovery] = alt;
  }

  // Verified by the total, or a clean read the total did not contradict.
  if (recovery !== "flagged") return fixed.slice();

  // Only a *reliable* total (clean grouping == digit concatenation) is trusted
  // enough to overrule an otherwise-clean three-number read.
  const reliableTotal =
    totalLine != null &&
    totalUsable(total, raw) &&
    totalIsReliable(totalLine.text, total);
  if (cleanThree && !reliableTotal) return fixed.slice();

  return [0, 0, 0];
}
