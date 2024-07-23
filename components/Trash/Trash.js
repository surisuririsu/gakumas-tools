import { useContext } from "react";
import { useDrop } from "react-dnd";
import { FaRegTrashCan } from "react-icons/fa6";
import { EntityTypes } from "@/utils/entities";
import MemoryContext from "@/contexts/MemoryContext";
import SelectionContext from "@/contexts/SelectionContext";
import styles from "./Trash.module.scss";

export default function Trash() {
  const { setPItemIds, setSkillCardIds } = useContext(MemoryContext);
  const { selectedEntity, setSelectedEntity } = useContext(SelectionContext);

  function clearEntity(entity) {
    const setState =
      entity.type == EntityTypes.SKILL_CARD ? setSkillCardIds : setPItemIds;
    setState((cur) => {
      const next = [...cur];
      next[entity.index] = 0;
      return next;
    });
  }

  const [{ hover }, dropRef] = useDrop(() => ({
    accept: [EntityTypes.SKILL_CARD, EntityTypes.P_ITEM],
    drop: (item) => {
      if (item.widget != "dex") {
        clearEntity(item);
      }
    },
    collect: (monitor) => ({
      hover: !!monitor.isOver() && !!monitor.canDrop(),
    }),
  }));

  function handleClick(e) {
    e.stopPropagation();
    if (!selectedEntity) return;
    if (selectedEntity.widget == "memory_editor") {
      clearEntity(selectedEntity);
    }
    setSelectedEntity(null);
  }
  return (
    <button
      className={`${styles.trash} ${hover ? styles.hover : ""}`}
      ref={dropRef}
      onClick={(e) => handleClick(e)}
    >
      <FaRegTrashCan />
    </button>
  );
}
