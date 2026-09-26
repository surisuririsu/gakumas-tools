import { useTranslations } from "next-intl";
import buttonStyles from "@/components/Button/Button.module.scss";
import Image from "@/components/Image";
import c from "@/utils/classNames";
import styles from "./Error.module.scss";

const RETRY_CLASS = c(
  buttonStyles.button,
  buttonStyles.primary,
  buttonStyles.md
);
const HOME_CLASS = c(
  buttonStyles.button,
  buttonStyles.default,
  buttonStyles.md
);

export default function Error({ code, onRetry }) {
  const t = useTranslations("Error");
  const notFound = code == 404;

  return (
    <div className={styles.error}>
      <h2>{notFound ? t("notFound") : t("generic")}</h2>
      <div className={styles.actions}>
        {onRetry && (
          <button className={RETRY_CLASS} onClick={onRetry}>
            {t("retry")}
          </button>
        )}
        <a className={HOME_CLASS} href="/">
          {t("home")}
        </a>
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
