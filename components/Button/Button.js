import Link from "next/link";
import styles from "./Button.module.scss";

export default function Button({
  children,
  onClick,
  href,
  style = "primary",
  disabled,
  ariaLabel,
}) {
  if (href) {
    return (
      <Link
        className={styles[disabled ? "disabled" : style]}
        href={href}
        onClick={onClick}
        disabled={disabled}
        aria-label={ariaLabel}
      >
        {children}
      </Link>
    );
  }
  return (
    <button
      className={styles[disabled ? "disabled" : style]}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
    >
      {children}
    </button>
  );
}
