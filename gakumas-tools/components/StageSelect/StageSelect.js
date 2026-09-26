import { memo, useContext } from "react";
import { useTranslations } from "next-intl";
import { FaChevronDown } from "react-icons/fa6";
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

  const chevron = (
    <FaChevronDown
      className={styles.chevron}
      aria-hidden="true"
      data-export-hide="true"
    />
  );

  return (
    <Button
      className={styles.stageSelect}
      onClick={() => setModal(<StageSelectModal />)}
    >
      {stage.id ? (
        <StageSummary stage={stage} trailing={chevron} />
      ) : (
        <div className={styles.namePlan}>
          <span className={styles.placeholder}>{t("placeholder")}</span>
          {chevron}
        </div>
      )}
    </Button>
  );
}

export default memo(StageSelect);
