/**
 * Run the regression suite.
 *
 *   yarn test:regression              # compare current engine to stored scores
 *   yarn test:regression:update       # rewrite stored scores (use after
 *                                     # an intentional scoring change)
 *
 * Exit 0 on full match, 1 on any mismatch (unless --update is passed).
 */
import { loadSuite, runSuite, writeSuite, SUITE_PATH } from "./lib.mjs";

const UPDATE = process.argv.includes("--update");

const suite = loadSuite();
if (!suite.length) {
  console.error(
    `Suite is empty. Run \`yarn regression:bootstrap\` to seed ${SUITE_PATH}.`,
  );
  process.exit(2);
}

console.log(
  `${UPDATE ? "Updating" : "Checking"} ${suite.length} loadouts against structured engine...`,
);
const results = await runSuite(suite, {
  onProgress: (done, total) => {
    if (done % 50 === 0 || done === total) {
      process.stdout.write(`  ${done}/${total}\r`);
    }
  },
});

const mismatches = [];
for (const r of results) {
  if (r.actual !== r.score) {
    mismatches.push({ id: r.id, expected: r.score, actual: r.actual, delta: r.actual - r.score });
  }
}

console.log(
  `\n${results.length - mismatches.length}/${results.length} match, ${mismatches.length} mismatch`,
);

if (mismatches.length) {
  console.log("\nMismatches:");
  for (const m of mismatches) {
    const sign = m.delta > 0 ? "+" : "";
    console.log(`  ${m.id.padEnd(20)}  expected=${m.expected}  actual=${m.actual}  (${sign}${m.delta})`);
  }
}

if (UPDATE) {
  if (!mismatches.length) {
    console.log("No changes — suite.jsonl untouched.");
    process.exit(0);
  }
  const updated = results.map(({ id, query, note, actual }) => ({
    id,
    query,
    score: actual,
    note,
  }));
  writeSuite(updated);
  console.log(`Wrote updated scores for ${mismatches.length} entries.`);
  process.exit(0);
}

process.exit(mismatches.length ? 1 : 0);
