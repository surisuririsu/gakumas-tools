import { memo } from "react";
import { Link } from "@/i18n/routing";
import c from "@/utils/classNames";
import styles from "./Button.module.scss";

function Button({
  className,
  children,
  onClick,
  href,
  target,
  style = "default",
  disabled,
  ariaLabel,
  fill,
  locale,
}) {
  const fullClassName = c(
    styles.button,
    styles[disabled ? "disabled" : style],
    fill && styles.fill,
    className
  );

  return href ? (
    <Link
      className={fullClassName}
      href={href}
      target={target}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      locale={locale}
    >
      {children}
    </Link>
  ) : (
    <button
      className={fullClassName}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
    >
      {children}
    </button>
  );
}

export default memo(Button);
