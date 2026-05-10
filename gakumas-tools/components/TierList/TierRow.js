import { memo } from "react";
import { useTranslations } from "next-intl";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  rectSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { FaPlus, FaXmark } from "react-icons/fa6";
import EntityIcon from "@/components/EntityIcon";
import Image from "@/components/Image";
import c from "@/utils/classNames";
import styles from "./TierList.module.scss";

function SortableItem({ type, id }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={c(styles.item, isDragging && styles.itemPlaceholder)}
    >
      <EntityIcon type={type} id={id} size="fill" />
    </div>
  );
}

function TierRow({
  type,
  tierKey,
  ids,
  canDelete,
  addAbove,
  addBelow,
  isDragActive,
  onAdd,
  onAddTier,
  onDeleteTier,
}) {
  const t = useTranslations("TierList");
  const { setNodeRef: setItemsRef, isOver: isContainerOver } = useDroppable({
    id: tierKey,
  });

  return (
    <div className={styles.row}>
      <div className={styles.tierLabel}>
        {addAbove && (
          <button
            type="button"
            className={styles.tierAddTop}
            onClick={() => onAddTier(addAbove)}
            aria-label={t("addRankTier", { rank: addAbove })}
            data-export-ignore="true"
          >
            <FaPlus />
            {addAbove}
          </button>
        )}
        <Image
          src={`/ranks/${tierKey}.png`}
          alt={tierKey}
          width={48}
          height={48}
          draggable={false}
        />
        {canDelete && (
          <button
            type="button"
            className={styles.tierDeleteBtn}
            onClick={() => onDeleteTier(tierKey)}
            aria-label={t("removeRankTier", { rank: tierKey })}
            data-export-ignore="true"
          >
            <FaXmark />
          </button>
        )}
        {addBelow && (
          <button
            type="button"
            className={styles.tierAddBottom}
            onClick={() => onAddTier(addBelow)}
            aria-label={t("addRankTier", { rank: addBelow })}
            data-export-ignore="true"
          >
            <FaPlus />
            {addBelow}
          </button>
        )}
      </div>
      <div
        ref={setItemsRef}
        className={c(
          styles.items,
          isDragActive && styles.itemsCanDrop,
          isContainerOver && isDragActive && styles.itemsDropOver,
        )}
      >
        <SortableContext
          id={tierKey}
          items={ids}
          strategy={rectSortingStrategy}
        >
          {ids.map((id) => (
            <SortableItem key={id} type={type} id={id} />
          ))}
        </SortableContext>
        <button
          type="button"
          className={styles.addButton}
          aria-label={t("addItem")}
          onClick={() => onAdd(tierKey)}
          data-export-ignore="true"
        >
          <FaPlus />
        </button>
      </div>
    </div>
  );
}

export default memo(TierRow);
