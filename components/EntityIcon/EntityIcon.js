import { memo } from "react";
import Image from "@/components/Image";
import c from "@/utils/classNames";
import { ENTITY_DATA_BY_TYPE } from "@/utils/entities";
import styles from "./EntityIcon.module.scss";

function EntityIcon({ type, id, idolId, size = "large", onClick }) {
  const entity = ENTITY_DATA_BY_TYPE[type].getById(id);

  return (
    <button
      className={c(styles.entityIcon, styles[size])}
      onClick={() => onClick(entity || {})}
    >
      {entity && (
        <Image
          src={entity.getIcon(idolId)}
          alt={entity.name}
          fill
          sizes="64px"
        />
      )}
    </button>
  );
}

export default memo(EntityIcon);
