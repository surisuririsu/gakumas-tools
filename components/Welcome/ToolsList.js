import { memo } from "react";
import { useTranslations } from "next-intl";
import Button from "@/components/Button";
import { TOOLS } from "@/utils/tools";
import styles from "./Welcome.module.scss";

function ToolsList() {
  const t = useTranslations("tools");

  return (
    <ul className={styles.toolsList}>
      {Object.keys(TOOLS).map((key) => (
        <li key={key} className={styles.feature}>
          <Button ariaLabel={t(`${key}.title`)} href={TOOLS[key].path}>
            {TOOLS[key].icon}
          </Button>
          {t(`${key}.description`)}
        </li>
      ))}
    </ul>
  );
}

export default memo(ToolsList);
