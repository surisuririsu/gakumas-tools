/**
 * Reports which stages / skill cards / p-items / customizations appear
 * somewhere in suite.jsonl, against the full catalog in gakumas-data.
 *
 * Orphaned customizations — ids present in the catalog but not listed as
 * `availableCustomizations` on any skill card — are unreachable through
 * the loadout query format, so they're reported separately rather than
 * counted as a coverage miss.
 *
 * Use this to spot entities the regression suite never exercises.
 */
import { PItems, SkillCards, Stages, Customizations } from "gakumas-data";
import { loadSuite, loadoutFromQuery } from "./lib.mjs";

const suite = loadSuite();
const seenStages = new Set();
const seenCards = new Set();
const seenItems = new Set();
const seenCustomizations = new Set();

for (const entry of suite) {
  const l = loadoutFromQuery(entry.query);
  seenStages.add(l.stageId);
  for (const g of l.skillCardIdGroups) for (const id of g) if (id) seenCards.add(id);
  for (const id of l.pItemIds) if (id) seenItems.add(id);
  for (const g of l.customizationGroups)
    for (const c of g)
      for (const k of Object.keys(c || {})) seenCustomizations.add(parseInt(k, 10));
}

const STAGES = Stages.getAll().filter((s) => s.type === "contest" && !s.preview);
const CARDS = SkillCards.getAll().filter((c) => c.id > 0);
const P_ITEMS = PItems.getAll().filter((p) => p.mode === "stage");
const CUSTOMIZATIONS = Customizations.getAll();

// A customization is "reachable" only if at least one card lists it in
// availableCustomizations — otherwise loadouts can't encode it.
// availableCustomizations is a comma-split string array, not numeric, so
// normalize to numbers for comparison with Customizations[i].id.
const availableCustomizationIds = new Set();
for (const card of CARDS) {
  for (const cid of card.availableCustomizations || []) {
    availableCustomizationIds.add(parseInt(cid, 10));
  }
}
const REACHABLE_CUSTOMIZATIONS = CUSTOMIZATIONS.filter((c) =>
  availableCustomizationIds.has(c.id),
);
const ORPHAN_CUSTOMIZATIONS = CUSTOMIZATIONS.filter(
  (c) => !availableCustomizationIds.has(c.id),
);

function report(label, seen, all) {
  const total = all.length;
  const covered = all.filter((e) => seen.has(e.id));
  const missing = all.filter((e) => !seen.has(e.id));
  const pct = total ? ((covered.length / total) * 100).toFixed(1) : "—";
  console.log(`${label}: ${covered.length}/${total} (${pct}%)`);
  if (missing.length && missing.length <= 40) {
    console.log(
      `  missing: ${missing.map((m) => `${m.id}${m.name ? `(${m.name})` : ""}`).join(", ")}`,
    );
  } else if (missing.length) {
    console.log(`  ${missing.length} missing (first 20 ids: ${missing.slice(0, 20).map((m) => m.id).join(", ")})`);
  }
}

console.log(`Suite size: ${suite.length} loadouts`);
report("Stages (contest)", seenStages, STAGES);
report("Skill cards", seenCards, CARDS);
report("P-items (stage)", seenItems, P_ITEMS);
report("Customizations (reachable)", seenCustomizations, REACHABLE_CUSTOMIZATIONS);
if (ORPHAN_CUSTOMIZATIONS.length) {
  console.log(
    `Customizations (orphan, unreachable via loadout): ${ORPHAN_CUSTOMIZATIONS.length}`,
  );
  console.log(
    `  ${ORPHAN_CUSTOMIZATIONS.map((c) => `${c.id}${c.name ? `(${c.name})` : ""}`).join(", ")}`,
  );
}

const totalReachable =
  STAGES.length + CARDS.length + P_ITEMS.length + REACHABLE_CUSTOMIZATIONS.length;
const totalCovered =
  STAGES.filter((s) => seenStages.has(s.id)).length +
  CARDS.filter((c) => seenCards.has(c.id)).length +
  P_ITEMS.filter((p) => seenItems.has(p.id)).length +
  REACHABLE_CUSTOMIZATIONS.filter((c) => seenCustomizations.has(c.id)).length;

if (totalCovered < totalReachable) {
  console.log(
    `\nGap: ${totalReachable - totalCovered} reachable entities not covered.`,
  );
  process.exit(1);
}
console.log(`\nFull reachable coverage.`);
