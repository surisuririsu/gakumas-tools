import { Customizations } from "gakumas-data";
import c from "@/utils/classNames";
import { countCustomizations } from "@/utils/customizations";
import styles from "./EntityIcon.module.scss";

export default function CustomizationCounts({ customizations = {} }) {
  if (!countCustomizations(customizations)) return null;

  return (
    <div className={styles.customizations}>
      {Object.keys(customizations)
        .filter((c11n) => customizations[c11n] && Customizations.getById(c11n))
        .map((c11n) => (
          <div
            key={c11n}
            className={c(
              styles.badge,
              styles.customization,
              styles[Customizations.getById(c11n).type]
            )}
          >
            {customizations[c11n]}
          </div>
        ))}
    </div>
  );
}
