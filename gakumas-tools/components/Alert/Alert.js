import { memo } from "react";
import c from "@/utils/classNames";
import styles from "./Alert.module.scss";

function Alert({ children, variant = "neutral", className }) {
  return (
    <div className={c(styles.alert, styles[variant], className)}>
      <div className={styles.bar} />
      <div className={styles.content}>{children}</div>
    </div>
  );
}

export default memo(Alert);
