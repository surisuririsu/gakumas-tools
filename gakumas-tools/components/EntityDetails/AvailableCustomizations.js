import { useState } from "react";
import { useTranslations } from "next-intl";
import { Customizations } from "gakumas-data";
import c from "@/utils/classNames";
import styles from "./EntityDetails.module.scss";

export default function AvailableCustomizations({ entity }) {
  const t = useTranslations("Dex");
  const [c11nExpanded, setC11nExpanded] = useState(false);
  const availableCustomizations = (entity?.availableCustomizations || []).map(
    Customizations.getById
  );

  if (!availableCustomizations.length) return null;

  return (
    <button
      className={c(styles.c11ns, c11nExpanded && styles.expanded)}
      onClick={() => setC11nExpanded(!c11nExpanded)}
    >
      {availableCustomizations.map((c11n) => (
        <div key={c11n.id} className={c(styles.c11n, styles[c11n.type])}>
          <div className={styles.max}>{t("maxTimes", { n: c11n.max })}</div>
          <div className={styles.name}>{c11n.name}</div>
        </div>
      ))}
    </button>
  );
}
