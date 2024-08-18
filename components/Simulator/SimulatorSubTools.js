import { memo, useContext, useState } from "react";
import CostRanges from "@/components/CostRanges";
import DefaultCards from "@/components/DefaultCards";
import LoadoutContext from "@/contexts/LoadoutContext";
import styles from "./Simulator.module.scss";

function SimulatorSubTools({ plan, idolId }) {
  const { kafeUrl } = useContext(LoadoutContext);
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

        {kafeUrl && (
          <a href={kafeUrl} target="_blank">
            コンテストシミュレーター
            <br />
            (@かふぇもっと)
          </a>
        )}

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

      {activeSubTool == "defaultCards" && (
        <DefaultCards plan={plan} idolId={idolId} />
      )}
    </>
  );
}

export default memo(SimulatorSubTools);
