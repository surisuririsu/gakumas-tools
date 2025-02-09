import { memo } from "react";
import styles from "./Loader.module.scss";

function Loader() {
  return <div className={styles.loader} />;
}

export default memo(Loader);
