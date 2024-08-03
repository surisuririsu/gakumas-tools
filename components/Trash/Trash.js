import { useContext } from "react";
import { useDrop } from "react-dnd";
import { FaRegTrashCan } from "react-icons/fa6";
import { EntityTypes } from "@/utils/entities";
import LoadoutContext from "@/contexts/LoadoutContext";
import MemoryCalculatorContext from "@/contexts/MemoryCalculatorContext";
import MemoryContext from "@/contexts/MemoryContext";
import SearchContext from "@/contexts/SearchContext";
import SelectionContext from "@/contexts/SelectionContext";
import styles from "./Trash.module.scss";

export default function Trash({ size }) {
  const {
    setPItemIds: setLoadoutPItemIds,
    setSkillCardIds: setLoadoutSkillCardIds,
  } = useContext(LoadoutContext);
  const { setSkillCardIds: setMemoryCalculatorSkillCardIds } = useContext(
    MemoryCalculatorContext
  );
  const {
    setPItemIds: setMemoryPItemIds,
    setSkillCardIds: setMemorySkillCardIds,
  } = useContext(MemoryContext);
  const {
    setPItemIds: setSearchPItemIds,
    setSkillCardIds: setSearchSkillCardIds,
  } = useContext(SearchContext);
  const { selectedEntity, setSelectedEntity } = useContext(SelectionContext);

  const settersByWidgetAndType = {
    memoryCalculator: {
      [EntityTypes.P_ITEM]: () => {},
      [EntityTypes.SKILL_CARD]: setMemoryCalculatorSkillCardIds,
    },
    memoryEditor: {
      [EntityTypes.P_ITEM]: setMemoryPItemIds,
      [EntityTypes.SKILL_CARD]: setMemorySkillCardIds,
    },
    memories: {
      [EntityTypes.P_ITEM]: setSearchPItemIds,
      [EntityTypes.SKILL_CARD]: setSearchSkillCardIds,
    },
    loadoutEditor: {
      [EntityTypes.P_ITEM]: setLoadoutPItemIds,
      [EntityTypes.SKILL_CARD]: setLoadoutSkillCardIds,
    },
  };

  function clearEntity(entity) {
    const setState = settersByWidgetAndType[entity.widget][entity.type];
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
    if (selectedEntity.widget != "dex") {
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
