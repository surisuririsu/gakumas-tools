import { PIdols, PItems, SkillCards } from "gakumas-data/lite";

const CONTEST_DEFAULT_CARDS_BY_PLAN = {
  sense: [5, 7, 1, 1, 15, 15, 17, 17],
  logic: [9, 11, 19, 19, 21, 21, 13, 13],
  anomaly: [370, 372, 1, 1, 374, 374, 376, 376],
};

const EVENT_DEFAULT_CARDS_BY_RECOMMENDED_EFFECT = {
  goodConditionTurns: [15, 15, 5, 1, 1, 3, 13, 13],
  concentration: [17, 17, 7, 1, 1, 3, 13, 13],
  goodImpressionTurns: [19, 19, 9, 1, 1, 3, 13, 13],
  motivation: [21, 21, 11, 1, 1, 3, 13, 13],
  preservation: [370, 372, 1, 1, 374, 374, 376, 376],
  strength: [370, 372, 1, 1, 374, 374, 376, 376],
  fullPower: [370, 372, 1, 1, 374, 374, 376, 376],
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
      stage.type,
      this.params,
      this.supportBonus,
      stage.criteria,
      stage.season
    );

    this.pItemIds = [...new Set(pItemIds.filter((id) => id))];

    this.defaultCards = [];
    const defaultCardSet = stage.defaultCardSet || stage.type;
    if (defaultCardSet == "event" && this.recommendedEffect) {
      this.defaultCards =
        EVENT_DEFAULT_CARDS_BY_RECOMMENDED_EFFECT[this.recommendedEffect];
    } else {
      this.defaultCards = CONTEST_DEFAULT_CARDS_BY_PLAN[this.plan];
    }
    this.skillCardIds = this.getDedupedSkillCardIds(
      skillCardIds.concat(this.defaultCards)
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

  getTypeMultipliers(stageType, params, supportBonus, criteria, season) {
    if (stageType == "event") {
      return {
        vocal: params.vocal / 100,
        dance: params.dance / 100,
        visual: params.visual / 100,
      };
    }

    const hasFlatBonus = season == 13;

    let multipliers = {};

    for (let key of Object.keys(criteria)) {
      const param = params[key];
      const criterion = criteria[key];

      let multiplier = 0;
      if (param > 1200) {
        multiplier = param + 300 * 10;
        if (hasFlatBonus) {
          multiplier += param - 1200;
        }
      } else if (param > 900) {
        multiplier = param * 2 + 300 * 6;
      } else if (param > 600) {
        multiplier = param * 3 + 300 * 3;
      } else if (param > 300) {
        multiplier = param * 4 + 300;
      } else if (param > 0) {
        multiplier = param * 5;
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
