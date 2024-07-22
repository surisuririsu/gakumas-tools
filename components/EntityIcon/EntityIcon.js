import { useContext } from "react";
import Image from "next/image";
import { PItems, SkillCards } from "gakumas-data";
import MemoryContext from "@/contexts/MemoryContext";
import SelectionContext from "@/contexts/SelectionContext";
import { EntityTypes } from "@/utils/entities";
import styles from "./EntityIcon.module.scss";

export default function EntityIcon({ type, id, widget, index, small }) {
  const { pItemIds, setPItemIds, skillCardIds, setSkillCardIds } =
    useContext(MemoryContext);
  const { selectedEntity, setSelectedEntity } = useContext(SelectionContext);
  const selected =
    selectedEntity &&
    selectedEntity.type == type &&
    selectedEntity.widget == widget &&
    selectedEntity.index == index;

  let entity;
  if (type == EntityTypes.P_ITEM) {
    entity = PItems.getById(id);
  } else if (type == EntityTypes.SKILL_CARD) {
    entity = SkillCards.getById(id);
  }

  function handleClick(e) {
    e.stopPropagation();

    if (selected) {
      setSelectedEntity(null);
    } else if (
      !selectedEntity ||
      widget == "dex" ||
      selectedEntity.type != type
    ) {
      setSelectedEntity({ type, id, widget, index });
    } else if (widget == "memory_editor" && selectedEntity.type == type) {
      const setState =
        selectedEntity.type == EntityTypes.SKILL_CARD
          ? setSkillCardIds
          : setPItemIds;
      setState((cur) => {
        const next = [...cur];
        next[index] = selectedEntity.id;
        return next;
      });
      setSelectedEntity(null);
    }
  }

  return (
    <button
      className={`${styles.entityIcon} ${small ? styles.small : ""} ${
        selected ? styles.selected : ""
      }`}
      onClick={(e) => handleClick(e)}
    >
      {entity?.icon && (
        <Image src={entity.icon} fill alt={entity.name} sizes="52px" />
      )}
    </button>
  );
}
