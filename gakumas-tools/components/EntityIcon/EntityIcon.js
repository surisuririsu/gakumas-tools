import { memo } from "react";
import gkImg from "gakumas-images";
import Image from "@/components/Image";
import c from "@/utils/classNames";
import { ENTITY_DATA_BY_TYPE, EntityTypes } from "@/utils/entities";
import CustomizationCounts from "./CustomizationCounts";
import Indications from "./Indications";
import TierIndicator from "./TierIndicator";
import styles from "./EntityIcon.module.scss";

function EntityIcon({
  type,
  id,
  customizations,
  indications,
  idolId,
  size = "large",
  onClick,
  showTier,
}) {
  const entity = ENTITY_DATA_BY_TYPE[type].getById(id);
  const { icon } = gkImg(entity, idolId);

  if (onClick) {
    return (
      <>
        <button
          className={c(
            styles.entityIcon,
            styles[size],
            indications?.duplicate && styles.duplicate
          )}
          onClick={() => onClick(entity || {})}
        >
          {entity && (
            <>
              <Image
                src={icon}
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
          {!!indications && <Indications indications={indications} />}
        </button>
      </>
    );
  } else {
    return (
      <div className={c(styles.entityIcon, styles[size])}>
        {entity && (
          <Image
            src={icon}
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
