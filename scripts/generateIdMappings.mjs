import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import IDOLS from "gakumas-data/json/idols.json" assert { type: "json" };
import P_IDOLS from "gakumas-data/json/p_idols.json" assert { type: "json" };
import P_ITEMS from "gakumas-data/json/p_items.json" assert { type: "json" };
import SKILL_CARDS from "gakumas-data/json/skill_cards.json" assert { type: "json" };
import STAGES from "gakumas-data/json/stages.json" assert { type: "json" };
import { ContestData } from "gakumas_contest_simulator/scripts/simulator/data/contestData.js";
import { PIdolData } from "gakumas_contest_simulator/scripts/simulator/data/pIdolData.js";
import { PItemData } from "gakumas_contest_simulator/scripts/simulator/data/pItemData.js";
import { SkillCardData } from "gakumas_contest_simulator/scripts/simulator/data/skillCardData.js";

const IDOL_NAMES_BY_ID = IDOLS.reduce(
  (acc, cur) => ({
    ...acc,
    [cur.id]: cur.name,
  }),
  {}
);

const KAFE_P_IDOL_TITLE_FIXUPS = {
  "Yellow Big Bang!": "Yellow Big Bang！",
};

const KAFE_CARD_NAME_FIXUPS = {
  140: "コール＆レスポンス",
  141: "コール＆レスポンス+",
  148: "２００％スマイル",
  149: "２００％スマイル+",
  280: "ＰＯＷ！",
  281: "ＰＯＷ！+",
};

const KAFE_STAGE_IDS_BY_SEASON_STAGE = ContestData.getAll().reduce(
  (acc, cur) => {
    cur.stages.forEach((stage, i) => {
      const normalizedName = `${cur.name} ${stage.name}`.normalize("NFKC");
      const match = normalizedName.match(/第(\d+)期コンテスト.*ステージ(\d+)/);
      if (!match) return;
      acc[`${match[1]}-${match[2]}`] = `${cur.id}:${i}`;
    });
    return acc;
  },
  {}
);

const KAFE_P_IDOL_IDS_BY_NAME_TITLE = PIdolData.getAll().reduce(
  (acc, cur) => ({
    ...acc,
    [`${cur.name}_${
      KAFE_P_IDOL_TITLE_FIXUPS[cur.episode_name] || cur.episode_name
    }`]: cur.id,
  }),
  {}
);

const KAFE_ITEM_IDS_BY_NAME = PItemData.getAll().reduce(
  (acc, cur) => ({
    ...acc,
    [cur.name]: cur.id,
  }),
  {}
);

const KAFE_CARD_IDS_BY_NAME = SkillCardData.getAll().reduce(
  (acc, cur) => ({
    ...acc,
    [cur.name]: cur.id,
  }),
  {}
);

const KAFE_STAGE_MAP = STAGES.reduce((acc, cur) => {
  acc[cur.id] =
    KAFE_STAGE_IDS_BY_SEASON_STAGE[`${cur.season}-${cur.stage}`] || "-1:-1";
  return acc;
}, {});

const KAFE_P_IDOL_MAP = P_IDOLS.reduce((acc, cur) => {
  acc[cur.id] =
    KAFE_P_IDOL_IDS_BY_NAME_TITLE[
      `${IDOL_NAMES_BY_ID[cur.idolId].replaceAll(" ", "")}_${cur.title}`
    ] || -1;
  return acc;
}, {});

const KAFE_ITEM_MAP = P_ITEMS.reduce((acc, cur) => {
  acc[cur.id] = KAFE_ITEM_IDS_BY_NAME[cur.name] || -1;
  return acc;
}, {});

const KAFE_CARD_MAP = SKILL_CARDS.reduce((acc, cur) => {
  acc[cur.id] =
    KAFE_CARD_IDS_BY_NAME[KAFE_CARD_NAME_FIXUPS[cur.id] || cur.name] || -1;
  return acc;
}, {});

const MISMATCHED_ITEMS = P_ITEMS.filter(
  (item) => KAFE_ITEM_MAP[item.id] === -1
);
const MISMATCHED_CARDS = SKILL_CARDS.filter(
  (card) => KAFE_CARD_MAP[card.id] === -1
);

if (MISMATCHED_ITEMS.length) console.log("Mismatched items", MISMATCHED_ITEMS);
if (MISMATCHED_CARDS.length) console.log("Mismatched cards", MISMATCHED_CARDS);
console.log(
  "Mismatch count",
  MISMATCHED_ITEMS.length + MISMATCHED_CARDS.length
);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const generatedDir = path.join(__dirname, "../generated");

if (!fs.existsSync(generatedDir)) {
  fs.mkdirSync(generatedDir);
}
fs.writeFileSync(
  path.join(generatedDir, "kafeStageMap.json"),
  JSON.stringify(KAFE_STAGE_MAP)
);
fs.writeFileSync(
  path.join(generatedDir, "kafePIdolMap.json"),
  JSON.stringify(KAFE_P_IDOL_MAP)
);
fs.writeFileSync(
  path.join(generatedDir, "kafeItemMap.json"),
  JSON.stringify(KAFE_ITEM_MAP)
);
fs.writeFileSync(
  path.join(generatedDir, "kafeCardMap.json"),
  JSON.stringify(KAFE_CARD_MAP)
);
