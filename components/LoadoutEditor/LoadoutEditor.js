import { useContext, useEffect, useState } from "react";
import Button from "@/components/Button";
import DistributionPlot from "@/components/DistributionPlot";
import Loader from "@/components/Loader";
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
import { NUM_RUNS, BUCKET_SIZE } from "@/utils/simulator";
import styles from "./LoadoutEditor.module.scss";

const DEFAULT_CARDS_BY_PLAN = {
  sense: [5, 7, 1, 1, 15, 15, 17, 17],
  logic: [9, 11, 19, 19, 21, 21, 13, 13],
};
const LOGGING_ENABLED = false;

export default function LoadoutEditor() {
  const { params, setParams, pItemIds, skillCardIdGroups, clear } =
    useContext(LoadoutContext);
  const { plan } = useContext(WorkspaceContext);
  const [simulatorData, setSimulatorData] = useState(null);
  const [running, setRunning] = useState(false);

  function simulate() {
    const criteria = { vocal: 0.1, dance: 0.45, visual: 0.45 };
    const [vocal, dance, visual, stamina] = params;

    const stageConfig = new StageConfig(
      { vocal: 2, dance: 6, visual: 4 },
      ["dance"],
      criteria
    );

    const idolConfig = new IdolConfig(
      plan,
      { vocal, dance, visual, stamina },
      0,
      criteria,
      pItemIds.filter((id) => id),
      DEFAULT_CARDS_BY_PLAN[plan]
        .concat(...skillCardIdGroups)
        .filter((id) => id)
    );

    let runs = [];

    for (let i = 0; i < NUM_RUNS; i++) {
      const stageEngine = new StageEngine(stageConfig, idolConfig);
      const strategy = new DeepScoreStrategy(stageEngine, 2);

      stageEngine.loggingEnabled = LOGGING_ENABLED;
      let state = stageEngine.getInitialState();
      state = stageEngine.startStage(state);
      stageEngine.loggingEnabled = false;

      while (state.turnsRemaining > 0) {
        const cardToUse = strategy.chooseCard(state);
        stageEngine.loggingEnabled = LOGGING_ENABLED;
        if (cardToUse) {
          state = stageEngine.useCard(state, cardToUse);
        } else {
          state = stageEngine.endTurn(state);
        }
        stageEngine.loggingEnabled = false;
      }

      runs.push(state.score);
    }

    let data = {};
    for (let i = 0; i < runs.length; i++) {
      const bucket = Math.floor(runs[i] / BUCKET_SIZE);
      data[bucket] = (data[bucket] || 0) + 1;
    }
    const minKey = Math.min(...Object.keys(data));
    const maxKey = Math.max(...Object.keys(data));
    for (let i = minKey - 1; i <= maxKey + 1; i++) {
      if (!data[i]) data[i] = 0;
    }

    setSimulatorData(data);
    setRunning(false);
  }

  useEffect(() => {
    if (running) {
      setTimeout(simulate, 10);
    }
  }, [running]);

  return (
    <div className={styles.loadoutEditor}>
      <div>
        <label>Parameters</label>
        <div className={styles.params}>
          <ParametersInput
            parameters={params}
            onChange={setParams}
            withStamina
          />
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

        <div className={styles.simulateButton}>
          <Button
            style="red"
            onClick={() => {
              if (confirm("Are you sure you want to clear the loadout?")) {
                clear();
              }
            }}
          >
            Clear all
          </Button>
          <Button onClick={() => setRunning(true)} disabled={running}>
            Estimate score distribution
          </Button>
          {running && (
            <div className={styles.loader}>
              <Loader />
            </div>
          )}
        </div>
      </div>

      {simulatorData && (
        <div className={styles.chart}>
          <DistributionPlot data={simulatorData} />
          <b>
            This feature is in development. Statistics and logs will be added in
            the future.
          </b>
        </div>
      )}
    </div>
  );
}
