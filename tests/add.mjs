/**
 * Append a single loadout to suite.jsonl with its captured score.
 *
 * Use this when a user reports a regression — add the failing query as a
 * pinned test so a future refactor can't re-break the same case.
 *
 *   pnpm regression:add "<query>" --id=<id> [--note="<text>"]
 */
import { loadSuite, runQuery, writeSuite, silenceConsole, SUITE_PATH } from "./lib.mjs";

const positional = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const query = positional[0];
const idArg = process.argv.find((a) => a.startsWith("--id="));
const noteArg = process.argv.find((a) => a.startsWith("--note="));
const id = idArg ? idArg.slice("--id=".length) : null;
const note = noteArg ? noteArg.slice("--note=".length) : "";

if (!query || !id) {
  console.error(
    'Usage: pnpm regression:add "<query>" --id=<id> [--note="<text>"]',
  );
  process.exit(2);
}

const suite = loadSuite();
if (suite.some((e) => e.id === id)) {
  console.error(`ID "${id}" already exists in ${SUITE_PATH}.`);
  process.exit(2);
}

const restore = silenceConsole();
let score;
try {
  score = await runQuery(query);
} finally {
  restore();
}

suite.push({ id, query, score, note });
writeSuite(suite);
console.log(`Added ${id}: score=${score}`);
