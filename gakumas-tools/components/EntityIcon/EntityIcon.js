import { memo, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import { FaPlus } from "react-icons/fa6";
import { Idols } from "gakumas-data";
import Image from "@/components/Image";
import c from "@/utils/classNames";
import {
  ENTITY_DATA_BY_TYPE,
  EntityTypes,
  resolveEntityIcon,
} from "@/utils/entities";
import CustomizationCounts from "./CustomizationCounts";
import Indications from "./Indications";
import TierIndicator from "./TierIndicator";
import styles from "./EntityIcon.module.scss";

function SwappableButton({ swap, className, children, ...rest }) {
  const dragId = `${swap.type}-${swap.index}`;
  const {
    setNodeRef: setDragRef,
    listeners,
    isDragging,
  } = useDraggable({ id: dragId, data: swap, disabled: !swap.id });
  const {
    setNodeRef: setDropRef,
    isOver,
    active,
  } = useDroppable({ id: dragId, data: swap });
  const ref = useCallback(
    (node) => {
      setDragRef(node);
      setDropRef(node);
    },
    [setDragRef, setDropRef]
  );
  const isTarget =
    isOver && !isDragging && active?.data.current?.type == swap.type;

  return (
    <button
      ref={ref}
      {...listeners}
      className={c(
        className,
        styles.swappable,
        isDragging && styles.swapSource,
        isTarget && styles.swapTarget
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

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
  const t = useTranslations("EntityIcon");
  const entity = ENTITY_DATA_BY_TYPE[type].getById(id);
  const icon = resolveEntityIcon(entity, idolId);

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

  if (!onClick) {
    return <div className={className}>{unwrappedElement}</div>;
  }

  const contents = (
    <div className={styles.dropArea}>
      {unwrappedElement ||
        (showEmptyPlaceholder && (
          <FaPlus className={styles.emptyPlaceholder} aria-hidden="true" />
        ))}
    </div>
  );
  const buttonProps = {
    className,
    onClick: () => onClick(entity || {}),
    "aria-label": entity ? undefined : t("emptySlot"),
  };

  if (onSwap) {
    const swap = { type, index, id, idolId, customizations, onSwap };
    return (
      <SwappableButton swap={swap} {...buttonProps}>
        {contents}
      </SwappableButton>
    );
  }
  return <button {...buttonProps}>{contents}</button>;
}

export default memo(EntityIcon);
