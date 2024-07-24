import styles from "./Button.module.scss";

export default function Button({
  children,
  onClick,
  style = "primary",
  disabled,
}) {
  return (
    <button
      className={styles[disabled ? "disabled" : style]}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
