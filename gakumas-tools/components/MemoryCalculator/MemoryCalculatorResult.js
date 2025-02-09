import { memo } from "react";
import { SkillCards } from "gakumas-data";
import gkImg from "gakumas-images";
import Image from "@/components/Image";
import { calculateSkillCardCost } from "@/utils/contestPower";
import styles from "./MemoryCalculator.module.scss";

function MemoryCalculatorResult({ skillCardIds, probability, idolId, style }) {
  return (
    <div className={styles.result} style={style}>
      {skillCardIds.map(SkillCards.getById).map((skillCard) => (
        <div key={skillCard.id} className={styles.card}>
          <Image
            src={gkImg(skillCard, idolId).icon}
            fill
            sizes="64px"
            alt={skillCard.name}
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
