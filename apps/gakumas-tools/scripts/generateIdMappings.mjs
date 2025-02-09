import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import IDOLS from "gakumas-data/json/idols.json" assert { type: "json" };
import P_IDOLS from "gakumas-data/json/p_idols.json" assert { type: "json" };
import P_ITEMS from "gakumas-data/json/p_items.json" assert { type: "json" };
import SKILL_CARDS from "gakumas-data/json/skill_cards.json" assert { type: "json" };
import STAGES from "gakumas-data/json/stages.json" assert { type: "json" };
import { data as KAFE_CONTESTS } from "gakumas_contest_simulator/simulator/game/data/contest.js";
import { data as KAFE_P_IDOLS } from "gakumas_contest_simulator/simulator/game/data/pIdol.js";
import { data as KAFE_P_ITEMS } from "gakumas_contest_simulator/simulator/game/data/pItem.js";
import { data as KAFE_SKILL_CARDS } from "gakumas_contest_simulator/simulator/game/data/cards.js";

const IDOL_NAMES_BY_ID = IDOLS.reduce(
  (acc, cur) => ({
    ...acc,
    [cur.id]: cur.name,
  }),
  {}
);

const KAFE_P_IDOL_TITLE_FIXUPS = {
  32: "Yellow Big Bang!",
};

const KAFE_ITEM_NAME_FIXUPS = {
  143: "う～ら〜め〜し～や〜",
  144: "う～ら〜め〜し～や〜+",
};

const KAFE_CARD_NAME_FIXUPS = {
  140: "コール＆レスポンス",
  141: "コール＆レスポンス+",
  148: "２００％スマイル",
  149: "２００％スマイル+",
  280: "ＰＯＷ！",
  281: "ＰＯＷ！+",
};

const KAFE_STAGE_IDS_BY_SEASON_STAGE = KAFE_CONTESTS.reduce((acc, cur) => {
  cur.stages.forEach((stage, i) => {
    const normalizedName = `${cur.name} ${stage.name}`.normalize("NFKC");
    const match = normalizedName.match(/第(\d+)期コンテスト.*ステージ(\d+)/);
    if (!match) return;
    acc[`${match[1]}-${match[2]}`] = `${cur.id}:${i}`;
  });
  return acc;
}, {});

const KAFE_P_IDOL_IDS_BY_NAME_TITLE = KAFE_P_IDOLS.reduce(
  (acc, cur) => ({
    ...acc,
    [`${cur.name}_${cur.episode_name}`]: cur.id,
  }),
  {}
);

const KAFE_ITEM_IDS_BY_NAME = KAFE_P_ITEMS.reduce(
  (acc, cur) => ({
    ...acc,
    [cur.name]: cur.id,
  }),
  {}
);

const KAFE_CARD_IDS_BY_NAME = KAFE_SKILL_CARDS.reduce(
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
      `${IDOL_NAMES_BY_ID[cur.idolId].replaceAll(" ", "")}_${
        KAFE_P_IDOL_TITLE_FIXUPS[cur.id] || cur.title
      }`
    ] || -1;
  return acc;
}, {});

const KAFE_ITEM_MAP = P_ITEMS.reduce((acc, cur) => {
  acc[cur.id] =
    KAFE_ITEM_IDS_BY_NAME[KAFE_ITEM_NAME_FIXUPS[cur.id] || cur.name] || -1;
  return acc;
}, {});

const KAFE_CARD_MAP = SKILL_CARDS.reduce((acc, cur) => {
  acc[cur.id] =
    KAFE_CARD_IDS_BY_NAME[KAFE_CARD_NAME_FIXUPS[cur.id] || cur.name] || -1;
  return acc;
}, {});

const MISMATCHED_STAGES = STAGES.filter(
  (stage) => KAFE_STAGE_MAP[stage.id] === -1
);
const MISMATCHED_P_IDOLS = P_IDOLS.filter(
  (pIdol) => KAFE_P_IDOL_MAP[pIdol.id] === -1
);
const MISMATCHED_ITEMS = P_ITEMS.filter(
  (item) => KAFE_ITEM_MAP[item.id] === -1
);
const MISMATCHED_CARDS = SKILL_CARDS.filter(
  (card) => KAFE_CARD_MAP[card.id] === -1
);

if (MISMATCHED_STAGES.length)
  console.log("Mismatched stages", MISMATCHED_STAGES);
if (MISMATCHED_P_IDOLS.length)
  console.log("Mismatched p-idols", MISMATCHED_P_IDOLS);
if (MISMATCHED_ITEMS.length) console.log("Mismatched items", MISMATCHED_ITEMS);
if (MISMATCHED_CARDS.length) console.log("Mismatched cards", MISMATCHED_CARDS);
console.log(
  "Mismatch count",
  MISMATCHED_STAGES.length +
    MISMATCHED_P_IDOLS.length +
    MISMATCHED_ITEMS.length +
    MISMATCHED_CARDS.length
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
