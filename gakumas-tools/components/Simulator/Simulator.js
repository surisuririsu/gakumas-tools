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
import { FaArrowsRotate, FaHashtag, FaPercent } from "react-icons/fa6";
import { Tooltip } from "react-tooltip";
import {
  IdolConfig,
  StageConfig,
  IdolStageConfig,
  STRATEGIES,
  StageEngine,
  StagePlayer,
  S,
} from "gakumas-engine";
import Button from "@/components/Button";
import IconButton from "@/components/IconButton";
import Input from "@/components/Input";
import KofiAd from "@/components/KofiAd";
import Loader from "@/components/Loader";
import LoadoutEditor from "@/components/LoadoutEditor";
import LoadoutSummary from "@/components/LoadoutHistory/LoadoutSummary";
import SimulatorResult from "@/components/SimulatorResult";
import StageSelect from "@/components/StageSelect";
import StrategyPicker from "@/components/StrategyPicker";
import LoadoutContext from "@/contexts/LoadoutContext";
import LoadoutHistoryContext from "@/contexts/LoadoutHistoryContext";
import WorkspaceContext from "@/contexts/WorkspaceContext";
import { simulate } from "@/simulator";
import { MAX_WORKERS, DEFAULT_NUM_RUNS, SYNC } from "@/simulator/constants";
import { bucketScores, getMedianScore, mergeResults } from "@/utils/simulator";
import ManualPlay from "./ManualPlay";
import SimulatorButtons from "./SimulatorButtons";
import SimulatorSubTools from "./SimulatorSubTools";
import styles from "./Simulator.module.scss";

const LINK_PHASES = ["OP", "MID", "ED"];

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
  const [enterPercents, setEnterPercents] = useState(false);
  const workersRef = useRef();

  const [pendingDecision, setPendingDecision] = useState(null);
  const resolveDecisionRef = useRef(null);

  const config = useMemo(() => {
    const idolConfig = new IdolConfig(loadout);
    const stageConfig = new StageConfig(stage);
    return new IdolStageConfig(idolConfig, stageConfig, enterPercents);
  }, [loadout, stage, enterPercents]);

  const manualInputCallback = useCallback((decision) => {
    return new Promise((resolve) => {
      setPendingDecision(decision);
      resolveDecisionRef.current = resolve;
    });
  }, []);

  const handleDecision = useCallback((value) => {
    if (resolveDecisionRef.current) {
      resolveDecisionRef.current(value);
      resolveDecisionRef.current = null;
      setPendingDecision(null);
    }
  }, []);

  const linkConfigs = useMemo(() => {
    if (stage.type !== "linkContest") return null;
    return loadouts.map((ld) => {
      const idolConfig = new IdolConfig(ld);
      const stageConfig = new StageConfig(stage);
      return new IdolStageConfig(idolConfig, stageConfig, enterPercents);
    });
  }, [loadouts, stage, enterPercents]);

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

  async function startManualPlay() {
    setRunning(true);
    setSimulatorData(null);
    setPendingDecision(null);

    pushLoadoutHistory();
    if (stage.type === "linkContest") {
      pushLoadoutsHistory();
    }

    const engine = new StageEngine(config, linkConfigs);

    const wrappedInputCallback = async (decision) => {
      const currentLogs = decision.state[S.logs].map(
        (logIndex) => engine.logger.logs[logIndex]
      );
      currentLogs[currentLogs.length - 1] = {
        ...currentLogs[currentLogs.length - 1],
        isPending: true,
      };
      setSimulatorData({ logs: currentLogs });
      return await manualInputCallback(decision);
    };

    const ManualStrategy = STRATEGIES["ManualStrategy"];
    const strategy = new ManualStrategy(engine, wrappedInputCallback);
    engine.strategy = strategy;

    const player = new StagePlayer(engine, strategy);
    const result = await player.play();
    setSimulatorData({ logs: result.logs });
    setRunning(false);
  }

  async function runSimulation() {
    setRunning(true);

    console.time("simulation");

    if (SYNC || !workersRef.current) {
      const result = await simulate(config, linkConfigs, strategy, numRuns);
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
          <div className={styles.percentRow}>
            <div className={styles.enterPercentsToggle}>
              <IconButton
                icon={FaArrowsRotate}
                size="small"
                onClick={() => setEnterPercents(!enterPercents)}
              />
              {enterPercents ? <FaPercent /> : <FaHashtag />}
            </div>
            {!enterPercents && (
              <div className={styles.supportBonusInput}>
                <label>{t("supportBonus")}</label>
                <Input
                  type="number"
                  value={parseFloat(
                    ((loadout.supportBonus || 0) * 100).toFixed(2)
                  )}
                  onChange={(value) =>
                    setSupportBonus(parseFloat((value / 100).toFixed(4)))
                  }
                />
              </div>
            )}
          </div>
        )}
        {stage.type == "linkContest" && <div>{t("linkContestNote")}</div>}
        {stage.type == "linkContest" ? (
          <div className={styles.loadoutTabs}>
            {loadouts.map((loadout, index) => (
              <div key={index} className={styles.loadoutTab}>
                <button
                  className={styles.selectButton}
                  onClick={() => {
                    setLoadout(loadouts[index]);
                    setCurrentLoadoutIndex(index);
                  }}
                >
                  {LINK_PHASES[index]}
                </button>
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

        <StrategyPicker
          strategy={strategy}
          setStrategy={(value) => {
            setSimulatorData(null);
            setPendingDecision(null);
            setStrategy(value);
            setRunning(false);
          }}
        />

        {strategy === "HeuristicStrategy" && (
          <>
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
          </>
        )}

        {strategy === "ManualStrategy" && (
          <Button style="blue" onClick={startManualPlay}>
            {running ? t("restart") : t("start")}
          </Button>
        )}
        <SimulatorButtons />
        <div className={styles.subLinks}>
          <a
            href="https://github.com/surisuririsu/gakumas-tools/blob/master/gakumas-tools/simulator/CHANGELOG.md"
            target="_blank"
          >
            {t("lastUpdated")}: 2026-02-09
          </a>
        </div>
        {!simulatorData && (
          <div className={styles.ad}>
            <KofiAd />
          </div>
        )}
      </div>

      {strategy === "ManualStrategy" && simulatorData && (
        <ManualPlay
          logs={simulatorData.logs}
          pendingDecision={pendingDecision}
          onDecision={handleDecision}
          idolId={config.idol.idolId || idolId}
        />
      )}

      {strategy === "HeuristicStrategy" && simulatorData && (
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
