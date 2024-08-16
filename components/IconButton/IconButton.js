import { memo } from "react";
import styles from "./IconButton.module.scss";

function IconButton({ icon: Icon, onClick }) {
  return (
    <button className={styles.iconButton} onClick={onClick}>
      <Icon />
    </button>
  );
}

export default memo(IconButton);
