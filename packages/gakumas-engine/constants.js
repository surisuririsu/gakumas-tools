import { deserializeEffectSequence } from "gakumas-data";

export const DEBUG = false;

export const STANCES = [
  "none",
  "strength",
  "strength2",
  "preservation",
  "preservation2",
  "leisure",
  "fullPower",
];
export const SKILL_CARD_TYPES = ["active", "mental", "trouble"];
export const SOURCE_TYPES = ["default", "produce", "pIdol", "support"];
export const RARITIES = ["N", "R", "SR", "SSR"];

/**
 * Parse an effect string and attach source metadata
 */
function parseEffect(effectStr, source) {
  const effects = deserializeEffectSequence(effectStr);
  for (const effect of effects) {
    effect.source = source;
  }
  return effects;
}

export const DEFAULT_EFFECTS = parseEffect(
  "at:cardUsed { if:stance==strength2 { do:fixedStamina-=1 } }",
  { type: "default", id: "強気2" }
);

export const FULL_POWER_EFFECTS = [
  ...parseEffect(
    "if:stance==fullPower { do:setStance(none) }",
    { type: "default", id: "全力" }
  ),
  ...parseEffect(
    "if:lockStanceTurns==0 & fullPowerCharge>=10 { do:setStance(fullPower); do:fullPowerCharge-=10 }",
    { type: "default", id: "全力" }
  ),
];

export const GOOD_IMPRESSION_EFFECTS = parseEffect(
  "if:goodImpressionTurns>=1 { do:score+=goodImpressionTurns*goodImpressionTurnsEffectBuff }",
  { type: "default", id: "好印象" }
);

export const STANCE_CHANGED_EFFECTS = [
  ...parseEffect(
    "if:prevStance==preservation & stance!=leisure { do:enthusiasm+=5; do:cardUsesRemaining+=1 }",
    { type: "default", id: "温存" }
  ),
  ...parseEffect(
    "if:prevStance==preservation2 & stance!=leisure { do:enthusiasm+=8; do:fixedGenki+=5; do:cardUsesRemaining+=1 }",
    { type: "default", id: "温存2" }
  ),
  ...parseEffect(
    "if:prevStance==leisure { do:fixedGenki+=5; do:cardUsesRemaining+=1 }",
    { type: "default", id: "のんびり" }
  ),
  ...parseEffect(
    "if:prevStance==leisure & stance==fullPower { target:all { do:g.score+=10 } }",
    { type: "default", id: "のんびり" }
  ),
  ...parseEffect(
    "if:prevStance==leisure & stance!=fullPower { do:enthusiasm+=10 }",
    { type: "default", id: "のんびり" }
  ),
  ...parseEffect(
    "if:stance==fullPower { do:cardUsesRemaining+=1; do:moveHeldCardsToHand }",
    { type: "default", id: "全力" }
  ),
];

export const UNFRESH_PHASES = [
  "beforeStartOfTurn",
  "startOfTurn",
  "afterStartOfTurn",
  "turn",
  "everyTurn",
];
export const CHANGE_TRIGGER_PHASES = ["processCard", "processCost"];
export const PHASES = [
  "activeCardUsed",
  "afterActiveCardUsed",
  "afterCardUsed",
  "afterMentalCardUsed",
  "afterStartOfStage",
  "afterStartOfTurn",
  "beforeStartOfTurn",
  "buffCostConsumed",
  "cardUsed",
  "cardMovedToHand",
  "cardRemoved",
  "concentrationIncreased",
  "endOfTurn",
  "everyTurn",
  "genkiIncreased",
  "goodConditionTurnsIncreased",
  "goodImpressionTurnsIncreased",
  "mentalCardUsed",
  "motivationIncreased",
  "prestage",
  "processCard",
  "processCost",
  "checkCost",
  "staminaDecreased",
  "stanceChanged",
  "startOfStage",
  "startOfTurn",
  "turn",
  "turnSkipped",
];

export const ALL_FIELDS = [
  // Logging
  "logs",
  "graphData",

  // General
  "cardUsesRemaining",
  "stamina",
  "consumedStamina",
  "genki",
  "score",

  // Turns
  "turnsElapsed",
  "turnsRemaining",
  "turnTypes",
  "linkPhase",

  // Buffs
  "halfCostTurns",
  "doubleCostTurns",
  "costReduction",
  "costIncrease",
  "nullifyCostCards",
  "nullifyCostActiveCards",
  "nullifyDebuff",
  "nullifyGenkiTurns",
  "doubleCardEffectCards",
  "noActiveTurns",
  "noMentalTurns",
  "poorConditionTurns",
  "uneaseTurns",
  "scoreBuffs",
  "scoreDebuffs",
  "goodImpressionTurnsBuffs",
  "goodImpressionTurnsEffectBuffs",
  "concentrationBuffs",
  "goodConditionTurns",
  "goodConditionTurnsMultiplier",
  "goodConditionTurnsBuffs",
  "perfectConditionTurns",
  "concentration",
  "concentrationMultiplier",
  "goodImpressionTurns",
  "motivation",
  "motivationMultiplier",
  "motivationBuffs",
  "prideTurns",
  "stance",
  "prevStance",
  "lockStanceTurns",
  "fullPowerCharge",
  "fullPowerChargeBuffs",
  "cumulativeFullPowerCharge",
  "enthusiasm",
  "enthusiasmBonus",
  "enthusiasmBuffs",
  "strengthTimes",
  "preservationTimes",
  "leisureTimes",
  "fullPowerTimes",
  "freshBuffs",

  // Cards
  "cardMap",
  "deckCards",
  "handCards",
  "discardedCards",
  "removedCards",
  "heldCards",
  "cardsUsed",
  "activeCardsUsed",
  "turnCardsUsed",
  "turnCardsUpgraded",
  "thisCardHeld",
  "usedCard",
  "lastUsedCard",
  "movedCard",
  "noCardUseTurns",

  // Effects
  "effects",
  "phase",
  "parentPhase",

  // Special
  "pcchiCardsUsed",
  "natsuyaCardsUsed",
  "holidayCardsUsed",
  "onigiriCardsUsed",
  "nullifySelect",

  // Delta
  "goodImpressionTurnsDelta",
  "motivationDelta",
  "genkiDelta",
  "goodConditionTurnsDelta",
  "concentrationDelta",
  "staminaDelta",
];

export const S = ALL_FIELDS.reduce((acc, cur, i) => {
  acc[cur] = i;
  return acc;
}, {});

export const GROWTH_FIELDS = [
  "g.score",
  "g.scoreTimes",
  "g.cost",
  "g.typedCost",
  "g.genki",
  "g.goodConditionTurns",
  "g.perfectConditionTurns",
  "g.concentration",
  "g.goodImpressionTurns",
  "g.motivation",
  "g.fullPowerCharge",
  "g.halfCostTurns",
  "g.scoreByGoodImpressionTurns",
  "g.scoreByMotivation",
  "g.scoreByGenki",
  "g.stanceLevel",
];

export const G = GROWTH_FIELDS.reduce((acc, cur, i) => {
  acc[cur] = i;
  return acc;
}, {});

export const CARD_PILES = [
  S.deckCards,
  S.handCards,
  S.discardedCards,
  S.removedCards,
];

export const COST_FIELDS = [
  S.stamina,
  S.goodConditionTurns,
  S.concentration,
  S.goodImpressionTurns,
  S.motivation,
  S.fullPowerCharge,
];

export const EOT_DECREMENT_FIELDS = [
  S.goodConditionTurns,
  S.perfectConditionTurns,
  S.goodImpressionTurns,
  S.prideTurns,
  S.lockStanceTurns,
  S.halfCostTurns,
  S.doubleCostTurns,
  S.nullifyGenkiTurns,
  S.poorConditionTurns,
  S.noActiveTurns,
  S.noMentalTurns,
  S.uneaseTurns,
  S.noCardUseTurns,
];

// Consumable buffs
export const BUFF_FIELDS = [
  S.goodConditionTurns,
  S.perfectConditionTurns,
  S.concentration,
  S.goodImpressionTurns,
  S.motivation,
  S.fullPowerCharge,
];

export const DEBUFF_FIELDS = [
  S.doubleCostTurns,
  S.costIncrease,
  S.nullifyGenkiTurns,
  S.noActiveTurns,
  S.noMentalTurns,
  S.uneaseTurns,
  S.poorConditionTurns,
  S.lockStanceTurns,
  S.noCardUseTurns,
];

export const DEBUFF_SPECIAL_ACTIONS = [
  "setScoreDebuff",
  "decreaseFullPowerCharge",
];

export const INCREASE_TRIGGER_FIELDS = [
  S.goodImpressionTurns,
  S.motivation,
  S.genki,
  S.goodConditionTurns,
  S.concentration,
  S.fullPowerCharge,
];

export const DECREASE_TRIGGER_FIELDS = [S.stamina];

export const GROWABLE_FIELDS = [
  S.genki,
  S.goodConditionTurns,
  S.perfectConditionTurns,
  S.concentration,
  S.goodImpressionTurns,
  S.motivation,
  S.fullPowerCharge,
  S.halfCostTurns,
];

export const WHOLE_FIELDS = [
  S.stamina,
  S.genki,
  S.goodConditionTurns,
  S.perfectConditionTurns,
  S.concentration,
  S.goodImpressionTurns,
  S.motivation,
  S.prideTurns,
  S.fullPowerCharge,
  S.cumulativeFullPowerCharge,
  S.enthusiasm,
];

export const NON_NEGATIVE_FIELDS = [
  S.stamina,
  S.genki,
  S.goodConditionTurns,
  S.perfectConditionTurns,
  S.concentration,
  S.goodImpressionTurns,
  S.motivation,
  S.fullPowerCharge,
];

export const LOGGED_FIELDS = [
  S.stamina,
  S.genki,
  S.stance,
  S.score,
  S.goodConditionTurns,
  S.perfectConditionTurns,
  S.concentration,
  S.goodImpressionTurns,
  S.motivation,
  S.prideTurns,
  S.enthusiasm,
  S.enthusiasmBonus,
  S.fullPowerCharge,
  S.lockStanceTurns,
  S.halfCostTurns,
  S.doubleCostTurns,
  S.costReduction,
  S.costIncrease,
  S.doubleCardEffectCards,
  S.nullifyGenkiTurns,
  S.nullifyDebuff,
  S.poorConditionTurns,
  S.nullifyCostCards,
  S.nullifyCostActiveCards,
  S.turnsRemaining,
  S.cardUsesRemaining,
  S.noActiveTurns,
  S.noMentalTurns,
  S.noCardUseTurns,
  S.uneaseTurns,
];

export const GRAPHED_FIELDS = [
  S.stamina,
  S.genki,
  S.score,
  S.goodConditionTurns,
  S.concentration,
  S.goodImpressionTurns,
  S.motivation,
  S.prideTurns,
];

export const FIELDS_TO_DIFF = [
  ...new Set(
    LOGGED_FIELDS.concat(
      INCREASE_TRIGGER_FIELDS,
      DECREASE_TRIGGER_FIELDS,
      EOT_DECREMENT_FIELDS
    )
  ),
];
