// Transcribed from player-visible P-idol status/progression screens. Most
// P-idols share their idol's values; the exceptions stay explicit here.
const STANDARD_TRAINING_STAMINA_BONUSES = [{ rank: 5, stamina: 3 }];
const EARLY_TRAINING_STAMINA_BONUSES = [
  { rank: 1, stamina: 3 },
  { rank: 5, stamina: 3 },
];
const AWAKENING_STAMINA_BONUSES = [{ rank: 4, stamina: 3 }];

const P_IDOL_STAMINA_BY_IDOL_ID = {
  1: { base: 32, training: STANDARD_TRAINING_STAMINA_BONUSES },
  2: { base: 30, training: STANDARD_TRAINING_STAMINA_BONUSES },
  3: { base: 27, training: STANDARD_TRAINING_STAMINA_BONUSES },
  4: { base: 31, training: STANDARD_TRAINING_STAMINA_BONUSES },
  5: { base: 28, training: EARLY_TRAINING_STAMINA_BONUSES },
  6: { base: 23, training: EARLY_TRAINING_STAMINA_BONUSES },
  7: { base: 30, training: STANDARD_TRAINING_STAMINA_BONUSES },
  8: { base: 22, training: EARLY_TRAINING_STAMINA_BONUSES },
  9: { base: 30, training: STANDARD_TRAINING_STAMINA_BONUSES },
  10: { base: 30, training: STANDARD_TRAINING_STAMINA_BONUSES },
  11: { base: 31, training: STANDARD_TRAINING_STAMINA_BONUSES },
  12: { base: 27, training: EARLY_TRAINING_STAMINA_BONUSES },
  13: { base: 31, training: STANDARD_TRAINING_STAMINA_BONUSES },
};

const P_IDOL_STAMINA_OVERRIDES_BY_ID = {
  57: { training: EARLY_TRAINING_STAMINA_BONUSES },
  62: { base: 31 },
  64: { training: STANDARD_TRAINING_STAMINA_BONUSES },
};

// Future and preview P-idols remain unavailable until their player-visible
// status/progression values are confirmed and their ID is added here.
const CONFIRMED_P_IDOL_ID_RANGES = [
  [1, 130],
  [134, 150],
];

const AFFECTION_STAMINA_BONUSES = [
  { rank: 22, stamina: 1 },
  { rank: 25, stamina: 2 },
];

// True End rewards are permanent achievements. Missing scenario keys are
// unconfirmed zero-value entries, matching the currently visible data.
const TRUE_END_STAMINA_BY_IDOL_ID = {
  1: { hajime: 0, nia: 0 },
  2: { hajime: 2, nia: 0, hif: 0 },
  3: { hajime: 4, nia: 0 },
  4: { hajime: 0, nia: 0, hif: 0 },
  5: { hajime: 0, nia: 0, hif: 0 },
  6: { hajime: 2, nia: 1, hif: 0 },
  7: { hajime: 0, nia: 0, hif: 0 },
  8: { hajime: 2, nia: 1, hif: 0 },
  9: { hajime: 0, nia: 0, hif: 0 },
  10: { hajime: 0, nia: 0, hif: 0 },
  11: { hajime: 0, nia: 0 },
  12: { hajime: 0, nia: 0, hif: 0 },
  13: { hajime: 0, nia: 0 },
};

// Transcribed from the player-visible support-card level table. Each Sensei
// copy applies separately.
const SENSEI_STAMINA_BONUSES = [
  { rank: 1, stamina: 4 },
  { rank: 25, stamina: 5 },
  { rank: 40, stamina: 6 },
  { rank: 45, stamina: 7 },
  { rank: 50, stamina: 8 },
  { rank: 55, stamina: 9 },
];

const TRUE_END_SCENARIOS = new Set(["hajime", "nia", "hif"]);

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

function hasConfirmedPIdolStamina(pIdolId) {
  return CONFIRMED_P_IDOL_ID_RANGES.some(
    ([first, last]) => pIdolId >= first && pIdolId <= last
  );
}

function getPIdolStaminaData(pIdol) {
  if (!Number.isInteger(pIdol?.id) || !hasConfirmedPIdolStamina(pIdol.id)) {
    return null;
  }
  const defaults = P_IDOL_STAMINA_BY_IDOL_ID[pIdol.idolId];
  if (!defaults) return null;
  return {
    ...defaults,
    awakening: AWAKENING_STAMINA_BONUSES,
    ...P_IDOL_STAMINA_OVERRIDES_BY_ID[pIdol.id],
  };
}

export function getSenseiStaminaBonus(level) {
  return replacementBonusAtRank(SENSEI_STAMINA_BONUSES, level || 0);
}

export function getMemoryStaminaBreakdown({
  pIdol,
  trainingRank = 0,
  awakeningRank = 0,
  affectionLevel = 0,
  trueEndScenarios = [],
  senseiLevels = [],
}) {
  const pIdolStamina = getPIdolStaminaData(pIdol);
  if (!pIdolStamina) return null;
  const unknownTrueEndScenario = trueEndScenarios.find(
    (scenario) => !TRUE_END_SCENARIOS.has(scenario)
  );
  if (unknownTrueEndScenario) {
    throw new RangeError(
      `Unknown True End scenario: ${unknownTrueEndScenario}`
    );
  }

  const breakdown = {
    base: pIdolStamina.base,
    training: cumulativeBonusAtRank(pIdolStamina.training, trainingRank),
    awakening: cumulativeBonusAtRank(pIdolStamina.awakening, awakeningRank),
    affection: replacementBonusAtRank(
      AFFECTION_STAMINA_BONUSES,
      affectionLevel
    ),
    trueEnd: trueEndScenarios.reduce(
      (total, scenario) =>
        total +
        (TRUE_END_STAMINA_BY_IDOL_ID[pIdol.idolId]?.[scenario] || 0),
      0
    ),
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
