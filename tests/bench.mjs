/**
 * Perf benchmark for the structured engine against the committed baseline.
 *
 *   pnpm bench           # measure and compare to perf-baseline.json
 *   pnpm bench:update    # rewrite perf-baseline.json with current numbers
 *
 * Methodology:
 *   - Runs every query in suite.jsonl.
 *   - 1 warmup pass (discarded), then 3 timed trials.
 *   - Median-of-medians is the reported metric (stable against GC spikes).
 *   - Regression threshold = 10% above baseline.
 *
 * Both the suite and the structured engine are deterministic under
 * resetRand(), so run-to-run score variation is zero and per-run timings
 * are what we're actually measuring.
 */
import { performance } from "node:perf_hooks";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { loadSuite, runQuery, silenceConsole, PERF_BASELINE_PATH } from "./lib.mjs";

const UPDATE = process.argv.includes("--update");
const TRIALS = 3;
const THRESHOLD = 0.10; // 10% regression threshold

function median(arr) {
  const s = arr.slice().sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

function fmtMs(x) {
  return x >= 100 ? x.toFixed(1) : x >= 10 ? x.toFixed(2) : x.toFixed(3);
}

const suite = loadSuite();
if (!suite.length) {
  console.error("Suite is empty — bootstrap it first (`pnpm regression:bootstrap`).");
  process.exit(2);
}

console.log(`Benchmarking ${suite.length} loadouts × ${TRIALS + 1} passes (1 warmup)...`);

async function runTrial(warmup = false) {
  const restore = silenceConsole();
  const durations = new Array(suite.length);
  try {
    for (let i = 0; i < suite.length; i++) {
      const t0 = performance.now();
      await runQuery(suite[i].query);
      durations[i] = performance.now() - t0;
    }
  } finally {
    restore();
  }
  if (warmup) return null;
  return median(durations);
}

await runTrial(true);
const trialMedians = [];
for (let t = 0; t < TRIALS; t++) {
  const m = await runTrial(false);
  trialMedians.push(m);
  process.stdout.write(`  trial ${t + 1}/${TRIALS}: median ${fmtMs(m)}ms\n`);
}
const medianOfMedians = median(trialMedians);

let baseline = null;
if (existsSync(PERF_BASELINE_PATH)) {
  baseline = JSON.parse(readFileSync(PERF_BASELINE_PATH, "utf8"));
}

console.log("");
console.log(`Current median-of-medians: ${fmtMs(medianOfMedians)}ms/loadout`);
if (baseline) {
  const ratio = medianOfMedians / baseline.median_ms;
  const pct = (ratio - 1) * 100;
  const arrow = ratio > 1 ? "↑" : "↓";
  console.log(`Baseline:                  ${fmtMs(baseline.median_ms)}ms/loadout (captured ${baseline.captured_at})`);
  console.log(
    `Delta:                     ${arrow} ${(pct >= 0 ? "+" : "") + pct.toFixed(1)}%  (threshold: ±${(THRESHOLD * 100).toFixed(0)}%)`,
  );
  if (!UPDATE && pct > THRESHOLD * 100) {
    console.log(`\nREGRESSION: current median is ${pct.toFixed(1)}% slower than baseline.`);
    process.exit(1);
  }
} else if (!UPDATE) {
  console.log("\nNo baseline yet — run `pnpm bench:update` to capture one.");
  process.exit(1);
}

if (UPDATE) {
  const out = {
    median_ms: medianOfMedians,
    trials: trialMedians,
    suite_size: suite.length,
    captured_at: new Date().toISOString().slice(0, 10),
    engine_sha: (process.env.GIT_SHA || "").slice(0, 12) || null,
  };
  writeFileSync(PERF_BASELINE_PATH, JSON.stringify(out, null, 2) + "\n");
  console.log(`\nWrote baseline to ${PERF_BASELINE_PATH}`);
}
