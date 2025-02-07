export const SYNC = false;
export const DEBUG = false;
export const NUM_RUNS = 2000;
export const BUCKET_SIZE = 1000;
export const MAX_WORKERS = 8;

export const FALLBACK_STAGE = {
  id: "custom",
  type: "custom",
  plan: "free",
  turnCounts: { vocal: 4, dance: 4, visual: 4 },
  firstTurns: {
    vocal: 0.33,
    dance: 0.33,
    visual: 0.33,
  },
  criteria: {
    vocal: 0,
    dance: 0,
    visual: 0,
  },
  effects: [],
};

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

export const CARD_PILES = [
  "deckCards",
  "handCards",
  "discardedCards",
  "removedCards",
];

export const UNFRESH_PHASES = ["startOfTurn", "everyTurn"];

export const COST_FIELDS = [
  "stamina",
  "goodConditionTurns",
  "concentration",
  "goodImpressionTurns",
  "motivation",
  "fullPowerCharge",
];

export const DEBUFF_FIELDS = [
  "doubleCostTurns",
  "costIncrease",
  "nullifyGenkiTurns",
  "noActiveTurns",
  "noMentalTurns",
  "poorConditionTurns",
  "lockStanceTurns",
];

export const EOT_DECREMENT_FIELDS = [
  "goodConditionTurns",
  "perfectConditionTurns",
  "goodImpressionTurns",
  "lockStanceTurns",
  "halfCostTurns",
  "doubleCostTurns",
  "nullifyGenkiTurns",
  "poorConditionTurns",
  "noActiveTurns",
  "noMentalTurns",
];

export const INCREASE_TRIGGER_FIELDS = [
  "goodImpressionTurns",
  "motivation",
  "goodConditionTurns",
  "concentration",
];

export const DECREASE_TRIGGER_FIELDS = ["stamina"];

export const CHANGE_TRIGGER_PHASES = ["card", "cost"];

export const WHOLE_FIELDS = [
  "stamina",
  "genki",
  "goodConditionTurns",
  "perfectConditionTurns",
  "concentration",
  "goodImpressionTurns",
  "motivation",
];

export const LOGGED_FIELDS = [
  "stamina",
  "genki",
  "stance",
  "score",
  "goodConditionTurns",
  "perfectConditionTurns",
  "concentration",
  "goodImpressionTurns",
  "motivation",
  "enthusiasm",
  "fullPowerCharge",
  "lockStanceTurns",
  "halfCostTurns",
  "doubleCostTurns",
  "costReduction",
  "costIncrease",
  "doubleCardEffectCards",
  "nullifyGenkiTurns",
  "nullifyDebuff",
  "poorConditionTurns",
  "nullifyCostCards",
  "turnsRemaining",
  "cardUsesRemaining",
  "noActiveTurns",
  "noMentalTurns",
];

export const GRAPHED_FIELDS = [
  "stamina",
  "genki",
  "score",
  "goodConditionTurns",
  "concentration",
  "goodImpressionTurns",
  "motivation",
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

export const GROWABLE_FIELDS = [
  "genki",
  "goodConditionTurns",
  "perfectConditionTurns",
  "concentration",
  "goodImpressionTurns",
  "motivation",
  "fullPowerCharge",
  "halfCostTurns",
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

export const HOLD_SOURCES_BY_ALIAS = {
  hand: S.handCards,
  deck: S.deckCards,
  discards: S.discardedCards,
};
