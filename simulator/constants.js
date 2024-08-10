export const SYNC = false;
export const DEBUG = false;
export const NUM_RUNS = 1000;
export const BUCKET_SIZE = 1000;
export const MAX_WORKERS = 8;
export const FALLBACK_STAGE = {
  turnCounts: { vocal: 4, dance: 4, visual: 4 },
  firstTurns: ["vocal", "dance", "visual"],
  criteria: {
    vocal: 0,
    dance: 0,
    visual: 0,
  },
  effects: [],
};

export const DEBUFF_FIELDS = ["doubleCostTurns", "nullifyGenkiTurns"];

export const COST_FIELDS = [
  "stamina",
  "goodConditionTurns",
  "concentration",
  "goodImpressionTurns",
  "motivation",
];

export const EOT_DECREMENT_FIELDS = [
  "goodConditionTurns",
  "perfectConditionTurns",
  "goodImpressionTurns",
  "halfCostTurns",
  "doubleCostTurns",
  "nullifyGenkiTurns",
];

export const INCREASE_TRIGGER_FIELDS = [
  "goodImpressionTurns",
  "motivation",
  "goodConditionTurns",
  "concentration",
];

export const DECREASE_TRIGGER_FIELDS = ["stamina"];

export const LOGGED_FIELDS = [
  "turnsRemaining",
  "cardUsesRemaining",
  "stamina",
  "genki",
  "score",
  "goodConditionTurns",
  "perfectConditionTurns",
  "concentration",
  "goodImpressionTurns",
  "motivation",
  "oneTurnScoreBuff",
  "permanentScoreBuff",
  "halfCostTurns",
  "doubleCostTurns",
  "costReduction",
  "doubleCardEffectCards",
  "nullifyGenkiTurns",
];

export const WHOLE_FIELDS = [
  "stamina",
  "genki",
  "goodConditionTurns",
  "perfectConditionTurns",
  "concentration",
  "goodImpressionTurns",
  "motivation",
];
