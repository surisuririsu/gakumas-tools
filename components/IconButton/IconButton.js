import styles from "./IconButton.module.scss";

export default function IconButton({ icon: Icon, onClick }) {
  return (
    <button className={styles.iconButton} onClick={onClick}>
      <Icon />
    </button>
  );
}
