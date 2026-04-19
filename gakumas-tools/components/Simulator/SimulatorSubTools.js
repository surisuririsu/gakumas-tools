import { memo, useState } from "react";
import { useTranslations } from "next-intl";
import { FaChevronDown } from "react-icons/fa6";
import CostRanges from "@/components/CostRanges";
import DefaultCards from "@/components/DefaultCards";
import c from "@/utils/classNames";
import styles from "./Simulator.module.scss";

function SimulatorSubTools({ defaultCardIds }) {
  const t = useTranslations("SimulatorSubTools");
  const [activeSubTool, setActiveSubTool] = useState(null);

  const toggleSubTool = (subTool) => {
    setActiveSubTool(activeSubTool == subTool ? null : subTool);
  };

  return (
    <>
      <div className={styles.expanderButtons}>
        <button
          className={c(activeSubTool === "costRanges" && styles.expanded)}
          onClick={() => toggleSubTool("costRanges")}
        >
          {t("costRanges")}
          <FaChevronDown />
        </button>

        <button
          disabled={!defaultCardIds.length}
          className={c(
            !defaultCardIds.length && styles.disabled,
            activeSubTool === "defaultCards" && styles.expanded
          )}
          onClick={() => toggleSubTool("defaultCards")}
        >
          {t("defaultCards")}
          <FaChevronDown />
        </button>
      </div>

      {activeSubTool == "costRanges" && <CostRanges />}
      {activeSubTool == "defaultCards" && defaultCardIds && (
        <DefaultCards skillCardIds={defaultCardIds} />
      )}
    </>
  );
}

export default memo(SimulatorSubTools);
