"use client";
import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { FaArrowUpRightFromSquare, FaCheck, FaRegCopy } from "react-icons/fa6";
import { IdolConfig, StageConfig } from "gakumas-engine";
import Button from "@/components/Button";
import Input from "@/components/Input";
import Loader from "@/components/Loader";
import LoadoutSkillCardGroup from "@/components/LoadoutSkillCardGroup";
import ParametersInput from "@/components/ParametersInput";
import SimulatorResult from "@/components/SimulatorResult";
import StagePItems from "@/components/StagePItems";
import StageSelect from "@/components/StageSelect";
import LoadoutContext from "@/contexts/LoadoutContext";
import WorkspaceContext from "@/contexts/WorkspaceContext";
import { simulate } from "@/simulator";
import { MAX_WORKERS, NUM_RUNS, SYNC } from "@/simulator/constants";
import STRATEGIES from "@/simulator/strategies";
import { bucketScores, mergeResults } from "@/utils/simulator";
import SimulatorSubTools from "./SimulatorSubTools";
import styles from "./Simulator.module.scss";

export default function Simulator() {
  const {
    stage,
    supportBonus,
    setSupportBonus,
    params,
    setParams,
    pItemIds,
    skillCardIdGroups,
    replacePItemId,
    clear,
    simulatorUrl,
    kafeUrl,
  } = useContext(LoadoutContext);
  const { plan, idolId } = useContext(WorkspaceContext);
  const [strategy, setStrategy] = useState("HeuristicStrategy");
  const [simulatorData, setSimulatorData] = useState(null);
  const [running, setRunning] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const workersRef = useRef();

  const idolConfig = new IdolConfig(
    params,
    supportBonus,
    pItemIds,
    skillCardIdGroups,
    stage,
    plan,
    idolId
  );
  const stageConfig = new StageConfig(stage);

  // Set up web workers on mount
  useEffect(() => {
    let numWorkers = 1;
    if (navigator.hardwareConcurrency) {
      numWorkers = Math.min(navigator.hardwareConcurrency, MAX_WORKERS);
    }

    workersRef.current = [];
    for (let i = 0; i < numWorkers; i++) {
      workersRef.current.push(
        new Worker(new URL("../../simulator/worker.js", import.meta.url))
      );
    }

    return () => workersRef.current?.forEach((worker) => worker.terminate());
  }, []);

  const setResult = useCallback(
    (result) => {
      const { minRun, averageRun, maxRun, averageScore, scores, graphData } =
        result;
      const bucketedScores = bucketScores(scores);

      console.timeEnd("simulation");

      setSimulatorData({
        scores,
        bucketedScores,
        minScore: minRun.score,
        maxScore: maxRun.score,
        averageScore,
        minRun,
        maxRun,
        averageRun,
        graphData,
      });
      setRunning(false);

      setTimeout(
        () =>
          document.getElementById("simulator_result").scrollIntoView({
            behavior: "smooth",
          }),
        100
      );
    },
    [setSimulatorData, setRunning]
  );

  function runSimulation() {
    setRunning(true);

    console.time("simulation");

    if (SYNC || !workersRef.current) {
      const result = simulate(stageConfig, idolConfig, strategy, NUM_RUNS);
      setResult(result);
    } else {
      const numWorkers = workersRef.current.length;
      const runsPerWorker = Math.round(NUM_RUNS / numWorkers);

      let promises = [];
      for (let i = 0; i < numWorkers; i++) {
        promises.push(
          new Promise((resolve) => {
            workersRef.current[i].onmessage = (e) => resolve(e.data);
            workersRef.current[i].postMessage({
              stageConfig,
              idolConfig,
              strategy,
              numRuns: runsPerWorker,
            });
          })
        );
      }

      Promise.all(promises).then((results) => {
        const mergedResults = mergeResults(results);
        setResult(mergedResults);
      });
    }
  }

  return (
    <div id="simulator_loadout" className={styles.loadoutEditor}>
      <div className={styles.configurator}>
        <label>ステージ</label>
        <StageSelect />

        <label>サポートボーナス%</label>
        <div className={styles.supportBonusInput}>
          <Input
            type="number"
            value={parseFloat(((supportBonus || 0) * 100).toFixed(2))}
            onChange={(value) =>
              setSupportBonus(parseFloat((value / 100).toFixed(4)))
            }
          />
        </div>

        <label>パラメータ</label>
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

        <label>Pアイテム</label>
        <StagePItems
          pItemIds={pItemIds}
          replacePItemId={replacePItemId}
          size="small"
        />

        <label>スキルカード</label>
        {skillCardIdGroups.map((skillCardIdGroup, i) => (
          <LoadoutSkillCardGroup
            key={i}
            skillCardIds={skillCardIdGroup}
            groupIndex={i}
            idolId={idolConfig.idolId}
          />
        ))}

        <SimulatorSubTools plan={idolConfig.plan} idolId={idolConfig.idolId} />

        <div className={styles.buttons}>
          <Button
            style="red-secondary"
            onClick={() => {
              if (confirm("Are you sure you want to clear the loadout?")) {
                clear();
              }
            }}
          >
            クリア
          </Button>

          <Button
            style="secondary"
            onClick={() => {
              navigator.clipboard.writeText(simulatorUrl);
              setLinkCopied(true);
              setTimeout(() => setLinkCopied(false), 3000);
            }}
          >
            {linkCopied ? (
              <FaCheck />
            ) : (
              <>
                <FaRegCopy />
                URL
              </>
            )}
          </Button>
        </div>

        <label>シミュレーター</label>
        <select
          className={styles.strategySelect}
          value={strategy}
          onChange={(e) => setStrategy(e.target.value)}
        >
          {Object.keys(STRATEGIES).map((strategy) => (
            <option key={strategy} value={strategy}>
              {strategy}
            </option>
          ))}
        </select>

        <Button style="blue" onClick={runSimulation} disabled={running}>
          {running ? <Loader /> : "実行"}
        </Button>

        {kafeUrl && (
          <Button style="blue-secondary" href={kafeUrl} target="_blank">
            @かふぇもっと <FaArrowUpRightFromSquare />
          </Button>
        )}
      </div>

      {simulatorData && (
        <SimulatorResult data={simulatorData} idolId={idolConfig.idolId} />
      )}
    </div>
  );
}
