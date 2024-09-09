import { memo, useContext } from "react";
import LoadoutContext from "@/contexts/LoadoutContext";
import LoadoutSummary from "./LoadoutSummary";
import styles from "./LoadoutHistory.module.scss";

function LoadoutHistory() {
  const { loadoutHistory, setLoadout } = useContext(LoadoutContext);

  return (
    <div className={styles.history}>
      {loadoutHistory.map((loadout) => (
        <LoadoutSummary
          key={loadout.timestamp}
          loadout={loadout}
          setLoadout={setLoadout}
        />
      ))}
    </div>
  );
}

export default memo(LoadoutHistory);
