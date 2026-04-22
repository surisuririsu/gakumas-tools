import { memo } from "react";
import { PItems, SkillCards } from "gakumas-data";
import gkImg from "gakumas-images";
import { CustomizationCounts } from "@/components/EntityIcon";
import Image from "@/components/Image";
import { formatScore } from "./helpers";
import styles from "./SimulatorStats.module.scss";

function Row({ row, numRuns }) {
  const isPItem = row.type === "pItem";
  const entity = isPItem ? PItems.getById(row.id) : SkillCards.getById(row.id);
  if (!entity) return null;
  const usePct = row.draw ? (row.use / row.draw) * 100 : null;
  const score = row.score / numRuns;
  return (
    <tr>
      <td className={styles.cardCell}>
        <div className={styles.iconWrap}>
          <Image
            src={gkImg(entity).icon}
            alt={entity.name}
            title={entity.name}
            width={32}
            height={32}
          />
          {!isPItem && row.c && (
            <CustomizationCounts customizations={row.c} size="small" />
          )}
        </div>
        <span className={styles.cardName}>{entity.name}</span>
      </td>
      <td className={styles.numericCell}>{row.use.toLocaleString()}</td>
      <td className={styles.numericCell}>
        {usePct == null ? "—" : `${usePct.toFixed(1)}%`}
      </td>
      <td className={styles.numericCell}>{formatScore(score)}</td>
    </tr>
  );
}

export default memo(Row);
