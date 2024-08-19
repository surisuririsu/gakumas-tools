import IdolConfig from "@/simulator/IdolConfig";
import { PItems, SkillCards, Stages } from "gakumas-data";
import { ContestData } from "gakumas_contest_simulator/scripts/simulator/data/contestData";
import { PIdolData as SimulatorPIdols } from "gakumas_contest_simulator/scripts/simulator/data/pIdolData";
import { PItemData as SimulatorPItems } from "gakumas_contest_simulator/scripts/simulator/data/pItemData";
import { SkillCardData as SimulatorSkillCards } from "gakumas_contest_simulator/scripts/simulator/data/skillCardData";

export const KAFE_CONTEST_STAGES = ContestData.getAll().reduce((acc, cur) => {
  const stages = cur.stages
    .map((stage, stageIdx) => {
      const normalizedName = `${cur.name} ${stage.name}`.normalize("NFKC");
      const match = normalizedName.match(/第(\d+)回.*ステージ(\d+)/);
      if (!match) return null;
      return {
        id: `${cur.id}:${stageIdx}`,
        seasonStage: `${match[1]}-${match[2]}`,
      };
    })
    .filter((s) => s);
  return stages.concat(acc);
}, []);

const KAFE_ITEM_IDS_BY_NAME = SimulatorPItems.getAll().reduce(
  (acc, cur) => ({
    ...acc,
    [cur.name]: cur.id,
  }),
  {}
);

const KAFE_CARD_IDS_BY_NAME = SimulatorSkillCards.getAll().reduce(
  (acc, cur) => ({
    ...acc,
    [cur.name]: cur.id,
  }),
  {}
);

const KAFE_STAGES_BY_SEASON_STAGE = KAFE_CONTEST_STAGES.reduce(
  (acc, cur) => ({
    ...acc,
    [cur.seasonStage]: cur.id,
  }),
  {}
);

const KAFE_P_IDOL_IDS_BY_KAFE_CARD_ID = SimulatorPIdols.getAll().reduce(
  (acc, cur) => ({
    ...acc,
    [cur.unique_skillCard_id]: cur.id,
    [cur.unique_skillCard_id + 1]: cur.id,
  }),
  {}
);

const KAFE_ITEM_NAME_FIXUPS = {
  140: "コール＆レスポンス",
  141: "コール＆レスポンス+",
  148: "２００％スマイル",
  149: "２００％スマイル+",
  280: "ＰＯＷ！",
  281: "ＰＯＷ！+",
};

const KAFE_ITEM_MAP = PItems.getAll().reduce((acc, cur) => {
  acc[cur.id] = KAFE_ITEM_IDS_BY_NAME[cur.name] || -1;
  return acc;
}, {});

const KAFE_CARD_MAP = SkillCards.getAll().reduce((acc, cur) => {
  acc[cur.id] =
    KAFE_CARD_IDS_BY_NAME[KAFE_ITEM_NAME_FIXUPS[cur.id] || cur.name] || -1;
  return acc;
}, {});

const KAFE_STAGE_MAP = Stages.getAll().reduce((acc, cur) => {
  acc[cur.id] =
    KAFE_STAGES_BY_SEASON_STAGE[`${cur.season}-${cur.stage}`] || "-1:-1";
  return acc;
}, {});

const MISMATCHED_ITEMS = PItems.getAll().filter(
  (item) => KAFE_ITEM_MAP[item.id] === -1
);
const MISMATCHED_CARDS = SkillCards.getAll().filter(
  (card) => KAFE_CARD_MAP[card.id] === -1
);

const KAFE_URL_BASE = "https://katabami83.github.io/gakumas_contest_simulator";

export function generateKafeUrl(
  stage,
  supportBonus,
  params,
  pItemIds,
  skillCardIdGroups
) {
  const kafeStage = KAFE_STAGE_MAP[stage.id];
  const idolConfig = new IdolConfig(
    params,
    supportBonus,
    pItemIds,
    skillCardIdGroups,
    stage
  );
  const status = Object.values(idolConfig.typeMultipliers)
    .map((s) => s * 100)
    .concat(idolConfig.params.stamina);
  const itemSimulatorIds = pItemIds
    .filter((i) => PItems.getById(i) && PItems.getById(i).sourceType != "pIdol")
    .map((i) => KAFE_ITEM_MAP[i] || -1);
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

if (MISMATCHED_ITEMS.length) console.log("Mismatched items", MISMATCHED_ITEMS);
if (MISMATCHED_CARDS.length) console.log("Mismatched cards", MISMATCHED_CARDS);
