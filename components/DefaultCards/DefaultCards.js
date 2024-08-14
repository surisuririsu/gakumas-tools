import Image from "next/image";
import { SkillCards } from "gakumas-data";
import styles from "./DefaultCards.module.scss";
import { memo } from "react";

const DEFAULT_CARDS_BY_PLAN = {
  sense: [5, 7, 1, 1, 15, 15, 17, 17],
  logic: [9, 11, 19, 19, 21, 21, 13, 13],
};

function DefaultCards({ plan, idolId }) {
  const defaultCards = DEFAULT_CARDS_BY_PLAN[plan].map(SkillCards.getById);

  return (
    <div className={styles.list}>
      {defaultCards.map((skillCard, index) => (
        <Image
          key={`${index}_${skillCard.id}`}
          src={skillCard.getDynamicIcon?.(idolId)}
          alt={skillCard.name}
          width={60}
          height={60}
        />
      ))}
    </div>
  );
}

export default memo(DefaultCards);
