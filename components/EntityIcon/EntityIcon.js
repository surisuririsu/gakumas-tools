import { useContext } from "react";
import Image from "next/image";
import { useDrag, useDrop } from "react-dnd";
import { PItems, SkillCards } from "gakumas-data";
import EntityContext from "@/contexts/EntityContext";
import LoadoutContext from "@/contexts/LoadoutContext";
import MemoryCalculatorContext from "@/contexts/MemoryCalculatorContext";
import MemoryContext from "@/contexts/MemoryContext";
import SearchContext from "@/contexts/SearchContext";
import WorkspaceContext from "@/contexts/WorkspaceContext";
import { EntityTypes } from "@/utils/entities";
import styles from "./EntityIcon.module.scss";

const ENTITY_DATA_BY_TYPE = {
  [EntityTypes.P_ITEM]: PItems,
  [EntityTypes.SKILL_CARD]: SkillCards,
};

export default function EntityIcon({ type, id, region, index, size }) {
  const { idolId } = useContext(WorkspaceContext);
  // TODO: refactor
  const {
    setPItemIds: setLoadoutPItemIds,
    setSkillCardIds: setLoadoutSkillCardIds,
  } = useContext(LoadoutContext);
  const {
    setTargetSkillCardIds: setMemoryCalculatorTargetSkillCardIds,
    setAlternateSkillCardIds: setMemoryCalculatorAlternateSkillCardIds,
    setAcquiredSkillCardIds: setMemoryCalculatorAcquiredSkillCardIds,
  } = useContext(MemoryCalculatorContext);
  const {
    setPItemIds: setMemoryPItemIds,
    setSkillCardIds: setMemorySkillCardIds,
  } = useContext(MemoryContext);
  const {
    setPItemIds: setSearchPItemIds,
    setSkillCardIds: setSearchSkillCardIds,
  } = useContext(SearchContext);

  const { selectedEntity, setSelectedEntity } = useContext(EntityContext);
  const selected =
    selectedEntity &&
    selectedEntity.type == type &&
    selectedEntity.region == region &&
    selectedEntity.index == index;

  const entity = ENTITY_DATA_BY_TYPE[type].getById(id);
  const settersByRegionAndType = {
    "memoryCalculator:target": {
      [EntityTypes.P_ITEM]: () => {},
      [EntityTypes.SKILL_CARD]: setMemoryCalculatorTargetSkillCardIds,
    },
    "memoryCalculator:alternate": {
      [EntityTypes.P_ITEM]: () => {},
      [EntityTypes.SKILL_CARD]: setMemoryCalculatorAlternateSkillCardIds,
    },
    "memoryCalculator:acquired": {
      [EntityTypes.P_ITEM]: () => {},
      [EntityTypes.SKILL_CARD]: setMemoryCalculatorAcquiredSkillCardIds,
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
    const setState = settersByRegionAndType[entity.region][entity.type];
    setState((cur) => {
      const next = [...cur];
      next[entity.index] = 0;
      return next;
    });
  }

  function swapEntity(entity) {
    const setState = settersByRegionAndType[region][entity.type];
    setState((cur) => {
      const next = [...cur];
      next[index] = entity.id;
      return next;
    });

    if (entity.region == region) {
      const setSourceState = settersByRegionAndType[entity.region][entity.type];
      setSourceState((cur) => {
        const next = [...cur];
        next[entity.index] = id;
        return next;
      });
    }
  }

  const [, dragRef] = useDrag(() => ({
    type,
    item: { type, id, region, index },
  }));
  const [, dropRef] = useDrop(() => ({
    accept:
      region == "dex" ? [EntityTypes.SKILL_CARD, EntityTypes.P_ITEM] : type,
    drop: (item) => {
      if (region == "dex" && item.region != "dex") {
        clearEntity(item);
      } else if (region != "dex" && type == item.type) {
        swapEntity(item);
      }
    },
  }));

  function handleClick(e) {
    e.stopPropagation();
    if (selected) {
      setSelectedEntity(null);
    } else if (!selectedEntity) {
      setSelectedEntity({ type, id, region, index });
    } else if (region == "dex") {
      if (selectedEntity.region == "dex") {
        setSelectedEntity({ type, id, region, index });
      } else {
        clearEntity(selectedEntity);
        setSelectedEntity(null);
      }
    } else if (selectedEntity.type != type) {
      setSelectedEntity({ type, id, region, index });
    } else {
      swapEntity(selectedEntity);
      setSelectedEntity(null);
    }
  }

  return (
    <button
      className={`${styles.entityIcon} ${styles[size] || ""} ${
        selected ? styles.selected : ""
      }`}
      ref={(node) => dragRef(dropRef(node))}
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
  );
}
