export const PARAM_BONUS_BY_PLACE = {
  "1st": 30,
  "2nd": 20,
  "3rd": 10,
  Other: 0,
};

export const RATING_BY_PLACE = {
  "1st": 1700,
  "2nd": 900,
  "3rd": 500,
  Other: 0,
};

export const TARGET_RATING_BY_RANK = {
  "S+": 14500,
  S: 13000,
  "A+": 11500,
  A: 10000,
  "B+": 8000,
  B: 6000,
  "C+": 4500,
  C: 3000,
};

export const REVERSE_RATING_REGIMES = [
  { threshold: 3650, base: 40000, multiplier: 0.01 },
  { threshold: 3450, base: 30000, multiplier: 0.02 },
  { threshold: 3050, base: 20000, multiplier: 0.04 },
  { threshold: 2250, base: 10000, multiplier: 0.08 },
  { threshold: 1500, base: 5000, multiplier: 0.15 },
  { threshold: 0, base: 0, multiplier: 0.3 },
];
