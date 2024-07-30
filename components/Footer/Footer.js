import styles from "./Footer.module.scss";

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <span>
        Made with ☕ by{" "}
        <a href="https://www.ris.moe" target="_blank">
          risりす
        </a>
      </span>
      <a
        href="https://github.com/surisuririsu/gakumas-tools/issues/new"
        target="_blank"
      >
        Report a problem or request a feature
      </a>
    </footer>
  );
}
