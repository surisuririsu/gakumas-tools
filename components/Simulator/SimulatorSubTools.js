import { memo, useState } from "react";
import CostRanges from "@/components/CostRanges";
import DefaultCards from "@/components/DefaultCards";
import styles from "./Simulator.module.scss";

function SimulatorSubTools({ plan }) {
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
          コスト範囲
        </button>

        <button
          onClick={() =>
            setActiveSubTool(
              activeSubTool == "defaultCards" ? null : "defaultCards"
            )
          }
        >
          基本カード
        </button>
      </div>

      {activeSubTool == "costRanges" && <CostRanges />}
      {activeSubTool == "defaultCards" && <DefaultCards plan={plan} />}
    </>
  );
}

export default memo(SimulatorSubTools);
