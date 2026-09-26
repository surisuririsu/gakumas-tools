import { useCallback } from "react";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import c from "@/utils/classNames";
import styles from "./EntityIcon.module.scss";

export default function SwappableButton({
  swap,
  className,
  children,
  ...rest
}) {
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
