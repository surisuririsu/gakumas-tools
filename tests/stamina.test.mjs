import { test } from "node:test";
import assert from "node:assert/strict";
import {
  Idols,
  PIdols,
  calculateMemoryStamina,
  getMemoryStaminaBreakdown,
  getSenseiStaminaBonus,
} from "gakumas-data";

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
  const idol = Idols.getById(pIdol.idolId);
  assert.deepEqual(
    getMemoryStaminaBreakdown({
      pIdol,
      idol,
      trainingRank: 5,
      potentialRank: 0,
      relationshipLevel: 20,
      trueEndScenario: "firstStar",
      senseiLevels: [50, 60],
    }),
    {
      base: 22,
      training: 6,
      potential: 0,
      relationship: 0,
      trueEnd: 2,
      sensei: 17,
      total: 47,
    }
  );
});

test("progression milestones apply with cumulative and replacement semantics", () => {
  const pIdol = PIdols.getById(24); // Wonder Scale 倉本 千奈
  const idol = Idols.getById(pIdol.idolId);
  assert.equal(
    calculateMemoryStamina({
      pIdol,
      idol,
      trainingRank: 5,
      potentialRank: 4,
      relationshipLevel: 25,
      trueEndScenario: "nextIdolAudition",
      senseiLevels: [55],
    }),
    44
  );
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
        trueEndScenario: "unknown",
      }),
    RangeError
  );
});
