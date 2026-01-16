import { memo } from "react";
import { useTranslations } from "next-intl";
import ToolsList from "./ToolsList";
import styles from "./Welcome.module.scss";

function Welcome() {
  const t = useTranslations("Welcome");

  return (
    <div className={styles.welcome}>
      <div className={styles.hero}>
        <h2>{t("title")}</h2>
        <p>{t("introduction")}</p>
      </div>
      <ToolsList />
    </div>
  );
}

export default memo(Welcome);
