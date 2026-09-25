import { memo } from "react";
import { useTranslations } from "next-intl";
import { FaChevronDown } from "react-icons/fa6";
import c from "@/utils/classNames";
import styles from "./SimulatorLogs.module.scss";

function HandTitle({ expanded, onToggle }) {
  const t = useTranslations("stage");

  return (
    <button
      type="button"
      className={c(styles.handTitle, expanded && styles.expanded)}
      onClick={onToggle}
      aria-expanded={expanded}
    >
      {t("hand")}
      <FaChevronDown className={styles.handCaret} aria-hidden="true" />
    </button>
  );
}

export default memo(HandTitle);
