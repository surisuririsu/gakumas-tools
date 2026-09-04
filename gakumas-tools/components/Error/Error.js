import { useTranslations } from "next-intl";
import Image from "@/components/Image";
import styles from "./Error.module.scss";

export default function Error({ code }) {
  const t = useTranslations("Error");
  const notFound = code == 404;

  return (
    <div className={styles.error}>
      <h2>{notFound ? t("notFound") : t("generic")}</h2>
      <div className={styles.wrapper}>
        <Image
          src={notFound ? "/errors/not_found.jpg" : "/errors/generic.jpg"}
          alt=""
          fill
          sizes="(max-width: 640px) 100vw, 640px"
        />
      </div>
    </div>
  );
}
