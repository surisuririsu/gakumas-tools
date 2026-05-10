// Available rank labels, ordered from highest to lowest. These map directly
// to icons in /public/ranks/ and define the canonical display order for tiers.
export const AVAILABLE_RANKS = [
  "S4",
  "SSS+",
  "SSS",
  "SS+",
  "SS",
  "S+",
  "S",
  "A+",
  "A",
  "B+",
  "B",
  "C+",
  "C",
  "D",
  "E",
  "F",
];

const RANK_INDEX = AVAILABLE_RANKS.reduce((acc, r, i) => {
  acc[r] = i;
  return acc;
}, {});

export function sortRanks(tiers) {
  return [...tiers].sort((a, b) => {
    const ai = RANK_INDEX[a] ?? Infinity;
    const bi = RANK_INDEX[b] ?? Infinity;
    return ai - bi;
  });
}
