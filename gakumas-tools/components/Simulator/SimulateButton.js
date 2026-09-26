import { memo, useState, useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";
import Loader from "@/components/Loader";
import c from "@/utils/classNames";
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

  const [runKey, setRunKey] = useState(0);
  const [wasRunning, setWasRunning] = useState(running);
  if (running !== wasRunning) {
    setWasRunning(running);
    if (running) setRunKey(runKey + 1);
  }

  return (
    <button
      type="button"
      className={c(styles.run, running && styles.running)}
      onClick={running ? undefined : onRun}
      aria-disabled={running || undefined}
      aria-busy={running}
    >
      {runKey > 0 && (
        <span
          key={runKey}
          className={styles.runFill}
          style={{ scale: `${running ? percent / 100 : 1} 1` }}
          aria-hidden="true"
        />
      )}
      <span className={styles.runLabel}>
        <span className={styles.runIdle}>{t("simulate")}</span>
        <span className={styles.runBusy} aria-hidden={!running}>
          <Loader />
          <span className={styles.runPercent}>{percent}%</span>
        </span>
      </span>
    </button>
  );
}

export default memo(SimulateButton);
