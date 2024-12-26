"use client";
import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { IdolConfig, StageConfig, IdolStageConfig } from "@/simulator/config";
import Button from "@/components/Button";
import Input from "@/components/Input";
import KofiAd from "@/components/KofiAd";
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
import { bucketScores, getMedianScore, mergeResults } from "@/utils/simulator";
import SimulatorButtons from "./SimulatorButtons";
import SimulatorSubTools from "./SimulatorSubTools";
import styles from "./Simulator.module.scss";

export default function Simulator() {
  const t = useTranslations("Simulator");

  const {
    stage,
    loadout,
    setSupportBonus,
    setParams,
    replacePItemId,
    pushLoadoutHistory,
  } = useContext(LoadoutContext);
  const { plan, idolId } = useContext(WorkspaceContext);
  const [strategy, setStrategy] = useState("HeuristicStrategy");
  const [simulatorData, setSimulatorData] = useState(null);
  const [running, setRunning] = useState(false);
  const workersRef = useRef();

  const idolConfig = new IdolConfig(loadout);
  const stageConfig = new StageConfig(stage);
  const idolStageConfig = new IdolStageConfig(idolConfig, stageConfig);

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

  useEffect(() => {
    if (simulatorData) {
      document.getElementById("simulator_result").scrollIntoView({
        behavior: "smooth",
      });
    }
  }, [simulatorData]);

  const setResult = useCallback(
    (result) => {
      const bucketedScores = bucketScores(result.scores);
      const medianScore = getMedianScore(result.scores);

      console.timeEnd("simulation");

      setSimulatorData({ bucketedScores, medianScore, ...result });
      setRunning(false);
    },
    [setSimulatorData, setRunning]
  );

  function runSimulation() {
    setRunning(true);

    console.time("simulation");

    if (SYNC || !workersRef.current) {
      const result = simulate(idolStageConfig, strategy, NUM_RUNS);
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
              idolStageConfig,
              strategyName: strategy,
              numRuns: runsPerWorker,
            });
          })
        );
      }

      Promise.all(promises).then((results) => {
        const mergedResults = mergeResults(results);
        setResult(mergedResults);
        pushLoadoutHistory();
      });
    }
  }

  return (
    <div id="simulator_loadout" className={styles.loadoutEditor}>
      <div className={styles.configurator}>
        {/* <>
          ※ Season 16 preview is based only on the announced p-items and
          criteria. Turn types are not yet known.
        </> */}
        <StageSelect />
        {stage.type == "event" ? (
          t("enterPercents")
        ) : (
          <div className={styles.supportBonusInput}>
            <label>{t("supportBonus")}</label>
            <Input
              type="number"
              value={parseFloat(((loadout.supportBonus || 0) * 100).toFixed(2))}
              onChange={(value) =>
                setSupportBonus(parseFloat((value / 100).toFixed(4)))
              }
            />
          </div>
        )}

        <div className={styles.params}>
          <ParametersInput
            parameters={loadout.params}
            onChange={setParams}
            withStamina
            max={10000}
          />
          <div className={styles.typeMultipliers}>
            {Object.keys(idolStageConfig.typeMultipliers).map((param) => (
              <div key={param}>
                {Math.round(idolStageConfig.typeMultipliers[param] * 100)}%
              </div>
            ))}
            <div />
          </div>
        </div>
        <StagePItems
          pItemIds={loadout.pItemIds}
          replacePItemId={replacePItemId}
          size="medium"
        />
        {loadout.skillCardIdGroups.map((skillCardIdGroup, i) => (
          <LoadoutSkillCardGroup
            key={i}
            skillCardIds={skillCardIdGroup}
            customizations={loadout.customizationGroups[i]}
            groupIndex={i}
            idolId={idolConfig.idolId || idolId}
          />
        ))}
        <SimulatorSubTools defaultCardIds={idolStageConfig.defaultCardIds} />
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
          {running ? <Loader /> : t("simulate")}
        </Button>
        <SimulatorButtons />
        <div className={styles.subLinks}>
          <a
            href="https://github.com/surisuririsu/gakumas-tools/blob/master/simulator/CHANGELOG.md"
            target="_blank"
          >
            {t("lastUpdated")}: 2024-12-27
          </a>
        </div>
        {!simulatorData && (
          <div className={styles.ad}>
            <KofiAd />
          </div>
        )}
      </div>

      {simulatorData && (
        <SimulatorResult
          data={simulatorData}
          idolId={idolConfig.idolId || idolId}
          plan={idolConfig.plan || plan}
        />
      )}
    </div>
  );
}
