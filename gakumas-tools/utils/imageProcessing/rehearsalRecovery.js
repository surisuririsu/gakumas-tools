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
// tie or a bonus disagreement is "flagged".
//
// `rawScores`, when supplied (reconcileStage), classifies by whether the scores
// actually CHANGED rather than by raw cost: a clean score that the checksum
// confirms only under a comma-deleted total carries a non-zero selection penalty
// but was not edited, so it is "ok", not "repaired". The digit-stream caller omits
// it and falls back to the cost rule (cost 0 == a clean read == "ok").
function pickBest(solutions, bonusOk, rawScores) {
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
  const unchanged = rawScores != null && comboCompare(chosen, rawScores) === 0;
  const recovery =
    best.length > 1 || bonusDisagrees
      ? "flagged"
      : unchanged || minCost === 0
        ? "ok"
        : "repaired";
  return [chosen, recovery];
}

// A candidate value for one slot, tagged with its provenance (`kind`) and whether
// its units digit was changed relative to the raw reading (`unitsEdited`). This
// mirrors the Rust `struct Cand { value, kind, units_edited }` / `enum BaseKind`,
// and is the seam that lets `cost` and `physicallyValid` agree on what kind of
// edit each candidate represents:
//   "raw"     — the raw OCR value, high-order digits unchanged.
//   "million" — a dropped leading "1,"/"2," restored AT A JUNCTION (raw + d*1e6);
//               physically valid only when the left neighbour is >= 1,000,000.
//   "prepend" — a dropped/substituted leading digit restored at the number's own
//               next decimal place (52,517 -> 852,517) or an impossible/substituted
//               leading glyph corrected (4,177,174 -> 1,177,174, 2,396,184 ->
//               1,396,184); a plain OCR edit, position-independent (no neighbour rule).
//
// Every slot offers the raw reading, optionally one or more restoration bases, and
// for every base >= 100,000 the ten units-digit variants (the units may be misread).
export function candidates(value) {
  if (value === 0) return [{ value: 0, kind: "raw", unitsEdited: false }];
  const rawUnits = value % 10;

  const bases = [{ value, kind: "raw" }];
  if (value >= 1000 && value < 1_000_000) {
    for (let d = 1; d <= 2; d++) {
      const restored = value + d * 1_000_000;
      if (restored >= MAX_SCORE) break;
      bases.push({ value: restored, kind: "million" });
    }
  }
  // Prepend: a dropped leading non-million digit restored at the number's own next
  // decimal place, e.g. 52,517 -> 852,517 (a plain OCR drop, no junction needed).
  if (value >= 1000 && value < 100_000) {
    const place = 10 ** String(value).length;
    for (let d = 1; d <= 9; d++) {
      const restored = d * place + value;
      if (restored >= MAX_SCORE) break;
      bases.push({ value: restored, kind: "prepend" });
    }
  }
  // Impossible >= 3,000,000 raw (a leading "1," misread as another glyph, e.g.
  // 4,177,174 for a true 1,177,174 / 2,177,174): restore the plausible million.
  if (value >= MAX_SCORE && value < 10_000_000) {
    const tail = value % 1_000_000;
    bases.push({ value: 1_000_000 + tail, kind: "prepend" });
    bases.push({ value: 2_000_000 + tail, kind: "prepend" });
  }
  // A valid-looking 2,XXX,XXX whose leading "1" was misread as "2" (2,396,184 for
  // a true 1,396,184). Offer the 1,XXX,XXX reading; the exact total disambiguates —
  // a genuine 2M score keeps its raw value at cost 0, so the swap only wins when
  // the checksum demands it.
  if (value >= 2_000_000 && value < MAX_SCORE) {
    bases.push({ value: 1_000_000 + (value % 1_000_000), kind: "prepend" });
  }

  // Dedup on (value, kind): the same number can arise as different kinds and they
  // cost differently, so they must not collapse (a collapse would also hide a real
  // min-cost tie). Order is irrelevant — ties break on whole solutions, not slots.
  const out = [];
  const seen = new Set();
  const push = (v, kind) => {
    if (v >= MAX_SCORE) return;
    const key = v + ":" + kind;
    if (seen.has(key)) return;
    seen.add(key);
    out.push({ value: v, kind, unitsEdited: v % 10 !== rawUnits });
  };
  for (const { value: base, kind } of bases) {
    push(base, kind);
    if (base >= 100_000) {
      const tens = Math.floor(base / 10) * 10;
      for (let d = 0; d <= 9; d++) push(tens + d, kind);
    }
  }
  return out;
}

// Reject physically-impossible reconstructions. A "million" restore (a dropped
// leading "1,"/"2," at a junction) is valid only when its left neighbour is
// >= 1,000,000 and it is not the leftmost slot (invariants 2-3). A "prepend"
// restore is a plain leading-digit drop/substitution, not a junction artifact, so
// it carries no neighbour constraint. `kinds` are the chosen candidates' kinds.
function physicallyValid(combo, kinds) {
  for (let i = 0; i < 3; i++)
    if (kinds[i] === "million" && (i === 0 || combo[i - 1] < 1_000_000))
      return false;
  return true;
}

// Corruption-aware cost. NOT a plain edit count: +1 per restored slot (any
// non-"raw" kind); a units change costs +1 only when the slot is immediately LEFT
// of a "million" restore (the expected junction victim), else +3. This breaks
// unit-trade ties toward the physically correct reconstruction. `kinds` and
// `unitsEdited` come from the chosen candidates (not reconstructed from magnitudes,
// so a millions-digit edit like a 2M->1M swap is charged faithfully).
function cost(kinds, unitsEdited) {
  let c = 0;
  for (let i = 0; i < 3; i++) {
    if (kinds[i] !== "raw") c += 1;
    if (unitsEdited[i]) {
      const leftOfJunction = i + 1 < 3 && kinds[i + 1] === "million";
      c += leftOfJunction ? 1 : 3;
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

// A raw slot's plausible magnitude. An impossible value (>= MAX_SCORE — a leading
// glyph misread like 4,177,174) is treated as its 1,XXX,XXX repair so it does not
// over-bound the total used to validate it; everything else is itself.
function plausibleFloor(value) {
  return value < MAX_SCORE ? value : 1_000_000 + (value % 1_000_000);
}

// Plausible totals to test against the checksum: the literal total (penalty 0)
// plus every one-digit deletion of its decimal string (penalty 1, so the literal
// wins genuine ties). A deletion models the stage total's thousands comma being
// OCR'd as a spurious digit (e.g. "393,454" -> "3935454"). Deletions <= 0,
// > MAX_TOTAL, below `floor`, or equal to the literal are dropped.
function totalCandidates(total, floor) {
  const out = [[total, 0]];
  const s = String(total);
  if (s.length > 1) {
    const seen = new Set();
    for (let skip = 0; skip < s.length; skip++) {
      const v = parseInt(s.slice(0, skip) + s.slice(skip + 1), 10);
      if (v > 0 && v <= MAX_TOTAL && v >= floor && v !== total && !seen.has(v)) {
        seen.add(v);
        out.push([v, 1]);
      }
    }
  }
  return out;
}

// The unique per-character score `c` with `c + floor(c/5) == total`, if any.
// `c + c/5` is monotonic in `c`, so a tiny window around floor(total*5/6) suffices.
function solveSingle(total) {
  const approx = Math.floor((total * 5) / 6);
  for (let c = Math.max(0, approx - 3); c <= approx + 3; c++) {
    if (c + Math.floor(c / 5) === total) return c;
  }
  return null;
}

// Is `c` a plausible reading of the raw single-character score — the raw itself,
// or the raw with a dropped leading digit restored (so the raw is c's low-order
// suffix, e.g. 55,172 -> 855,172)? Guards the single-character total-solve: unlike
// Rust (which crops each stage's total positionally), this app pairs totals by
// geometry, so a one-character row can be mis-paired with a NEIGHBOURING stage's
// total whose inverse checksum is an unrelated value (e.g. raw 206,256 paired with
// total 2,744,700 inverts to 2,287,250). Requiring `c` to actually read `raw`
// rejects that, keeping the solve to its purpose (recovering a dropped digit).
function isLeadingDigitReading(c, raw) {
  if (c === raw) return true;
  const place = 10 ** String(raw).length;
  return c > raw && c % place === raw;
}

// Best-effort repair driven by the bonus when the exact-total checksum found no
// solution (the total mis-OCR'd). The bonus equals floor(max/5), so if exactly one
// physically-valid junction million-restore (a sub-million non-leftmost slot whose
// left neighbour is >= 1M) makes the restored slot the maximum with floor(max/5)
// == bonus, apply it (leaving the other slots raw). Returns the combo or null if
// zero or several qualify. Always best-effort — the caller marks it "flagged".
function bonusDrivenRepair(raw, bonusOk) {
  if (bonusOk == null) return null;
  let hit = null;
  for (let i = 0; i < 3; i++) {
    if (i === 0 || !(raw[i] >= 1000 && raw[i] < 1_000_000) || raw[i - 1] < 1_000_000)
      continue;
    for (let d = 1; d <= 2; d++) {
      const restored = raw[i] + d * 1_000_000;
      if (restored >= MAX_SCORE) break;
      const combo = raw.slice();
      combo[i] = restored;
      const max = Math.max(combo[0], combo[1], combo[2]);
      if (max === restored && Math.floor(max / 5) === bonusOk) {
        if (hit != null && comboCompare(hit, combo) !== 0) return null; // ambiguous
        hit = combo;
      }
    }
  }
  return hit;
}

// Fallback ladder when the checksum search found no satisfying combination.
// A collision-prone stage (a >= 1M plausible slot and >= 2 non-zero slots) is
// flagged (the digit-stream fallback handles those). A single-character stage
// total-solves a dropped leading digit straight from the (comma-tolerant) total,
// corroborated by the bonus. A multi-score stage that reaches here had a usable
// total it could not satisfy, so digits were lost — flag, never silently accept.
// A lone (or empty) stage leans on the bonus: Ok when it corroborates (or is
// absent), else Flagged.
function resolveWithoutChecksum(ocrScores, totalSet, bonusOk) {
  const nonzero = ocrScores.filter((s) => s > 0).length;
  const hasMillion = ocrScores.some((s) => plausibleFloor(s) >= 1_000_000);
  if (hasMillion && nonzero >= 2) return [ocrScores.slice(), "flagged"];

  const idxs = [0, 1, 2].filter((i) => ocrScores[i] > 0);
  if (idxs.length === 1) {
    const idx = idxs[0];
    for (const [t] of totalSet.slice().sort((a, b) => a[1] - b[1])) {
      const c = solveSingle(t);
      if (
        c != null &&
        c < MAX_SCORE &&
        isLeadingDigitReading(c, ocrScores[idx]) &&
        (bonusOk == null || Math.floor(c / 5) === bonusOk)
      ) {
        const out = ocrScores.slice();
        out[idx] = c;
        return [out, c === ocrScores[idx] ? "ok" : "repaired"];
      }
    }
  }

  if (nonzero >= 2) return [ocrScores.slice(), "flagged"];

  const maxPlausible = Math.max(...ocrScores.map(plausibleFloor));
  if (bonusOk == null) return [ocrScores.slice(), "ok"];
  return Math.floor(maxPlausible / 5) === bonusOk
    ? [ocrScores.slice(), "ok"]
    : [ocrScores.slice(), "flagged"];
}

// Reconstruct one stage from raw OCR scores + optional total/bonus.
// Returns [ [a, b, c], "ok" | "repaired" | "flagged" ].
//
// `strict` (used by stageVerified for row CLASSIFICATION, not recovery) skips the
// no-checksum fallback ladder: a row is verified only by an exact-checksum
// solution, so a stage total or 総合力 look-alike — which the lenient fallbacks
// would otherwise resolve to a best-effort "ok" — stays "flagged" and is rejected.
export function reconcileStage(ocrScores, total, bonus, strict = false) {
  const totalProvided = total != null;
  // Floor the total must clear is the largest PLAUSIBLE magnitude, so an impossible
  // raw (e.g. 4,177,174) does not reject its true smaller total.
  const maxRaw = Math.max(...ocrScores.map(plausibleFloor));
  const totalOk =
    total != null && total <= MAX_TOTAL && total >= maxRaw && total > 0
      ? total
      : null;
  const bonusOk =
    bonus != null && bonus < 1_000_000 && (totalOk == null || bonus < totalOk)
      ? bonus
      : null;

  if (totalOk == null) {
    // No usable total. Try a bonus-driven repair (a unique leading-"1" restore the
    // bonus corroborates) before the conservative structural pass.
    const rep = bonusDrivenRepair(ocrScores, bonusOk);
    if (rep) return [rep, "flagged"];
    return structuralOnly(ocrScores, totalProvided, bonusOk);
  }

  const cand = [
    candidates(ocrScores[0]),
    candidates(ocrScores[1]),
    candidates(ocrScores[2]),
  ];
  // The OCR'd total may carry one spuriously-inserted digit (a comma read as a
  // digit), so search every plausible total; a deletion-derived total carries a
  // small penalty so the literal always wins a genuine tie.
  const totalSet = totalCandidates(totalOk, maxRaw);
  const solutions = [];
  for (const [t, penalty] of totalSet)
    for (const a of cand[0])
      for (const b of cand[1])
        for (const c of cand[2]) {
          const combo = [a.value, b.value, c.value];
          const kinds = [a.kind, b.kind, c.kind];
          if (physicallyValid(combo, kinds) && checksumOk(combo, t))
            solutions.push([
              combo,
              cost(kinds, [a.unitsEdited, b.unitsEdited, c.unitsEdited]) + penalty,
            ]);
        }

  const result = pickBest(solutions, bonusOk, ocrScores);
  if (result) return result;

  // No combination satisfied any plausible total. For classification (strict) this
  // is a definitive non-match. For recovery, try a bonus-driven repair, then the
  // no-checksum fallback ladder (single-character solve, multi-score flag).
  if (strict) return [ocrScores.slice(), "flagged"];
  const rep = bonusDrivenRepair(ocrScores, bonusOk);
  if (rep) return [rep, "flagged"];
  return resolveWithoutChecksum(ocrScores, totalSet, bonusOk);
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

// The values one digit-stream part could represent: its literal reading, plus the
// collision-victim repairs for the part's length. A leading digit is corrupted
// only at a junction, whose left operand is >= 1M (enforced by the caller's
// restore-validity guard for multi-part stages); a single-part stage (k == 1) is a
// lone-glyph fix with no junction, so those repairs are offered with no neighbour
// constraint. Each option carries a `restored` flag. Empty when nothing is in range.
//   - non-first 6-digit: lost its leading "1,"/"2," -> d,XXX,XXX (d in 1..9).
//   - non-first / single 7-digit impossible (>= MAX_SCORE): leading digit was
//     SUBSTITUTED (e.g. "0"+"1" overlap misread as "4") -> replace it with 1 or 2.
//   - non-first 8-digit with equal first two digits: leading "1" was DUPLICATED ->
//     drop one (collapse to 7). single 8-digit: a spurious leading digit -> drop it.
function partOptions(partDigits, index, partCount) {
  const literal = parseInt(partDigits, 10);
  const len = partDigits.length;
  const isFirst = index === 0;
  const single = partCount === 1;
  const options = [];
  if (literal < MAX_SCORE) options.push({ value: literal, restored: false });

  if (!isFirst && len === 6) {
    for (let d = 1; d <= 9; d++) {
      const rv = d * 1_000_000 + literal;
      if (rv >= MAX_SCORE) break;
      options.push({ value: rv, restored: true });
    }
  }
  if (!isFirst && len === 7 && literal >= MAX_SCORE) {
    const tail = literal % 1_000_000;
    for (let d = 1; d <= 2; d++) {
      const rv = d * 1_000_000 + tail;
      if (rv < MAX_SCORE) options.push({ value: rv, restored: true });
    }
  }
  if (!isFirst && len === 8 && partDigits[0] === partDigits[1]) {
    const rv = parseInt(partDigits.slice(1), 10);
    if (rv < MAX_SCORE) options.push({ value: rv, restored: true });
  }

  if (single && len === 8) {
    const rv = parseInt(partDigits.slice(1), 10);
    if (rv >= 1_000_000 && rv < MAX_SCORE)
      options.push({ value: rv, restored: true });
  }
  if (single && len === 7 && literal >= MAX_SCORE) {
    const tail = literal % 1_000_000;
    for (let d = 1; d <= 2; d++) {
      const rv = d * 1_000_000 + tail;
      if (rv < MAX_SCORE) options.push({ value: rv, restored: true });
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
export function reconstructFromDigits(digits, total, bonus) {
  if (total == null || total < 1 || total > MAX_TOTAL) return null;
  const stream = String(digits).replace(/\D/g, "");
  if (stream.length === 0 || stream.length > MAX_STREAM_DIGITS) return null;
  const bonusOk =
    bonus != null && bonus < 1_000_000 && bonus < total ? bonus : null;

  const solutions = [];
  const maxParts = Math.min(3, stream.length);
  for (let partCount = 1; partCount <= maxParts; partCount++) {
    // Parts may be up to 8 digits: a colliding leading "1" is sometimes DUPLICATED
    // by OCR (read as "11") rather than dropped, inflating one part to 8 digits.
    const splits = compositions(stream.length, partCount, 1, 8);
    for (const lengths of splits) {
      const parts = splitByLengths(stream, lengths);
      const optionsPerPart = parts.map((part, i) =>
        partOptions(part, i, partCount),
      );
      if (optionsPerPart.some((opts) => opts.length === 0)) continue;

      for (const choice of cartesian(optionsPerPart)) {
        const scores = [0, 0, 0];
        const restored = [false, false, false];
        choice.forEach((opt, i) => {
          scores[i] = opt.value;
          restored[i] = opt.restored;
        });
        // A restored part needs a >= 1M left neighbour (a collision partner). This
        // junction rule does not apply to a single-part stage (k == 1): its repair
        // is a lone-glyph fix, not a junction, so the guard is skipped there.
        if (partCount > 1 && !restoreValid(restored, scores)) continue;

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

// Is a row's reading confirmed by a usable stage total (i.e. the checksum holds)?
// Used to admit a SINGLE-number row as a one-character stage and to rank
// candidates, telling a genuine breakdown row apart from the total / 総合力
// look-alikes that share its single-number shape. A one-character stage's total is
// c1 + floor(c1/5), a relationship those look-alikes do not satisfy, so they are
// rejected; a real one-character row passes.
export function stageVerified(rowText, raw, totalLine) {
  const total = totalLine ? numberOf(totalLine) : null;
  if (!totalUsable(total, raw)) return false;
  let [, recovery] = reconcileStage(raw, total, null, true);
  if (recovery === "flagged") {
    const alt = reconstructFromDigits(rowText.replace(/[^\d]/g, ""), total, null);
    if (alt) recovery = alt[1];
  }
  return recovery !== "flagged";
}

// Recover one stage's scores from its OCR row text + raw tokens + paired stage-
// total line (or null). Owns the full per-stage policy: checksum reconcile, the
// digit-stream fallback for the two-collision case, and the decision to trust a
// clean read versus flag it for review. Returns `{ scores, recovery }` where
// recovery is "ok" | "repaired" | "flagged". It NEVER force-zeros a row that has
// values — an unverifiable read is kept as best-effort and flagged so the user can
// review it in the table (mirroring gakumas-screenshot), rather than silently
// dropping correct data.
export function recoverStage(rowText, raw, cleanThree, totalLine, rowConfidence) {
  const total = totalLine ? numberOf(totalLine) : null;
  let [fixed, recovery] = reconcileStage(raw, total, null);
  if (recovery === "flagged" && total != null) {
    const digits = rowText.replace(/[^\d]/g, "");
    const alt = reconstructFromDigits(digits, total, null);
    if (alt && alt[1] !== "flagged") [fixed, recovery] = alt;
  }

  // Verified by the total, or a clean read the total did not contradict.
  if (recovery !== "flagged") return { scores: fixed.slice(), recovery };

  // A total is trusted to overrule a clean read only when it is reliable (clean
  // grouping == digit concatenation) AND read at no-lower confidence than the row.
  // The confidence gate is the portable analog of gakumas-screenshot's
  // multi-threshold total re-OCR (commit 3be5b78): on real data a substituted
  // total digit (e.g. 1,358,696 -> 1,558,696) OCRs at very low confidence while
  // the clean row OCRs high, so a lower-confidence total must not condemn it.
  const reliableTotal =
    totalLine != null &&
    totalUsable(total, raw) &&
    totalIsReliable(totalLine.text, total) &&
    totalLine.confidence >= (rowConfidence ?? 0);

  // A clean three-number read: keep it. Trust it as "ok" when the only thing
  // against it is a low-confidence/garbage total; flag it for review when a
  // genuinely reliable total disproves it (likely lost digits) — but still keep
  // the best-effort values, never zero them.
  if (cleanThree) {
    return { scores: fixed.slice(), recovery: reliableTotal ? "flagged" : "ok" };
  }

  // A degraded/fragmentary row we could not verify: keep best-effort, flagged.
  return { scores: fixed.slice(), recovery: "flagged" };
}
