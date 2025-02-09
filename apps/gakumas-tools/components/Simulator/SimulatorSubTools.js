import { memo, useContext, useState } from "react";
import { useTranslations } from "next-intl";
import CostRanges from "@/components/CostRanges";
import LoadoutHistory from "@/components/LoadoutHistory";
import DefaultCards from "@/components/DefaultCards";
import LoadoutContext from "@/contexts/LoadoutContext";
import c from "@/utils/classNames";
import styles from "./Simulator.module.scss";

function SimulatorSubTools({ defaultCardIds }) {
  const t = useTranslations("SimulatorSubTools");

  const { loadoutHistory } = useContext(LoadoutContext);
  const [activeSubTool, setActiveSubTool] = useState(null);

  const toggleSubTool = (subTool) => {
    setActiveSubTool(activeSubTool == subTool ? null : subTool);
  };

  return (
    <>
      <div className={styles.expanderButtons}>
        <button onClick={() => toggleSubTool("costRanges")}>
          {t("costRanges")}
        </button>

        <button
          disabled={!loadoutHistory.length}
          className={c(!loadoutHistory.length && styles.disabled)}
          onClick={() => toggleSubTool("history")}
        >
          {t("history")}
        </button>

        <button
          disabled={!defaultCardIds.length}
          className={c(!defaultCardIds.length && styles.disabled)}
          onClick={() => toggleSubTool("defaultCards")}
        >
          {t("defaultCards")}
        </button>
      </div>

      {activeSubTool == "costRanges" && <CostRanges />}
      {activeSubTool == "history" && <LoadoutHistory />}
      {activeSubTool == "defaultCards" && defaultCardIds && (
        <DefaultCards skillCardIds={defaultCardIds} />
      )}
    </>
  );
}

export default memo(SimulatorSubTools);
