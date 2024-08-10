import { PItems, SkillCards, Stages } from "gakumas-data";

export function inferPlan(pItemIds, skillCardIdGroups, stageId, workspacePlan) {
  const signaturePItem = pItemIds
    .map(PItems.getById)
    .find((p) => p?.sourceType == "pIdol");
  if (signaturePItem) return signaturePItem.plan;
  const signatureSkillCard = skillCardIdGroups[0]
    .map(SkillCards.getById)
    .find((s) => s?.sourceType == "pIdol");
  if (signatureSkillCard) return signatureSkillCard.plan;
  const stage = Stages.getById(stageId);
  if (stage && stage.plan != "free") return stage.plan;
  return workspacePlan;
}
