import { useContext } from "react";
import { FaRegTrashCan } from "react-icons/fa6";
import { EntityTypes } from "@/utils/entities";
import MemoryContext from "@/contexts/MemoryContext";
import SelectionContext from "@/contexts/SelectionContext";
import styles from "./Trash.module.scss";

export default function Trash() {
  const { setPItemIds, setSkillCardIds } = useContext(MemoryContext);
  const { selectedEntity, setSelectedEntity } = useContext(SelectionContext);
  function handleClick(e) {
    e.stopPropagation();
    if (!selectedEntity) return;
    if (selectedEntity.widget == "memory_editor") {
      const setState =
        selectedEntity.type == EntityTypes.SKILL_CARD
          ? setSkillCardIds
          : setPItemIds;
      setState((cur) => {
        const next = [...cur];
        next[selectedEntity.index] = 0;
        return next;
      });
    }
    setSelectedEntity(null);
  }
  return (
    <button className={styles.trash} onClick={(e) => handleClick(e)}>
      <FaRegTrashCan />
    </button>
  );
}
