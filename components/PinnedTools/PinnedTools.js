"use client";
import { memo, useContext } from "react";
import dynamic from "next/dynamic";
import { FaXmark } from "react-icons/fa6";
import WorkspaceContext from "@/contexts/WorkspaceContext";
import { TOOLS } from "@/utils/tools";
import styles from "./PinnedTools.module.scss";

const Dex = dynamic(() => import("@/components/Dex"));
const MemoryCalculator = dynamic(() => import("@/components/MemoryCalculator"));
const Memories = dynamic(() => import("@/components/Memories"));
const ProduceRankCalculator = dynamic(() =>
  import("@/components/ProduceRankCalculator")
);
const Rehearsal = dynamic(() => import("@/components/Rehearsal"));
const Simulator = dynamic(() => import("@/components/Simulator"));

function PinnedTools() {
  const { pinnedTools, unpin } = useContext(WorkspaceContext);

  return (
    <div className={styles.pinnedTools}>
      {pinnedTools.map((tool) => (
        <div key={tool} className={styles.container}>
          <div className={styles.header}>
            <span>{TOOLS[tool].icon}</span>
            <button onClick={() => unpin(tool)}>
              <FaXmark />
            </button>
          </div>
          <div className={styles.tool}>
            {tool == "produceRankCalculator" && <ProduceRankCalculator />}
            {tool == "dex" && <Dex />}
            {tool == "memoryCalculator" && <MemoryCalculator />}
            {tool == "memories" && <Memories />}
            {tool == "simulator" && <Simulator />}
            {tool == "rehearsal" && <Rehearsal />}
          </div>
        </div>
      ))}
    </div>
  );
}

export default memo(PinnedTools);
