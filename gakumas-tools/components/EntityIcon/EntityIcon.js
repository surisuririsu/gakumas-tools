import { memo, useContext } from "react";
import { useTranslations } from "next-intl";
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
import SwapButtonContext from "./SwapButtonContext";
import TierIndicator from "./TierIndicator";
import styles from "./EntityIcon.module.scss";

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
  const SwapButton = useContext(SwapButtonContext);
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
    entity ? styles.filled : styles.empty,
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

  if (onSwap && SwapButton) {
    const swap = { type, index, id, idolId, customizations, onSwap };
    return (
      <SwapButton swap={swap} {...buttonProps}>
        {contents}
      </SwapButton>
    );
  }
  return <button {...buttonProps}>{contents}</button>;
}

export default memo(EntityIcon);
