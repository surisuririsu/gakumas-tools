/**
 * Fuzz-generates random realistic loadouts and flags any score divergence
 * between the legacy and structured engines. Because both engines share the
 * same simulation contract, any delta is a real bug — either data drift
 * between the two CSV packages or an engine porting bug.
 *
 * Usage (from repo root):
 *   yarn test:fuzz [N] [--seed=S]
 *
 * N defaults to 500. Failing queries are written to
 *   scripts/test-compare/fuzz-failures.txt
 * in test-urls.txt format so they can be fed back into `yarn test:compare`
 * for targeted investigation. The file is truncated at the start of each
 * run so it always reflects the latest fuzz output.
 */
import { writeFileSync } from "node:fs";
import { PItems, SkillCards, Stages } from "gakumas-data-structured";
import { compareEngines, loadoutFromQuery } from "./compare-engines.mjs";
import { resetRand as resetLegacy } from "gakumas-engine";
import { resetRand as resetStructured } from "gakumas-engine/structured";

const FAILURES_PATH = new URL("./fuzz-failures.txt", import.meta.url);

const N = parseInt(process.argv[2], 10) || 500;

// Deterministic PRNG so runs are reproducible. Seeded from the first
// process argument after N — pass `--seed=<n>` or rely on the default.
const seedArg = process.argv.find((a) => a.startsWith("--seed="));
const SEED = seedArg ? parseInt(seedArg.split("=")[1], 10) : 1;
const rand = mulberry32(SEED);
function mulberry32(a) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function pick(arr) {
  return arr[Math.floor(rand() * arr.length)];
}
function pickN(arr, n) {
  const copy = arr.slice();
  const out = [];
  for (let i = 0; i < n && copy.length; i++) {
    const j = Math.floor(rand() * copy.length);
    out.push(copy.splice(j, 1)[0]);
  }
  return out;
}

// Silence noisy per-run logs from the engines; only surface our fuzz output.
const origConsole = { ...console };
const noop = () => {};
async function compareQuiet(q) {
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

// --- Pool: filter out preview/link stages + cards/items that won't help ---

const STAGES = Stages.getAll().filter(
  (s) => s.type === "contest" && !s.preview,
);
const CARDS = SkillCards.getAll();
const P_ITEMS = PItems.getAll().filter((p) => p.mode === "stage");

function stageMatchesPlan(card, plan) {
  return card.plan === "free" || card.plan === plan;
}

function buildQuery() {
  const stage = pick(STAGES);
  const plan = stage.plan === "free" ? pick(["sense", "logic", "anomaly"]) : stage.plan;

  // Cards: 6 slots. Plan-compatible.
  const cardPool = CARDS.filter((c) => stageMatchesPlan(c, plan) && c.id > 0);
  const cards = pickN(cardPool, 6).map((c) => c.id);
  while (cards.length < 6) cards.push(0);

  // P-items: 4 slots. Plan-compatible.
  const itemPool = P_ITEMS.filter((p) => stageMatchesPlan(p, plan));
  const items = pickN(itemPool, 4).map((p) => p.id);
  while (items.length < 4) items.push(0);

  // Customizations: 50% chance per card, 1–2 per card.
  const customizations = cards.map((id) => {
    if (!id || rand() > 0.5) return "";
    const card = SkillCards.getById(id);
    const avail = card?.availableCustomizations || [];
    if (!avail.length) return "";
    const c11n = pickN(avail, 1 + Math.floor(rand() * 2))
      .map((cid) => `${cid}x1`)
      .join("e");
    return c11n ? `e${c11n}` : "";
  });

  // Params — spread across vocal/dance/visual with stamina 30–50.
  const total = 3500 + Math.floor(rand() * 2500);
  const shares = [rand(), rand(), rand()];
  const ssum = shares.reduce((a, b) => a + b, 0);
  const vocal = Math.round((shares[0] / ssum) * total);
  const dance = Math.round((shares[1] / ssum) * total);
  const visual = total - vocal - dance;
  const stamina = 30 + Math.floor(rand() * 21);

  return (
    `stage=${stage.id}` +
    `&support_bonus=0.04` +
    `&params=${vocal}-${dance}-${visual}-${stamina}` +
    `&items=${items.join("-")}` +
    `&cards=${cards.join("-")}` +
    `&customizations=${customizations.join("-")}`
  );
}

// --- Run ---

console.log(`Fuzz: ${N} loadouts, seed=${SEED}`);
const failures = [];
let passed = 0;
let errored = 0;

for (let i = 0; i < N; i++) {
  const q = buildQuery();
  let result;
  try {
    result = await compareQuiet(q);
  } catch (err) {
    errored++;
    console.log(`ERROR ${i + 1}: ${err.message}\n  ${q}`);
    continue;
  }
  if (result.scoreDelta === 0) {
    passed++;
  } else {
    failures.push({
      index: i + 1,
      legacy: result.legacy.score,
      structured: result.structured.score,
      delta: result.scoreDelta,
      query: q,
    });
  }
  if ((i + 1) % 50 === 0) {
    process.stdout.write(
      `  ${i + 1}/${N}: ${passed} pass, ${failures.length} fail, ${errored} error\n`,
    );
  }
}

console.log(
  `\nResults: ${passed}/${N} passed, ${failures.length} failed, ${errored} errored\n`,
);

// Always write the file — empty-with-header when clean, populated when not.
const header = [
  `# Fuzz failures from seed=${SEED}, N=${N}`,
  `# ${failures.length} failures / ${N} runs / ${errored} errors`,
  `# Each non-comment line is a test-urls.txt-compatible query string.`,
  `# Prefix comments show legacy/structured/delta for context.`,
  "",
];
const body = failures.flatMap((f) => [
  `# legacy=${f.legacy} structured=${f.structured} delta=${f.delta}`,
  f.query,
]);
writeFileSync(FAILURES_PATH, [...header, ...body, ""].join("\n"));
console.log(`Failures written to ${FAILURES_PATH.pathname}`);

if (failures.length) {
  console.log(
    `\nTriage tip: sort by |delta| ascending — smallest divergences are usually localized bugs.`,
  );
  process.exit(1);
}
