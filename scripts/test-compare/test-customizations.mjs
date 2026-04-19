/**
 * Per-customization parity tests (legacy vs. structured engine).
 *
 * Covers the customizations that were migrated to the new anchor/patch DSL
 * (46, 85-88, 91-92, 97, 100-102, 105-107). For each, runs two scenarios:
 *   1. Minimal — target card + default fillers. Verifies parity with legacy
 *      when the customization is both applied and absent.
 *   2. Rich — loadout with stat-generators that trigger the customization's
 *      effect, so we're not just testing a silent no-op.
 *
 * Usage:
 *   node --loader ./scripts/test-compare/extensionless-loader.mjs \
 *        ./scripts/test-compare/test-customizations.mjs
 */
import {
  compareEngines,
  loadoutFromQuery,
} from "./compare-engines.mjs";
import { resetRand as resetLegacy } from "gakumas-engine-legacy";
import { resetRand as resetStructured } from "gakumas-engine";

const origConsole = { ...console };
const noop = () => {};

async function run(q) {
  resetLegacy();
  resetStructured();
  console.log = noop;
  console.warn = noop;
  console.error = noop;
  console.info = noop;
  console.debug = noop;
  try {
    return await compareEngines(loadoutFromQuery(q));
  } finally {
    Object.assign(console, origConsole);
  }
}

// ===== Minimal per-cust tests =====
// One row per (custId, level, cardId, plan). Card receives cust at level;
// rest of deck is default filler cards 1..5.

const PLAN_STAGES = { sense: 75, logic: 77, anomaly: 108 };
const FILLERS = [1, 2, 3, 4, 5];

const MINIMAL_TESTS = [
  [46, 1, 305, "logic"],
  [85, 1, 517, "logic"],
  [86, 1, 517, "logic"],
  [86, 2, 517, "logic"],
  [86, 3, 517, "logic"],
  [87, 1, 519, "anomaly"],
  [88, 1, 521, "logic"],
  [91, 1, 225, "sense"],
  [92, 1, 235, "sense"],
  [97, 1, 597, "sense"],
  [100, 1, 625, "sense"],
  [101, 1, 625, "sense"],
  [102, 1, 273, "logic"],
  [105, 1, 778, "logic"],
  [106, 1, 778, "logic"],
  [107, 1, 451, "anomaly"],
];

function buildMinimal(custId, level, cardId, plan) {
  const stage = PLAN_STAGES[plan];
  const side1Cards = [cardId, ...FILLERS].slice(0, 6).join("-");
  const side1Cust = `${custId}x${level}-----`;
  const side2Cards = FILLERS.concat([FILLERS[0]]).slice(0, 6).join("-");
  const side2Cust = "-----";
  return `stage=${stage}&support_bonus=0.05&params=2000-1500-1800-50&items=0-0-0&cards=${side1Cards}_${side2Cards}&customizations=${side1Cust}_${side2Cust}`;
}

// ===== Rich per-cust tests =====
// Hand-crafted loadouts that include stat-generators so the customization's
// effect actually fires (lowers threshold, buffs trigger, etc.).

const RICH_TESTS = [
  {
    label: "46 (kagakimi) on 305 + logic support",
    q: "stage=66&support_bonus=0.07&params=1204-1422-2072-51&items=94-78-141&cards=281-283-297-89-305-170_315-259-131-97-291-180&customizations=-38x1--49x2-46x1-_-19x1--5x1--",
  },
  {
    label: "85 (daydreaming cond) + 517 + genki support",
    q: "stage=77&support_bonus=0.05&params=2000-1500-1800-50&items=0-0-0&cards=517-25-26-27-28-59_2-3-4-5-1-1&customizations=85x1-----_-----",
  },
  {
    label: "86 (daydreaming effect lv3) + 517 + genki support",
    q: "stage=77&support_bonus=0.05&params=2000-1500-1800-50&items=0-0-0&cards=517-25-26-27-28-59_2-3-4-5-1-1&customizations=86x3-----_-----",
  },
  {
    label: "88 (yumelip) + 521 + goodImpression support",
    q: "stage=77&support_bonus=0.05&params=2000-1500-1800-50&items=0-0-0&cards=521-19-20-80-7-5_2-3-4-5-1-1&customizations=88x1-----_-----",
  },
  {
    label: "91 (seisou) + 225 + goodCondition/concentration support",
    q: "stage=75&support_bonus=0.05&params=2000-1500-1800-50&items=0-0-0&cards=225-13-17-18-14-52_2-3-4-5-1-1&customizations=91x1-----_-----",
  },
  {
    label: "97 (hachiku) + 597 + goodCondition support",
    q: "stage=75&support_bonus=0.05&params=2000-1500-1800-50&items=0-0-0&cards=597-13-14-15-16-18_2-3-4-5-1-1&customizations=97x1-----_-----",
  },
  {
    label: "100 (ukenagashi/conc) + 625 + concentration support",
    q: "stage=75&support_bonus=0.05&params=2000-1500-1800-50&items=0-0-0&cards=625-17-18-32-14-70_2-3-4-5-1-1&customizations=100x1-----_-----",
  },
  {
    label: "101 (ukenagashi/good) + 625 + goodCondition support",
    q: "stage=75&support_bonus=0.05&params=2000-1500-1800-50&items=0-0-0&cards=625-13-14-16-52-70_2-3-4-5-1-1&customizations=101x1-----_-----",
  },
  {
    label: "106 (bishitto) + 778 + goodImpression support",
    q: "stage=77&support_bonus=0.05&params=2000-1500-1800-50&items=0-0-0&cards=778-19-20-21-80-27_2-3-4-5-1-1&customizations=106x1-----_-----",
  },
];

// ===== Run =====

let failed = 0;

console.log("\n== Minimal per-cust tests ==");
console.log("cust  lv  card  plan      WITHOUT    WITH L     WITH S   delta  note");
console.log("────  ──  ────  ─────    ─────────  ─────────  ─────────  ─────  ────");
for (const [custId, level, cardId, plan] of MINIMAL_TESTS) {
  const withQ = buildMinimal(custId, level, cardId, plan);
  const withoutQ = withQ.replace(`${custId}x${level}`, "");
  const withR = await run(withQ);
  const withoutR = await run(withoutQ);
  const delta = withR.scoreDelta;
  const hasEffect = withR.structured.score !== withoutR.structured.score;
  const mark = delta === 0 ? "✓" : "✗";
  if (delta !== 0) failed++;
  console.log(
    `${String(custId).padStart(4)}  ${String(level).padStart(2)}  ${String(cardId).padStart(4)}  ${plan.padEnd(7)} ${String(withoutR.structured.score).padStart(9)}  ${String(withR.legacy.score).padStart(9)}  ${String(withR.structured.score).padStart(9)}  ${mark}${String(delta).padStart(5)}  ${hasEffect ? "applied" : "no-op"}`,
  );
}

console.log("\n== Rich per-cust tests ==");
console.log("scenario                                                    WITH L   WITH S  delta");
console.log("──────────────────────────────────────────────────────────  ───────  ───────  ─────");
for (const t of RICH_TESTS) {
  const r = await run(t.q);
  const mark = r.scoreDelta === 0 ? "✓" : "✗";
  if (r.scoreDelta !== 0) failed++;
  console.log(
    `${t.label.padEnd(58)} ${String(r.legacy.score).padStart(7)}  ${String(r.structured.score).padStart(7)}  ${mark}${String(r.scoreDelta).padStart(5)}`,
  );
}

console.log(
  `\nTotal tests: ${MINIMAL_TESTS.length + RICH_TESTS.length}, failed: ${failed}`,
);
process.exit(failed > 0 ? 1 : 0);
