import Image from "next/image";
import { SkillCards } from "gakumas-data";
import styles from "./DefaultCards.module.scss";

const DEFAULT_CARDS_BY_PLAN = {
  sense: [5, 7, 1, 1, 15, 15, 17, 17],
  logic: [9, 11, 19, 19, 21, 21, 13, 13],
};

export default function DefaultCards({ plan, idolId }) {
  const defaultCards = DEFAULT_CARDS_BY_PLAN[plan];

  return (
    <div className={styles.list}>
      {defaultCards.map(SkillCards.getById).map((skillCard, index) => (
        <Image
          key={`${index}_${skillCard.id}`}
          src={skillCard.getDynamicIcon?.(idolId) || entity.icon}
          alt={skillCard.name}
          width={60}
          height={60}
        />
      ))}
    </div>
  );
}
