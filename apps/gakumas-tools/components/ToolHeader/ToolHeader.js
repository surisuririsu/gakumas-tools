"use client";
import { memo, useContext } from "react";
import { FaTableColumns } from "react-icons/fa6";
import { usePathname } from "@/i18n/routing";
import WorkspaceContext from "@/contexts/WorkspaceContext";
import { TOOLS } from "@/utils/tools";
import styles from "./ToolHeader.module.scss";

function ToolHeader() {
  const pathname = usePathname();
  const { pinnedTools, pin } = useContext(WorkspaceContext);
  const tool = Object.keys(TOOLS).find((t) =>
    pathname.startsWith(TOOLS[t].path)
  );

  if (!tool || !TOOLS[tool].pinnable || pinnedTools.includes(tool)) return null;

  return (
    <button className={styles.toolHeader} onClick={() => pin(tool)}>
      <FaTableColumns />
    </button>
  );
}

export default memo(ToolHeader);
