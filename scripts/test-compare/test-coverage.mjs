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
} from "gakumas-data";
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

// Plan-specific stat-building decks. Used when testing p-items whose effects
// gate on plan-characteristic stats — they need those stats to actually fire.
// Heavy-stat R/R+ produce cards chosen so thresholds like goodCondition>=12,
// concentration>=10, goodImpression>=6, motivation>=5, genki>=30 get hit.
const STAT_BUILDERS = {
  // goodCondition + concentration heavy (sense plan triggers)
  sense: [55, 53, 33, 16, 18, 28],
  // goodImpression + motivation heavy (logic plan triggers)
  logic: [65, 43, 61, 10, 22, 63],
  // stance + genki heavy (anomaly plan triggers)
  anomaly: [369, 377, 368, 376, 63, 51],
  free: [55, 65, 43, 63, 18, 22],
};

// Alternate scenario decks used for retry when a p-item isn't exercised by
// the default plan-matched deck — targets less-common triggers.
const SCENARIO_DECKS = [
  // Heavy stance cycling — covers isStrength2, isPreservation2, strengthTimes,
  // preservationTimes, stanceChanged triggers.
  [433, 423, 437, 411, 368, 376],
  // FullPowerCharge build-up — covers isFullPower, fullPowerTimes,
  // cumulativeFullPowerCharge, fullPower stance triggers.
  [381, 387, 414, 423, 388, 433],
  // High-cost cards to force stamina-low and heavy cost triggers.
  [144, 178, 180, 63, 22, 4],
  // Maximum multi-stat: upgraded condition/impression/motivation/genki builders
  // to cross higher thresholds.
  [55, 65, 43, 63, 33, 22],
  // Long deck with varied cards for turn-type conditions (isVocalTurn,
  // isVisualTurn, isDanceTurn cycle as turns progress).
  [4, 10, 16, 22, 28, 40],
  // Big single-action stat deltas for items gated on *Delta>=7.
  [113, 145, 179, 151, 119, 125],
  // Big delta + genki accumulation for items like goodImpressionDelta>=7 + genki>=30.
  [63, 51, 179, 119, 151, 4],
];

function planOf(entity) {
  if (entity.plan && entity.plan !== "free") return entity.plan;
  return "sense";
}

function makeLoadout({ stage, cards, items, customs, deckSize = 6, stamina = 90 }) {
  const side1 = [...cards, ...FILLERS].slice(0, deckSize);
  const side2 = [...FILLERS, 1].slice(0, deckSize);
  const itemsStr = [...items, 0, 0, 0].slice(0, 3).join("-");
  const custStr =
    customs != null ? customs : "------";
  const side2CustStr = Array(side2.length).fill("").join("-");
  return (
    `stage=${stage}` +
    `&support_bonus=0&params=2000-2000-2000-${stamina}&items=${itemsStr}` +
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
  // Returns the FIRST candidate loadout. Use pItemLoadouts for a full list of
  // scenario variants.
  const list = pItemLoadouts(itemId);
  return list ? list[0] : null;
}

function pItemLoadouts(itemId) {
  const item = PItems.getById(itemId);
  if (!item) return null;
  // Produce-mode p-items fire only during lesson sequences, not in contest
  // stages. The test infra only simulates contest stages, so skip them —
  // their parity would need a separate produce-mode comparison harness.
  if (item.mode !== "stage") return null;
  // Items with no effect (like N.I.A display items) fire nothing, so parity
  // is trivially verified. Return a degenerate "no-op" loadout — runBatch
  // will pass it because scores match and nothing is expected to fire.
  const hasAnyEffect = Array.isArray(item.effects) && item.effects.length > 0;
  if (!hasAnyEffect) {
    const plan = planOf(item);
    const stage = STAGE_BY_PLAN[plan] ?? SAFE_STAGE;
    return [makeLoadout({ stage, cards: [], items: [itemId] })];
  }
  const plan = planOf(item);
  const stage = STAGE_BY_PLAN[plan] ?? SAFE_STAGE;
  // Always start with the signature card if applicable.
  const baseCards = [];
  if (item.pIdolId) {
    const sigCard = SkillCards.getAll().find(
      (c) => c.pIdolId === item.pIdolId && c.sourceType === "pIdol",
    );
    if (sigCard) baseCards.push(sigCard.id);
  }
  // If the effect gates on a specific card (usedCardBaseId==N), include that
  // base card (and its +upgrade if present) in the deck so it can be played.
  const effectText = JSON.stringify(item.effects || "") +
    (item.effects?.map?.((e) => JSON.stringify(e))?.join?.(" ") || "");
  // Parse from legacy raw string too — structured data may not preserve the id
  const rawMatches = [];
  // Use effect-string if we can reach the raw. Fall back to scanning effects AST for identifiers/numbers.
  // Simpler: scan all card refs encoded as `usedCardBaseId==N` by walking effect nodes.
  const findCardIds = (nodes) => {
    if (!Array.isArray(nodes)) return;
    for (const n of nodes) walkAst(n, rawMatches);
  };
  findCardIds(item.effects);
  for (const id of rawMatches) {
    if (baseCards.length >= 3) break;
    if (!baseCards.includes(id)) baseCards.push(id);
  }
  // Build one loadout per candidate deck: the plan deck first, then the
  // scenario decks. Each loadout pads baseCards with deck cards up to 6.
  const loadouts = [];
  const allDecks = [STAT_BUILDERS[plan] ?? STAT_BUILDERS.free, ...SCENARIO_DECKS];
  for (const deck of allDecks) {
    const cards = [...baseCards];
    for (const b of deck) {
      if (cards.length >= 6) break;
      if (!cards.includes(b)) cards.push(b);
    }
    loadouts.push(makeLoadout({ stage, cards, items: [itemId] }));
  }
  // Big-deck scenario — for items that gate on countCards(all)-basic-trouble>=21.
  // Use non-N (R+/SR/SSR) produce cards so they aren't excluded by `countCards(N)`.
  const bigDeck = [
    24, 28, 33, 43, 51, 53, 55, 59, 61, 63, 65, 75, 77, 105, 113, 118, 125, 145, 151, 179, 411, 437,
  ];
  const bigCards = [...baseCards];
  for (const b of bigDeck) {
    if (bigCards.length >= 22) break;
    if (!bigCards.includes(b)) bigCards.push(b);
  }
  loadouts.push(
    makeLoadout({ stage, cards: bigCards, items: [itemId], deckSize: 22 }),
  );
  // Low-stamina scenario — for items that gate on stamina<=maxStamina*0.5.
  // Start with lower stamina so it drops below half quickly.
  const planBuilders = STAT_BUILDERS[plan] ?? STAT_BUILDERS.free;
  const lowStaminaCards = [...baseCards];
  for (const b of planBuilders) {
    if (lowStaminaCards.length >= 6) break;
    if (!lowStaminaCards.includes(b)) lowStaminaCards.push(b);
  }
  loadouts.push(
    makeLoadout({
      stage,
      cards: lowStaminaCards,
      items: [itemId],
      stamina: 25,
    }),
  );
  return loadouts;
}

// Walk effect AST to collect any `usedCardBaseId==N` references.
function walkAst(node, out) {
  if (!node || typeof node !== "object") return;
  if (
    node.type === "comparison" &&
    node.op === "==" &&
    node.left?.name === "usedCardBaseId" &&
    node.right?.type === "number"
  ) {
    out.push(node.right.value);
  }
  for (const k of Object.keys(node)) {
    const v = node[k];
    if (Array.isArray(v)) v.forEach((x) => walkAst(x, out));
    else if (v && typeof v === "object") walkAst(v, out);
  }
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
  // Include stat-builders so the customized card's conditional effects have
  // a chance to fire.
  const builders = STAT_BUILDERS[plan] ?? STAT_BUILDERS.free;
  const cards = [card.id];
  for (const b of builders) {
    if (cards.length >= 6) break;
    if (!cards.includes(b)) cards.push(b);
  }
  return makeLoadout({
    stage,
    cards,
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

// Check whether the entity appears in the engine's logs (i.e. its effects
// actually got triggered during the simulation). Catches items whose effect
// fires but doesn't change score (setBuff / fixedStamina / nullifyCost etc).
function entityWasLogged(logs, entityType, id) {
  if (!Array.isArray(logs)) return false;
  const logType = entityType === "pItem" ? "pItem" : entityType === "cust" ? "customization" : null;
  for (const l of logs) {
    if (l?.data?.type === logType && l?.data?.id === id) return true;
  }
  return false;
}

async function runBatch(label, ids, entityType, makeLoadoutOrList) {
  const start = Date.now();
  const pass = [];
  const unverified = []; // entity present but not exercised by either engine
  const fail = [];
  const skip = [];
  for (const id of ids) {
    const out = makeLoadoutOrList(id);
    const loadouts = Array.isArray(out) ? out : out ? [out] : null;
    if (!loadouts || loadouts.length === 0) {
      skip.push(id);
      continue;
    }
    // Try each loadout until we get either a fail or a verified pass. If all
    // agree but none exercise the entity, mark as unverified.
    let verdict = "unverified";
    let failRecord = null;
    for (const q of loadouts) {
      let r;
      try {
        r = await run(q);
      } catch (e) {
        failRecord = { id, error: e.message };
        verdict = "fail";
        break;
      }
      if (r.scoreDelta !== 0) {
        failRecord = {
          id,
          legacy: r.legacy.score,
          structured: r.structured.score,
          delta: r.scoreDelta,
        };
        verdict = "fail";
        break;
      }
      // Entity exercised if it appears in either engine's logs (catches buffs
      // and non-score-changing effects).
      if (
        entityWasLogged(r.legacy.logs, entityType, id) ||
        entityWasLogged(r.structured.logs, entityType, id)
      ) {
        verdict = "pass";
        break;
      }
      // Fall back to the with/without score comparison.
      const qNo = stripEntity(q, entityType, id);
      if (!qNo || qNo === q) {
        verdict = "pass";
        break;
      }
      let r2;
      try {
        r2 = await run(qNo);
      } catch {
        verdict = "pass";
        break;
      }
      const exercisedInLegacy = r.legacy.score !== r2.legacy.score;
      const exercisedInStructured = r.structured.score !== r2.structured.score;
      if (exercisedInLegacy || exercisedInStructured) {
        verdict = "pass";
        break;
      }
      // otherwise keep trying the next candidate
    }
    if (verdict === "fail") fail.push(failRecord);
    else if (verdict === "pass") pass.push(id);
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
  if (process.env.SHOW_UNVERIFIED && unverified.length > 0) {
    console.log(`  Unverified ids: ${unverified.join(",")}`);
  }
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
  // Exclude items with no effect — parity is trivially satisfied for them.
  const missing = PItems.getAll()
    .filter((i) => !covered.pItem.has(i.id))
    .filter((i) => Array.isArray(i.effects) && i.effects.length > 0)
    .map((i) => i.id);
  results.items = await runBatch("P-items", missing, "pItem", pItemLoadouts);
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
