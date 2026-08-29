export const DEFAULT_STAMINA_PROGRESSION = Object.freeze({
  trainingRank: 7,
  awakeningRank: 4,
});

export const STAMINA_PROGRESSION_STORAGE_KEY =
  "gakumas-tools.staminaProgression";

function validRank(value, maximum, fallback) {
  return Number.isInteger(value) && value >= 0 && value <= maximum
    ? value
    : fallback;
}

function normalizeProgression(value) {
  return {
    trainingRank: validRank(
      value?.trainingRank,
      7,
      DEFAULT_STAMINA_PROGRESSION.trainingRank,
    ),
    awakeningRank: validRank(
      value?.awakeningRank,
      4,
      DEFAULT_STAMINA_PROGRESSION.awakeningRank,
    ),
  };
}

function readProgressions(storage) {
  const raw = storage?.getItem(STAMINA_PROGRESSION_STORAGE_KEY);
  if (raw == null) return {};
  let value;
  try {
    value = JSON.parse(raw);
  } catch {
    return {};
  }
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

export function loadStaminaProgression(pIdolId, storage) {
  try {
    const targetStorage = storage ?? globalThis.localStorage;
    return normalizeProgression(readProgressions(targetStorage)[pIdolId]);
  } catch {
    return { ...DEFAULT_STAMINA_PROGRESSION };
  }
}

export function saveStaminaProgression(pIdolId, progression, storage) {
  try {
    const targetStorage = storage ?? globalThis.localStorage;
    const progressions = readProgressions(targetStorage);
    targetStorage?.setItem(
      STAMINA_PROGRESSION_STORAGE_KEY,
      JSON.stringify({
        ...progressions,
        [pIdolId]: normalizeProgression(progression),
      }),
    );
  } catch {
    // Storage can be unavailable in private browsing or full. The calculator
    // remains usable with its in-memory values.
  }
}
