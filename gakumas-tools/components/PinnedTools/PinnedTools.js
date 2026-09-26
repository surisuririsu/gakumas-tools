"use client";
import { createElement, memo, useContext } from "react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { FaXmark } from "react-icons/fa6";
import IconButton from "@/components/IconButton";
import Loader from "@/components/Loader";
import WorkspaceContext from "@/contexts/WorkspaceContext";
import { usePathname } from "@/i18n/routing";
import { TOOLS } from "@/utils/tools";
import styles from "./PinnedTools.module.scss";

// ssr: false keeps these heavy tools (ONNX, Tesseract) off the server render.
// The container around each one is a fixed 350px and stretches to the row
// height, so it reserves the right box server-side and the tool fills in on
// hydration without moving <main>.
function ToolLoading() {
  return (
    <div className={styles.loading} aria-busy="true">
      <Loader size="large" />
    </div>
  );
}

const TOOL_COMPONENTS = {
  dex: dynamic(() => import("@/components/Dex"), {
    ssr: false,
    loading: ToolLoading,
  }),
  lessonCalculator: dynamic(() => import("@/components/LessonCalculator"), {
    ssr: false,
    loading: ToolLoading,
  }),
  memoryCalculator: dynamic(() => import("@/components/MemoryCalculator"), {
    ssr: false,
    loading: ToolLoading,
  }),
  memories: dynamic(() => import("@/components/Memories"), {
    ssr: false,
    loading: ToolLoading,
  }),
  produceRankCalculator: dynamic(
    () => import("@/components/ProduceRankCalculator"),
    { ssr: false, loading: ToolLoading }
  ),
  rehearsal: dynamic(() => import("@/components/Rehearsal"), {
    ssr: false,
    loading: ToolLoading,
  }),
  simulator: dynamic(() => import("@/components/Simulator/Simulator"), {
    ssr: false,
    loading: ToolLoading,
  }),
};

function PinnedTools() {
  const t = useTranslations("tools");
  const tHeader = useTranslations("ToolHeader");
  const { pinnedTools, unpin } = useContext(WorkspaceContext);
  const pathname = usePathname();
  const filteredTools = pinnedTools.filter(
    (tool) =>
      tool in TOOL_COMPONENTS &&
      TOOLS[tool] &&
      !pathname.startsWith(TOOLS[tool].path)
  );

  if (!filteredTools.length) return null;

  return (
    <div className={styles.pinnedTools}>
      {filteredTools.map((tool) => (
        <div key={tool} className={styles.container}>
          <div className={styles.header}>
            <span className={styles.icon}>{TOOLS[tool].icon}</span>
            <span className={styles.title}>{t(`${tool}.title`)}</span>
            <IconButton
              icon={FaXmark}
              size="small"
              onClick={() => unpin(tool)}
              ariaLabel={tHeader("unpin")}
            />
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
