"use client";
import { createElement, memo, useContext } from "react";
import dynamic from "next/dynamic";
import { FaXmark } from "react-icons/fa6";
import WorkspaceContext from "@/contexts/WorkspaceContext";
import { TOOLS } from "@/utils/tools";
import styles from "./PinnedTools.module.scss";

// ssr: false keeps these heavy tools (ONNX, Tesseract) off the server render.
// The container around each one is a fixed 350px and stretches to the row
// height, so it reserves the right box server-side and the tool fills in on
// hydration without moving <main>.
const TOOL_COMPONENTS = {
  dex: dynamic(() => import("@/components/Dex"), { ssr: false }),
  lessonCalculator: dynamic(() => import("@/components/LessonCalculator"), {
    ssr: false,
  }),
  memoryCalculator: dynamic(() => import("@/components/MemoryCalculator"), {
    ssr: false,
  }),
  memories: dynamic(() => import("@/components/Memories"), { ssr: false }),
  produceRankCalculator: dynamic(
    () => import("@/components/ProduceRankCalculator"),
    { ssr: false }
  ),
  rehearsal: dynamic(() => import("@/components/Rehearsal"), { ssr: false }),
  simulator: dynamic(() => import("@/components/Simulator/Simulator"), {
    ssr: false,
  }),
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
