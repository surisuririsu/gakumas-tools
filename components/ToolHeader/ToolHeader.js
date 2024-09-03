"use client";
import { memo, useContext } from "react";
import { FaTableColumns } from "react-icons/fa6";
import { usePathname } from "next/navigation";
import WorkspaceContext from "@/contexts/WorkspaceContext";
import { TOOLS } from "@/utils/tools";
import styles from "./ToolHeader.module.scss";

function ToolHeader() {
  const pathname = usePathname();
  const { pinnedTools, pin } = useContext(WorkspaceContext);
  const tool = Object.keys(TOOLS).find((t) => TOOLS[t].path == pathname);
  if (!tool) return null;
  const { pinnable } = TOOLS[tool];

  if (pinnable && !pinnedTools.includes(tool)) {
    return (
      <button className={styles.toolHeader} onClick={() => pin(tool)}>
        <FaTableColumns />
      </button>
    );
  }

  return null;
}

export default memo(ToolHeader);
