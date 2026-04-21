import { memo, useContext } from "react";
import Button from "@/components/Button";
import SimulationRunsContext from "@/contexts/SimulationRunsContext";
import LoadoutSummary from "./LoadoutSummary";
import styles from "./LoadoutHistory.module.scss";

function LoadoutHistory() {
  const { history, loadRun } = useContext(SimulationRunsContext);

  return (
    <div className={styles.history}>
      {history.map((run) => (
        <Button
          key={run.id}
          className={styles.summary}
          onClick={() => loadRun(run)}
        >
          <LoadoutSummary loadout={run.loadout} />
        </Button>
      ))}
    </div>
  );
}

export default memo(LoadoutHistory);
