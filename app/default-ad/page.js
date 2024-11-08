import Image from "@/components/Image";
import styles from "./page.module.scss";

export default function DefaultAdPage() {
  return (
    <a
      className={styles.defaultAd}
      href="https://ko-fi.com/surisuririsu"
      target="_blank"
    >
      <div className={styles.text}>
        <div>Like GAKUMAS TOOLS?</div>
        <div>プロデューサーさん、お役に立っていますか？</div>
      </div>
      <Image src="/support_me_on_kofi_blue.webp" width={213} height={43} />
    </a>
  );
}
