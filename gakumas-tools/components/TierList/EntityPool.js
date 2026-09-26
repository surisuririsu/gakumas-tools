import { memo, useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import EntityIcon from "@/components/EntityIcon";
import { usePopOnActivate } from "@/utils/usePop";
import {
  COMPARE_FN_BY_TYPE,
  ENTITY_DATA_BY_TYPE,
  isEntityHidden,
} from "@/utils/entities";
import { RARITY_VALUES } from "@/utils/sort";
import c from "@/utils/classNames";
import styles from "./EntityPool.module.scss";

export const POOL_ID = "pool";

const nearCallbacks = new WeakMap();
let nearObserver = null;

function observeNear(el, onNear) {
  nearObserver ??= new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        nearCallbacks.get(entry.target)?.();
        nearCallbacks.delete(entry.target);
        nearObserver.unobserve(entry.target);
      }
    },
    { rootMargin: "200px" },
  );
  nearCallbacks.set(el, onNear);
  nearObserver.observe(el);
  return () => {
    nearCallbacks.delete(el);
    nearObserver.unobserve(el);
  };
}

function DragSurface({ id }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id,
  });
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={c(styles.dragSurface, isDragging && styles.dragging)}
    />
  );
}

const PoolItem = memo(function PoolItem({ type, id }) {
  const ref = useRef(null);
  const [near, setNear] = useState(false);

  useEffect(() => {
    if (near) return;
    return observeNear(ref.current, () => setNear(true));
  }, [near]);

  return (
    <div ref={ref} className={styles.item}>
      <EntityIcon type={type} id={id} size="fill" />
      {near && <DragSurface id={id} />}
    </div>
  );
});

function FilterChip({ active, onClick, children }) {
  const pop = usePopOnActivate(active);
  return (
    <button
      type="button"
      className={c(styles.chip, active && styles.chipActive, pop && styles[`pop${pop}`])}
      aria-pressed={active}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

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
              <FilterChip
                active={rarityFilter == null}
                onClick={() => setRarityFilter(null)}
              >
                {t("filterAll")}
              </FilterChip>
              {availableRarities.map((r) => (
                <FilterChip
                  key={r}
                  active={rarityFilter === r}
                  onClick={() => toggleRarity(r)}
                >
                  {r}
                </FilterChip>
              ))}
            </>
          )}
          {hasUpgradedVariants && (
            <>
              <span className={styles.filterDivider} aria-hidden="true" />
              <FilterChip
                active={upgradedFilter === false}
                onClick={() => toggleUpgraded(false)}
              >
                {t("filterBase")}
              </FilterChip>
              <FilterChip
                active={upgradedFilter === true}
                onClick={() => toggleUpgraded(true)}
              >
                {t("filterUpgraded")}
              </FilterChip>
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
