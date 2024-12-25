import { memo } from "react";
import { Link } from "@/i18n/routing";
import c from "@/utils/classNames";
import styles from "./IconButton.module.scss";

function IconButton({ icon: Icon, onClick, href, disabled, size = "medium" }) {
  const className = c(
    styles.iconButton,
    styles[size],
    disabled && styles.disabled
  );

  return href ? (
    <Link
      className={className}
      href={href}
      target="_blank"
      onClick={onClick}
      disabled={disabled}
    >
      <Icon />
    </Link>
  ) : (
    <button className={className} onClick={onClick} disabled={disabled}>
      <Icon />
    </button>
  );
}

export default memo(IconButton);
