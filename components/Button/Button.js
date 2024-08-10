import styles from "./Button.module.scss";

export default function Button({
  children,
  onClick,
  style = "primary",
  disabled,
  ariaLabel,
}) {
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
