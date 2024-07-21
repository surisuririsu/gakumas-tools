import styles from "./Footer.module.scss";

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <span>
        Made with ☕ by <a href="https://www.ris.moe">risりす</a>
      </span>
      <a>GitHub</a>
    </footer>
  );
}
