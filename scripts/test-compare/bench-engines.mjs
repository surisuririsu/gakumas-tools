/**
 * Benchmarks legacy vs structured engine throughput on realistic loadouts.
 *
 * Usage (from repo root):
 *   node scripts/test-compare/bench-engines.mjs [N] [--seed=S] [--warmup=W]
 *
 * N defaults to 200. Loadouts are generated deterministically from the seed
 * so both engines run the exact same workload, then each engine is run
 * back-to-back (not interleaved) so we measure steady-state per-engine cost.
 */
import { performance } from "node:perf_hooks";
import { PItems, SkillCards, Stages } from "gakumas-data";
import {
  LegacyIdolConfig,
  LegacyIdolStageConfig,
  LegacyStageConfig,
  LegacyStageEngine,
  LegacyStagePlayer,
  LEGACY_STRATEGIES,
  resetRand as resetLegacyRand,
} from "gakumas-engine-legacy";
import {
  IdolConfig as StructuredIdolConfig,
  IdolStageConfig as StructuredIdolStageConfig,
  StageConfig as StructuredStageConfig,
  StageEngine as StructuredStageEngine,
  StagePlayer as StructuredStagePlayer,
  STRATEGIES as STRUCTURED_STRATEGIES,
  resetRand as resetStructuredRand,
} from "gakumas-engine";
import { LegacyStages } from "gakumas-data-legacy";
import { Stages as StructuredStages } from "gakumas-data";
import { loadoutFromQuery } from "./compare-engines.mjs";

const N = parseInt(process.argv[2], 10) || 200;
const seedArg = process.argv.find((a) => a.startsWith("--seed="));
const SEED = seedArg ? parseInt(seedArg.split("=")[1], 10) : 1;
const warmupArg = process.argv.find((a) => a.startsWith("--warmup="));
const WARMUP = warmupArg ? parseInt(warmupArg.split("=")[1], 10) : Math.min(20, N);

function mulberry32(a) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const STAGES = Stages.getAll().filter((s) => s.type === "contest" && !s.preview);
const CARDS = SkillCards.getAll();
const P_ITEMS = PItems.getAll().filter((p) => p.mode === "stage");

function stageMatchesPlan(card, plan) {
  return card.plan === "free" || card.plan === plan;
}

// Pre-generate loadouts so both engines see identical work.
function generateQueries(n, seed) {
  const rand = mulberry32(seed);
  const pick = (arr) => arr[Math.floor(rand() * arr.length)];
  const pickN = (arr, k) => {
    const copy = arr.slice();
    const out = [];
    for (let i = 0; i < k && copy.length; i++) {
      out.push(copy.splice(Math.floor(rand() * copy.length), 1)[0]);
    }
    return out;
  };
  const queries = [];
  for (let i = 0; i < n; i++) {
    const stage = pick(STAGES);
    const plan = stage.plan === "free" ? pick(["sense", "logic", "anomaly"]) : stage.plan;
    const cardPool = CARDS.filter((c) => stageMatchesPlan(c, plan) && c.id > 0);
    const picked = pickN(cardPool, 12).map((c) => c.id);
    while (picked.length < 12) picked.push(0);
    const cards1 = picked.slice(0, 6);
    const cards2 = picked.slice(6, 12);
    const cards = [...cards1, ...cards2];
    const itemPool = P_ITEMS.filter((p) => stageMatchesPlan(p, plan));
    const items = pickN(itemPool, 3).map((p) => p.id);
    while (items.length < 3) items.push(0);
    const c11ns = cards.map((id) => {
      if (!id || rand() > 0.5) return "";
      const card = SkillCards.getById(id);
      const avail = card?.availableCustomizations || [];
      if (!avail.length) return "";
      const c11n = pickN(avail, 1 + Math.floor(rand() * 2))
        .map((cid) => `${cid}x1`)
        .join("e");
      return c11n ? `e${c11n}` : "";
    });
    const cust1 = c11ns.slice(0, 6).join("-");
    const cust2 = c11ns.slice(6, 12).join("-");
    const total = 3500 + Math.floor(rand() * 2500);
    const shares = [rand(), rand(), rand()];
    const ssum = shares.reduce((a, b) => a + b, 0);
    const vocal = Math.round((shares[0] / ssum) * total);
    const dance = Math.round((shares[1] / ssum) * total);
    const visual = total - vocal - dance;
    const stamina = 30 + Math.floor(rand() * 21);
    queries.push(
      `stage=${stage.id}&support_bonus=0.04` +
        `&params=${vocal}-${dance}-${visual}-${stamina}` +
        `&items=${items.join("-")}` +
        `&cards=${cards1.join("-")}_${cards2.join("-")}` +
        `&customizations=${cust1}_${cust2}`,
    );
  }
  return queries;
}

function buildAndPlay({ IdolConfig, StageConfig, IdolStageConfig, Stages, Engine, Player, Strategy, resetRand }, loadout) {
  resetRand();
  const idol = new IdolConfig(loadout);
  const stage = new StageConfig(Stages.getById(loadout.stageId));
  const config = new IdolStageConfig(idol, stage, loadout.enterPercents);
  const engine = new Engine(config);
  const strategy = new Strategy(engine);
  engine.strategy = strategy;
  return new Player(engine, strategy).play();
}

const legacyDeps = {
  IdolConfig: LegacyIdolConfig,
  StageConfig: LegacyStageConfig,
  IdolStageConfig: LegacyIdolStageConfig,
  Stages: LegacyStages,
  Engine: LegacyStageEngine,
  Player: LegacyStagePlayer,
  Strategy: LEGACY_STRATEGIES.HeuristicStrategy,
  resetRand: resetLegacyRand,
};
const structuredDeps = {
  IdolConfig: StructuredIdolConfig,
  StageConfig: StructuredStageConfig,
  IdolStageConfig: StructuredIdolStageConfig,
  Stages: StructuredStages,
  Engine: StructuredStageEngine,
  Player: StructuredStagePlayer,
  Strategy: STRUCTURED_STRATEGIES.HeuristicStrategy,
  resetRand: resetStructuredRand,
};

async function runBatch(deps, loadouts, label) {
  // Silence engine logs during the timed region.
  const orig = { log: console.log, warn: console.warn, error: console.error, info: console.info, debug: console.debug };
  const noop = () => {};
  console.log = noop; console.warn = noop; console.error = noop; console.info = noop; console.debug = noop;
  const durations = new Array(loadouts.length);
  let totalScore = 0;
  try {
    for (let i = 0; i < loadouts.length; i++) {
      const t0 = performance.now();
      const r = await buildAndPlay(deps, loadouts[i]);
      durations[i] = performance.now() - t0;
      totalScore += r.score;
    }
  } finally {
    Object.assign(console, orig);
  }
  return { durations, totalScore, label };
}

function summarize(durations) {
  const sorted = durations.slice().sort((a, b) => a - b);
  const sum = sorted.reduce((a, b) => a + b, 0);
  const pct = (p) => sorted[Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length))];
  return {
    total: sum,
    mean: sum / sorted.length,
    median: pct(50),
    p95: pct(95),
    p99: pct(99),
    min: sorted[0],
    max: sorted[sorted.length - 1],
  };
}

function fmtMs(x) {
  return x >= 100 ? x.toFixed(1) : x >= 10 ? x.toFixed(2) : x.toFixed(3);
}

console.log(`Bench: N=${N}, seed=${SEED}, warmup=${WARMUP}`);
const queries = generateQueries(N + WARMUP, SEED);
const loadouts = queries.map((q) => loadoutFromQuery(q));

// Warmup (discarded) — prime JIT, caches.
if (WARMUP > 0) {
  const warm = loadouts.slice(0, WARMUP);
  await runBatch(legacyDeps, warm, "legacy-warmup");
  await runBatch(structuredDeps, warm, "structured-warmup");
}
const bench = loadouts.slice(WARMUP);

// Interleave trials A/B/A/B/A/B to reduce order effects.
const TRIALS = 3;
const legacyDurs = [];
const structuredDurs = [];
let legacyScore = 0;
let structuredScore = 0;
for (let t = 0; t < TRIALS; t++) {
  // Run in alternating order across trials to neutralize any thermal/GC bias.
  const first = t % 2 === 0 ? [legacyDeps, "legacy"] : [structuredDeps, "structured"];
  const second = t % 2 === 0 ? [structuredDeps, "structured"] : [legacyDeps, "legacy"];
  const r1 = await runBatch(first[0], bench, first[1]);
  const r2 = await runBatch(second[0], bench, second[1]);
  if (first[1] === "legacy") {
    legacyDurs.push(...r1.durations); legacyScore = r1.totalScore;
    structuredDurs.push(...r2.durations); structuredScore = r2.totalScore;
  } else {
    structuredDurs.push(...r1.durations); structuredScore = r1.totalScore;
    legacyDurs.push(...r2.durations); legacyScore = r2.totalScore;
  }
}

const L = summarize(legacyDurs);
const S = summarize(structuredDurs);

const rows = [
  ["metric", "legacy", "structured", "structured/legacy"],
  ["total (ms)", fmtMs(L.total), fmtMs(S.total), (S.total / L.total).toFixed(3) + "x"],
  ["mean (ms)", fmtMs(L.mean), fmtMs(S.mean), (S.mean / L.mean).toFixed(3) + "x"],
  ["median (ms)", fmtMs(L.median), fmtMs(S.median), (S.median / L.median).toFixed(3) + "x"],
  ["p95 (ms)", fmtMs(L.p95), fmtMs(S.p95), (S.p95 / L.p95).toFixed(3) + "x"],
  ["p99 (ms)", fmtMs(L.p99), fmtMs(S.p99), (S.p99 / L.p99).toFixed(3) + "x"],
  ["min (ms)", fmtMs(L.min), fmtMs(S.min), ""],
  ["max (ms)", fmtMs(L.max), fmtMs(S.max), ""],
];
const w = rows[0].map((_, c) => Math.max(...rows.map((r) => String(r[c]).length)));
for (const r of rows) {
  console.log(r.map((cell, c) => String(cell).padEnd(w[c])).join("  "));
}

console.log(
  `\nChecksums: legacy score sum=${legacyScore}, structured score sum=${structuredScore}, delta=${structuredScore - legacyScore}`,
);
const throughputL = (N * TRIALS) / (L.total / 1000);
const throughputS = (N * TRIALS) / (S.total / 1000);
console.log(
  `Throughput: legacy=${throughputL.toFixed(1)} runs/s, structured=${throughputS.toFixed(1)} runs/s`,
);
