import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { Stages } from "gakumas-data";
import Button from "@/components/Button";
import DistributionPlot from "@/components/DistributionPlot";
import Loader from "@/components/Loader";
import LoadoutSkillCardGroup from "@/components/LoadoutSkillCardGroup";
import ParametersInput from "@/components/ParametersInput";
import StagePItems from "@/components/StagePItems";
import StageSelect from "@/components/StageSelect";
import Trash from "@/components/Trash";
import LoadoutContext from "@/contexts/LoadoutContext";
import WorkspaceContext from "@/contexts/WorkspaceContext";
import IdolConfig from "@/simulator/IdolConfig";
import StageConfig from "@/simulator/StageConfig";
import { BUCKET_SIZE, FALLBACK_STAGE, inferPlan } from "@/utils/simulator";
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
  const { plan: workspacePlan } = useContext(WorkspaceContext);
  const [simulatorData, setSimulatorData] = useState(null);
  const [running, setRunning] = useState(false);
  const workerRef = useRef();

  const stage = Stages.getById(stageId) || FALLBACK_STAGE;
  const { turnCounts, firstTurns, criteria, effects } = stage;
  const plan = inferPlan(pItemIds, skillCardIdGroups, stageId, workspacePlan);
  const [vocal, dance, visual, stamina] = params;

  const stageConfig = new StageConfig(
    turnCounts,
    firstTurns,
    criteria,
    effects
  );
  const idolConfig = new IdolConfig(
    plan,
    { vocal, dance, visual, stamina },
    0,
    criteria,
    pItemIds.filter((id) => id),
    [].concat(...skillCardIdGroups).filter((id) => id)
  );

  useEffect(() => {
    workerRef.current = new Worker(
      new URL("../../simulator/worker.js", import.meta.url)
    );

    workerRef.current.onmessage = (e) => {
      let data = {};
      for (let i = 0; i < e.data.length; i++) {
        const bucket = Math.floor(e.data[i] / BUCKET_SIZE);
        data[bucket] = (data[bucket] || 0) + 1;
      }

      const minKey = Math.min(...Object.keys(data));
      const maxKey = Math.max(...Object.keys(data));
      for (let i = minKey - 1; i <= maxKey + 1; i++) {
        if (!data[i]) data[i] = 0;
      }

      setSimulatorData(data);
      setRunning(false);
    };

    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  const simulate = useCallback(async () => {
    setRunning(true);
    workerRef.current?.postMessage({ stageConfig, idolConfig });
  }, [stageConfig, idolConfig]);

  return (
    <div className={styles.loadoutEditor}>
      <div>
        <label>Stage</label>
        <StageSelect stageId={stageId} setStageId={setStageId} />
        <label>Parameters</label>
        <div className={styles.params}>
          <ParametersInput
            parameters={params}
            onChange={setParams}
            withStamina
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
          {/* <Button onClick={simulate} disabled={running}>
            Estimate score distribution
          </Button> */}
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
