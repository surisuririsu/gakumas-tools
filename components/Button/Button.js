import { memo } from "react";
import Link from "next/link";
import styles from "./Button.module.scss";

function Button({
  children,
  onClick,
  href,
  target,
  style = "primary",
  disabled,
  ariaLabel,
  fill,
}) {
  const className = `${styles.button} ${
    styles[disabled ? "disabled" : style]
  } ${fill ? styles.fill : ""}`;

  return href ? (
    <Link
      className={className}
      href={href}
      target={target}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
    >
      {children}
    </Link>
  ) : (
    <button
      className={className}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
    >
      {children}
    </button>
  );
}

export default memo(Button);
