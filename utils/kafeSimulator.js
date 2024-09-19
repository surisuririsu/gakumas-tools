import { PItems, SkillCards } from "gakumas-data/lite";
import { IdolConfig } from "@/simulator/engine";
import KAFE_CARD_MAP from "@/generated/kafeCardMap.json";
import KAFE_ITEM_MAP from "@/generated/kafeItemMap.json";
import KAFE_P_IDOL_MAP from "@/generated/kafePIdolMap.json";
import KAFE_STAGE_MAP from "@/generated/kafeStageMap.json";
import { comparePItems } from "./sort";

const KAFE_URL_BASE = "https://katabami83.github.io/gakumas_contest_simulator";

export function generateKafeUrl(
  stage,
  supportBonus,
  params,
  pItemIds,
  skillCardIdGroups
) {
  const idolConfig = new IdolConfig(
    params,
    supportBonus,
    pItemIds,
    skillCardIdGroups,
    stage
  );

  // Convert stage id
  const kafeStage = KAFE_STAGE_MAP[stage.id];

  // Convert parameters
  const status = Object.values(idolConfig.typeMultipliers)
    .map((s) => Math.round(s * 100))
    .concat(idolConfig.params.stamina);

  // Convert p-item ids
  const itemSimulatorIds = pItemIds
    .map(PItems.getById)
    .filter((p) => p)
    .sort(comparePItems)
    .map((p) => KAFE_ITEM_MAP[p.id] || -1);
  while (itemSimulatorIds.length < 4) {
    itemSimulatorIds.unshift(-1);
  }

  // Convert skill card ids
  const groups = skillCardIdGroups.slice();
  while (groups.length < 2) {
    groups.push([0, 0, 0, 0, 0, 0]);
  }
  const cardSimulatorIds = groups.slice(0, 2).map((cg) => {
    const cards = cg.map(SkillCards.getById);
    const signatureCard = cards.find((c) => c?.sourceType == "pIdol");
    const signatureCardKafeId = KAFE_CARD_MAP[signatureCard?.id] || -1;
    const nonSignatureCardKafeIds = cards.map((c) =>
      c?.sourceType == "pIdol" ? -1 : KAFE_CARD_MAP[c?.id] || -1
    );
    const emptyIndex = nonSignatureCardKafeIds.indexOf(-1);
    if (emptyIndex != -1) nonSignatureCardKafeIds.splice(emptyIndex, 1);
    return [signatureCardKafeId, ...nonSignatureCardKafeIds];
  });

  // Build search query
  const simulatorParams = new URLSearchParams();
  simulatorParams.set("contest_stage", kafeStage);
  simulatorParams.set("p_idol", KAFE_P_IDOL_MAP[idolConfig.pIdolId]);
  simulatorParams.set("status", status.join(":"));
  simulatorParams.set("p_item_ids", itemSimulatorIds.join(":"));
  simulatorParams.set(
    "cards",
    cardSimulatorIds.map((cg) => cg.join(":")).join("_")
  );

  return `${KAFE_URL_BASE}/?${simulatorParams.toString()}`;
}
