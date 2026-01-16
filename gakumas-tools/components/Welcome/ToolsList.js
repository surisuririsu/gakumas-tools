import { memo } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { TOOLS } from "@/utils/tools";
import styles from "./Welcome.module.scss";

function ToolsList() {
  const t = useTranslations("tools");

  return (
    <ul className={styles.toolsGrid}>
      {Object.keys(TOOLS).map((key) => (
        <li key={key}>
          <Link className={styles.toolCard} href={TOOLS[key].path}>
            <span className={styles.toolIcon}>{TOOLS[key].icon}</span>
            <div className={styles.toolInfo}>
              <span className={styles.toolTitle}>{t(`${key}.title`)}</span>
              <span className={styles.toolDescription}>
                {t(`${key}.description`)}
              </span>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export default memo(ToolsList);
