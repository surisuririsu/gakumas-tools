import Image from "next/image";
import { SkillCards } from "gakumas-data";
import styles from "./SkillCard.module.scss";

export default function SkillCard({ skillCardId, small }) {
  const skillCard = SkillCards.getById(skillCardId);
  return (
    <div className={`${styles.skillCard} ${small ? styles.small : ""}`}>
      {skillCard?.icon && (
        <Image src={skillCard.icon} fill alt={skillCard.name} sizes="52px" />
      )}
    </div>
  );
}
