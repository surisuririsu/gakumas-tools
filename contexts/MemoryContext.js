import { createContext, useState } from "react";

const MemoryContext = createContext();

export function MemoryContextProvider({ children }) {
  const [pIdolId, setPIdolId] = useState(null);
  const [params, setParams] = useState([null, null, null]);
  const [pItemIds, setPItemIds] = useState([0, 0, 0, 0]);
  const [skillCardIds, setSkillCardIds] = useState([0, 0, 0, 0, 0, 0]);

  return (
    <MemoryContext.Provider
      value={{
        pIdolId,
        setPIdolId,
        params,
        setParams,
        pItemIds,
        setPItemIds,
        skillCardIds,
        setSkillCardIds,
      }}
    >
      {children}
    </MemoryContext.Provider>
  );
}

export default MemoryContext;
