import { memo } from "react";
import Image from "@/components/Image";
import { SkillCards } from "@/utils/data";
import styles from "./DefaultCards.module.scss";

function DefaultCards({ skillCardIds }) {
  const defaultCards = skillCardIds.map(SkillCards.getById);

  return (
    <div className={styles.list}>
      {defaultCards.map((skillCard, index) => (
        <Image
          key={`${index}_${skillCard.id}`}
          src={skillCard.getIcon()}
          alt={skillCard.name}
          width={60}
          height={60}
        />
      ))}
    </div>
  );
}

export default memo(DefaultCards);
