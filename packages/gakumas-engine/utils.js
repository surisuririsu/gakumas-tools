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
  return [...state];
}

// Recursive clone specialized for engine state. ~4x faster than
// JSON.parse(JSON.stringify) on a typical mid-run state. Two specializations:
// (1) effect objects — identified by `effectInstanceId` — are shallow-cloned
// so their AST-valued fields (conditions/actions/effects/targets/filter/
// source) are shared by reference across copies. Those fields come from the
// DSL parser and are never mutated after setEffects spreads them in, so the
// shared refs remain safe; skipping them avoids recursing through the
// entire per-card/per-p-item AST on every useCard/endTurn.
// (2) primitives and arrays follow the standard recursive path so every
// other mutable field (piles, cardMap entries with `growth`, effectCounters,
// buff arrays, graphData) gets a full independent copy.
function cloneValue(v) {
  if (v === null || typeof v !== "object") return v;
  if (Array.isArray(v)) {
    const n = v.length;
    const out = new Array(n);
    for (let i = 0; i < n; i++) out[i] = cloneValue(v[i]);
    return out;
  }
  if ("effectInstanceId" in v) {
    const out = {};
    for (const k in v) out[k] = v[k];
    return out;
  }
  const out = {};
  for (const k in v) out[k] = cloneValue(v[k]);
  return out;
}

export function deepCopy(state) {
  if (!Array.isArray(state)) return cloneValue(state);
  const n = state.length;
  const out = new Array(n);
  for (let i = 0; i < n; i++) out[i] = cloneValue(state[i]);
  return out;
}

export function getBaseId(entity) {
  if (entity.upgraded) return entity.id - 1;
  return entity.id;
}
