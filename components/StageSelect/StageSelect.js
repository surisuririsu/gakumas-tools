import { useState } from "react";
import { FaChevronUp, FaChevronDown } from "react-icons/fa6";
import { Stages } from "gakumas-data";
import StageSummary from "./StageSummary";
import { compareStages } from "@/utils/sort";
import styles from "./StageSelect.module.scss";

export default function StageSelect({ stageId, setStageId }) {
  const [expanded, setExpanded] = useState(false);
  const selectedStage = Stages.getById(stageId);

  return (
    <div className={styles.select}>
      <button onClick={() => setExpanded(!expanded)}>
        {selectedStage ? (
          <StageSummary stage={selectedStage} />
        ) : (
          <div className={styles.placeholder}>ステージ選択</div>
        )}
        {expanded ? <FaChevronUp /> : <FaChevronDown />}
      </button>

      {expanded && (
        <div className={styles.options}>
          {Stages.getAll()
            .sort(compareStages)
            .map((stage) => (
              <button
                key={stage.id}
                className={styles.option}
                value={stage.id}
                onClick={() => {
                  setStageId(stage.id);
                  setExpanded(false);
                }}
              >
                <StageSummary stage={stage} />
              </button>
            ))}
        </div>
      )}
    </div>
  );
}
