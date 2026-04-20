import { memo } from "react";
import { useTranslations } from "next-intl";
import ToolsList from "./ToolsList";
import styles from "./Welcome.module.scss";

function Welcome() {
  const t = useTranslations("Welcome");

  return (
    <div className={styles.welcome}>
      <div className={styles.hero}>
        <h2 className={styles.heroTitle}>
          <span className={styles.heroTitleEcho} aria-hidden="true">
            学マスツール
          </span>
          <span className={styles.heroTitleMain}>
            <span className={styles.heroTitlePrimary}>Gakumas</span>{" "}
            <span className={styles.heroTitleSecondary}>Tools</span>
          </span>
        </h2>
        <p>{t("introduction")}</p>
        <p className={styles.disclaimer}>{t("disclaimer")}</p>
      </div>
      <ToolsList />
    </div>
  );
}

export default memo(Welcome);
