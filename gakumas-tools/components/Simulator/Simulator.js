"use client";
import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useTranslations } from "next-intl";
import { Tooltip } from "react-tooltip";
import {
  IdolConfig,
  StageConfig,
  IdolStageConfig,
  STRATEGIES,
} from "gakumas-engine";
import Button from "@/components/Button";
import Input from "@/components/Input";
import KofiAd from "@/components/KofiAd";
import Loader from "@/components/Loader";
import LoadoutEditor from "@/components/LoadoutEditor";
import LoadoutSummary from "@/components/LoadoutHistory/LoadoutSummary";
import SimulatorResult from "@/components/SimulatorResult";
import StageSelect from "@/components/StageSelect";
import LoadoutContext from "@/contexts/LoadoutContext";
import LoadoutHistoryContext from "@/contexts/LoadoutHistoryContext";
import WorkspaceContext from "@/contexts/WorkspaceContext";
import { simulate } from "@/simulator";
import { MAX_WORKERS, DEFAULT_NUM_RUNS, SYNC } from "@/simulator/constants";
import { logEvent } from "@/utils/logging";
import { bucketScores, getMedianScore, mergeResults } from "@/utils/simulator";
import SimulatorButtons from "./SimulatorButtons";
import SimulatorSubTools from "./SimulatorSubTools";
import styles from "./Simulator.module.scss";

export default function Simulator() {
  const t = useTranslations("Simulator");

  const {
    stage,
    loadout,
    simulatorUrl,
    setSupportBonus,
    loadouts,
    setLoadout,
    currentLoadoutIndex,
    setCurrentLoadoutIndex,
  } = useContext(LoadoutContext);
  const { pushLoadoutHistory, pushLoadoutsHistory } = useContext(
    LoadoutHistoryContext
  );
  const { plan, idolId } = useContext(WorkspaceContext);
  const [strategy, setStrategy] = useState("HeuristicStrategy");
  const [simulatorData, setSimulatorData] = useState(null);
  const [running, setRunning] = useState(false);
  const [numRuns, setNumRuns] = useState(DEFAULT_NUM_RUNS);
  const workersRef = useRef();

  const config = useMemo(() => {
    const idolConfig = new IdolConfig(loadout);
    const stageConfig = new StageConfig(stage);
    return new IdolStageConfig(idolConfig, stageConfig);
  }, [loadout, stage, loadouts]);

  const linkConfigs = useMemo(() => {
    if (stage.type !== "linkContest") return null;
    return loadouts.map((ld) => {
      const idolConfig = new IdolConfig(ld);
      const stageConfig = new StageConfig(stage);
      return new IdolStageConfig(idolConfig, stageConfig);
    });
  }, [loadouts, stage]);

  // Set up web workers on mount
  useEffect(() => {
    let numWorkers = 1;
    if (navigator.hardwareConcurrency) {
      numWorkers = Math.min(navigator.hardwareConcurrency, MAX_WORKERS);
    }
    setNumRuns(Math.floor((numWorkers * 250) / 200) * 200);

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
      const { bucketedScores, bucketSize } = bucketScores(result.scores);
      const medianScore = getMedianScore(result.scores);

      console.timeEnd("simulation");

      setSimulatorData({ bucketedScores, medianScore, bucketSize, ...result });
      setRunning(false);
    },
    [setSimulatorData, setRunning]
  );

  function runSimulation() {
    setRunning(true);

    console.time("simulation");

    if (SYNC || !workersRef.current) {
      const result = simulate(config, linkConfigs, strategy, numRuns);
      setResult(result);
    } else {
      const numWorkers = workersRef.current.length;
      const runsPerWorker = Math.round(numRuns / numWorkers);

      let promises = [];
      for (let i = 0; i < numWorkers; i++) {
        promises.push(
          new Promise((resolve) => {
            workersRef.current[i].onmessage = (e) => resolve(e.data);
            workersRef.current[i].postMessage({
              idolStageConfig: config,
              linkConfigs: linkConfigs,
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
        if (stage.type === "linkContest") {
          pushLoadoutsHistory();
        }

        logEvent("simulator.simulate", {
          stageId: stage.id,
          idolId: config.idol.idolId,
          page_location: simulatorUrl,
          minScore: mergedResults.minRun.score,
          averageScore: mergedResults.averageScore,
          maxScore: mergedResults.maxRun.score,
        });
      });
    }
  }

  return (
    <div id="simulator_loadout" className={styles.loadoutEditor}>
      <div className={styles.configurator}>
        <div>{t("multiplierNote")}</div>
        {stage.preview && <div>{t("previewNote")}</div>}
        <StageSelect />
        {stage.type !== "contest" ? (
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
        {stage.type == "linkContest" && <div>{t("linkContestNote")}</div>}
        {stage.type == "linkContest" ? (
          <div className={styles.loadoutTabs}>
            {loadouts.map((loadout, index) => (
              <div key={index} className={styles.loadoutTab}>
                {/* <div className={styles.loadoutTabButtons}> */}
                <button
                  className={styles.selectButton}
                  onClick={() => {
                    setLoadout(loadouts[index]);
                    setCurrentLoadoutIndex(index);
                  }}
                >
                  {index + 1}
                </button>
                {/* <button
                  className={styles.deleteButton}
                  onClick={() => {
                    const newLoadouts = loadouts.filter((_, i) => i !== index);
                    setCurrentLoadoutIndex(
                      currentLoadoutIndex >= newLoadouts.length
                        ? newLoadouts.length - 1
                        : currentLoadoutIndex
                    );
                    setLoadouts(newLoadouts);
                  }}
                >
                  <FaXmark />
                </button> */}
                {/* </div> */}
                {index === currentLoadoutIndex ? (
                  <LoadoutEditor
                    config={config}
                    idolId={config.idol.idolId || idolId}
                  />
                ) : (
                  <div
                    className={styles.loadoutSummary}
                    onClick={() => {
                      setLoadout(loadouts[index]);
                      setCurrentLoadoutIndex(index);
                    }}
                  >
                    <LoadoutSummary loadout={loadout} showStage={false} />
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <LoadoutEditor
            config={config}
            idolId={config.idol.idolId || idolId}
          />
        )}

        <SimulatorSubTools defaultCardIds={config.defaultCardIds} />
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
        <input
          type="range"
          value={numRuns}
          onChange={(e) => setNumRuns(parseInt(e.target.value, 10))}
          min={200}
          max={4000}
          step={200}
        />
        <Button style="blue" onClick={runSimulation} disabled={running}>
          {running ? <Loader /> : `${t("simulate")} (n=${numRuns})`}
        </Button>
        <SimulatorButtons />
        {/* <div className={styles.url}>{simulatorUrl}</div> */}
        <div className={styles.subLinks}>
          {/* <a
            href={`https://docs.google.com/forms/d/e/1FAIpQLScNquedw8Lp2yVfZjoBFMjQxIFlX6-rkzDWIJTjWPdQVCJbiQ/viewform?usp=pp_url&entry.1787906485=${encodeURIComponent(
              simulatorUrl
            )}`}
            target="_blank"
          >
            {t("provideData")}
          </a> */}
          <a
            href="https://github.com/surisuririsu/gakumas-tools/blob/master/gakumas-tools/simulator/CHANGELOG.md"
            target="_blank"
          >
            {t("lastUpdated")}: 2025-11-17
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
          idolId={config.idol.idolId || idolId}
          plan={config.idol.plan || plan}
        />
      )}

      <Tooltip id="indications-tooltip" />
    </div>
  );
}
