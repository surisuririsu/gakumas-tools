import { test } from "node:test";
import assert from "node:assert/strict";
import {
  PIdols,
  calculateMemoryStamina,
  getAvailableTrueEndScenarios,
  getMemoryStaminaBreakdown,
  getSenseiStaminaBonus,
} from "gakumas-data";
import { getLoadoutStaminaContributions } from "../gakumas-tools/utils/stamina.js";
import {
  DEFAULT_STAMINA_PROGRESSION,
  STAMINA_PROGRESSION_STORAGE_KEY,
  loadStaminaProgression,
  saveStaminaProgression,
} from "../gakumas-tools/utils/staminaProgression.js";

function createMemoryStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem(key) {
      return values.has(key) ? values.get(key) : null;
    },
    setItem(key, value) {
      values.set(key, value);
    },
  };
}

test("Sensei stamina follows the support-card level breakpoints", () => {
  assert.equal(getSenseiStaminaBonus(0), 0);
  assert.equal(getSenseiStaminaBonus(1), 4);
  assert.equal(getSenseiStaminaBonus(24), 4);
  assert.equal(getSenseiStaminaBonus(25), 5);
  assert.equal(getSenseiStaminaBonus(50), 8);
  assert.equal(getSenseiStaminaBonus(60), 9);
});

test("Hiro real-data vector totals 47 stamina", () => {
  const pIdol = PIdols.getById(26); // 光景 篠澤 広
  assert.deepEqual(
    getMemoryStaminaBreakdown({
      pIdol,
      trainingRank: 5,
      awakeningRank: 0,
      affectionLevel: 20,
      trueEndScenarios: ["hajime"],
      senseiLevels: [50, 60],
    }),
    {
      base: 22,
      training: 6,
      awakening: 0,
      affection: 0,
      trueEnd: 2,
      sensei: 17,
      total: 47,
    }
  );
});

test("earned True End achievements and progression bonuses total 46", () => {
  const pIdol = PIdols.getById(24); // Wonder Scale 倉本 千奈
  assert.deepEqual(
    getMemoryStaminaBreakdown({
      pIdol,
      trainingRank: 7,
      awakeningRank: 4,
      affectionLevel: 27,
      trueEndScenarios: ["hajime", "nia"],
      senseiLevels: [60],
    }),
    {
      base: 23,
      training: 6,
      awakening: 3,
      affection: 2,
      trueEnd: 3,
      sensei: 9,
      total: 46,
    }
  );
});

test("P-idol-specific stamina overrides stay isolated in calculator data", () => {
  assert.equal(
    calculateMemoryStamina({ pIdol: PIdols.getById(62) }),
    31
  );
  assert.equal(
    calculateMemoryStamina({
      pIdol: PIdols.getById(64),
      trainingRank: 7,
    }),
    31
  );
});

test("only confirmed True End scenarios are exposed to the UI", () => {
  assert.deepEqual(getAvailableTrueEndScenarios(PIdols.getById(19)), [
    "hajime",
    "nia",
  ]);
  assert.deepEqual(getAvailableTrueEndScenarios(PIdols.getById(20)), [
    "hajime",
    "nia",
    "hif",
  ]);
});

test("unconfirmed preview metadata stays unavailable", () => {
  const pIdol = PIdols.getById(151); // unreleased Misuzu preview
  assert.equal(calculateMemoryStamina({ pIdol }), null);
});

test("unknown True End scenarios are rejected", () => {
  assert.throws(
    () =>
      calculateMemoryStamina({
        pIdol: PIdols.getById(19),
        trueEndScenarios: ["unknown"],
      }),
    RangeError
  );
});

test("contest loadout stamina includes 20% of the secondary memory", () => {
  assert.deepEqual(getLoadoutStaminaContributions([41, 42], [1, 0.2]), [
    41, 8,
  ]);
});

test("link contest loadout stamina includes every memory at full value", () => {
  assert.deepEqual(getLoadoutStaminaContributions([41, 42], [1, 1]), [41, 42]);
});

test("stamina progression is remembered independently for each P-idol", () => {
  const storage = createMemoryStorage();

  saveStaminaProgression(24, { trainingRank: 4, awakeningRank: 0 }, storage);
  saveStaminaProgression(26, { trainingRank: 5, awakeningRank: 2 }, storage);

  assert.deepEqual(loadStaminaProgression(24, storage), {
    trainingRank: 4,
    awakeningRank: 0,
  });
  assert.deepEqual(loadStaminaProgression(26, storage), {
    trainingRank: 5,
    awakeningRank: 2,
  });
});

test("missing or invalid saved progression falls back to maxed defaults", () => {
  const storage = createMemoryStorage({
    [STAMINA_PROGRESSION_STORAGE_KEY]: JSON.stringify({
      24: { trainingRank: 8, awakeningRank: 2 },
    }),
  });

  assert.deepEqual(loadStaminaProgression(24, storage), {
    trainingRank: DEFAULT_STAMINA_PROGRESSION.trainingRank,
    awakeningRank: 2,
  });
  assert.deepEqual(
    loadStaminaProgression(26, storage),
    DEFAULT_STAMINA_PROGRESSION,
  );
  const corruptStorage = createMemoryStorage({
    [STAMINA_PROGRESSION_STORAGE_KEY]: "not json",
  });
  assert.deepEqual(
    loadStaminaProgression(26, corruptStorage),
    DEFAULT_STAMINA_PROGRESSION,
  );

  saveStaminaProgression(
    26,
    { trainingRank: 3, awakeningRank: 1 },
    corruptStorage,
  );
  assert.deepEqual(loadStaminaProgression(26, corruptStorage), {
    trainingRank: 3,
    awakeningRank: 1,
  });
});

test("blocked browser storage does not prevent stamina calculation", () => {
  const blockedStorage = {
    getItem() {
      throw new Error("blocked");
    },
    setItem() {
      throw new Error("blocked");
    },
  };

  assert.deepEqual(
    loadStaminaProgression(24, blockedStorage),
    DEFAULT_STAMINA_PROGRESSION,
  );
  assert.doesNotThrow(() =>
    saveStaminaProgression(
      24,
      { trainingRank: 4, awakeningRank: 0 },
      blockedStorage,
    ),
  );
});
