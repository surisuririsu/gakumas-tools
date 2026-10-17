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

const isScore = (s) => Number.isInteger(s) && s > 0 && s < MAX_SCORE;
const isId = (s) => typeof s == "string" && /^[0-9a-f-]{36}$/.test(s);

export function validateComparison(body) {
  const { id, loadout, enterPercents, simulator, simStats, rehearsal } =
    body || {};
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
  if (!simStats || !Number.isFinite(simStats.mean)) {
    return { error: "Invalid simulator result" };
  }
  return {
    comparison: {
      _id: id,
      loadout: extractLoadoutFields(loadout),
      enterPercents: !!enterPercents,
      simulator: {
        strategy: String(simulator?.strategy || ""),
        numRuns: Number(simulator?.numRuns) || null,
      },
      simStats,
      rehearsal: { stage, slot, scores },
    },
  };
}
