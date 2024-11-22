import { PIdols, PItems, SkillCards } from "gakumas-data/lite";

export default class IdolConfig {
  constructor(loadout) {
    const { params, supportBonus, pItemIds, skillCardIdGroups } = loadout;
    const skillCardIds = [].concat(...skillCardIdGroups).filter((id) => id);

    // P-items and skill cards
    this.pItemIds = [...new Set(pItemIds.filter((id) => id))];
    this.skillCardIds = this.getDedupedSkillCardIds(skillCardIds);

    // P-idol
    this.pIdolId = this.inferPIdolId(this.pItemIds, this.skillCardIds);
    const pIdol = PIdols.getById(this.pIdolId);
    if (pIdol) {
      this.idolId = pIdol.idolId;
      this.plan = pIdol.plan;
      this.recommendedEffect = pIdol.recommendedEffect;
    }
    if (!this.plan) {
      this.plan = this.inferPlan(this.pItemIds, this.skillCardIds);
    }

    // Params
    const [vocal, dance, visual, stamina] = params.map((p) => p || 0);
    this.params = { vocal, dance, visual, stamina };
    this.supportBonus = supportBonus || 0;
  }

  inferPIdolId(pItemIds, skillCardIds) {
    const signatureSkillCardId = skillCardIds.find(
      (id) => SkillCards.getById(id)?.sourceType == "pIdol"
    );
    if (signatureSkillCardId)
      return SkillCards.getById(signatureSkillCardId).pIdolId;

    const signaturePItemId = pItemIds.find(
      (id) => PItems.getById(id)?.sourceType == "pIdol"
    );
    if (signaturePItemId) return PItems.getById(signaturePItemId).pIdolId;

    return null;
  }

  inferPlan(pItemIds, skillCardIds) {
    for (let id of skillCardIds) {
      const { plan } = SkillCards.getById(id);
      if (plan != "free") return plan;
    }
    for (let id of pItemIds) {
      const { plan } = PItems.getById(id);
      if (plan != "free") return plan;
    }
    return null;
  }

  // If the loadout contains dupes of a unique skill card,
  // keep only the most upgraded copy
  getDedupedSkillCardIds(skillCardIds) {
    const sortedSkillCardIds = skillCardIds.sort((a, b) => b - a);

    let dedupedIds = [];

    for (let i = 0; i < sortedSkillCardIds.length; i++) {
      const skillCard = SkillCards.getById(sortedSkillCardIds[i]);
      if (skillCard.unique) {
        const baseId = skillCard.upgraded ? skillCard.id - 1 : skillCard.id;
        if (dedupedIds.some((d) => [baseId, baseId + 1].includes(d))) {
          continue;
        }
      }
      dedupedIds.push(skillCard.id);
    }

    return dedupedIds;
  }
}
