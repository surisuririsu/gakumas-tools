import Image from "next/image";
import { FaRegRectangleList } from "react-icons/fa6";
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
      {entity ? (
        <Image
          src={entity.details}
          alt={entity.name}
          fill
          sizes="400px"
          draggable={false}
        />
      ) : (
        <div className={styles.placeholder}>
          <FaRegRectangleList />
        </div>
      )}
    </div>
  );
}
