import { SkillCards } from "gakumas-data/lite";
import {
  calculateSkillCardCost,
  COST_RANGES_BY_RANK,
} from "@/utils/contestPower";

// Recursive function to generate all combinations of a specified length
function generateCombinations(cards, length) {
  if (length == 0) return [[]];
  return cards.reduce(
    (acc, cur, i) =>
      acc.concat(
        generateCombinations(cards.slice(i + 1), length - 1).map(
          (combination) => [cur].concat(combination)
        )
      ),
    []
  );
}

export function generatePossibleMemories(skillCardIds, rank) {
  // Get cost range based on rank
  const { min: minCost, max: maxCost } = COST_RANGES_BY_RANK[rank];

  // Get skill card data from ids
  const skillCards = [...new Set(skillCardIds.filter((id) => id))].map(
    SkillCards.getById
  );

  // Separate skill cards by support/produce
  let supportSkillCards = [];
  let produceSkillCards = [];
  for (let card of skillCards) {
    if (card.sourceType == "produce") {
      produceSkillCards.push(card);
    } else if (
      card.sourceType == "support" &&
      !skillCards.find((other) => other.name == `${card.name}+`)
    ) {
      supportSkillCards.push(card);
    }
  }
  produceSkillCards.sort((a, b) => b.contestPower - a.contestPower);

  // Generate initial combinations of support cards (up to 1)
  let preLotteryCombinations = [];
  if (!supportSkillCards.length) {
    preLotteryCombinations.push([]);
  }
  for (let supportSkillCard of supportSkillCards) {
    preLotteryCombinations.push([supportSkillCard]);
  }

  // Generate combinations of remaining cards for each support card chosen
  let fullCombinations = [];
  for (let preLotteryCombination of preLotteryCombinations) {
    // Number of lottery slots is up to 5 or 4 depending on whether a support card is selected
    // or the number of produce cards acquired if less than that
    const lotterySlots = Math.min(
      5 - preLotteryCombination.length,
      produceSkillCards.length
    );

    // Reduce number of lottery slots until we find a viable combination
    // or we reach 0 slots
    let maxCombinedCost;
    let remainingSlots = lotterySlots;
    while (true) {
      // If no possible combinations, add lonely memory
      if (remainingSlots == 0) {
        fullCombinations.push({
          skillCards: preLotteryCombination,
          probability: 1 / preLotteryCombinations.length,
        });
        break;
      }

      // Generate all combinations based on remaining slots
      let stepCombinations = [];
      for (let combination of generateCombinations(
        produceSkillCards,
        remainingSlots
      )) {
        // Remove combinations that contain upgraded and non-upgraded version of the same card
        const names = combination.map((c) => c.name);
        if (names.some((name) => names.includes(`${name}+`))) {
          continue;
        }

        // Calculate cost of this combination
        const combinationCost = calculateSkillCardCost(
          preLotteryCombination.concat(combination).map(({ id }) => id)
        );

        // Remove combinations that cost too much
        if (combinationCost > maxCost) {
          continue;
        }

        // Record the highest cost combination
        if (!maxCombinedCost) {
          maxCombinedCost = combinationCost;
        }

        // If this combination has the highest possible cost in the acquired cards
        // and is below minimum cost for the rank, add it to possible combinations
        if (maxCombinedCost < minCost && maxCombinedCost === combinationCost) {
          stepCombinations.push(preLotteryCombination.concat(combination));
          continue;
        }

        // Remove combinations that cost too little
        if (combinationCost < minCost) {
          continue;
        }

        // Add valid combination
        stepCombinations.push(preLotteryCombination.concat(combination));
      }

      // If we found combinations at the current number of slots, end the lottery
      if (stepCombinations.length) {
        fullCombinations = fullCombinations.concat(
          stepCombinations.map((combination) => ({
            skillCards: combination,
            probability:
              1 / preLotteryCombinations.length / stepCombinations.length,
          }))
        );
        break;
      }

      // Otherwise, reduce the number of slots
      remainingSlots--;
    }
  }

  return fullCombinations.map(({ skillCards, probability }) => ({
    skillCardIds: skillCards.map(({ id }) => id),
    probability,
  }));
}
