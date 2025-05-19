import Button from "@/components/Button";
import styles from "./Ad.module.scss";

export default function ContestWikiAd() {
  return (
    <a
      className={styles.ad}
      href="https://wikiwiki.jp/gakumas/"
      target="_blank"
    >
      <div className={styles.text}>
        <div>コンテストで勝ちたい？</div>
        <div>コンテストWikiを、読もう！</div>
      </div>
      <Button style="primary" className={styles.flatButton}>
        学マスコンテストWiki
      </Button>
    </a>
  );
}
