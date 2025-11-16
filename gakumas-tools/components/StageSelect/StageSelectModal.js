import { useContext, useState } from "react";
import { useTranslations } from "next-intl";
import { Stages } from "gakumas-data";
import ButtonGroup from "@/components/ButtonGroup";
import Modal from "@/components/Modal";
import StageCustomizer from "@/components/StageCustomizer";
import LoadoutContext from "@/contexts/LoadoutContext";
import ModalContext from "@/contexts/ModalContext";
import { compareStages } from "@/utils/sort";
import StageSummary from "./StageSummary";
import styles from "./StageSelect.module.scss";

const allStages = Stages.getAll().sort(compareStages);
const stagesByType = allStages.reduce((acc, stage) => {
  if (!acc[stage.type]) {
    acc[stage.type] = [];
  }
  acc[stage.type].push(stage);
  return acc;
}, {});

export default function StageSelectModal() {
  const t = useTranslations("StageSelectModal");

  const STAGE_TYPE_OPTIONS = [
    { value: "contest", label: t("contest") },
    { value: "linkContest", label: t("linkContest") },
    { value: "event", label: t("event") },
    // { value: "custom", label: t("custom") },
  ];

  const { setStageId, stage, setCustomStage } = useContext(LoadoutContext);
  const { closeModal } = useContext(ModalContext);
  const [stageType, setStageType] = useState(stage?.type || "contest");

  function setStage(stageId, customStage) {
    setStageId(stageId);
    setCustomStage(customStage);
    closeModal();
  }

  const stages = stagesByType[stageType] || [];

  return (
    <Modal>
      <ButtonGroup
        className={styles.typeSelect}
        selected={stageType}
        options={STAGE_TYPE_OPTIONS}
        onChange={setStageType}
      />
      {stageType == "custom" ? (
        <div className={styles.customizer}>
          <StageCustomizer
            initialStage={stage}
            onApply={(value) => setStage("custom", value)}
          />
        </div>
      ) : (
        <div className={styles.stageList}>
          {stages.map((stage) => (
            <button
              key={stage.id}
              className={styles.option}
              value={stage.id}
              onClick={() => setStage(stage.id, {})}
            >
              <StageSummary stage={stage} />
            </button>
          ))}
        </div>
      )}
    </Modal>
  );
}
