// Verified against vertesan/gakumasu-diff@1866b84c and the in-game values
// transcribed by the Gakumas contest wiki. Each Sensei copy applies separately.
const SENSEI_STAMINA_BONUSES = [
  { rank: 1, stamina: 4 },
  { rank: 25, stamina: 5 },
  { rank: 40, stamina: 6 },
  { rank: 45, stamina: 7 },
  { rank: 50, stamina: 8 },
  { rank: 55, stamina: 9 },
];

const TRUE_END_FIELD_BY_SCENARIO = {
  firstStar: "trueEndStaminaFirstStar",
  nextIdolAudition: "trueEndStaminaNextIdolAudition",
  hatsuboshiIdolFestival: "trueEndStaminaHatsuboshiIdolFestival",
};

function cumulativeBonusAtRank(bonuses, rank) {
  return bonuses
    .filter((milestone) => milestone.rank <= rank)
    .reduce((total, milestone) => total + milestone.stamina, 0);
}

function replacementBonusAtRank(bonuses, rank) {
  return bonuses
    .filter((milestone) => milestone.rank <= rank)
    .reduce((value, milestone) => milestone.stamina, 0);
}

export function getSenseiStaminaBonus(level) {
  return replacementBonusAtRank(SENSEI_STAMINA_BONUSES, level || 0);
}

export function getMemoryStaminaBreakdown({
  pIdol,
  idol,
  trainingRank = 0,
  potentialRank = 0,
  dearnessLevel = 0,
  trueEndScenario = null,
  senseiLevels = [],
}) {
  if (!Number.isInteger(pIdol?.baseStamina)) return null;
  if (trueEndScenario && !TRUE_END_FIELD_BY_SCENARIO[trueEndScenario]) {
    throw new RangeError(`Unknown True End scenario: ${trueEndScenario}`);
  }

  const trueEndField = TRUE_END_FIELD_BY_SCENARIO[trueEndScenario];
  const breakdown = {
    base: pIdol.baseStamina,
    training: cumulativeBonusAtRank(
      pIdol.trainingStaminaBonuses,
      trainingRank
    ),
    potential: cumulativeBonusAtRank(
      pIdol.potentialStaminaBonuses,
      potentialRank
    ),
    dearness: replacementBonusAtRank(
      idol?.dearnessStaminaBonuses || [],
      dearnessLevel
    ),
    trueEnd: trueEndField ? idol?.[trueEndField] || 0 : 0,
    sensei: senseiLevels.reduce(
      (total, level) => total + getSenseiStaminaBonus(level),
      0
    ),
  };
  breakdown.total = Object.values(breakdown).reduce(
    (total, value) => total + value,
    0
  );
  return breakdown;
}

export function calculateMemoryStamina(options) {
  return getMemoryStaminaBreakdown(options)?.total ?? null;
}
