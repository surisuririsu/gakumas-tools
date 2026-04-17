/**
 * Broad parity coverage for legacy vs. structured engines.
 *
 * For every entity (skill card, p-item, stage, customization) that isn't
 * exercised by the existing test-urls.txt loadouts, generates a minimal
 * synthetic loadout that includes it, runs both engines with RNG reset,
 * and flags any score divergence.
 *
 * Usage (run from repo root):
 *   yarn test:coverage              # run everything
 *   yarn test:coverage cards        # run just one entity type
 *   yarn test:coverage items
 *   yarn test:coverage stages
 *   yarn test:coverage customizations
 */
import { readFile } from "node:fs/promises";
import {
  SkillCards,
  PItems,
  Stages,
  Customizations,
} from "gakumas-data-structured";
import {
  compareEngines,
  loadoutFromQuery,
} from "./compare-engines.mjs";
import { resetRand as resetLegacy } from "gakumas-engine";
import { resetRand as resetStructured } from "gakumas-engine/structured";

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

// ===== Load existing coverage =====

const text = await readFile(
  new URL("./test-urls.txt", import.meta.url),
  "utf8",
);
const existingUrls = text
  .split(/\r?\n/)
  .map((s) => s.trim())
  .filter(Boolean);
const covered = {
  card: new Set(),
  pItem: new Set(),
  stage: new Set(),
  cust: new Set(),
};
for (const url of existingUrls) {
  const q = new URLSearchParams(url);
  covered.stage.add(parseInt(q.get("stage"), 10));
  for (const id of (q.get("cards") || "").replace(/_/g, "-").split("-")) {
    const n = parseInt(id, 10);
    if (n) covered.card.add(n);
  }
  for (const id of (q.get("items") || "").split("-")) {
    const n = parseInt(id, 10);
    if (n) covered.pItem.add(n);
  }
  const custs = (q.get("customizations") || "").replace(/_/g, "-");
  for (const [, id] of custs.matchAll(/(\d+)x\d+/g))
    covered.cust.add(parseInt(id, 10));
}

// ===== Loadout generators =====

// Pick one usable stage per plan
const STAGE_BY_PLAN = (() => {
  const byPlan = {};
  for (const s of Stages.getAll()) {
    if (s.type !== "contest") continue;
    if (byPlan[s.plan]) continue;
    byPlan[s.plan] = s.id;
  }
  return byPlan;
})();

// Safe filler cards: basic score cards 1..5 (no conditions, no dependencies)
const FILLERS = [1, 2, 3, 4, 5];
const SAFE_STAGE = STAGE_BY_PLAN.sense ?? Stages.getAll().find((s) => s.type === "contest")?.id;

function planOf(entity) {
  if (entity.plan && entity.plan !== "free") return entity.plan;
  return "sense";
}

function makeLoadout({ stage, cards, items, customs }) {
  const side1 = [...cards, ...FILLERS].slice(0, 6);
  const side2 = [...FILLERS, 1].slice(0, 6);
  const itemsStr = [...items, 0, 0, 0].slice(0, 3).join("-");
  const custStr =
    customs != null ? customs : "------";
  const side2CustStr = "------";
  return (
    `stage=${stage}` +
    `&support_bonus=0&params=1500-1500-1500-45&items=${itemsStr}` +
    `&cards=${side1.join("-")}_${side2.join("-")}` +
    `&customizations=${custStr}_${side2CustStr}`
  );
}

function skillCardLoadout(cardId) {
  const card = SkillCards.getById(cardId);
  if (!card) return null;
  // Trouble cards aren't picked by player; stage effects insert them.
  if (card.type === "trouble") return null;
  const plan = planOf(card);
  const stage = STAGE_BY_PLAN[plan] ?? SAFE_STAGE;
  return makeLoadout({ stage, cards: [cardId], items: [] });
}

function pItemLoadout(itemId) {
  const item = PItems.getById(itemId);
  if (!item) return null;
  const plan = planOf(item);
  const stage = STAGE_BY_PLAN[plan] ?? SAFE_STAGE;
  // If it's a signature item, include a signature card for the same pIdol so
  // the pIdol is inferred and the item's context matches the game's intent.
  const cards = [];
  if (item.pIdolId) {
    const sigCard = SkillCards.getAll().find(
      (c) => c.pIdolId === item.pIdolId && c.sourceType === "pIdol",
    );
    if (sigCard) cards.push(sigCard.id);
  }
  return makeLoadout({ stage, cards, items: [itemId] });
}

function stageLoadout(stageId) {
  const stage = Stages.getById(stageId);
  if (!stage) return null;
  // linkContest stages need linkConfigs that the test infra doesn't provide.
  if (stage.type === "linkContest") return null;
  return makeLoadout({ stage: stageId, cards: [], items: [] });
}

function customizationLoadout(custId) {
  const cust = Customizations.getById(custId);
  if (!cust) return null;
  // Find a skill card that actually supports this customization
  const card = SkillCards.getAll().find((c) =>
    c.availableCustomizations?.includes(String(custId)),
  );
  if (!card) return null;
  const plan = planOf(card);
  const stage = STAGE_BY_PLAN[plan] ?? SAFE_STAGE;
  const level = Array.isArray(cust.price) ? cust.price.length : 1;
  return makeLoadout({
    stage,
    cards: [card.id],
    items: [],
    customs: `${custId}x${level}-----`,
  });
}

// ===== Runner =====

// Strip the entity from a loadout so we can compare with/without it and
// verify the entity is actually exercised (not just silently ignored).
function stripEntity(q, entityType, id) {
  switch (entityType) {
    case "card": {
      // Replace occurrences of `${id}` in cards= with 0, preserving separators.
      return q.replace(/(cards=)([^&]*)/, (_, pfx, rest) => {
        const replaced = rest
          .split("_")
          .map((grp) =>
            grp
              .split("-")
              .map((s) => (parseInt(s, 10) === id ? "0" : s))
              .join("-"),
          )
          .join("_");
        return pfx + replaced;
      });
    }
    case "pItem": {
      return q.replace(/(items=)([^&]*)/, (_, pfx, rest) =>
        pfx +
        rest
          .split("-")
          .map((s) => (parseInt(s, 10) === id ? "0" : s))
          .join("-"),
      );
    }
    case "cust": {
      // Remove customization like 42x3 from the customizations field
      return q.replace(new RegExp(`${id}x\\d+`, "g"), "");
    }
    case "stage":
      // No meaningful "strip" for a stage — the whole run is the stage.
      return null;
  }
  return null;
}

async function runBatch(label, ids, entityType, makeLoadout) {
  const start = Date.now();
  const pass = [];
  const unverified = []; // entity present but not exercised by either engine
  const fail = [];
  const skip = [];
  for (const id of ids) {
    const q = makeLoadout(id);
    if (!q) {
      skip.push(id);
      continue;
    }
    let r;
    try {
      r = await run(q);
    } catch (e) {
      fail.push({ id, error: e.message });
      continue;
    }
    if (r.scoreDelta !== 0) {
      fail.push({
        id,
        legacy: r.legacy.score,
        structured: r.structured.score,
        delta: r.scoreDelta,
      });
      continue;
    }
    // Scores matched — but verify the entity actually did something.
    const qNo = stripEntity(q, entityType, id);
    if (!qNo || qNo === q) {
      pass.push(id);
      continue;
    }
    let r2;
    try {
      r2 = await run(qNo);
    } catch {
      pass.push(id);
      continue;
    }
    const exercisedInLegacy = r.legacy.score !== r2.legacy.score;
    const exercisedInStructured = r.structured.score !== r2.structured.score;
    if (exercisedInLegacy || exercisedInStructured) pass.push(id);
    else unverified.push(id);
  }
  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  console.log(
    `\n== ${label}: ${pass.length} pass, ${fail.length} fail, ${unverified.length} unverified, ${skip.length} skip (${elapsed}s) ==`,
  );
  for (const f of fail.slice(0, 30)) {
    if (f.error) console.log(`  ✗ id ${f.id}: ERROR ${f.error}`);
    else
      console.log(
        `  ✗ id ${f.id}: legacy=${f.legacy} structured=${f.structured} delta=${f.delta}`,
      );
  }
  if (fail.length > 30) console.log(`  ... and ${fail.length - 30} more failures`);
  return {
    pass: pass.length,
    fail: fail.length,
    unverified: unverified.length,
    unverifiedIds: unverified,
    skip: skip.length,
  };
}

// ===== Main =====

const mode = process.argv[2] || "all";
const results = {};

if (mode === "all" || mode === "cards") {
  const missing = SkillCards.getAll()
    .filter((c) => !covered.card.has(c.id))
    .map((c) => c.id);
  results.cards = await runBatch("Skill cards", missing, "card", skillCardLoadout);
}

if (mode === "all" || mode === "items") {
  const missing = PItems.getAll()
    .filter((i) => !covered.pItem.has(i.id))
    .map((i) => i.id);
  results.items = await runBatch("P-items", missing, "pItem", pItemLoadout);
}

if (mode === "all" || mode === "stages") {
  const missing = Stages.getAll()
    .filter((s) => !covered.stage.has(s.id))
    .map((s) => s.id);
  results.stages = await runBatch("Stages", missing, "stage", stageLoadout);
}

if (mode === "all" || mode === "customizations") {
  const missing = Customizations.getAll()
    .filter((c) => !covered.cust.has(c.id))
    .map((c) => c.id);
  results.customizations = await runBatch(
    "Customizations",
    missing,
    "cust",
    customizationLoadout,
  );
}

const totalFail = Object.values(results).reduce((a, r) => a + r.fail, 0);
console.log(`\n== Summary ==`);
for (const [k, v] of Object.entries(results)) {
  console.log(
    `  ${k}: ${v.pass} pass, ${v.fail} fail, ${v.unverified ?? 0} unverified, ${v.skip} skip`,
  );
}
console.log(
  `\nUnverified = entity present in loadout but not exercised by either engine.`,
);
console.log(
  `  These are parity-inconclusive: scores matched, but we can't tell if the entity is buggy.`,
);
console.log(
  `  To verify, craft a loadout where the entity's trigger conditions are met.`,
);
process.exit(totalFail > 0 ? 1 : 0);
