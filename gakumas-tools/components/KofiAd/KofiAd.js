import { useTranslations } from "next-intl";
import { SiKofi } from "react-icons/si";
import styles from "./KofiAd.module.scss";

export default function KofiAd() {
  const t = useTranslations("KofiAd");
  return (
    <a
      className={styles.kofiAd}
      href="https://ko-fi.com/surisuririsu"
      target="_blank"
      rel="noopener noreferrer"
    >
      <SiKofi />
      <span>{t("prompt")}</span>
    </a>
  );
}
