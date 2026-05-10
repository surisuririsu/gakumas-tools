import { memo, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import EntityIcon from "@/components/EntityIcon";
import {
  COMPARE_FN_BY_TYPE,
  ENTITY_DATA_BY_TYPE,
  isEntityHidden,
} from "@/utils/entities";
import { RARITY_VALUES } from "@/utils/sort";
import c from "@/utils/classNames";
import styles from "./EntityPool.module.scss";

export const POOL_ID = "pool";

const PoolItem = memo(function PoolItem({ type, id }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id,
  });
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={c(styles.item, isDragging && styles.itemDragging)}
    >
      <EntityIcon type={type} id={id} size="fill" />
    </div>
  );
});

function EntityPool({ type, list }) {
  const t = useTranslations("TierList");

  const allEntities = useMemo(() => {
    const all = ENTITY_DATA_BY_TYPE[type]
      .getAll()
      .filter((e) => !isEntityHidden(type, e.id));
    return [...all].sort(COMPARE_FN_BY_TYPE[type]);
  }, [type]);

  const placedIds = useMemo(() => {
    const set = new Set();
    for (const tier of list.tiers) {
      for (const id of list.items[tier] || []) set.add(id);
    }
    return set;
  }, [list]);

  const availableRarities = useMemo(() => {
    const present = new Set();
    for (const e of allEntities) {
      if (e.rarity) present.add(e.rarity);
    }
    return [...present].sort(
      (a, b) => (RARITY_VALUES[b] ?? -1) - (RARITY_VALUES[a] ?? -1),
    );
  }, [allEntities]);

  const hasUpgradedVariants = useMemo(() => {
    let hasBase = false;
    let hasUpgraded = false;
    for (const e of allEntities) {
      if (e.upgraded === true) hasUpgraded = true;
      else if (e.upgraded === false) hasBase = true;
      if (hasBase && hasUpgraded) return true;
    }
    return false;
  }, [allEntities]);

  const [rarityFilter, setRarityFilter] = useState(null);
  const [upgradedFilter, setUpgradedFilter] = useState(null);

  const filtered = useMemo(() => {
    return allEntities.filter((e) => {
      if (placedIds.has(e.id)) return false;
      if (rarityFilter && e.rarity !== rarityFilter) return false;
      if (upgradedFilter != null && e.upgraded !== upgradedFilter) return false;
      return true;
    });
  }, [allEntities, placedIds, rarityFilter, upgradedFilter]);

  const { setNodeRef, isOver } = useDroppable({ id: POOL_ID });

  const toggleRarity = (r) =>
    setRarityFilter((cur) => (cur === r ? null : r));
  const toggleUpgraded = (v) =>
    setUpgradedFilter((cur) => (cur === v ? null : v));

  return (
    <div ref={setNodeRef} className={c(styles.pool, isOver && styles.poolOver)}>
      {(availableRarities.length > 0 || hasUpgradedVariants) && (
        <div className={styles.filters}>
          {availableRarities.length > 0 && (
            <>
              <button
                type="button"
                className={c(
                  styles.chip,
                  rarityFilter == null && styles.chipActive,
                )}
                onClick={() => setRarityFilter(null)}
              >
                {t("filterAll")}
              </button>
              {availableRarities.map((r) => (
                <button
                  key={r}
                  type="button"
                  className={c(
                    styles.chip,
                    rarityFilter === r && styles.chipActive,
                  )}
                  onClick={() => toggleRarity(r)}
                >
                  {r}
                </button>
              ))}
            </>
          )}
          {hasUpgradedVariants && (
            <>
              <span className={styles.filterDivider} aria-hidden="true" />
              <button
                type="button"
                className={c(
                  styles.chip,
                  upgradedFilter === false && styles.chipActive,
                )}
                onClick={() => toggleUpgraded(false)}
              >
                {t("filterBase")}
              </button>
              <button
                type="button"
                className={c(
                  styles.chip,
                  upgradedFilter === true && styles.chipActive,
                )}
                onClick={() => toggleUpgraded(true)}
              >
                {t("filterUpgraded")}
              </button>
            </>
          )}
        </div>
      )}
      <div className={styles.scrollArea}>
        <div className={styles.scrollContent}>
          <div className={styles.dragHandle} aria-hidden="true">
            {Array.from({ length: 24 }, (_, i) => (
              <span key={i} className={styles.dragHandleHint}>
                {t("swipeHint")}
              </span>
            ))}
          </div>
          <div className={styles.items}>
            {filtered.map((e) => (
              <PoolItem key={e.id} type={type} id={e.id} />
            ))}
            {filtered.length === 0 && (
              <div className={styles.empty}>{t("poolEmpty")}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default memo(EntityPool);
