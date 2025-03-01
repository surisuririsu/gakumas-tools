import { useTranslations } from "next-intl";
import c from "@/utils/classNames";
import styles from "./EntityIcon.module.scss";

const WARNINGS = ["planMismatch", "idolMismatch", "pIdolMismatch"];

export default function Indications({ indications }) {
  const t = useTranslations("EntityIcon");

  const warningIndications = WARNINGS.filter((key) => indications[key]);
  const numIndications = warningIndications.length;

  if (!numIndications) return null;

  return (
    <>
      <div
        className={c(styles.badge, styles.indication)}
        data-tooltip-id="indications-tooltip"
        data-tooltip-content={warningIndications
          .map((key) => t(key))
          .join(", ")}
        onClick={(e) => e.stopPropagation()}
      >
        {numIndications}
      </div>
    </>
  );
}
