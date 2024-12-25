import { PIdols, PItems, SkillCards } from "gakumas-data/lite";

export default class IdolConfig {
  constructor(loadout) {
    const {
      params,
      supportBonus,
      pItemIds,
      skillCardIdGroups,
      customizationGroups,
    } = loadout;

    console.log(customizationGroups);

    let cards = [];
    for (let i = 0; i < skillCardIdGroups.length; i++) {
      for (let j = 0; j < skillCardIdGroups[i].length; j++) {
        if (skillCardIdGroups[i][j]) {
          cards.push({
            id: skillCardIdGroups[i][j],
            customizations: customizationGroups?.[i]?.[j],
          });
        }
      }
    }

    // P-items and skill cards
    this.pItemIds = [...new Set(pItemIds.filter((id) => id))];
    this.cards = this.getDedupedCards(cards);
    const skillCardIds = cards.map((c) => c.id);

    // P-idol
    this.pIdolId = this.inferPIdolId(this.pItemIds, skillCardIds);
    const pIdol = PIdols.getById(this.pIdolId);
    if (pIdol) {
      this.idolId = pIdol.idolId;
      this.plan = pIdol.plan;
      this.recommendedEffect = pIdol.recommendedEffect;
    }
    if (!this.plan) {
      this.plan = this.inferPlan(this.pItemIds, skillCardIds);
    }

    // Params
    const [vocal, dance, visual, stamina] = params.map((p) => p || 0);
    this.params = { vocal, dance, visual, stamina };
    this.supportBonus = supportBonus || 0;
  }

  inferPIdolId(pItemIds, skillCardIds) {
    const signaturePItemId = pItemIds.find(
      (id) => PItems.getById(id)?.sourceType == "pIdol"
    );
    if (signaturePItemId) return PItems.getById(signaturePItemId).pIdolId;

    const signatureSkillCardId = skillCardIds.find(
      (id) => SkillCards.getById(id)?.sourceType == "pIdol"
    );
    if (signatureSkillCardId)
      return SkillCards.getById(signatureSkillCardId).pIdolId;

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

  getDedupedCards(cards) {
    const sortedCards = cards.sort((a, b) => b.id - a.id);

    let dedupedCards = [];

    for (let i = 0; i < sortedCards.length; i++) {
      const skillCard = SkillCards.getById(sortedCards[i].id);
      if (skillCard.unique) {
        const baseId = skillCard.upgraded ? skillCard.id - 1 : skillCard.id;
        if (dedupedCards.some((d) => [baseId, baseId + 1].includes(d.id))) {
          continue;
        }
      }
      dedupedCards.push(sortedCards[i]);
    }

    return dedupedCards;
  }
}
