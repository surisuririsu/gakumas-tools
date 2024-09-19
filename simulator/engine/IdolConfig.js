import { PIdols, PItems, SkillCards } from "gakumas-data/lite";

const DEFAULT_CARDS_BY_PLAN = {
  sense: [5, 7, 1, 1, 15, 15, 17, 17],
  logic: [9, 11, 19, 19, 21, 21, 13, 13],
};

export default class IdolConfig {
  constructor(
    params,
    supportBonus,
    pItemIds,
    skillCardIdGroups,
    stage,
    fallbackPlan,
    fallbackIdolId
  ) {
    const skillCardIds = [].concat(...skillCardIdGroups).filter((id) => id);

    this.pIdolId = this.inferPIdolId(pItemIds, skillCardIds);
    this.idolId = PIdols.getById(this.pIdolId)?.idolId || fallbackIdolId;
    this.plan = this.inferPlan(this.pIdolId, stage.plan, fallbackPlan);
    this.recommendedEffect = this.inferRecommendedEffect(this.pIdolId);

    const [vocal, dance, visual, stamina] = params.map((p) => p || 0);
    this.params = { vocal, dance, visual, stamina };
    this.supportBonus = supportBonus || 0;
    this.typeMultipliers = this.getTypeMultipliers(
      this.params,
      this.supportBonus,
      stage.criteria
    );

    this.pItemIds = [...new Set(pItemIds.filter((id) => id))];
    this.skillCardIds = this.getDedupedSkillCardIds(
      skillCardIds.concat(DEFAULT_CARDS_BY_PLAN[this.plan])
    );
  }

  inferPIdolId(pItemIds, skillCardIds) {
    const signaturePItem = pItemIds
      .map(PItems.getById)
      .find((p) => p?.sourceType == "pIdol");
    if (signaturePItem) return signaturePItem.pIdolId;

    const signatureSkillCard = skillCardIds
      .map(SkillCards.getById)
      .find((s) => s?.sourceType == "pIdol");
    if (signatureSkillCard) return signatureSkillCard.pIdolId;

    return null;
  }

  inferPlan(pIdolId, stagePlan, fallbackPlan) {
    if (pIdolId) {
      const pIdol = PIdols.getById(pIdolId);
      return pIdol.plan;
    }

    if (stagePlan && stagePlan != "free") return stagePlan;

    return fallbackPlan;
  }

  inferRecommendedEffect(pIdolId) {
    if (pIdolId) {
      const pIdol = PIdols.getById(pIdolId);
      return pIdol.recommendedEffect;
    }

    return null;
  }

  getTypeMultipliers(params, supportBonus, criteria) {
    let multipliers = {};

    for (let key of Object.keys(criteria)) {
      const param = params[key];
      const criterion = criteria[key];

      let multiplier = param;
      for (let i = 0; i < 5; i++) {
        if (param > 300 * i) {
          multiplier += 300 * i;
        } else {
          multiplier += param;
        }
      }
      multiplier = multiplier * criterion + 100;
      multiplier = Math.ceil(multiplier) * (1 + supportBonus);
      multiplier = Math.ceil(Math.floor(multiplier * 10) / 10);
      multipliers[key] = multiplier / 100;
    }

    return multipliers;
  }

  // If the loadout contains dupes of a unique skill card,
  // keep only the most upgraded copy
  getDedupedSkillCardIds(skillCardIds) {
    const sortedSkillCards = skillCardIds
      .filter((id) => id)
      .map(SkillCards.getById)
      .sort((a, b) => {
        if (a.upgraded) return -1;
        if (b.upgraded) return 1;
        return 0;
      });

    let dedupedIds = [];

    for (let skillCard of sortedSkillCards) {
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
