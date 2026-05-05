/**
 * One-shot bootstrap for tests/suite.jsonl.
 *
 * Two phases:
 *   1. Random — N seeded 12-card contest loadouts for broad sampling.
 *   2. Sweep  — targeted loadouts that include every stage, skill card,
 *              p-item, and customization still uncovered after phase 1.
 *
 * The result is a committed suite that exercises every entity in the
 * catalog at least once by construction, not by luck. If coverage matters
 * more than sample size, raising N has diminishing returns — sweep fills
 * the tail cheaply.
 *
 * WARNING: this overwrites any existing suite.jsonl. Once the suite is in
 * place, prefer `regression:add` (individual loadouts) and
 * `test:regression:update` (refresh stored scores) — regeneration drops
 * hand-curated entries that were pinned for specific regression coverage.
 */
import { PItems, SkillCards, Stages, Customizations } from "gakumas-data";
import {
  loadSuite,
  loadoutFromQuery,
  runSuite,
  SUITE_PATH,
  writeSuite,
} from "./lib.mjs";

const N = parseInt(process.argv[2], 10) || 500;
const seedArg = process.argv.find((a) => a.startsWith("--seed="));
const SEED = seedArg ? parseInt(seedArg.split("=")[1], 10) : 1;

if (loadSuite().length) {
  console.error(
    `Refusing to overwrite existing ${SUITE_PATH}.\n` +
      `If you really want to regenerate, delete the file first.`,
  );
  process.exit(2);
}

// --- Pools ---

const STAGES = Stages.getAll().filter((s) => s.type === "contest" && !s.preview);
const CARDS = SkillCards.getAll();
const P_ITEMS = PItems.getAll().filter((p) => p.mode === "stage");
const CUSTOMIZATIONS = Customizations.getAll();
const matches = (entity, plan) => entity.plan === "free" || entity.plan === plan;

// --- Phase 1: seeded random ---

function mulberry32(a) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function buildRandomQuery(rand) {
  const pick = (a) => a[Math.floor(rand() * a.length)];
  const pickN = (a, k) => {
    const c = a.slice();
    const o = [];
    for (let i = 0; i < k && c.length; i++) {
      o.push(c.splice(Math.floor(rand() * c.length), 1)[0]);
    }
    return o;
  };
  const stage = pick(STAGES);
  const plan = stage.plan === "free" ? pick(["sense", "logic", "anomaly"]) : stage.plan;
  const picked = pickN(CARDS.filter((c) => matches(c, plan) && c.id > 0), 12).map((c) => c.id);
  while (picked.length < 12) picked.push(0);
  const cards1 = picked.slice(0, 6);
  const cards2 = picked.slice(6);
  const items = pickN(P_ITEMS.filter((p) => matches(p, plan)), 3).map((p) => p.id);
  while (items.length < 3) items.push(0);
  const c11ns = picked.map((id) => {
    if (!id || rand() > 0.5) return "";
    const avail = SkillCards.getById(id)?.availableCustomizations || [];
    if (!avail.length) return "";
    const c = pickN(avail, 1 + Math.floor(rand() * 2))
      .map((x) => `${x}x1`)
      .join("e");
    return c ? `e${c}` : "";
  });
  const total = 3500 + Math.floor(rand() * 2500);
  const shares = [rand(), rand(), rand()];
  const ssum = shares.reduce((a, b) => a + b, 0);
  const v = Math.round((shares[0] / ssum) * total);
  const d = Math.round((shares[1] / ssum) * total);
  const stamina = 30 + Math.floor(rand() * 21);
  return (
    `stage=${stage.id}&support_bonus=0.04&params=${v}-${d}-${total - v - d}-${stamina}` +
    `&items=${items.join("-")}&cards=${cards1.join("-")}_${cards2.join("-")}` +
    `&customizations=${c11ns.slice(0, 6).join("-")}_${c11ns.slice(6).join("-")}`
  );
}

// --- Phase 2: sweep ---

function coverageFor(entries) {
  const stages = new Set(), cards = new Set(), items = new Set(), c11ns = new Set();
  for (const entry of entries) {
    const l = loadoutFromQuery(entry.query);
    stages.add(l.stageId);
    for (const g of l.skillCardIdGroups) for (const id of g) if (id) cards.add(id);
    for (const id of l.pItemIds) if (id) items.add(id);
    for (const g of l.customizationGroups)
      for (const c of g)
        for (const k of Object.keys(c || {})) c11ns.add(parseInt(k, 10));
  }
  return { stages, cards, items, c11ns };
}

// Pick a concrete plan for any entity. "free" entities can slot into any
// plan; pick sense arbitrarily — the choice is deterministic so the suite
// stays reproducible.
function concretePlan(entity) {
  return entity.plan === "free" ? "sense" : entity.plan;
}

function buildSweepQuery({ stageId, cardIds, itemIds, customizationsByIndex }) {
  const cards1 = cardIds.slice(0, 6);
  const cards2 = cardIds.slice(6, 12);
  while (cards1.length < 6) cards1.push(0);
  while (cards2.length < 6) cards2.push(0);
  const items = itemIds.slice(0, 3);
  while (items.length < 3) items.push(0);
  const all = [...cards1, ...cards2];
  const c11nStrings = all.map((_, i) => {
    const c = customizationsByIndex?.[i];
    if (!c) return "";
    const parts = Object.entries(c).map(([cid, lvl]) => `${cid}x${lvl}`).join("e");
    return parts ? `e${parts}` : "";
  });
  return (
    `stage=${stageId}&support_bonus=0.04&params=1500-1500-1000-40` +
    `&items=${items.join("-")}&cards=${cards1.join("-")}_${cards2.join("-")}` +
    `&customizations=${c11nStrings.slice(0, 6).join("-")}_${c11nStrings.slice(6).join("-")}`
  );
}

// Fill cards/items for a given plan, optionally prepending a required card.
function fillLoadout(plan, { requiredCardId, requiredItemId } = {}) {
  const cardPool = CARDS.filter((c) => matches(c, plan) && c.id > 0);
  const itemPool = P_ITEMS.filter((p) => matches(p, plan));
  const cardIds = [];
  if (requiredCardId != null) cardIds.push(requiredCardId);
  for (const c of cardPool) {
    if (cardIds.length >= 12) break;
    if (c.id !== requiredCardId) cardIds.push(c.id);
  }
  const itemIds = [];
  if (requiredItemId != null) itemIds.push(requiredItemId);
  for (const p of itemPool) {
    if (itemIds.length >= 3) break;
    if (p.id !== requiredItemId) itemIds.push(p.id);
  }
  return { cardIds, itemIds };
}

function buildSweeps(missing) {
  const out = [];

  for (const stage of missing.stages) {
    const plan = concretePlan(stage);
    const { cardIds, itemIds } = fillLoadout(plan);
    out.push({
      id: `sweep-stage-${stage.id}`,
      query: buildSweepQuery({ stageId: stage.id, cardIds, itemIds }),
      note: `sweep: stage ${stage.id}`,
    });
  }

  for (const card of missing.cards) {
    const plan = concretePlan(card);
    const stage = STAGES.find((s) => matches(s, plan)) || STAGES[0];
    const { cardIds, itemIds } = fillLoadout(plan, { requiredCardId: card.id });
    out.push({
      id: `sweep-card-${card.id}`,
      query: buildSweepQuery({ stageId: stage.id, cardIds, itemIds }),
      note: `sweep: card ${card.id}`,
    });
  }

  for (const item of missing.items) {
    const plan = concretePlan(item);
    const stage = STAGES.find((s) => matches(s, plan)) || STAGES[0];
    const { cardIds, itemIds } = fillLoadout(plan, { requiredItemId: item.id });
    out.push({
      id: `sweep-item-${item.id}`,
      query: buildSweepQuery({ stageId: stage.id, cardIds, itemIds }),
      note: `sweep: item ${item.id}`,
    });
  }

  for (const c11n of missing.c11ns) {
    // Find any card that lists this customization as available.
    // `availableCustomizations` is a string array (comma-split CSV field),
    // so compare against the string form of the numeric id.
    const c11nKey = String(c11n.id);
    const hostCard = CARDS.find(
      (c) => c.id > 0 && (c.availableCustomizations || []).includes(c11nKey),
    );
    if (!hostCard) {
      console.warn(`  customization ${c11n.id} has no host card — skipped`);
      continue;
    }
    const plan = concretePlan(hostCard);
    const stage = STAGES.find((s) => matches(s, plan)) || STAGES[0];
    const { cardIds, itemIds } = fillLoadout(plan, { requiredCardId: hostCard.id });
    out.push({
      id: `sweep-c11n-${c11n.id}`,
      query: buildSweepQuery({
        stageId: stage.id,
        cardIds,
        itemIds,
        customizationsByIndex: { 0: { [c11n.id]: 1 } },
      }),
      note: `sweep: customization ${c11n.id} via card ${hostCard.id}`,
    });
  }

  return out;
}

// --- Run ---

console.log(`Phase 1 — seeded random: ${N} loadouts (seed=${SEED})`);
const rand = mulberry32(SEED);
const pad = String(N).length;
const draftRandom = [];
for (let i = 0; i < N; i++) {
  draftRandom.push({
    id: `seed${SEED}-${String(i + 1).padStart(pad, "0")}`,
    query: buildRandomQuery(rand),
    note: "random",
  });
}

const covered = coverageFor(draftRandom);
const missing = {
  stages: STAGES.filter((s) => !covered.stages.has(s.id)),
  cards: CARDS.filter((c) => c.id > 0 && !covered.cards.has(c.id)),
  items: P_ITEMS.filter((p) => !covered.items.has(p.id)),
  c11ns: CUSTOMIZATIONS.filter((c) => !covered.c11ns.has(c.id)),
};
const missingTotal =
  missing.stages.length + missing.cards.length + missing.items.length + missing.c11ns.length;
console.log(
  `  coverage after random: stages ${STAGES.length - missing.stages.length}/${STAGES.length}, ` +
    `cards ${CARDS.filter((c) => c.id > 0).length - missing.cards.length}/${CARDS.filter((c) => c.id > 0).length}, ` +
    `items ${P_ITEMS.length - missing.items.length}/${P_ITEMS.length}, ` +
    `customizations ${CUSTOMIZATIONS.length - missing.c11ns.length}/${CUSTOMIZATIONS.length}`,
);

console.log(`Phase 2 — sweep: ${missingTotal} targeted loadouts for uncovered entities`);
const draftSweep = buildSweeps(missing);

const draft = [...draftRandom, ...draftSweep];
console.log(`Phase 3 — scoring ${draft.length} loadouts...`);
const scored = await runSuite(draft, {
  onProgress: (done, total) => {
    if (done % 25 === 0 || done === total) {
      process.stdout.write(`  ${done}/${total}\r`);
    }
  },
});

const entries = scored.map(({ id, query, note, actual }) => ({
  id,
  query,
  score: actual,
  note,
}));
writeSuite(entries);
console.log(`\nWrote ${entries.length} entries to ${SUITE_PATH}`);
