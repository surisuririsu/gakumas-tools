import { createContext, useContext, useEffect, useState } from "react";

const LoadoutContext = createContext();

export function LoadoutContextProvider({ children }) {
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
      }}
    >
      {children}
    </LoadoutContext.Provider>
  );
}

export default LoadoutContext;
