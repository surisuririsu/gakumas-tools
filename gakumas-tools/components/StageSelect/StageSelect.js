import { memo, useContext } from "react";
import { useTranslations } from "next-intl";
import Button from "@/components/Button";
import LoadoutContext from "@/contexts/LoadoutContext";
import ModalContext from "@/contexts/ModalContext";
import StageSelectModal from "./StageSelectModal";
import StageSummary from "./StageSummary";
import styles from "./StageSelect.module.scss";

function StageSelect() {
  const t = useTranslations("StageSelect");

  const { stage } = useContext(LoadoutContext);
  const { setModal } = useContext(ModalContext);

  return (
    <Button
      className={styles.stageSelect}
      onClick={() => setModal(<StageSelectModal />)}
    >
      {stage.id ? (
        <StageSummary stage={stage} />
      ) : (
        <div className={styles.placeholder}>{t("placeholder")}</div>
      )}
    </Button>
  );
}

export default memo(StageSelect);
