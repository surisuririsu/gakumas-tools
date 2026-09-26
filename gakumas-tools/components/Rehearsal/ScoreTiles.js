import { memo } from "react";
import { useTranslations } from "next-intl";
import styles from "./Rehearsal.module.scss";

const KEYS = ["min", "average", "median", "max"];

function ScoreTiles({ data }) {
  const t = useTranslations("SimulatorResult");

  return (
    <table className={styles.stats}>
      <thead>
        <tr>
          {KEYS.map((key) => (
            <th key={key} className={key == "average" ? styles.hero : null}>
              {t(key)}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        <tr>
          {KEYS.map((key) => (
            <td key={key} className={key == "average" ? styles.hero : null}>
              {data[key]}
            </td>
          ))}
        </tr>
      </tbody>
    </table>
  );
}

export default memo(ScoreTiles);
