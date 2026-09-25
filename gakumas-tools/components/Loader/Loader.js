import { memo } from "react";
import c from "@/utils/classNames";
import styles from "./Loader.module.scss";

function Loader({ size, center }) {
  const loader = (
    <span
      className={c(styles.loader, size == "large" && styles.large)}
      role="status"
      aria-label="Loading"
    />
  );
  return center ? <div className={styles.center}>{loader}</div> : loader;
}

export default memo(Loader);
