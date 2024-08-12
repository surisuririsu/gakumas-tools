import Image from "next/image";
import { ENTITY_DATA_BY_TYPE } from "@/utils/entities";
import styles from "./EntityIcon.module.scss";

export default function EntityIcon({
  type,
  id,
  idolId,
  size = "large",
  onClick,
}) {
  const entity = ENTITY_DATA_BY_TYPE[type].getById(id);
  return (
    <button
      className={`${styles.entityIcon} ${styles[size] || ""}`}
      onClick={() => onClick(entity)}
    >
      {entity?.icon && (
        <Image
          src={entity.getDynamicIcon?.(idolId) || entity.icon}
          alt={entity.name}
          fill
          sizes="64px"
        />
      )}
    </button>
  );
}
