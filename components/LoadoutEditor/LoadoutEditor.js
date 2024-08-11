import { useContext, useState } from "react";
import { Stages } from "gakumas-data";
import Button from "@/components/Button";
import Loader from "@/components/Loader";
import LoadoutSkillCardGroup from "@/components/LoadoutSkillCardGroup";
import ParametersInput from "@/components/ParametersInput";
import SimulatorResult from "@/components/SimulatorResult";
import StagePItems from "@/components/StagePItems";
import StageSelect from "@/components/StageSelect";
import Trash from "@/components/Trash";
import LoadoutContext from "@/contexts/LoadoutContext";
import WorkspaceContext from "@/contexts/WorkspaceContext";
import IdolConfig from "@/simulator/IdolConfig";
import StageConfig from "@/simulator/StageConfig";
import {
  BUCKET_SIZE,
  FALLBACK_STAGE,
  MAX_WORKERS,
  NUM_RUNS,
  SYNC,
} from "@/simulator/constants";
import { simulate } from "@/simulator/worker";
import { getPlannerUrl } from "@/utils/planner";
import styles from "./LoadoutEditor.module.scss";

export default function LoadoutEditor() {
  const {
    stageId,
    setStageId,
    params,
    setParams,
    pItemIds,
    skillCardIdGroups,
    clear,
  } = useContext(LoadoutContext);
  const { plan, idolId } = useContext(WorkspaceContext);
  const [simulatorData, setSimulatorData] = useState(null);
  const [running, setRunning] = useState(false);

  const stage = Stages.getById(stageId) || FALLBACK_STAGE;
  const idolConfig = new IdolConfig(
    params,
    0,
    pItemIds,
    skillCardIdGroups,
    stage,
    plan
  );

  function setResult(result) {
    const { minRun, averageRun, maxRun, averageScore, scores } = result;

    let data = {};
    for (let score of scores) {
      const bucket = Math.floor(score / BUCKET_SIZE);
      data[bucket] = (data[bucket] || 0) + 1;
    }

    const minKey = Math.floor(minRun.score / BUCKET_SIZE);
    const maxKey = Math.floor(maxRun.score / BUCKET_SIZE);
    for (let i = minKey - 1; i <= maxKey + 1; i++) {
      if (!data[i]) data[i] = 0;
    }

    console.timeEnd("simulation");

    setSimulatorData({
      buckets: data,
      minScore: minRun.score,
      maxScore: maxRun.score,
      averageScore,
      minRun,
      maxRun,
      averageRun,
    });
    setRunning(false);
  }

  function runSimulation() {
    setRunning(true);

    console.time("simulation");

    const stageConfig = new StageConfig(stage);

    if (SYNC) {
      const result = simulate(stageConfig, idolConfig, NUM_RUNS);
      setResult(result);
    } else {
      let numWorkers = 1;
      if (navigator.hardwareConcurrency) {
        numWorkers = Math.min(navigator.hardwareConcurrency, MAX_WORKERS);
      }
      const runsPerWorker = Math.round(NUM_RUNS / numWorkers);

      let promises = [];
      for (let i = 0; i < numWorkers; i++) {
        promises.push(
          new Promise((resolve) => {
            const worker = new Worker(
              new URL("../../simulator/worker.js", import.meta.url)
            );
            worker.onmessage = (e) => {
              resolve(e.data);
              worker.terminate();
            };
            worker.postMessage({
              stageConfig,
              idolConfig,
              numRuns: runsPerWorker,
            });
          })
        );
      }

      Promise.all(promises).then((results) => {
        let scores = [];
        for (let result of results) {
          scores = scores.concat(result.scores);
        }
        const averageScore = Math.round(
          scores.reduce((acc, cur) => acc + cur, 0) / scores.length
        );

        let minRun, averageRun, maxRun;
        for (let result of results) {
          if (!minRun || result.minRun.score < minRun.score) {
            minRun = result.minRun;
          }
          if (!maxRun || result.maxRun.score > maxRun.score) {
            maxRun = result.maxRun;
          }
          if (
            !averageRun ||
            Math.abs(result.averageRun.score - averageScore) <
              Math.abs(averageRun.score - averageScore)
          ) {
            averageRun = result.averageRun;
          }
        }

        setResult({
          minRun,
          averageRun,
          maxRun,
          averageScore,
          scores,
        });
      });
    }
  }

  return (
    <div id="loadout_editor" className={styles.loadoutEditor}>
      <div className={styles.configurator}>
        <label>Stage</label>
        <StageSelect stageId={stageId} setStageId={setStageId} />

        <label>Parameters</label>
        <div className={styles.params}>
          <ParametersInput
            parameters={params}
            onChange={setParams}
            withStamina
            max={10000}
          />
          <div className={styles.typeMultipliers}>
            {Object.keys(idolConfig.typeMultipliers).map((param) => (
              <div key={param}>
                {Math.round(idolConfig.typeMultipliers[param] * 100)}%
              </div>
            ))}
            <div />
          </div>
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

        <a
          className={styles.plannerLink}
          href={getPlannerUrl(plan, idolId, pItemIds, skillCardIdGroups)}
          target="_blank"
        >
          Open in Gakumas Contest Planner
        </a>

        <div className={styles.simulateButton}>
          <Button
            style="red"
            onClick={() => {
              if (confirm("Are you sure you want to clear the loadout?")) {
                clear();
                setStageId(null);
              }
            }}
          >
            Clear all
          </Button>

          <Button onClick={runSimulation} disabled={running}>
            Simulate
          </Button>

          {running && (
            <div className={styles.loader}>
              <Loader />
            </div>
          )}
        </div>
      </div>

      {simulatorData && (
        <SimulatorResult data={simulatorData} idolId={idolConfig.idolId} />
      )}
    </div>
  );
}
