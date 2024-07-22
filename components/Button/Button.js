import styles from "./Button.module.scss";

export default function Button({ children, onClick, style = "primary" }) {
  return (
    <button className={`${styles[style]}`} onClick={onClick}>
      {children}
    </button>
  );
}
