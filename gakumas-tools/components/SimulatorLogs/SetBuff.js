import { memo } from "react";
import { useTranslations } from "next-intl";
import styles from "./SimulatorLogs.module.scss";

function SetBuff({ label, amount, turns, flat }) {
  const t = useTranslations("stage");

  return (
    <div className={styles.tile}>
      {label}{" "}
      <span className={styles.blue}>
        {amount >= 0 ? "+" : ""}
        {flat ? amount : `${amount * 100}%`}
      </span>{" "}
      {turns ? `(${t("numTurns", { num: turns })})` : ""}
    </div>
  );
}

export default memo(SetBuff);
