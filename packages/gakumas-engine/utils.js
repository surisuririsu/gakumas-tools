import { DEBUG } from "./constants";

const seed = 610397104;

// Public domain
function mulberry32(a) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

let _getRand = DEBUG ? mulberry32(seed) : Math.random;
let _getRandCount = 0;

export function getRand() {
  _getRandCount++;
  return _getRand();
}

export function getRandCallCount() {
  return _getRandCount;
}

// Seed the RNG for deterministic runs. DEBUG only controls the *default*
// RNG; calling resetRand always switches to the seeded stream — parity
// tests rely on this.
export function resetRand(customSeed) {
  _getRand = mulberry32(customSeed ?? seed);
  _getRandCount = 0;
}

export function shuffle(arr) {
  let currentIndex = arr.length;

  while (currentIndex != 0) {
    let randomIndex = Math.floor(getRand() * currentIndex);
    currentIndex--;

    [arr[currentIndex], arr[randomIndex]] = [
      arr[randomIndex],
      arr[currentIndex],
    ];
  }

  return arr;
}

export function formatDiffField(value) {
  if (isNaN(value)) return value;
  // Most diffed fields are integer-valued. toFixed+parseFloat is a string
  // round-trip we want to skip for those; only non-integer numerics need
  // the 2-decimal truncation.
  if (Number.isInteger(value)) return value;
  return parseFloat(value.toFixed(2));
}

// Math.ceil with float-precision correction — snaps results that are within
// 1e-9 of an integer to that integer before ceiling, so artifacts like
// `Math.ceil(40 * 0.2 * 3)` rounding 24.000000000000004 up to 25 don't
// leak into integer-domain score results.
export function safeCeil(value) {
  const rounded = Math.round(value);
  if (Math.abs(value - rounded) < 1e-9) return rounded;
  return Math.ceil(value);
}

export function shallowCopy(state) {
  // `.slice()` is meaningfully faster than `[...state]` for a 90-slot
  // array in V8 (native memcpy vs. iterator-protocol spread).
  return state.slice();
}

// Marker for objects that cloneValue should share by reference instead of
// deep-cloning. Used by append-only structures whose "mutation" sites
// replace the whole container with a fresh one (copy-on-write), so no
// two states ever witness a mid-mutation view of the same object.
export const CLONE_SHARE = Symbol("cloneShare");

// Recursive clone specialized for engine state. Much faster than
// JSON.parse(JSON.stringify) on a typical mid-run state. Three
// specializations:
// (1) arrays of primitives — detected by peeking at the first element —
// use native slice(), avoiding a per-element function call. The engine's
// primitive arrays (card piles, logs, turn types, graphData columns) have
// homogeneous element types, so the peek is reliable in practice.
// (2) effect objects — identified by `effectInstanceId` — are shallow-cloned
// so their AST-valued fields (conditions/actions/effects/targets/filter/
// source) are shared by reference across copies. Those fields come from the
// DSL parser and are never mutated after setEffects spreads them in, so the
// shared refs remain safe; skipping them avoids recursing through the
// entire per-card/per-p-item AST on every useCard/endTurn.
// (3) everything else follows the recursive path so mutable nested state
// (cardMap entries with `growth`, effectCounters, buff records) gets a
// full independent copy.
function cloneValue(v) {
  if (v === null || typeof v !== "object") return v;
  // All array-valued state slots carry a copy-on-write invariant:
  //   - primitive arrays (card piles, logs, turn types, graphData
  //     columns) are append/pop/splice in place, but a shallow slice
  //     gives each state its own array instance so those in-place
  //     mutations don't leak across states.
  //   - object arrays (effects, cardMap, buff arrays) never mutate
  //     their entries in place — every mutation site replaces the
  //     entry with a fresh object — so a shallow slice is also safe
  //     here (the entries are shared by reference).
  if (Array.isArray(v)) return v.slice();
  // Effects: mutable fields (limit, ttl, delay) are decremented at
  // known sites in EffectManager which clone the effect first.
  if (v.effectInstanceId !== undefined) return v;
  // cardMap entries: only mutations (CardManager.grow, .upgrade)
  // replace the entry with a fresh object.
  if (v.baseId !== undefined) return v;
  // COW marker: the container's mutation sites replace the whole
  // object with a fresh one.
  if (v[CLONE_SHARE]) return v;
  const out = {};
  for (const k in v) {
    const val = v[k];
    if (val === null || typeof val !== "object") {
      out[k] = val;
    } else {
      out[k] = cloneValue(val);
    }
  }
  return out;
}

export function deepCopy(state) {
  if (!Array.isArray(state)) return cloneValue(state);
  // Shallow slice first (native, packed-array fast path), then walk and
  // deep-clone only the object-valued slots. Primitive slots (most of
  // the state array) are already correctly copied by the slice.
  const out = state.slice();
  for (let i = 0; i < out.length; i++) {
    const v = out[i];
    if (v !== null && typeof v === "object") {
      out[i] = cloneValue(v);
    }
  }
  return out;
}

export function getBaseId(entity) {
  if (entity.upgraded) return entity.id - 1;
  return entity.id;
}
