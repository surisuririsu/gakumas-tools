"use client";
import { memo, useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { useDrag } from "@/utils/safeDnd";
import Input from "@/components/Input";
import EntityIcon from "@/components/EntityIcon";
import styles from "./UnrankedPool.module.scss";

function UnrankedPool({ entities, entityType, onEntityMove }) {
  const t = useTranslations("TierList");
  const [searchTerm, setSearchTerm] = useState("");

  const filteredEntities = useMemo(() => {
    if (!searchTerm.trim()) return entities;
    
    const term = searchTerm.toLowerCase();
    return entities.filter(entity => 
      entity.name.toLowerCase().includes(term) ||
      (entity.title && entity.title.toLowerCase().includes(term))
    );
  }, [entities, searchTerm]);

  if (entities.length === 0) {
    return (
      <div className={styles.emptyPool}>
        <p>{t("noTierLists")}</p>
      </div>
    );
  }

  return (
    <div className={styles.unrankedPool}>
      <div className={styles.poolHeader}>
        <div className={styles.searchWrapper}>
          <Input
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder={t("searchEntities")}
          />
        </div>
        <div className={styles.entityCount}>
          {filteredEntities.length} / {entities.length}
        </div>
      </div>
      
      <div className={styles.entityGrid}>
        {filteredEntities.map(entity => (
          <UnrankedEntity
            key={entity.id}
            entity={entity}
            entityType={entityType}
          />
        ))}
      </div>
    </div>
  );
}

function UnrankedEntity({ entity, entityType }) {
  const [{ isDragging }, dragRef] = useDrag({
    type: "TIER_LIST_ENTITY",
    item: { 
      entityId: entity.id, 
      sourceTier: "unranked" 
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  return (
    <div 
      ref={dragRef}
      className={`${styles.unrankedEntity} ${isDragging ? styles.dragging : ""}`}
      title={entity.name + (entity.title ? ` - ${entity.title}` : "")}
    >
      <EntityIcon
        type={entityType}
        id={entity.id}
        size="medium"
      />
    </div>
  );
}

export default memo(UnrankedPool);