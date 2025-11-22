import { memo, useContext } from "react";
import Button from "@/components/Button";
import LoadoutContext from "@/contexts/LoadoutContext";
import LoadoutHistoryContext from "@/contexts/LoadoutHistoryContext";
import LoadoutSummary from "./LoadoutSummary";
import styles from "./LoadoutHistory.module.scss";

function LoadoutHistory() {
  const { setLoadout } = useContext(LoadoutContext);
  const { loadoutHistory } = useContext(LoadoutHistoryContext);

  return (
    <div className={styles.history}>
      {loadoutHistory.map((loadout, i) => (
        <Button
          key={i}
          className={styles.summary}
          onClick={() => setLoadout(loadout)}
        >
          <LoadoutSummary loadout={loadout} setLoadout={setLoadout} />
        </Button>
      ))}
    </div>
  );
}

export default memo(LoadoutHistory);
