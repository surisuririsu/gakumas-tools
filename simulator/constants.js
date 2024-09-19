export const SYNC = false;
export const DEBUG = false;
export const NUM_RUNS = 2000;
export const BUCKET_SIZE = 1000;
export const MAX_WORKERS = 8;
export const FALLBACK_STAGE = {
  turnCounts: { vocal: 4, dance: 4, visual: 4 },
  firstTurns: [0.33, 0.33, 0.33],
  criteria: {
    vocal: 0,
    dance: 0,
    visual: 0,
  },
  effects: [],
};

export const STRINGS = {
  turnsRemaining: "残りターン数",
  cardUsesRemaining: "スキルカード使用数",
  stamina: "体力",
  genki: "元気",
  score: "スコア",
  goodConditionTurns: "好調",
  perfectConditionTurns: "絶好調",
  concentration: "集中",
  goodImpressionTurns: "好印象",
  motivation: "やる気",
  halfCostTurns: "消費体力減少",
  doubleCostTurns: "消費体力増加",
  costReduction: "消費体力削減",
  costIncrease: "消費体力追加",
  doubleCardEffectCards: "スキルカード追加発動",
  nullifyGenkiTurns: "元気増加無効",
  scoreBuff: "スコア上昇量増加",
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
