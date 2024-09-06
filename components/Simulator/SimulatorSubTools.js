import { memo, useState } from "react";
import { useTranslations } from "next-intl";
import CostRanges from "@/components/CostRanges";
import DefaultCards from "@/components/DefaultCards";
import styles from "./Simulator.module.scss";

function SimulatorSubTools({ plan }) {
  const t = useTranslations("SimulatorSubTools");
  const [activeSubTool, setActiveSubTool] = useState(null);

  return (
    <>
      <div className={styles.expanderButtons}>
        <button
          onClick={() =>
            setActiveSubTool(
              activeSubTool == "costRanges" ? null : "costRanges"
            )
          }
        >
          {t("costRanges")}
        </button>

        <button
          onClick={() =>
            setActiveSubTool(
              activeSubTool == "defaultCards" ? null : "defaultCards"
            )
          }
        >
          {t("defaultCards")}
        </button>
      </div>

      {activeSubTool == "costRanges" && <CostRanges />}
      {activeSubTool == "defaultCards" && <DefaultCards plan={plan} />}
    </>
  );
}

export default memo(SimulatorSubTools);
