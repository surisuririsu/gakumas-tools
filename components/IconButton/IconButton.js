import { memo } from "react";
import Link from "next/link";
import styles from "./IconButton.module.scss";

function IconButton({ icon: Icon, onClick, href, size = "medium" }) {
  const className = `${styles.iconButton} ${styles[size]}`;
  return href ? (
    <Link className={className} href={href} target="_blank" onClick={onClick}>
      <Icon />
    </Link>
  ) : (
    <button className={className} onClick={onClick}>
      <Icon />
    </button>
  );
}

export default memo(IconButton);
