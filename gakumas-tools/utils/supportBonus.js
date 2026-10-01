import { Stages } from "gakumas-data";
import { calculateTypeMultipliers } from "gakumas-engine/typeMultipliers";

const TYPES = ["vocal", "dance", "visual"];
const STEP = 0.0001;
const MAX_STEPS = 5000;

function shownPercents(params, stage, steps) {
  const multipliers = calculateTypeMultipliers(params, stage, steps * STEP);
  return TYPES.map((type) => Math.round(multipliers[type] * 100));
}

function firstStepReaching(params, stage, typeIndex, target) {
  let lo = 0;
  let hi = MAX_STEPS + 1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (shownPercents(params, stage, mid)[typeIndex] >= target) hi = mid;
    else lo = mid + 1;
  }
  return lo;
}

function supportBonusRange(params, percents, stage, tolerance, types) {
  let lo = 0;
  let hi = MAX_STEPS;
  for (const i of types) {
    lo = Math.max(
      lo,
      firstStepReaching(params, stage, i, percents[i] - tolerance),
    );
    hi = Math.min(
      hi,
      firstStepReaching(params, stage, i, percents[i] + tolerance + 1) - 1,
    );
  }
  if (lo > hi) return null;
  const shown = shownPercents(params, stage, lo);
  if (types.some((i) => Math.abs(shown[i] - percents[i]) > tolerance)) {
    return null;
  }
  return [lo * STEP, hi * STEP];
}

function midpoint([lo, hi]) {
  return Math.round((lo + hi) / 2 / STEP) * STEP;
}

// Some screenshots show a percent one off from what their params produce,
// and any two percents pin the support bonus if one was misread.
const ATTEMPTS = [
  { tolerance: 0, typeSets: [[0, 1, 2]] },
  { tolerance: 1, typeSets: [[0, 1, 2]] },
  {
    tolerance: 1,
    typeSets: [
      [0, 1],
      [0, 2],
      [1, 2],
    ],
  },
];

export function findStageCandidates(
  params,
  percents,
  { currentStageId, plan } = {},
) {
  const stats = { vocal: params[0], dance: params[1], visual: params[2] };
  const stages = Stages.getAll().filter((stage) => stage.type === "contest");
  const matchesPlan = ({ stage }) =>
    !plan || stage.plan === plan || stage.plan === "free";
  let fallback = [];
  let matches = [];
  for (const { tolerance, typeSets } of ATTEMPTS) {
    const readable = typeSets.filter((types) =>
      types.every((i) => Number.isFinite(percents[i])),
    );
    const fits = stages
      .map((stage) => ({
        stage,
        range: readable
          .map((types) =>
            supportBonusRange(stats, percents, stage, tolerance, types),
          )
          .find(Boolean),
      }))
      .filter(({ range }) => range);
    if (!fallback.length) fallback = fits;
    matches = fits.filter(matchesPlan);
    if (matches.length) break;
  }

  const rank = ({ stage }) => [
    stage.id == currentStageId ? 0 : 1,
    stage.preview ? 1 : 0,
    -stage.id,
  ];
  return (matches.length ? matches : fallback)
    .sort((a, b) => {
      const [ra, rb] = [rank(a), rank(b)];
      return ra[0] - rb[0] || ra[1] - rb[1] || ra[2] - rb[2];
    })
    .map(({ stage, range }) => ({
      stageId: stage.id,
      supportBonus: Number(midpoint(range).toFixed(4)),
    }));
}
