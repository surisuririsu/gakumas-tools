import Image from "next/image";
import { PItems, SkillCards } from "gakumas-data";
import { EntityTypes } from "@/utils/entities";
import styles from "./EntityDetails.module.scss";

export default function EntityDetails({ type, id }) {
  let entity;
  if (type == EntityTypes.P_ITEM) {
    entity = PItems.getById(id);
  } else if (type == EntityTypes.SKILL_CARD) {
    entity = SkillCards.getById(id);
  }
  return (
    <div className={styles.entityDetails}>
      <Image src={entity.details} fill alt={entity.name} sizes="400px" />
    </div>
  );
}
