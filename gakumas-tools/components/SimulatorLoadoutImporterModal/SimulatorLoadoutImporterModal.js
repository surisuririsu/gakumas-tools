"use client";
import { useCallback, useContext, useState } from "react";
import { useTranslations } from "next-intl";
import { Stages } from "gakumas-data";
import Modal from "@/components/Modal";
import ScreenshotImporterModal from "@/components/ScreenshotImporterModal";
import importerStyles from "@/components/ScreenshotImporterModal/ScreenshotImporterModal.module.scss";
import StageSummary from "@/components/StageSelect/StageSummary";
import stageStyles from "@/components/StageSelect/StageSelect.module.scss";
import LoadoutContext from "@/contexts/LoadoutContext";
import ModalContext from "@/contexts/ModalContext";
import c from "@/utils/classNames";
import { getSimulatorLoadoutFromFile } from "@/utils/imageProcessing/simulatorLoadout";
import styles from "./SimulatorLoadoutImporterModal.module.scss";

function SimulatorLoadoutImporterModal({ stageId, onImport }) {
  const t = useTranslations("SimulatorLoadoutImporterModal");
  const { stage, selectStage, setSupportBonus } = useContext(LoadoutContext);
  const { closeModal } = useContext(ModalContext);
  const [candidates, setCandidates] = useState(null);

  const importFn = useCallback(
    (file) => getSimulatorLoadoutFromFile(file, stageId),
    [stageId],
  );

  const handleImport = useCallback(
    ({ stageCandidates, ...imported }) => {
      onImport(imported);
      setCandidates(stageCandidates);
    },
    [onImport],
  );

  if (!candidates) {
    return (
      <ScreenshotImporterModal
        translationNamespace="SimulatorLoadoutImporterModal"
        importFn={importFn}
        onSuccess={handleImport}
      />
    );
  }

  const pick = ({ stageId, supportBonus }) => {
    selectStage(stageId, {});
    setSupportBonus(supportBonus);
    closeModal();
  };

  return (
    <Modal>
      <h3>{t("matchingStages")}</h3>
      <p className={importerStyles.instructions}>
        {candidates.length ? t("pickStage") : t("noStage")}
      </p>
      <div className={stageStyles.stageList}>
        {candidates.map((candidate, i) => (
          <button
            key={candidate.stageId}
            className={c(
              stageStyles.option,
              candidate.stageId == stage?.id && stageStyles.selected,
            )}
            style={{ "--i": i }}
            aria-pressed={candidate.stageId == stage?.id}
            onClick={() => pick(candidate)}
          >
            <StageSummary
              stage={Stages.getById(candidate.stageId)}
              trailing={
                <span className={styles.supportBonus}>
                  {(candidate.supportBonus * 100).toFixed(2)}%
                </span>
              }
            />
          </button>
        ))}
      </div>
    </Modal>
  );
}

export default SimulatorLoadoutImporterModal;
