import { PItems, SkillCards, Stages } from "gakumas-data";

export const DEBUG = false;
export const NUM_RUNS = 1000;
export const BUCKET_SIZE = 1000;
export const FALLBACK_STAGE = {
  turnCounts: { vocal: 4, dance: 4, visual: 4 },
  firstTurns: ["vocal", "dance", "visual"],
  criteria: {
    vocal: 0,
    dance: 0,
    visual: 0,
  },
  effects: [],
};

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
