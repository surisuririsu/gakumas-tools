import { SkillCards } from "gakumas-data";
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
    let hasOverCostCombination = false;
    let remainingSlots = lotterySlots;
    let subCombinations = [];
    while (true) {
      // If no possible combinations, add lonely memory
      if (remainingSlots == 0) {
        break;
      }

      // Generate all combinations based on remaining slots
      let hasInRangeCostCombination = false;
      let maxCombinedCost;
      let stepCombinations = [];
      const combinations = generateCombinations(
        produceSkillCards,
        remainingSlots
      );
      for (let combination of combinations) {
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
          hasOverCostCombination = true;
          continue;
        }

        // Record the highest cost combination below max cost
        if (!maxCombinedCost) {
          maxCombinedCost = combinationCost;
        }

        // If there are no combinations within cost range, then if there is a
        // combination higher than max cost, add all combinations lower than min
        // cost. Otherwise, add only the highest possible cost combination.
        if (maxCombinedCost < minCost) {
          if (hasOverCostCombination || maxCombinedCost === combinationCost) {
            stepCombinations.push(preLotteryCombination.concat(combination));
            continue;
          }
        }

        // Remove combinations that cost too little
        if (combinationCost < minCost) {
          continue;
        }

        hasInRangeCostCombination = true;

        // Add valid combination
        stepCombinations.push(preLotteryCombination.concat(combination));
      }

      // If we found in-range combinations at the current number of slots, end the lottery
      if (hasInRangeCostCombination) {
        subCombinations = stepCombinations.map((combination) => ({
          skillCards: combination,
          probability:
            1 / preLotteryCombinations.length / stepCombinations.length,
        }));
        break;
      }

      // If we found out-of-range combinations at the current number of slots
      // And none for higher numbers, set to current step
      if (stepCombinations.length && !subCombinations.length) {
        subCombinations = stepCombinations.map((combination) => ({
          skillCards: combination,
          probability:
            1 / preLotteryCombinations.length / stepCombinations.length,
        }));
      }

      // Reduce the number of slots
      remainingSlots--;
    }

    if (!subCombinations.length) {
      subCombinations.push({
        skillCards: preLotteryCombination,
        probability: 1 / preLotteryCombinations.length,
      });
    }

    fullCombinations = fullCombinations.concat(subCombinations);
  }

  return fullCombinations.map(({ skillCards, probability }) => ({
    skillCardIds: skillCards.map(({ id }) => id),
    probability,
  }));
}
