"use client";
import {
  memo,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import {
  DndContext,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  closestCenter,
  pointerWithin,
  rectIntersection,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { FaTrash } from "react-icons/fa6";
import { arrayMove } from "@dnd-kit/sortable";
import { FaShareNodes } from "react-icons/fa6";
import ConfirmModal from "@/components/ConfirmModal";
import EntityIcon from "@/components/EntityIcon";
import ModalContext from "@/contexts/ModalContext";
import NavigationGuardContext from "@/contexts/NavigationGuardContext";
import c from "@/utils/classNames";
import TierListPickerModal from "./TierListPickerModal";
import TierRow from "./TierRow";
import TierShareModal from "./TierShareModal";
import { AVAILABLE_RANKS, sortRanks } from "./ranks";
import styles from "./TierList.module.scss";

const DEFAULT_RANKS = ["S4", "SSS", "SS", "S", "A", "B"];
const TRASH_ID = "trash:bottom";

const EMPTY_LIST = {
  tiers: DEFAULT_RANKS,
  items: DEFAULT_RANKS.reduce((acc, k) => {
    acc[k] = [];
    return acc;
  }, {}),
};

function encodeList(list) {
  return list.tiers
    .map((rank) => `${rank}=${(list.items[rank] || []).join(".")}`)
    .join("_");
}

function decodeList(str) {
  if (!str) return null;
  const tiers = [];
  const items = {};
  for (const seg of str.split("_")) {
    const eq = seg.indexOf("=");
    const rank = eq >= 0 ? seg.slice(0, eq) : seg;
    const idsStr = eq >= 0 ? seg.slice(eq + 1) : "";
    if (!rank) continue;
    tiers.push(rank);
    items[rank] = idsStr
      ? idsStr.split(".").map(Number).filter(Number.isFinite)
      : [];
  }
  if (!tiers.length) return null;
  return { tiers: sortRanks(tiers), items };
}

function isDefaultList(list) {
  if (list.tiers.length !== DEFAULT_RANKS.length) return false;
  for (let i = 0; i < DEFAULT_RANKS.length; i++) {
    if (list.tiers[i] !== DEFAULT_RANKS[i]) return false;
  }
  return Object.values(list.items).every((arr) => arr.length === 0);
}

// dnd-kit IDs are strings or numbers. Items use their numeric id; tier
// containers use the rank string (e.g., "SS"); trash zones are prefixed.
function findContainer(list, id) {
  if (typeof id === "string" && list.tiers.includes(id)) return id;
  for (const tier of list.tiers) {
    if ((list.items[tier] || []).includes(id)) return tier;
  }
  return null;
}

function BottomTrashZone({ isDragActive, isOverTrash }) {
  const t = useTranslations("TierList");
  const { setNodeRef } = useDroppable({
    id: TRASH_ID,
    disabled: !isDragActive,
  });
  return (
    <div
      ref={setNodeRef}
      className={c(
        styles.bottomTrash,
        isDragActive && styles.bottomTrashActive,
        isOverTrash && styles.bottomTrashOver,
      )}
      aria-label={isDragActive ? t("removeItem") : undefined}
      data-export-ignore="true"
    >
      <FaTrash />
      <span>{t("removeItem")}</span>
    </div>
  );
}

function TierList({ type }) {
  const t = useTranslations("TierList");
  const { setModal } = useContext(ModalContext);
  const { setGuard } = useContext(NavigationGuardContext);
  const searchParams = useSearchParams();

  const initialList = useMemo(() => {
    const d = searchParams?.get("d");
    if (d) {
      const decoded = decodeList(d);
      if (decoded) return decoded;
    }
    return EMPTY_LIST;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [list, setList] = useState(initialList);
  const listRef = useRef(list);
  listRef.current = list;

  useEffect(() => {
    const url = new URL(window.location.href);
    if (isDefaultList(list)) {
      url.searchParams.delete("d");
    } else {
      url.searchParams.set("d", encodeList(list));
    }
    window.history.replaceState(null, "", url);
  }, [list]);

  const [pickerTier, setPickerTier] = useState(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [activeId, setActiveId] = useState(null);
  const [overId, setOverId] = useState(null);

  const tierRowsRef = useRef(null);

  const pickedById = useMemo(() => {
    const m = {};
    for (const tierKey of list.tiers) {
      const ids = list.items[tierKey] || [];
      for (const id of ids) m[id] = tierKey;
    }
    return m;
  }, [list]);

  const allIdsCount = useMemo(
    () => Object.keys(pickedById).length,
    [pickedById],
  );

  // Picker-side helpers (still uses index-based placement; not via dnd-kit).
  const placeItem = useCallback((targetKey, targetIndex, id) => {
    setList((prev) => {
      if (!prev.tiers.includes(targetKey)) return prev;
      const nextItems = { ...prev.items };
      let oldTier = null;
      let oldIndex = -1;
      for (const k of prev.tiers) {
        const arr = nextItems[k] || [];
        const idx = arr.indexOf(id);
        if (idx !== -1) {
          oldTier = k;
          oldIndex = idx;
          break;
        }
      }
      if (oldTier) {
        const arr = [...nextItems[oldTier]];
        arr.splice(oldIndex, 1);
        nextItems[oldTier] = arr;
      }
      const targetArr = [...(nextItems[targetKey] || [])];
      let insertAt;
      if (targetIndex == null) {
        insertAt = targetArr.length;
      } else {
        let idx = targetIndex;
        if (oldTier === targetKey && oldIndex !== -1 && oldIndex < idx) idx -= 1;
        insertAt = Math.max(0, Math.min(idx, targetArr.length));
      }
      if (oldTier === targetKey && oldIndex === insertAt) return prev;
      targetArr.splice(insertAt, 0, id);
      nextItems[targetKey] = targetArr;
      return { ...prev, items: nextItems };
    });
  }, []);

  const removeItem = useCallback((tierKey, id) => {
    setList((prev) => ({
      ...prev,
      items: {
        ...prev.items,
        [tierKey]: (prev.items[tierKey] || []).filter((x) => x !== id),
      },
    }));
  }, []);

  const removeAnywhere = useCallback((id) => {
    setList((prev) => {
      let foundTier = null;
      for (const k of prev.tiers) {
        if ((prev.items[k] || []).includes(id)) {
          foundTier = k;
          break;
        }
      }
      if (!foundTier) return prev;
      return {
        ...prev,
        items: {
          ...prev.items,
          [foundTier]: prev.items[foundTier].filter((x) => x !== id),
        },
      };
    });
  }, []);

  const pickedByIdRef = useRef(pickedById);
  pickedByIdRef.current = pickedById;

  const togglePickerItem = useCallback(
    (entity) => {
      if (entity?.id == null || pickerTier == null) return;
      const id = entity.id;
      const currentTier = pickedByIdRef.current[id];
      if (currentTier === pickerTier) {
        removeItem(currentTier, id);
      } else {
        placeItem(pickerTier, null, id);
      }
    },
    [pickerTier, removeItem, placeItem],
  );

  const addTier = useCallback((rank) => {
    setList((prev) => {
      if (!AVAILABLE_RANKS.includes(rank) || prev.tiers.includes(rank)) {
        return prev;
      }
      return {
        tiers: sortRanks([...prev.tiers, rank]),
        items: { ...prev.items, [rank]: [] },
      };
    });
  }, []);

  const removeTier = useCallback(
    (rank) => {
      if (!list.tiers.includes(rank) || list.tiers.length <= 1) return;
      const apply = () =>
        setList((prev) => {
          if (prev.tiers.length <= 1) return prev;
          const nextTiers = prev.tiers.filter((k) => k !== rank);
          const nextItems = { ...prev.items };
          delete nextItems[rank];
          return { tiers: nextTiers, items: nextItems };
        });
      const itemCount = (list.items[rank] || []).length;
      if (itemCount > 0) {
        setModal(
          <ConfirmModal
            message={t("confirmRemoveTier", { rank, count: itemCount })}
            onConfirm={apply}
          />,
        );
      } else {
        apply();
      }
    },
    [list, setModal, t],
  );

  const clearAll = useCallback(() => {
    setModal(
      <ConfirmModal
        message={t("confirmClear")}
        onConfirm={() =>
          setList((prev) => ({
            ...prev,
            items: prev.tiers.reduce((acc, k) => {
              acc[k] = [];
              return acc;
            }, {}),
          }))
        }
      />,
    );
  }, [setModal, t]);

  useEffect(() => {
    if (allIdsCount === 0) {
      setGuard(null);
      return;
    }
    setGuard(
      () =>
        new Promise((resolve) => {
          setModal(
            <ConfirmModal
              message={t("confirmLeave")}
              onConfirm={() => resolve(true)}
              onCancel={() => resolve(false)}
            />,
          );
        }),
    );
    return () => setGuard(null);
  }, [allIdsCount, setGuard, setModal, t]);

  const tiersSet = useMemo(() => new Set(list.tiers), [list.tiers]);
  const canDeleteTier = list.tiers.length > 1;

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 6 },
    }),
  );

  // Custom collision detection (multiple-container pattern):
  //   - trash takes precedence when pointer is inside it
  //   - cursor over a tier with items → closest item inside that tier
  //   - cursor over empty tier → the tier container itself
  //   - cursor outside everything → rectIntersection fallback
  const collisionDetection = useCallback((args) => {
    const pointerHits = pointerWithin(args);
    const trashHit = pointerHits.find((c) => c.id === TRASH_ID);
    if (trashHit) return [trashHit];

    const intersections =
      pointerHits.length > 0 ? pointerHits : rectIntersection(args);
    if (intersections.length === 0) return [];

    const cur = listRef.current;
    let firstId = intersections[0].id;

    if (typeof firstId === "string" && cur.tiers.includes(firstId)) {
      const containerItems = cur.items[firstId] || [];
      if (containerItems.length > 0) {
        const inside = args.droppableContainers.filter((c) =>
          containerItems.includes(c.id),
        );
        const closer = closestCenter({ ...args, droppableContainers: inside });
        if (closer.length > 0) return closer;
      }
    }

    return [{ id: firstId }];
  }, []);

  const handleDragStart = useCallback((event) => {
    setActiveId(event.active.id);
    setOverId(null);
  }, []);

  const handleDragOver = useCallback((event) => {
    const { active, over } = event;
    setOverId(over?.id ?? null);
    if (!over) return;
    const activeId = active.id;
    const overIdNow = over.id;
    if (activeId === overIdNow) return;
    if (overIdNow === TRASH_ID) return;

    const cur = listRef.current;
    const activeContainer = findContainer(cur, activeId);
    const overContainer = findContainer(cur, overIdNow);
    if (!activeContainer || !overContainer) return;
    if (activeContainer === overContainer) return;

    setList((prev) => {
      const activeItems = prev.items[activeContainer] || [];
      const overItems = prev.items[overContainer] || [];
      if (!activeItems.includes(activeId)) return prev;

      let newIndex;
      if (overIdNow === overContainer) {
        newIndex = overItems.length;
      } else {
        const overIdx = overItems.indexOf(overIdNow);
        // Insert above the over item; dnd-kit handles half-detection visually
        // through its drag-over mechanism with pointer position.
        const isBelowOver =
          over.rect &&
          active.rect.current.translated &&
          active.rect.current.translated.top >
            over.rect.top + over.rect.height / 2;
        newIndex = overIdx >= 0 ? overIdx + (isBelowOver ? 1 : 0) : overItems.length;
      }

      return {
        ...prev,
        items: {
          ...prev.items,
          [activeContainer]: activeItems.filter((id) => id !== activeId),
          [overContainer]: [
            ...overItems.slice(0, newIndex),
            activeId,
            ...overItems.slice(newIndex),
          ],
        },
      };
    });
  }, []);

  const handleDragEnd = useCallback(
    (event) => {
      const { active, over } = event;
      setActiveId(null);
      setOverId(null);
      if (!over) return;
      const activeId = active.id;
      const dropId = over.id;

      if (dropId === TRASH_ID) {
        removeAnywhere(activeId);
        return;
      }

      const cur = listRef.current;
      const activeContainer = findContainer(cur, activeId);
      const overContainer = findContainer(cur, dropId);
      if (!activeContainer || !overContainer) return;
      if (activeContainer !== overContainer) return;

      const items = cur.items[activeContainer] || [];
      const oldIndex = items.indexOf(activeId);
      const newIndex =
        dropId === overContainer ? items.length - 1 : items.indexOf(dropId);
      if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return;

      setList((prev) => ({
        ...prev,
        items: {
          ...prev.items,
          [activeContainer]: arrayMove(prev.items[activeContainer], oldIndex, newIndex),
        },
      }));
    },
    [removeAnywhere],
  );

  const handleDragCancel = useCallback(() => {
    setActiveId(null);
    setOverId(null);
  }, []);

  const isOverTrash = overId === TRASH_ID;

  return (
    <DndContext
      id="tier-list"
      sensors={sensors}
      collisionDetection={collisionDetection}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className={styles.tierList}>
        <div className={styles.header}>
          <button
            type="button"
            className={styles.headerButton}
            onClick={() => setShareOpen(true)}
          >
            <FaShareNodes />
            {t("share")}
          </button>
          <button
            type="button"
            className={styles.headerButton}
            onClick={clearAll}
            disabled={allIdsCount === 0}
          >
            {t("clearAll")}
          </button>
        </div>

        <div className={styles.tiers}>
          <div ref={tierRowsRef} className={styles.tierRows}>
            {list.tiers.map((tierKey) => {
              const idx = AVAILABLE_RANKS.indexOf(tierKey);
              const aboveRank =
                idx > 0 && !tiersSet.has(AVAILABLE_RANKS[idx - 1])
                  ? AVAILABLE_RANKS[idx - 1]
                  : null;
              const belowRank =
                idx >= 0 &&
                idx < AVAILABLE_RANKS.length - 1 &&
                !tiersSet.has(AVAILABLE_RANKS[idx + 1])
                  ? AVAILABLE_RANKS[idx + 1]
                  : null;
              return (
                <TierRow
                  key={tierKey}
                  type={type}
                  tierKey={tierKey}
                  ids={list.items[tierKey] || []}
                  canDelete={canDeleteTier}
                  addAbove={aboveRank}
                  addBelow={belowRank}
                  isDragActive={activeId != null}
                  isOverTrash={isOverTrash}
                  onAdd={() => setPickerTier(tierKey)}
                  onAddTier={addTier}
                  onDeleteTier={() => removeTier(tierKey)}
                />
              );
            })}
          </div>
          <BottomTrashZone
            isDragActive={activeId != null}
            isOverTrash={isOverTrash}
          />
        </div>

        {pickerTier != null && list.tiers.includes(pickerTier) && (
          <TierListPickerModal
            type={type}
            tierKey={pickerTier}
            pickedById={pickedById}
            onPick={togglePickerItem}
            onClose={() => setPickerTier(null)}
          />
        )}

        {shareOpen && (
          <TierShareModal
            type={type}
            getImageNode={() => tierRowsRef.current}
            onClose={() => setShareOpen(false)}
          />
        )}
      </div>

      <DragOverlay
        dropAnimation={{ duration: 180, easing: "cubic-bezier(0.18, 0.67, 0.6, 1)" }}
      >
        {activeId != null ? (
          <div className={styles.item}>
            <EntityIcon type={type} id={activeId} size="fill" />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

export default memo(TierList);
