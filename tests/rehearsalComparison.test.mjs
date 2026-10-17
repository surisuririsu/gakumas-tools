import { test } from "node:test";
import assert from "node:assert/strict";
import {
  cellScores,
  compareScores,
  validateComparison,
} from "../gakumas-tools/utils/rehearsalComparison.js";

const row = (scores, flags = ["ok", "ok", "ok"]) => ({ scores, flags });

test("cellScores reads one stage/slot and skips flagged stages and zeros", () => {
  const rows = [
    row([[10, 20, 30], [40, 50, 60], [70, 80, 90]]),
    row([[11, 0, 31], [41, 51, 61], [71, 81, 91]]),
    row([[12, 22, 32], [42, 52, 62], [72, 82, 92]], ["ok", "flagged", "ok"]),
  ];
  assert.deepEqual(cellScores(rows, 0, 1), [20, 22]);
  assert.deepEqual(cellScores(rows, 1, 2), [60, 61]);
});

test("compareScores reports the simulator's gap relative to rehearsal", () => {
  const result = compareScores([110, 110], [90, 100, 110]);
  assert.equal(result.n, 3);
  assert.equal(result.simMean, 110);
  assert.equal(result.rehearsalMean, 100);
  assert.ok(Math.abs(result.diffPct - 0.1) < 1e-9);
  assert.ok(Math.abs(result.marginPct - (1.96 * 10) / Math.sqrt(3) / 100) < 1e-9);
});

test("compareScores has no margin from a single rehearsal", () => {
  assert.equal(compareScores([100], [90]).marginPct, null);
  assert.equal(compareScores([100], []), null);
});

const valid = {
  id: "0b6c7f6e-8a4f-4c55-9a43-6f1f3f1f2a10",
  loadout: { stageId: 148, params: [1, 2, 3, 4], extra: "dropped" },
  enterPercents: false,
  simulator: { strategy: "HeuristicStrategy", numRuns: 2000 },
  simStats: { mean: 41000, count: 2000 },
  rehearsal: { stage: 2, slot: 1, scores: [40000, 42000] },
};

test("validateComparison keeps known loadout fields only", () => {
  const { comparison, error } = validateComparison(valid);
  assert.equal(error, undefined);
  assert.equal(comparison._id, valid.id);
  assert.equal(comparison.loadout.extra, undefined);
  assert.deepEqual(comparison.loadout.params, [1, 2, 3, 4]);
});

test("validateComparison rejects bad input", () => {
  const bad = [
    null,
    { ...valid, id: "nope" },
    { ...valid, loadout: { stageId: "custom" } },
    { ...valid, rehearsal: { ...valid.rehearsal, slot: 4 } },
    { ...valid, rehearsal: { ...valid.rehearsal, scores: [] } },
    { ...valid, rehearsal: { ...valid.rehearsal, scores: [1.5] } },
    { ...valid, simStats: null },
  ];
  for (const body of bad) assert.ok(validateComparison(body).error);
});
