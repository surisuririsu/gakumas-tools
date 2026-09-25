import { memo, useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";
import Button from "@/components/Button";
import Loader from "@/components/Loader";
import ProgressBar from "@/components/ProgressBar";
import styles from "./Simulator.module.scss";

function SimulateButton({ running, numRuns, progress, onRun, onCancel }) {
  const t = useTranslations("Simulator");
  const completed = useSyncExternalStore(
    progress.subscribe,
    progress.get,
    progress.get
  );

  if (!running) {
    return (
      <Button style="blue" fill onClick={onRun}>
        {t("simulate")}
      </Button>
    );
  }

  const percent = numRuns > 0 ? Math.floor((completed / numRuns) * 100) : 0;

  return (
    <>
      <div className={styles.runRow}>
        <Button style="blue" fill disabled>
          <Loader />
          <span className={styles.runPercent}>{Math.min(percent, 100)}%</span>
        </Button>
        <Button style="blue-secondary" onClick={onCancel}>
          {t("cancel")}
        </Button>
      </div>
      <div className={styles.progressBarWrap}>
        <ProgressBar value={completed} max={numRuns} />
      </div>
    </>
  );
}

export default memo(SimulateButton);
