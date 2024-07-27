import { useContext } from "react";
import Image from "next/image";
import { useDrag, useDrop } from "react-dnd";
import { PItems, SkillCards } from "gakumas-data";
import MemoryContext from "@/contexts/MemoryContext";
import SearchContext from "@/contexts/SearchContext";
import SelectionContext from "@/contexts/SelectionContext";
import { EntityTypes } from "@/utils/entities";
import styles from "./EntityIcon.module.scss";

export default function EntityIcon({ type, id, widget, index, size, idolId }) {
  const {
    setPItemIds: setMemoryPItemIds,
    setSkillCardIds: setMemorySkillCardIds,
  } = useContext(MemoryContext);
  const {
    setPItemIds: setSearchPItemIds,
    setSkillCardIds: setSearchSkillCardIds,
  } = useContext(SearchContext);
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

  function swapEntity(entity) {
    let setState = () => {};
    if (widget == "memory_editor") {
      setState =
        entity.type == EntityTypes.SKILL_CARD
          ? setMemorySkillCardIds
          : setMemoryPItemIds;
    } else if (widget == "memories") {
      setState =
        entity.type == EntityTypes.SKILL_CARD
          ? setSearchSkillCardIds
          : setSearchPItemIds;
    }

    setState((cur) => {
      const next = [...cur];
      next[index] = entity.id;
      return next;
    });

    if (entity.widget == widget) {
      let setSourceState = () => {};
      if (entity.widget == "memory_editor") {
        setSourceState =
          entity.type == EntityTypes.SKILL_CARD
            ? setMemorySkillCardIds
            : setMemoryPItemIds;
      } else if (entity.widget == "memories") {
        setSourceState =
          entity.type == EntityTypes.SKILL_CARD
            ? setSearchSkillCardIds
            : setSearchPItemIds;
      }

      setSourceState((cur) => {
        const next = [...cur];
        next[entity.index] = id;
        return next;
      });
    }
  }

  const [, dragRef] = useDrag(() => ({
    type,
    item: { type, id, widget, index },
  }));
  const [, dropRef] = useDrop(() => ({
    accept:
      widget == "dex" ? [EntityTypes.SKILL_CARD, EntityTypes.P_ITEM] : type,
    drop: (item) => {
      if (widget == "dex" && item.widget != "dex") {
        clearEntity(item);
      } else if (widget != "dex" && type == item.type) {
        swapEntity(item);
      }
    },
  }));

  function handleClick(e) {
    e.stopPropagation();
    if (selected) {
      setSelectedEntity(null);
    } else if (!selectedEntity) {
      setSelectedEntity({ type, id, widget, index });
    } else if (widget == "dex") {
      if (selectedEntity.widget == "dex") {
        setSelectedEntity({ type, id, widget, index });
      } else {
        clearEntity(selectedEntity);
        setSelectedEntity(null);
      }
    } else if (selectedEntity.type != type) {
      setSelectedEntity({ type, id, widget, index });
    } else {
      swapEntity(selectedEntity);
      setSelectedEntity(null);
    }
  }

  return (
    <div ref={dropRef}>
      <button
        className={`${styles.entityIcon} ${styles[size] || ""} ${
          selected ? styles.selected : ""
        }`}
        ref={dragRef}
        onClick={(e) => handleClick(e)}
      >
        {entity?.icon && (
          <Image
            src={entity.getDynamicIcon?.(idolId) || entity.icon}
            fill
            alt={entity.name}
            sizes="52px"
          />
        )}
      </button>
    </div>
  );
}
