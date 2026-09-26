"use client";
import { memo, useContext } from "react";
import { useTranslations } from "next-intl";
import { FaTableColumns } from "react-icons/fa6";
import { usePathname } from "@/i18n/routing";
import WorkspaceContext from "@/contexts/WorkspaceContext";
import c from "@/utils/classNames";
import { TOOLS } from "@/utils/tools";
import styles from "./ToolHeader.module.scss";

function ToolHeader() {
  const t = useTranslations("ToolHeader");
  const pathname = usePathname();
  const { pinnedTools, pin, unpin } = useContext(WorkspaceContext);
  const tool = Object.keys(TOOLS).find((t) =>
    pathname.startsWith(TOOLS[t].path)
  );

  if (!tool || !TOOLS[tool].pinnable) return null;

  const pinned = pinnedTools.includes(tool);
  const label = pinned ? t("pinned") : t("pin");

  return (
    <button
      className={c(styles.toolHeader, pinned && styles.pinned)}
      onClick={() => (pinned ? unpin(tool) : pin(tool))}
      aria-pressed={pinned}
      aria-label={label}
      data-tooltip-id="nav-tooltip"
      data-tooltip-content={label}
    >
      <FaTableColumns />
    </button>
  );
}

export default memo(ToolHeader);
