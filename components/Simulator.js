import { PItems, SkillCards } from "gakumas-data";
import IdolConfig from "@/simulator/IdolConfig";
import StageConfig from "@/simulator/StageConfig";
import StageEngine from "@/simulator/StageEngine";

const P_ITEMS = [101, 73, 71].map(PItems.getById);
const SKILL_CARDS = [
  309, 311, 36, 35, 164, 145, 260, 35, 111, 85, 162, 5, 7, 1, 1, 15, 15, 17, 17,
].map(SkillCards.getById);
const CRITERIA = { vocal: 0.1, dance: 0.45, visual: 0.45 };

const stageConfig = new StageConfig(
  { vocal: 1, dance: 4, visual: 3 },
  ["dance"],
  CRITERIA
);

console.log(stageConfig);

const idolConfig = new IdolConfig(
  { vocal: 1588, dance: 1406, visual: 827, stamina: 48 },
  0.0226,
  CRITERIA,
  P_ITEMS,
  SKILL_CARDS
);

console.log(idolConfig);

const stageEngine = new StageEngine(stageConfig, idolConfig);

console.log(stageEngine);

let state = stageEngine.getInitialState();

console.log(JSON.parse(JSON.stringify(state)));

state = stageEngine.startStage(state);

console.log(JSON.parse(JSON.stringify(state)));

let loopCount = 0;
while (state.turnsRemaining > 0) {
  loopCount += 1;

  const usableCards = state.handCards.filter((card) =>
    stageEngine.isCardUsable(state, card)
  );
  if (usableCards.length) {
    state = stageEngine.useCard(state, usableCards[0]);
  } else {
    state = stageEngine.endTurn(state);
  }
  console.log(JSON.parse(JSON.stringify(state)));

  if (loopCount > 100) {
    console.log("inf loop");
    break;
  }
}

console.log(JSON.parse(JSON.stringify(state)));
