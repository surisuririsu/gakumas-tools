import { useContext, useState } from "react";
import { PItems, SkillCards } from "gakumas-data";
import Button from "@/components/Button";
import LoadoutSkillCardGroup from "@/components/LoadoutSkillCardGroup";
import ParametersInput from "@/components/ParametersInput";
import StagePItems from "@/components/StagePItems";
import Trash from "@/components/Trash";
import LoadoutContext from "@/contexts/LoadoutContext";
import WorkspaceContext from "@/contexts/WorkspaceContext";
import IdolConfig from "@/simulator/IdolConfig";
import StageConfig from "@/simulator/StageConfig";
import StageEngine from "@/simulator/StageEngine";
import DeepScoreStrategy from "@/simulator/strategies/DeepScoreStrategy";
import styles from "./LoadoutEditor.module.scss";

const DEFAULT_CARDS_BY_PLAN = {
  sense: [5, 7, 1, 1, 15, 15, 17, 17],
  logic: [9, 11, 19, 19, 21, 21, 13, 13],
};

export default function LoadoutEditor() {
  const { pItemIds, skillCardIdGroups } = useContext(LoadoutContext);
  const { plan } = useContext(WorkspaceContext);
  const [params, setParams] = useState([977, 1413, 1496, 46]); //([null, null, null, null]);

  async function simulate() {
    const criteria = { vocal: 0.1, dance: 0.45, visual: 0.45 };
    const [vocal, dance, visual, stamina] = params;

    const stageConfig = new StageConfig(
      { vocal: 2, dance: 6, visual: 4 },
      ["dance"],
      criteria
    );

    const idolConfig = new IdolConfig(
      { vocal, dance, visual, stamina },
      0,
      criteria,
      pItemIds.filter((id) => id),
      DEFAULT_CARDS_BY_PLAN[plan]
        .concat(...skillCardIdGroups)
        .filter((id) => id)
    );

    let runs = [];

    console.time("100");
    for (let i = 0; i < 100; i++) {
      const stageEngine = new StageEngine(stageConfig, idolConfig);
      const strategy = new DeepScoreStrategy(stageEngine, 2);

      let state = stageEngine.getInitialState();
      state = stageEngine.startStage(state);

      while (state.turnsRemaining > 0) {
        const cardToUse = strategy.chooseCard(state);
        if (cardToUse) {
          state = stageEngine.useCard(state, cardToUse);
        } else {
          state = stageEngine.endTurn(state);
        }
      }

      runs.push(state.score);
    }
    console.timeEnd("100");

    console.log(
      Math.min(...runs),
      runs.reduce((acc, cur) => acc + cur, 0) / runs.length,
      Math.max(...runs)
    );
  }

  return (
    <div className={styles.loadoutEditor}>
      <label>Parameters</label>
      <div className={styles.params}>
        <ParametersInput parameters={params} onChange={setParams} withStamina />
      </div>

      <label>P-items</label>
      <StagePItems pItemIds={pItemIds} region="loadoutEditor" size="small" />

      <label>Skill cards</label>
      {skillCardIdGroups.map((skillCardIdGroup, i) => (
        <LoadoutSkillCardGroup
          key={i}
          skillCardIds={skillCardIdGroup}
          groupIndex={i}
        />
      ))}

      <Trash />

      <div>
        <Button onClick={simulate}>Simulate</Button>
      </div>
    </div>
  );
}
