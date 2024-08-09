import { useContext, useEffect, useState } from "react";
import { PItems, SkillCards, Stages } from "gakumas-data";
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
import StageEngine from "@/simulator/StageEngine";
import StagePlayer from "@/simulator/StagePlayer";
import HeuristicStrategy from "@/simulator/strategies/HeuristicStrategy";
import { NUM_RUNS, BUCKET_SIZE } from "@/utils/simulator";
import styles from "./LoadoutEditor.module.scss";

function inferPlan(pItemIds, skillCardIdGroups, stageId, workspacePlan) {
  const signaturePItem = pItemIds
    .map(PItems.getById)
    .find((p) => p?.sourceType == "pIdol");
  if (signaturePItem) return signaturePItem.plan;
  const signatureSkillCard = skillCardIdGroups[0]
    .map(SkillCards.getById)
    .find((s) => s?.sourceType == "pIdol");
  if (signatureSkillCard) return signatureSkillCard.plan;
  const stage = Stages.getById(stageId);
  if (stage) return stage.plan;
  return workspacePlan;
}

export default function LoadoutEditor() {
  const { params, setParams, pItemIds, skillCardIdGroups, clear } =
    useContext(LoadoutContext);
  const { plan: workspacePlan } = useContext(WorkspaceContext);
  const [stageId, setStageId] = useState(null);
  const [simulatorData, setSimulatorData] = useState(null);
  const [running, setRunning] = useState(false);

  const stage = Stages.getById(stageId);
  const turnCounts = stage?.turnCounts || { vocal: 4, dance: 4, visual: 4 };
  const firstTurns = stage?.firstTurns || ["vocal", "dance", "visual"];
  const criteria = stage?.criteria || {
    vocal: 0.33,
    dance: 0.33,
    visual: 0.33,
  };
  const effects = stage?.effects || [];
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

  function simulate() {
    const engine = new StageEngine(stageConfig, idolConfig);
    const strategy = new HeuristicStrategy(engine);

    let runs = [];
    for (let i = 0; i < NUM_RUNS; i++) {
      const score = new StagePlayer(engine, strategy, true).play();
      runs.push(score);
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
          {/* <Button onClick={() => setRunning(true)} disabled={running}>
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
