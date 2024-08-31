import { memo } from "react";
import Image from "next/image";
import { SkillCards } from "gakumas-data";
import { calculateSkillCardCost } from "@/utils/contestPower";
import styles from "./MemoryCalculator.module.scss";

function MemoryCalculatorResult({ skillCardIds, probability, idolId, style }) {
  return (
    <div className={styles.result} style={style}>
      {skillCardIds.map(SkillCards.getById).map(({ id, getIcon, name }) => (
        <div key={id} className={styles.card}>
          <Image
            src={getIcon(idolId)}
            fill
            sizes="64px"
            alt={name}
            draggable={false}
          />
        </div>
      ))}
      {calculateSkillCardCost(skillCardIds)}
      <span>({(probability * 100).toFixed(2)}%)</span>
    </div>
  );
}

export default memo(MemoryCalculatorResult);
