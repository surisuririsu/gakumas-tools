import { useTranslations } from "next-intl";
import Image from "@/components/Image";
import styles from "./KofiAd.module.scss";

export default function KofiAd() {
  const t = useTranslations("KofiAd");
  return (
    <a
      className={styles.kofiAd}
      href="https://ko-fi.com/surisuririsu"
      target="_blank"
    >
      <div className={styles.text}>
        <div>{t("prompt")}</div>
      </div>
      <Image
        src="/support_me_on_kofi_blue.webp"
        alt={t("imageAlt")}
        width={213}
        height={43}
      />
    </a>
  );
}
