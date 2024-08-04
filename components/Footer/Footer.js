import styles from "./Footer.module.scss";

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <a href="https://wikiwiki.jp/gakumas/" target="_blank">
        Gakumas Contest Wiki
      </a>
      <span>
        Made with ☕ by{" "}
        <a href="http://www.ris.moe" target="_blank">
          risりす
        </a>{" "}
        with research from the Gakumas contest community
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
