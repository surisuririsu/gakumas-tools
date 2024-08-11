import { PIdols, PItems, SkillCards, Stages } from "gakumas-data";

export function inferPIdolId(pItemIds, skillCardIds) {
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

export function inferPlan(pItemIds, skillCardIds, stagePlan, workspacePlan) {
  const pIdolId = inferPIdolId(pItemIds, skillCardIds);
  if (pIdolId) {
    const pIdol = PIdols.getById(pIdolId);
    return pIdol.plan;
  }

  if (stagePlan && stagePlan != "free") return stagePlan;

  return workspacePlan;
}

export function inferRecommendedEffect(pItemIds, skillCardIds) {
  const pIdolId = inferPIdolId(pItemIds, skillCardIds);
  if (pIdolId) {
    const pIdol = PIdols.getById(pIdolId);
    return pIdol.recommendedEffect;
  }
  return null;
}
