"use client";
import { memo, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useDrag, useDrop } from "@/utils/safeDnd";
import EntityIcon from "@/components/EntityIcon";
import styles from "./TierRow.module.scss";

function TierRow({ tier, entities, entityType, onEntityMove }) {
  const t = useTranslations("TierList");

  const [{ isOver }, dropRef] = useDrop({
    accept: "TIER_LIST_ENTITY",
    drop: (item) => {
      if (!entities.includes(item.entityId)) {
        onEntityMove(item.entityId, item.sourceTier, tier);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  const getTierColor = useCallback((tier) => {
    const colors = {
      S: "#ff6b6b",
      A: "#ffa500", 
      B: "#ffeb3b",
      C: "#4caf50",
      D: "#2196f3",
      F: "#9e9e9e"
    };
    return colors[tier] || "#9e9e9e";
  }, []);

  const handleEntityRemove = useCallback((entityId) => {
    onEntityMove(entityId, tier, "unranked");
  }, [tier, onEntityMove]);

  return (
    <div 
      ref={dropRef}
      className={`${styles.tierRow} ${isOver ? styles.dragOver : ""}`}
    >
      <div 
        className={styles.tierLabel}
        style={{ backgroundColor: getTierColor(tier) }}
      >
        <span className={styles.tierText}>{tier}</span>
        <span className={styles.count}>({entities.length})</span>
      </div>
      
      <div className={styles.tierContent}>
        {entities.length > 0 ? (
          <div className={styles.entities}>
            {entities.map(entityId => (
              <TierEntityItem
                key={`${tier}-${entityId}`}
                entityId={entityId}
                entityType={entityType}
                tier={tier}
                onRemove={handleEntityRemove}
              />
            ))}
          </div>
        ) : (
          <div className={styles.emptyTier}>
            <span>{t("dragHint")}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function TierEntityItem({ entityId, entityType, tier, onRemove }) {
  const handleDoubleClick = useCallback(() => {
    onRemove(entityId);
  }, [entityId, onRemove]);

  return (
    <div 
      className={styles.tierEntity}
      onDoubleClick={handleDoubleClick}
      title="Double-click to remove"
    >
      <DraggableTierEntity 
        entityId={entityId}
        entityType={entityType}
        sourceTier={tier}
      />
    </div>
  );
}

function DraggableTierEntity({ entityId, entityType, sourceTier }) {
  const [{ isDragging }, dragRef] = useDrag({
    type: "TIER_LIST_ENTITY",
    item: { entityId, sourceTier },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  return (
    <div 
      ref={dragRef}
      className={`${styles.draggableEntity} ${isDragging ? styles.dragging : ""}`}
    >
      <EntityIcon
        type={entityType}
        id={entityId}
        size="medium"
      />
    </div>
  );
}

export default memo(TierRow);