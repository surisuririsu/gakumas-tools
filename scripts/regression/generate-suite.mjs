/**
 * One-shot bootstrap for scripts/regression/suite.jsonl.
 *
 * Generates N realistic 12-card contest loadouts from a seeded RNG, captures
 * each one's score under the current engine, and writes them to suite.jsonl.
 *
 * WARNING: this overwrites any existing suite.jsonl. Once the suite is in
 * place, prefer `regression:add` (to append individual loadouts) and
 * `test:regression:update` (to refresh stored scores) over regenerating
 * from scratch — regeneration loses provenance of any hand-curated loadouts
 * that were added for specific regression coverage.
 */
import { PItems, SkillCards, Stages } from "gakumas-data";
import { runSuite, writeSuite, loadSuite, SUITE_PATH } from "./lib.mjs";

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

function mulberry32(a) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(SEED);
const pick = (a) => a[Math.floor(rand() * a.length)];
const pickN = (a, k) => {
  const c = a.slice();
  const o = [];
  for (let i = 0; i < k && c.length; i++) {
    o.push(c.splice(Math.floor(rand() * c.length), 1)[0]);
  }
  return o;
};

const STAGES = Stages.getAll().filter((s) => s.type === "contest" && !s.preview);
const CARDS = SkillCards.getAll();
const P_ITEMS = PItems.getAll().filter((p) => p.mode === "stage");
const matches = (card, plan) => card.plan === "free" || card.plan === plan;

function buildQuery() {
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

console.log(`Bootstrapping ${N} loadouts with seed=${SEED}...`);
const pad = String(N).length;
const draft = [];
for (let i = 0; i < N; i++) {
  draft.push({
    id: `seed${SEED}-${String(i + 1).padStart(pad, "0")}`,
    query: buildQuery(),
    note: "bootstrap",
  });
}

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
