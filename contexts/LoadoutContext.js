import { createContext, useContext, useEffect, useState } from "react";
import SelectionContext from "@/contexts/SelectionContext";

const LoadoutContext = createContext();

export function LoadoutContextProvider({ children }) {
  const { setSelectedEntity } = useContext(SelectionContext);
  const [plan, setPlan] = useState("sense");
  const [idolId, setIdolId] = useState(1);
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
    setSelectedEntity(null);
  };

  const deleteSkillCardIdGroup = (groupIndex) => {
    setSkillCardIdGroups((cur) => {
      const updatedSkillCardIds = [...cur];
      updatedSkillCardIds.splice(groupIndex, 1);
      return updatedSkillCardIds;
    });
    setSelectedEntity(null);
  };

  const swapSkillCardIdGroups = (groupIndexA, groupIndexB) => {
    setSkillCardIdGroups((cur) => {
      const updatedSkillCardIds = [...cur];
      const temp = updatedSkillCardIds[groupIndexA];
      updatedSkillCardIds[groupIndexA] = updatedSkillCardIds[groupIndexB];
      updatedSkillCardIds[groupIndexB] = temp;
      return updatedSkillCardIds;
    });
    setSelectedEntity(null);
  };

  return (
    <LoadoutContext.Provider
      value={{
        plan,
        setPlan,
        idolId,
        setIdolId,
        pItemIds,
        setPItemIds,
        skillCardIdGroups,
        setSkillCardIdGroups,
        setSkillCardIds,
        insertSkillCardIdGroup,
        deleteSkillCardIdGroup,
        swapSkillCardIdGroups,
      }}
    >
      {children}
    </LoadoutContext.Provider>
  );
}

export default LoadoutContext;
