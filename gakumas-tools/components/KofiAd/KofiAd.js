import Image from "@/components/Image";
import styles from "./KofiAd.module.scss";

export default function KofiAd() {
  return null;
  return (
    <a
      className={styles.kofiAd}
      href="https://ko-fi.com/surisuririsu"
      target="_blank"
    >
      <div className={styles.text}>
        <div>Like GAKUMAS TOOLS?</div>
        <div>プロデューサーさん、お役に立っていますか？</div>
      </div>
      <Image
        src="/support_me_on_kofi_blue.webp"
        alt="Support me on Ko-Fi"
        width={213}
        height={43}
      />
    </a>
  );
}
