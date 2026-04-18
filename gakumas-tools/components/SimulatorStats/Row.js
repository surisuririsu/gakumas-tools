import { memo } from "react";
import { SkillCards } from "gakumas-data";
import gkImg from "gakumas-images";
import { CustomizationCounts } from "@/components/EntityIcon";
import Image from "@/components/Image";
import { formatScore } from "./helpers";
import styles from "./SimulatorStats.module.scss";

function Row({ row, numRuns }) {
  const skillCard = SkillCards.getById(row.id);
  if (!skillCard) return null;
  const usePct = row.draw ? (row.use / row.draw) * 100 : 0;
  const score = row.score / numRuns;
  return (
    <tr>
      <td className={styles.cardCell}>
        <div className={styles.iconWrap}>
          <Image
            src={gkImg(skillCard).icon}
            alt={skillCard.name}
            title={skillCard.name}
            width={32}
            height={32}
          />
          {row.c && <CustomizationCounts customizations={row.c} size="small" />}
        </div>
        <span className={styles.cardName}>{skillCard.name}</span>
      </td>
      <td className={styles.numericCell}>{row.use.toLocaleString()}</td>
      <td className={styles.numericCell}>{usePct.toFixed(1)}%</td>
      <td className={styles.numericCell}>{formatScore(score)}</td>
    </tr>
  );
}

export default memo(Row);
