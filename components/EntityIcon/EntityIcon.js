import { memo } from "react";
import Image from "@/components/Image";
import c from "@/utils/classNames";
import { ENTITY_DATA_BY_TYPE, EntityTypes } from "@/utils/entities";
import CustomizationCounts from "./CustomizationCounts";
import TierIndicator from "./TierIndicator";
import styles from "./EntityIcon.module.scss";

function EntityIcon({
  type,
  id,
  customizations,
  idolId,
  size = "large",
  onClick,
  showTier,
}) {
  const entity = ENTITY_DATA_BY_TYPE[type].getById(id);

  if (onClick) {
    return (
      <button
        className={c(styles.entityIcon, styles[size])}
        onClick={() => onClick(entity || {})}
      >
        {entity && (
          <>
            <Image
              src={entity.getIcon(idolId)}
              alt={entity.name}
              fill
              sizes="64px"
              draggable={false}
            />
            {showTier && type == EntityTypes.SKILL_CARD && (
              <TierIndicator skillCard={entity} />
            )}
          </>
        )}
        {!!customizations && (
          <CustomizationCounts customizations={customizations} />
        )}
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
            draggable={false}
          />
        )}
        {!!customizations && (
          <CustomizationCounts customizations={customizations} />
        )}
      </div>
    );
  }
}

export default memo(EntityIcon);
