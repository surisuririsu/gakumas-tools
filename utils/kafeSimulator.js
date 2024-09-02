import { PItems, SkillCards } from "gakumas-data";
import { IdolConfig } from "gakumas-engine";
import KAFE_CARD_MAP from "@/generated/kafeCardMap.json";
import KAFE_ITEM_MAP from "@/generated/kafeItemMap.json";
import KAFE_P_IDOL_IDS_BY_KAFE_CARD_ID from "@/generated/kafePIdolIdsByKafeCardId.json";
import KAFE_STAGE_MAP from "@/generated/kafeStageMap.json";

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
    .filter((i) => PItems.getById(i) && PItems.getById(i).sourceType != "pIdol")
    .map((i) => KAFE_ITEM_MAP[i] || -1);

  // Convert skill card ids
  const groups = skillCardIdGroups.slice();
  while (groups.length < 2) {
    groups.push([0, 0, 0, 0, 0, 0]);
  }
  const mainIdolCard = groups[0]
    .map((cid) => SkillCards.getById(cid))
    .find((c) => c?.sourceType == "pIdol");
  const subIdolCard = groups[1]
    .map((cid) => SkillCards.getById(cid))
    .find((c) => c?.sourceType == "pIdol");
  const mainIdolCardSimulatorId = KAFE_CARD_MAP[mainIdolCard?.id] || -1;
  const subIdolCardSimulatorId = KAFE_CARD_MAP[subIdolCard?.id] || -1;
  const cardSimulatorIds = groups
    .slice(0, 2)
    .map((cg, idx) =>
      [idx ? subIdolCardSimulatorId : mainIdolCardSimulatorId].concat(
        cg
          .filter(
            (cid) =>
              SkillCards.getById(cid) &&
              SkillCards.getById(cid).sourceType != "pIdol"
          )
          .map((cid) => KAFE_CARD_MAP[cid] || -1)
      )
    );

  // Build search query
  const simulatorParams = new URLSearchParams();
  simulatorParams.set("contest_stage", kafeStage);
  simulatorParams.set(
    "p_idol",
    `${KAFE_P_IDOL_IDS_BY_KAFE_CARD_ID[mainIdolCardSimulatorId] || -1}:${
      KAFE_P_IDOL_IDS_BY_KAFE_CARD_ID[subIdolCardSimulatorId] || -1
    }`
  );
  simulatorParams.set("status", status.join(":"));
  simulatorParams.set("p_items", itemSimulatorIds.join(":"));
  simulatorParams.set(
    "cards",
    cardSimulatorIds.map((cg) => cg.join(":")).join("_")
  );

  return `${KAFE_URL_BASE}/?${simulatorParams.toString()}`;
}
