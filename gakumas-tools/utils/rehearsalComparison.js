import { buildBoxPlotData } from "@/components/Rehearsal/rehearsalStats";
import { extractLoadoutFields } from "@/utils/simulationRun";

export const NUM_STAGES = 3;
export const NUM_SLOTS = 3;
const MAX_REHEARSAL_SCORES = 2000;
const MAX_SCORE = 10_000_000;

export function cellScores(rows, stage, slot) {
  return buildBoxPlotData(rows)[slot].data[stage];
}

function mean(values) {
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export function compareScores(simScores, rehearsalScores) {
  const n = rehearsalScores.length;
  if (!simScores.length || !n) return null;
  const simMean = mean(simScores);
  const rehearsalMean = mean(rehearsalScores);
  const diffPct = (simMean - rehearsalMean) / rehearsalMean;
  let marginPct = null;
  if (n >= 2) {
    const variance =
      rehearsalScores.reduce((a, s) => a + (s - rehearsalMean) ** 2, 0) /
      (n - 1);
    marginPct = (1.96 * Math.sqrt(variance / n)) / rehearsalMean;
  }
  return { n, simMean, rehearsalMean, diffPct, marginPct };
}

const SIM_STAT_FIELDS = [
  "count",
  "min",
  "q1",
  "median",
  "mean",
  "q3",
  "max",
  "stddev",
  "bucketMin",
  "bucketSize",
];
const MAX_BUCKETS = 100;

function cleanSimStats(stats) {
  if (!stats) return null;
  const clean = {};
  for (const field of SIM_STAT_FIELDS) {
    if (!Number.isFinite(stats[field])) return null;
    clean[field] = stats[field];
  }
  const { buckets } = stats;
  if (
    !Array.isArray(buckets) ||
    buckets.length > MAX_BUCKETS ||
    !buckets.every(Number.isInteger)
  ) {
    return null;
  }
  return { ...clean, buckets };
}

const isScore = (s) => Number.isInteger(s) && s > 0 && s < MAX_SCORE;
const isId = (s) => typeof s == "string" && /^[0-9a-f-]{36}$/.test(s);

export function validateComparison(body) {
  const { id, loadout, enterPercents, simStats, rehearsal } = body || {};
  if (!isId(id)) return { error: "Invalid id" };
  if (!loadout?.stageId || loadout.stageId == "custom") {
    return { error: "Invalid stage" };
  }
  const { stage, slot, scores } = rehearsal || {};
  if (
    !Number.isInteger(stage) ||
    stage < 1 ||
    stage > NUM_STAGES ||
    !Number.isInteger(slot) ||
    slot < 1 ||
    slot > NUM_SLOTS ||
    !Array.isArray(scores) ||
    !scores.length ||
    scores.length > MAX_REHEARSAL_SCORES ||
    !scores.every(isScore)
  ) {
    return { error: "Invalid rehearsal" };
  }
  const cleanStats = cleanSimStats(simStats);
  if (!cleanStats) return { error: "Invalid simulator result" };
  return {
    comparison: {
      _id: id,
      loadout: extractLoadoutFields(loadout),
      enterPercents: !!enterPercents,
      simStats: cleanStats,
      rehearsal: { stage, slot, scores },
    },
  };
}

const TARGET_BUCKETS = 20;

function niceStep(raw) {
  const magnitude = 10 ** Math.floor(Math.log10(raw));
  return [1, 2, 5, 10].map((m) => m * magnitude).find((s) => s >= raw);
}

export function bucketShares(groups) {
  let min = Infinity;
  let max = -Infinity;
  for (const scores of groups) {
    for (const s of scores) {
      if (s < min) min = s;
      if (s > max) max = s;
    }
  }
  const bucketSize = niceStep(Math.max((max - min) / TARGET_BUCKETS, 1));
  const start = Math.floor(min / bucketSize);
  const count = Math.floor(max / bucketSize) - start + 1;
  const labels = Array.from(
    { length: count },
    (_, i) => (start + i) * bucketSize,
  );
  const shares = groups.map((scores) => {
    const out = new Array(count).fill(0);
    for (const s of scores) {
      out[Math.floor(s / bucketSize) - start] += 100 / scores.length;
    }
    return out;
  });
  return { labels, bucketSize, shares };
}
