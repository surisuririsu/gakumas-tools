import { memo } from "react";
import { SkillCards } from "gakumas-data";
import gkImg from "gakumas-images";
import Image from "@/components/Image";
import styles from "./DefaultCards.module.scss";

function DefaultCards({ skillCardIds }) {
  const defaultCards = skillCardIds.map(SkillCards.getById);
  const { icon } = gkImg(defaultCards);

  return (
    <div className={styles.list}>
      {defaultCards.map((skillCard, index) => (
        <Image
          key={`${index}_${skillCard.id}`}
          src={icon}
          alt={skillCard.name}
          width={60}
          height={60}
        />
      ))}
    </div>
  );
}

export default memo(DefaultCards);
