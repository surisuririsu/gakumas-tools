import { memo } from "react";
import { useTranslations } from "next-intl";
import { SkillCards } from "gakumas-data";
import gkImg from "gakumas-images";
import Image from "@/components/Image";
import { calculateSkillCardCost } from "@/utils/contestPower";
import styles from "./MemoryCalculator.module.scss";

function MemoryCalculatorResult({ skillCardIds, probability, idolId }) {
  const t = useTranslations("MemoryCalculator");

  return (
    <div className={styles.result}>
      <div className={styles.cards}>
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
      </div>
      <div className={styles.resultStats}>
        <span className={styles.resultProbability}>
          {(probability * 100).toFixed(2)}%
        </span>
        <span className={styles.resultCost}>
          {t("cost")}
          <b>{calculateSkillCardCost(skillCardIds)}</b>
        </span>
      </div>
    </div>
  );
}

export default memo(MemoryCalculatorResult);
