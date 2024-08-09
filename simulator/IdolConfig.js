import { SkillCards } from "gakumas-data";

const DEFAULT_CARDS_BY_PLAN = {
  sense: [5, 7, 1, 1, 15, 15, 17, 17],
  logic: [9, 11, 19, 19, 21, 21, 13, 13],
};

export default class IdolConfig {
  constructor(
    plan,
    parameters,
    supportBonus,
    criteria,
    pItemIds,
    skillCardIds
  ) {
    this.plan = plan;
    this.parameters = parameters;
    this.supportBonus = supportBonus;
    this.typeMultipliers = this.getTypeMultipliers(
      parameters,
      supportBonus,
      criteria
    );
    this.pItemIds = [...new Set(pItemIds)];
    this.skillCardIds = this.getDedupedSkillCardIds(
      skillCardIds.concat(DEFAULT_CARDS_BY_PLAN[plan])
    );
  }

  getTypeMultipliers(parameters, supportBonus, criteria) {
    return Object.keys(criteria).reduce((acc, cur) => {
      let multiplier = 0;
      if (parameters[cur] > 1200) {
        multiplier = parameters[cur] * 1 + 300 * 10;
      } else if (parameters[cur] > 900) {
        multiplier = parameters[cur] * 2 + 300 * 6;
      } else if (parameters[cur] > 600) {
        multiplier = parameters[cur] * 3 + 300 * 3;
      } else if (parameters[cur] > 300) {
        multiplier = parameters[cur] * 4 + 300 * 1;
      } else if (parameters[cur] > 0) {
        multiplier = parameters[cur] * 5 + 1;
      }
      multiplier = multiplier * criteria[cur] + 100;
      multiplier = Math.ceil(multiplier) * (1 + supportBonus);
      multiplier = Math.ceil(Math.floor(multiplier * 10) / 10);
      acc[cur] = multiplier / 100;
      return acc;
    }, {});
  }

  // If the loadout contains dupes of a unique skill card,
  // keep only the most upgraded copy
  getDedupedSkillCardIds(skillCardIds) {
    let dedupedIds = [];
    const sortedSkillCards = skillCardIds
      .map(SkillCards.getById)
      .sort((a, b) => {
        if (a.upgraded) return -1;
        if (b.upgraded) return 1;
        return 0;
      });
    for (let i = 0; i < sortedSkillCards.length; i++) {
      const skillCard = sortedSkillCards[i];
      if (skillCard.unique) {
        let baseId = skillCard.upgraded ? skillCard.id - 1 : skillCard.id;
        if (
          dedupedIds.indexOf(baseId) !== -1 ||
          dedupedIds.indexOf(baseId + 1) !== -1
        ) {
          continue;
        }
      }
      dedupedIds.push(skillCard.id);
    }
    return dedupedIds;
  }
}
