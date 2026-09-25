import { useTranslations } from "next-intl";
import { FaArrowRotateRight, FaHouse } from "react-icons/fa6";
import Button from "@/components/Button";
import Image from "@/components/Image";
import styles from "./Error.module.scss";

export default function Error({ code, onRetry }) {
  const t = useTranslations("Error");
  const notFound = code == 404;

  return (
    <div className={styles.error}>
      <h2>{notFound ? t("notFound") : t("generic")}</h2>
      <div className={styles.actions}>
        {onRetry && (
          <Button style="primary" onClick={onRetry}>
            <FaArrowRotateRight />
            {t("retry")}
          </Button>
        )}
        <Button href="/">
          <FaHouse />
          {t("home")}
        </Button>
      </div>
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
