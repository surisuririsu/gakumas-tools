import { memo, useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";
import Button from "@/components/Button";
import Loader from "@/components/Loader";
import styles from "./Simulator.module.scss";

function SimulateButton({ running, numRuns, progress, onRun }) {
  const t = useTranslations("Simulator");
  const completed = useSyncExternalStore(
    progress.subscribe,
    progress.get,
    progress.get
  );
  const percent =
    numRuns > 0 ? Math.min(Math.floor((completed / numRuns) * 100), 100) : 0;

  return (
    <Button style="blue" fill onClick={onRun} disabled={running}>
      <span className={styles.runLabel}>
        {running ? (
          <>
            <Loader />
            <span className={styles.runPercent}>{percent}%</span>
          </>
        ) : (
          t("simulate")
        )}
      </span>
    </Button>
  );
}

export default memo(SimulateButton);
