
import { useContext } from 'react';
import { DndContext, useDrag as originalUseDrag, useDrop as originalUseDrop } from "react-dnd";

export const useDrag = (spec) => {
  const { dragDropManager } = useContext(DndContext);
  if (!dragDropManager) {
    return [{}, null];
  }

  const [collectedProps, dragRef] = originalUseDrag(spec);
  return [collectedProps, dragRef];
};

export const useDrop = (spec) => {
  const { dragDropManager } = useContext(DndContext);
  if (!dragDropManager) {
    return [{}, null];
  }

  const [collectedProps, dropRef] = originalUseDrop(spec);
  return [collectedProps, dropRef];
};
