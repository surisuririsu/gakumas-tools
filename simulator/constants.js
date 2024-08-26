export const SYNC = false;
export const DEBUG = false;
export const NUM_RUNS = 2000;
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

export const GRAPHED_FIELDS = [
  "stamina",
  "genki",
  "score",
  "goodConditionTurns",
  "concentration",
  "goodImpressionTurns",
  "motivation",
];
