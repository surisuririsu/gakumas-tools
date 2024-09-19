import { memo, useContext, useState } from "react";
import { useTranslations } from "next-intl";
import { FaChevronUp, FaChevronDown, FaRegPenToSquare } from "react-icons/fa6";
import { Stages } from "gakumas-data/lite";
import Button from "@/components/Button";
import StageCustomizerModal from "@/components/StageCustomizerModal";
import LoadoutContext from "@/contexts/LoadoutContext";
import ModalContext from "@/contexts/ModalContext";
import { compareStages } from "@/utils/sort";
import StageSummary from "./StageSummary";
import styles from "./StageSelect.module.scss";

const stages = Stages.getAll().sort(compareStages);

function StageSelect() {
  const t = useTranslations("StageSelect");

  const { setStageId, stage, setCustomStage } = useContext(LoadoutContext);
  const { setModal } = useContext(ModalContext);
  const [expanded, setExpanded] = useState(false);

  function applyCustomStage(value) {
    setStageId("custom");
    setCustomStage(value);
  }

  return (
    <div className={styles.stageSelect}>
      <div className={styles.select}>
        <button onClick={() => setExpanded(!expanded)}>
          {stage.id ? (
            <StageSummary stage={stage} />
          ) : (
            <div className={styles.placeholder}>{t("placeholder")}</div>
          )}
          {expanded ? <FaChevronUp /> : <FaChevronDown />}
        </button>

        {expanded && (
          <div className={styles.options}>
            {stages.map((stage) => (
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

      {/* <Button
        onClick={() =>
          setModal(
            <StageCustomizerModal
              initialStage={stage}
              onApply={applyCustomStage}
            />
          )
        }
      >
        <FaRegPenToSquare />
      </Button> */}
    </div>
  );
}

export default memo(StageSelect);
