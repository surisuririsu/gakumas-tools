import { useContext } from "react";
import { createContext, useState } from "react";
import DataContext from "@/contexts/DataContext";

const LoadoutContext = createContext();

export function LoadoutContextProvider({ children }) {
  const { memories } = useContext(DataContext);
  const [memoryIds, setMemoryIds] = useState([null, null]);
  const [params, setParams] = useState([null, null, null, null]);
  const [pItemIds, setPItemIds] = useState([0, 0, 0, 0]);
  const [skillCardIdGroups, setSkillCardIdGroups] = useState([
    [0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0],
  ]);

  function setSkillCardIds(callback) {
    setSkillCardIdGroups((cur) => {
      const skillCardIds = [].concat(...cur);
      const updatedSkillCardIds = callback(skillCardIds);
      let chunks = [];
      for (let i = 0; i < updatedSkillCardIds.length; i += 6) {
        chunks.push(updatedSkillCardIds.slice(i, i + 6));
      }
      return chunks;
    });
  }

  const insertSkillCardIdGroup = (groupIndex) => {
    setSkillCardIdGroups((cur) => {
      const updatedSkillCardIds = [...cur];
      updatedSkillCardIds.splice(groupIndex, 0, [0, 0, 0, 0, 0, 0]);
      return updatedSkillCardIds;
    });
  };

  const deleteSkillCardIdGroup = (groupIndex) => {
    setSkillCardIdGroups((cur) => {
      const updatedSkillCardIds = [...cur];
      updatedSkillCardIds.splice(groupIndex, 1);
      return updatedSkillCardIds;
    });
  };

  const swapSkillCardIdGroups = (groupIndexA, groupIndexB) => {
    setSkillCardIdGroups((cur) => {
      const updatedSkillCardIds = [...cur];
      const temp = updatedSkillCardIds[groupIndexA];
      updatedSkillCardIds[groupIndexA] = updatedSkillCardIds[groupIndexB];
      updatedSkillCardIds[groupIndexB] = temp;
      return updatedSkillCardIds;
    });
  };

  function setMemory(memory, index) {
    const multiplier = index ? 0.2 : 1;

    // If there is currently a memory in that slot, remove its params
    if (memoryIds[index]) {
      const curMemory = memories.find((mem) => mem._id == memoryIds[index]);
      if (curMemory) {
        setParams((curParams) =>
          curParams.map(
            (p, i) => (p || 0) - Math.floor(curMemory.params[i] * multiplier)
          )
        );
      }
    }

    // Set memory
    setMemoryIds((cur) => {
      const next = [...cur];
      next[index] = memory._id;
      return next;
    });
    setParams((curParams) =>
      curParams.map(
        (p, i) => (p || 0) + Math.floor(memory.params[i] * multiplier)
      )
    );
    if (index == 0) {
      setPItemIds(memory.pItemIds);
    }
    setSkillCardIdGroups((cur) => {
      cur[index] = memory.skillCardIds;
      return cur;
    });
  }

  function clear() {
    setMemoryIds([null, null]);
    setParams([null, null, null, null]);
    setPItemIds([0, 0, 0, 0]);
    setSkillCardIdGroups([
      [0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0],
    ]);
  }

  return (
    <LoadoutContext.Provider
      value={{
        setMemory,
        params,
        setParams,
        pItemIds,
        setPItemIds,
        skillCardIdGroups,
        setSkillCardIdGroups,
        setSkillCardIds,
        insertSkillCardIdGroup,
        deleteSkillCardIdGroup,
        swapSkillCardIdGroups,
        clear,
      }}
    >
      {children}
    </LoadoutContext.Provider>
  );
}

export default LoadoutContext;
