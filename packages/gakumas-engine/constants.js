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
  "fullPower",
];

export const SET_OPERATOR = "&";
export const BOOLEAN_OPERATORS = ["==", "!=", "<", ">", "<=", ">="];
export const ADDITIVE_OPERATORS = ["+", "-"];
export const MULTIPLICATIVE_OPERATORS = ["*", "/", "%"];
export const ASSIGNMENT_OPERATORS = ["=", "+=", "-=", "*=", "/=", "%="];

export const DEFAULT_EFFECTS = [
  {
    phase: "endOfTurn",
    conditions: ["goodImpressionTurns>=1"],
    actions: ["score+=goodImpressionTurns"],
    group: 100,
    source: { type: "default", id: "好印象" },
  },
  {
    phase: "stanceChanged",
    conditions: ["prevStance==preservation"],
    actions: ["enthusiasm+=5", "cardUsesRemaining+=1"],
    source: { type: "default", id: "温存" },
  },
  {
    phase: "stanceChanged",
    conditions: ["prevStance==preservation2"],
    actions: ["enthusiasm+=8", "genki+=5", "cardUsesRemaining+=1"],
    source: { type: "default", id: "温存2" },
  },
  {
    phase: "cardUsed",
    conditions: ["stance==strength2"],
    actions: ["fixedStamina-=1"],
    source: { type: "default", id: "強気2" },
  },
  {
    phase: "startOfTurn",
    conditions: ["fullPowerCharge>=10"],
    actions: ["setStance(fullPower)", "fullPowerCharge-=10"],
    group: -1,
    source: { type: "default", id: "全力" },
  },
  {
    phase: "stanceChanged",
    conditions: ["stance==fullPower"],
    actions: [
      "cardUsesRemaining+=1",
      "addHeldCardsToHand",
      "fullPowerTimes+=1",
    ],
    source: { type: "default", id: "全力" },
  },
];

DEFAULT_EFFECTS.forEach((effect) => {
  effect.conditions = effect.conditions.map((x) => x.split(TOKEN_REGEX));
  effect.actions = effect.actions.map((x) => x.split(TOKEN_REGEX));
});

export const UNFRESH_PHASES = ["startOfTurn", "everyTurn"];
export const CHANGE_TRIGGER_PHASES = ["card", "cost"];

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
  "scoreBuffs",
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
  "strengthTimes",
  "preservationTimes",
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
  "turnCardsUsed",
  "turnCardsUpgraded",
  "thisCardHeld",
  "usedCard",

  // Effects
  "effects",
  "phase",

  // Growth
  "g.score",
  "g.scoreTimes",
  "g.cost",
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
  "hajikeruMizushibukiTurnUsed",
  "nullifyHold",
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
];

export const DEBUFF_FIELDS = [
  S.doubleCostTurns,
  S.costIncrease,
  S.nullifyGenkiTurns,
  S.noActiveTurns,
  S.noMentalTurns,
  S.poorConditionTurns,
  S.lockStanceTurns,
];

export const INCREASE_TRIGGER_FIELDS = [
  S.goodImpressionTurns,
  S.motivation,
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
