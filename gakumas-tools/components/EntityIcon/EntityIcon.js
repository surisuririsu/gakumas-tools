import { memo } from "react";
import { FaPlus } from "react-icons/fa6";
import { Idols, SkillCards } from "gakumas-data";
import gkImg from "gakumas-images";
import Image from "@/components/Image";
import c from "@/utils/classNames";
import { ENTITY_DATA_BY_TYPE, EntityTypes } from "@/utils/entities";
import { useDrag, useDrop } from "@/utils/safeDnd";
import CustomizationCounts from "./CustomizationCounts";
import Indications from "./Indications";
import TierIndicator from "./TierIndicator";
import styles from "./EntityIcon.module.scss";

// Not every p-idol has its own icon asset, so render its signature skill
// card icon instead (matches the p-idol collection page).
const SIGNATURE_CARD_BY_PIDOL = SkillCards.getAll().reduce((acc, sc) => {
  if (sc.pIdolId && !sc.upgraded && !acc[sc.pIdolId]) acc[sc.pIdolId] = sc;
  return acc;
}, {});

function EntityIcon({
  type,
  id,
  index,
  customizations,
  indications,
  idolId,
  size = "large",
  onClick,
  onSwap,
  showTier,
  showEmptyPlaceholder,
}) {
  const entity = ENTITY_DATA_BY_TYPE[type].getById(id);
  let imageEntity = entity;
  let imageIdolId = idolId;
  if (entity?._type === "pIdol") {
    const sigCard = SIGNATURE_CARD_BY_PIDOL[entity.id];
    if (sigCard) {
      imageEntity = sigCard;
      imageIdolId = entity.idolId;
    }
  }
  const { icon } = gkImg(imageEntity, imageIdolId);

  const [{ isDragging }, dragRef] = useDrag({
    type: "ENTITY_ICON",
    item: { type, id, index },
  });

  const [, dropRef] = useDrop({
    accept: "ENTITY_ICON",
    drop: (item) => {
      if (item.type != type) {
        return;
      }
      if (onSwap) {
        onSwap(item.index, index);
      }
    },
  });

  let displayName = entity?.name;
  if (entity?._type === "pIdol") {
    const idol = Idols.getById(entity.idolId);
    displayName = `${idol?.name || ""} ${entity.title || ""}`.trim();
  }

  let unwrappedElement = null;
  if (entity) {
    unwrappedElement = (
      <>
        <Image
          src={icon}
          alt={displayName}
          title={displayName}
          fill
          sizes="64px"
          draggable={false}
        />
        {showTier && type == EntityTypes.SKILL_CARD && (
          <TierIndicator skillCard={entity} />
        )}
        {!!customizations && (
          <CustomizationCounts customizations={customizations} />
        )}
        {!!indications && <Indications indications={indications} />}
      </>
    );
  }

  const className = c(
    styles.entityIcon,
    styles[size],
    indications?.duplicate && styles.duplicate
  );

  if (onClick) {
    return (
        <button ref={dragRef} className={className} onClick={() => onClick(entity || {})}>
          <div ref={dropRef} className={styles.dropArea}>
            {unwrappedElement ||
              (showEmptyPlaceholder && (
                <FaPlus
                  className={styles.emptyPlaceholder}
                  aria-hidden="true"
                />
              ))}
          </div>
      </button>
    );
  } else {
    return <div className={className}>{unwrappedElement}</div>;
  }
}

export default memo(EntityIcon);
