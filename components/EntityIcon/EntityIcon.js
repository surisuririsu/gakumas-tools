import { memo } from "react";
import CustomizationCount from "@/components/CustomizationCount";
import Image from "@/components/Image";
import c from "@/utils/classNames";
import { ENTITY_DATA_BY_TYPE } from "@/utils/entities";
import styles from "./EntityIcon.module.scss";

function EntityIcon({
  type,
  id,
  numCustomizations,
  idolId,
  size = "large",
  onClick,
}) {
  const entity = ENTITY_DATA_BY_TYPE[type].getById(id);

  if (onClick) {
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
        {!!numCustomizations && <CustomizationCount num={numCustomizations} />}
      </button>
    );
  } else {
    return (
      <div className={c(styles.entityIcon, styles[size])}>
        {entity && (
          <Image
            src={entity.getIcon(idolId)}
            alt={entity.name}
            fill
            sizes="64px"
          />
        )}
        {!!numCustomizations && <CustomizationCount num={numCustomizations} />}
      </div>
    );
  }
}

export default memo(EntityIcon);
