"use client";
import { useContext } from "react";
import Dex from "@/components/Dex";
import ProduceRankCalculator from "@/components/ProduceRankCalculator";
import WorkspaceContext from "@/contexts/WorkspaceContext";
import styles from "./PinnedTools.module.scss";
import { TOOLS } from "@/utils/tools";

export default function PinnedTools() {
  const { pinnedTools, unpin } = useContext(WorkspaceContext);
  return (
    <div className={styles.pinnedTools}>
      {pinnedTools.map((tool) => (
        <div className={styles.tool}>
          <div className={styles.toolHeader}>
            <h2>{TOOLS[tool].icon}</h2>
          </div>
          {tool == "produceRankCalculator" && <ProduceRankCalculator />}
          {tool == "dex" && <Dex />}
        </div>
      ))}
    </div>
  );
}
