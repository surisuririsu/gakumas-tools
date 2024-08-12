"use client";
import { useContext, useEffect, useRef, useState } from "react";
import { FaCheck, FaRegCopy } from "react-icons/fa6";
import { Stages } from "gakumas-data";
import Button from "@/components/Button";
import CostRanges from "@/components/CostRanges";
import DefaultCards from "@/components/DefaultCards";
import Loader from "@/components/Loader";
import LoadoutSkillCardGroup from "@/components/LoadoutSkillCardGroup";
import ParametersInput from "@/components/ParametersInput";
import SimulatorResult from "@/components/SimulatorResult";
import StagePItems from "@/components/StagePItems";
import StageSelect from "@/components/StageSelect";
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
import STRATEGIES from "@/simulator/strategies";
import { simulate } from "@/simulator";
import { generateKafeUrl } from "@/utils/kafeSimulator";
import styles from "./Simulator.module.scss";

export default function Simulator() {
  const {
    stageId,
    setStageId,
    params,
    setParams,
    pItemIds,
    skillCardIdGroups,
    replacePItemId,
    clear,
    simulatorUrl,
  } = useContext(LoadoutContext);
  const { plan } = useContext(WorkspaceContext);
  const [strategy, setStrategy] = useState("HeuristicStrategy");
  const [simulatorData, setSimulatorData] = useState(null);
  const [running, setRunning] = useState(false);
  const [activeSubTool, setActiveSubTool] = useState(null);
  const [linkCopied, setLinkCopied] = useState(false);
  const workersRef = useRef();

  const stage = Stages.getById(stageId) || FALLBACK_STAGE;
  const idolConfig = new IdolConfig(
    params,
    0,
    pItemIds,
    skillCardIdGroups,
    stage,
    plan
  );
  const kafeUrl = generateKafeUrl(pItemIds, skillCardIdGroups, stageId, params);

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

    return () => {
      workersRef.current?.forEach((worker) => worker.terminate());
    };
  }, []);

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

    setTimeout(
      () =>
        document.getElementById("simulator_result").scrollIntoView({
          behavior: "smooth",
        }),
      100
    );
  }

  function runSimulation() {
    setRunning(true);

    console.time("simulation");

    const stageConfig = new StageConfig(stage);

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
    <div id="simulator_loadout" className={styles.loadoutEditor}>
      <div className={styles.configurator}>
        <label>ステージ</label>
        <StageSelect stageId={stageId} setStageId={setStageId} />

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
          />
        ))}

        <div className={styles.expanderButtons}>
          <button
            onClick={() =>
              setActiveSubTool(
                activeSubTool == "costRanges" ? null : "costRanges"
              )
            }
          >
            コスト範囲
          </button>
          <a href={kafeUrl} target="_blank">
            コンテストシミュレーター
            <br />
            (@かふぇもっと)
          </a>
          <button
            onClick={() =>
              setActiveSubTool(
                activeSubTool == "defaultCards" ? null : "defaultCards"
              )
            }
          >
            基本カード
          </button>
        </div>

        {activeSubTool == "costRanges" && <CostRanges />}
        {activeSubTool == "defaultCards" && (
          <DefaultCards plan={idolConfig.plan} idolId={idolConfig.idolId} />
        )}
        <div className={styles.simulateButton}>
          <Button
            style="red-secondary"
            onClick={() => {
              if (confirm("Are you sure you want to clear the loadout?")) {
                clear();
                setStageId(null);
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

        <label>シミュレーター (@risりす)</label>
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

        <div className={styles.simulateButton}>
          <Button onClick={runSimulation} disabled={running}>
            シミュレート
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
