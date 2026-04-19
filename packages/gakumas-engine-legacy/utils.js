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

export function deepCopy(state) {
  return JSON.parse(JSON.stringify(state));
}

export function getBaseId(entity) {
  if (entity.upgraded) return entity.id - 1;
  return entity.id;
}
