export const DEBUG = false;

export const TOKEN_REGEX = /([=!]?=|[<>+\-*/%]=?|&)/;
export const NUMBER_REGEX = /^-?\d+(?:\.\d+)?$/;
export const FUNCTION_CALL_REGEX = /([^(]+)(?:\(([^)]+)\))?/;
export const STANCES = [
  "none",
  "strength",
  "strength2",
  "preservation",
  "preservation2",
  "leisure",
  "fullPower",
];
export const SOURCE_TYPES = ["default", "produce", "pIdol", "support"];

export const SET_OPERATOR = "&";
export const BOOLEAN_OPERATORS = ["==", "!=", "<", ">", "<=", ">="];
export const ADDITIVE_OPERATORS = ["+", "-"];
export const MULTIPLICATIVE_OPERATORS = ["*", "/", "%"];
export const ASSIGNMENT_OPERATORS = ["=", "+=", "-=", "*=", "/=", "%="];

function formatEffect(effect) {
  effect.conditions = effect.conditions.map((x) => x.split(TOKEN_REGEX));
  effect.actions = effect.actions.map((x) => x.split(TOKEN_REGEX));
  return effect;
}

export const DEFAULT_EFFECTS = [
  {
    phase: "cardUsed",
    conditions: ["stance==strength2"],
    actions: ["fixedStamina-=1"],
    source: { type: "default", id: "強気2" },
  },
].map(formatEffect);

export const FULL_POWER_EFFECTS = [
  {
    conditions: ["lockStanceTurns==0", "fullPowerCharge>=10"],
    actions: ["setStance(fullPower)", "fullPowerCharge-=10"],
    source: { type: "default", id: "全力" },
  },
].map(formatEffect);

export const GOOD_IMPRESSION_EFFECTS = [
  {
    conditions: ["goodImpressionTurns>=1"],
    actions: ["score+=goodImpressionTurns*goodImpressionTurnsEffectBuff"],
    source: { type: "default", id: "好印象" },
  },
].map(formatEffect);

export const STANCE_CHANGED_EFFECTS = [
  {
    conditions: ["prevStance==preservation", "stance!=leisure"],
    actions: ["enthusiasm+=5+enthusiasmBonus", "cardUsesRemaining+=1"],
    source: { type: "default", id: "温存" },
  },
  {
    conditions: ["prevStance==preservation2", "stance!=leisure"],
    actions: [
      "enthusiasm+=8+enthusiasmBonus",
      "fixedGenki+=5",
      "cardUsesRemaining+=1",
    ],
    source: { type: "default", id: "温存2" },
  },
  {
    conditions: ["prevStance==leisure"],
    actions: ["fixedGenki+=5", "cardUsesRemaining+=1"],
    source: { type: "default", id: "のんびり" },
  },
  {
    conditions: ["prevStance==leisure", "stance==fullPower"],
    targets: ["all"],
    actions: ["g.score+=10"],
    source: { type: "default", id: "のんびり" },
  },
  {
    conditions: ["prevStance==leisure", "stance!=fullPower"],
    actions: ["enthusiasm+=10+enthusiasmBonus"],
    source: { type: "default", id: "のんびり" },
  },
  {
    conditions: ["stance==fullPower"],
    actions: ["cardUsesRemaining+=1", "addHeldCardsToHand"],
    source: { type: "default", id: "全力" },
  },
].map(formatEffect);

export const UNFRESH_PHASES = ["beforeStartOfTurn", "startOfTurn", "everyTurn"];
export const CHANGE_TRIGGER_PHASES = ["processCard", "processCost"];
export const PHASES = [
  "activeCardUsed",
  "afterActiveCardUsed",
  "afterCardUsed",
  "afterMentalCardUsed",
  "beforeStartOfTurn",
  "buffCostConsumed",
  "cardUsed",
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
  "staminaDecreased",
  "stanceChanged",
  "startOfStage",
  "startOfTurn",
  "processCost",
  "processCard",
];

export const ALL_FIELDS = [
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

  // Buffs
  "halfCostTurns",
  "doubleCostTurns",
  "costReduction",
  "costIncrease",
  "nullifyCostCards",
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
  "perfectConditionTurns",
  "concentration",
  "concentrationMultiplier",
  "goodImpressionTurns",
  "motivation",
  "motivationMultiplier",
  "stance",
  "prevStance",
  "lockStanceTurns",
  "fullPowerCharge",
  "cumulativeFullPowerCharge",
  "enthusiasm",
  "enthusiasmBonus",
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

  // Effects
  "effects",
  "phase",
  "parentPhase",

  // Growth
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

  // Special
  "pcchiCardsUsed",
  "nullifyHold",

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
  S.lockStanceTurns,
  S.halfCostTurns,
  S.doubleCostTurns,
  S.nullifyGenkiTurns,
  S.poorConditionTurns,
  S.noActiveTurns,
  S.noMentalTurns,
  S.uneaseTurns,
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
];

export const INCREASE_TRIGGER_FIELDS = [
  S.goodImpressionTurns,
  S.motivation,
  S.genki,
  S.goodConditionTurns,
  S.concentration,
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
  S.turnsRemaining,
  S.cardUsesRemaining,
  S.noActiveTurns,
  S.noMentalTurns,
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

export const HOLD_SOURCES_BY_ALIAS = {
  hand: S.handCards,
  deck: S.deckCards,
  discards: S.discardedCards,
};
