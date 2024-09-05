import { memo } from "react";
import { Link } from "@/i18n/routing";
import c from "@/utils/classNames";
import styles from "./Button.module.scss";

function Button({
  children,
  onClick,
  href,
  target,
  style = "default",
  disabled,
  ariaLabel,
  fill,
}) {
  const className = c(
    styles.button,
    styles[disabled ? "disabled" : style],
    fill && styles.fill
  );

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
