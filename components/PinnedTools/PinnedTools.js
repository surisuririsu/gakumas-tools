"use client";
import { createElement, memo, useContext } from "react";
import dynamic from "next/dynamic";
import { FaXmark } from "react-icons/fa6";
import WorkspaceContext from "@/contexts/WorkspaceContext";
import { TOOLS } from "@/utils/tools";
import styles from "./PinnedTools.module.scss";

const TOOL_COMPONENTS = {
  dex: dynamic(() => import("@/components/Dex")),
  lessonCalculator: dynamic(() => import("@/components/LessonCalculator")),
  memoryCalculator: dynamic(() => import("@/components/MemoryCalculator")),
  memories: dynamic(() => import("@/components/Memories")),
  produceRankCalculator: dynamic(() =>
    import("@/components/ProduceRankCalculator")
  ),
  rehearsal: dynamic(() => import("@/components/Rehearsal")),
  simulator: dynamic(() => import("@/components/Simulator")),
};

function PinnedTools() {
  const { pinnedTools, unpin } = useContext(WorkspaceContext);
  const filteredTools = pinnedTools.filter((tool) => tool in TOOL_COMPONENTS);

  if (!filteredTools.length) return null;

  return (
    <div className={styles.pinnedTools}>
      {filteredTools.map((tool) => (
        <div key={tool} className={styles.container}>
          <div className={styles.header}>
            {TOOLS[tool].icon}
            <button onClick={() => unpin(tool)}>
              <FaXmark />
            </button>
          </div>
          <div className={styles.tool}>
            {createElement(TOOL_COMPONENTS[tool])}
          </div>
        </div>
      ))}
    </div>
  );
}

export default memo(PinnedTools);
