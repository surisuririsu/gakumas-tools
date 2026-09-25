import { useState } from "react";
import {
  DndContext,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import EntityIcon from "@/components/EntityIcon";
import styles from "./LoadoutEditor.module.scss";

export default function SwapDndContext({ children }) {
  const [dragged, setDragged] = useState(null);
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 250, tolerance: 8 },
    })
  );

  function handleDragStart({ active }) {
    setDragged(active.data.current);
    navigator.vibrate?.(8);
  }

  function handleDragEnd({ active, over }) {
    setDragged(null);
    const from = active.data.current;
    const to = over?.data.current;
    if (!to || to.type != from.type || over.id == active.id) return;
    from.onSwap(from.index, to.index);
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setDragged(null)}
    >
      {children}
      <DragOverlay dropAnimation={null}>
        {dragged && (
          <div className={styles.dragOverlay}>
            <EntityIcon
              type={dragged.type}
              id={dragged.id}
              idolId={dragged.idolId}
              customizations={dragged.customizations}
              size="fill"
            />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
