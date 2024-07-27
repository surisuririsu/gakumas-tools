import { useContext } from "react";
import { useDrop } from "react-dnd";
import { FaRegTrashCan } from "react-icons/fa6";
import { EntityTypes } from "@/utils/entities";
import MemoryContext from "@/contexts/MemoryContext";
import SearchContext from "@/contexts/SearchContext";
import SelectionContext from "@/contexts/SelectionContext";
import styles from "./Trash.module.scss";

export default function Trash({ size }) {
  const {
    setPItemIds: setMemoryPItemIds,
    setSkillCardIds: setMemorySkillCardIds,
  } = useContext(MemoryContext);
  const {
    setPItemIds: setSearchPItemIds,
    setSkillCardIds: setSearchSkillCardIds,
  } = useContext(SearchContext);
  const { selectedEntity, setSelectedEntity } = useContext(SelectionContext);

  function clearEntity(entity) {
    let setState = () => {};
    if (entity.widget == "memory_editor") {
      setState =
        entity.type == EntityTypes.SKILL_CARD
          ? setMemorySkillCardIds
          : setMemoryPItemIds;
    } else if (entity.widget == "memories") {
      setState =
        entity.type == EntityTypes.SKILL_CARD
          ? setSearchSkillCardIds
          : setSearchPItemIds;
    }
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
      className={`${styles.trash} ${hover ? styles.hover : ""} ${
        styles[size] || ""
      }`}
      ref={dropRef}
      onClick={(e) => handleClick(e)}
    >
      <FaRegTrashCan />
    </button>
  );
}
